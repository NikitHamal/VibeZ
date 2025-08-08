import {
  CountTokensResponse,
  GenerateContentResponse,
  GenerateContentParameters,
  CountTokensParameters,
  EmbedContentResponse,
  EmbedContentParameters,
  Part,
  Content,
} from '@google/genai';
import { ContentGenerator } from './contentGenerator.js';
import { Config } from '../config/config.js';

export class QwenWebContentGenerator implements ContentGenerator {
  private config: Config;
  private model: string;
  private sessionId?: string;
  private baseUrl = 'https://chat.qwen.ai/api/v2';

  constructor(config: Config, model: string, sessionId?: string) {
    this.config = config;
    this.model = model;
    this.sessionId = sessionId;
  }

  async generateContent(request: GenerateContentParameters): Promise<GenerateContentResponse> {
    const { chatId, body } = await this.buildRequestBody(request, false);
    const url = `${this.baseUrl}/chat/completions?chat_id=${encodeURIComponent(chatId)}`;
    const resp = await fetch(url, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(body),
    });
    if (!resp.ok) {
      const text = await resp.text();
      throw new Error(`Qwen web API error ${resp.status}: ${text}`);
    }
    const text = await resp.text();
    return this.parseSseToGenerateContentResponse(text);
  }

  async generateContentStream(request: GenerateContentParameters): Promise<AsyncGenerator<GenerateContentResponse>> {
    const { chatId, body } = await this.buildRequestBody(request, true);
    const url = `${this.baseUrl}/chat/completions?chat_id=${encodeURIComponent(chatId)}`;
    const resp = await fetch(url, {
      method: 'POST',
      headers: this.getHeaders(true),
      body: JSON.stringify(body),
    });
    if (!resp.ok || !resp.body) {
      const text = await resp.text();
      throw new Error(`Qwen web API error ${resp.status}: ${text}`);
    }
    const reader = resp.body.getReader();
    const decoder = new TextDecoder();
    const self = this;
    async function* stream() {
      let buffer = '';
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const chunks = buffer.split('\n\n');
        buffer = chunks.pop() || '';
        for (const chunk of chunks) {
          if (!chunk.startsWith('data:')) continue;
          const json = chunk.slice(5).trim();
          if (!json) continue;
          const parsed = self.deltaToGenerateContentResponse(json);
          if (parsed) yield parsed;
        }
      }
      if (buffer.trim()) {
        const chunk = buffer.trim();
        if (chunk.startsWith('data:')) {
          const json = chunk.slice(5).trim();
          const parsed = self.deltaToGenerateContentResponse(json);
          if (parsed) yield parsed;
        }
      }
    }
    return stream();
  }

  async countTokens(request: CountTokensParameters): Promise<CountTokensResponse> {
    const text = JSON.stringify(request.contents || []);
    const totalTokens = Math.ceil(text.length / 4);
    return { totalTokens } as CountTokensResponse;
  }

  async embedContent(_request: EmbedContentParameters): Promise<EmbedContentResponse> {
    throw new Error('Embeddings not supported by Qwen web provider');
  }

  private normalizeToTextMessage(request: GenerateContentParameters): string {
    let text = '';
    const contents = request.contents;
    if (Array.isArray(contents)) {
      // Join all parts text
      text = contents
        .map((c: Content | string) => {
          if (typeof c === 'string') return c;
          if ('parts' in c && c.parts) {
            return (c.parts as Part[])
              .map((p: Part) => (typeof p === 'string' ? p : 'text' in p ? (p as any).text ?? '' : ''))
              .join('\n');
          }
          return '';
        })
        .join('\n');
    } else if (contents) {
      if (typeof contents === 'string') {
        text = contents;
      } else if ('parts' in contents && contents.parts) {
        text = (contents.parts as Part[])
          .map((p: Part) => (typeof p === 'string' ? p : 'text' in p ? (p as any).text ?? '' : ''))
          .join('\n');
      }
    }
    return text;
  }

  private async buildRequestBody(request: GenerateContentParameters, stream: boolean): Promise<{ chatId: string; body: any }> {
    const chatId = await this.ensureChat();
    const content = this.normalizeToTextMessage(request);
    const thinkingEnabled = false;
    const sub_chat_type = 't2t';
    const chat_type = request.config?.tools ? 'search' : 't2t';
    const body = {
      stream,
      incremental_output: stream,
      chat_id: chatId,
      chat_mode: 'normal',
      model: this.model,
      parent_id: null,
      messages: [
        {
          fid: this.uuid(),
          parentId: null,
          childrenIds: [],
          role: 'user',
          content,
          user_action: 'chat',
          files: [],
          timestamp: Math.floor(Date.now() / 1000),
          models: [this.model],
          chat_type,
          feature_config: thinkingEnabled
            ? { thinking_enabled: true, output_schema: 'phase', thinking_budget: 38912 }
            : { thinking_enabled: false, output_schema: 'phase' },
          extra: { meta: { subChatType: sub_chat_type } },
          sub_chat_type,
          parent_id: null,
        },
      ],
      timestamp: Math.floor(Date.now() / 1000),
    };
    return { chatId, body };
  }

  private async ensureChat(): Promise<string> {
    const cacheKey = `qwen-chat-${this.sessionId || 'default'}`;
    // @ts-ignore
    if (!globalThis.__QWEN_CHAT_CACHE__) globalThis.__QWEN_CHAT_CACHE__ = new Map<string, string>();
    // @ts-ignore
    const cache: Map<string, string> = globalThis.__QWEN_CHAT_CACHE__;
    const existing = cache.get(cacheKey);
    if (existing) return existing;
    const url = `${this.baseUrl}/chats/new`;
    const body = {
      title: 'New Chat',
      models: [this.model],
      chat_mode: 'normal',
      chat_type: 't2t',
      timestamp: Date.now(),
    };
    const resp = await fetch(url, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(body),
    });
    if (!resp.ok) {
      const text = await resp.text();
      throw new Error(`Qwen new chat failed ${resp.status}: ${text}`);
    }
    const json = await resp.json();
    const id = json?.data?.id;
    if (!id) throw new Error('Qwen new chat: missing chat id');
    cache.set(cacheKey, id);
    return id;
  }

  private getHeaders(stream = false): Record<string, string> {
    return {
      accept: stream ? '*/*' : 'application/json',
      'content-type': 'application/json',
      origin: 'https://chat.qwen.ai',
      referer: 'https://chat.qwen.ai/',
      'user-agent': 'Mozilla/5.0 (Linux; Android 12) AppleWebKit/537.36 Chrome/107.0.0.0 Mobile Safari/537.36',
      authorization:
        'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjhiYjQ1NjVmLTk3NjUtNDQwNi04OWQ5LTI3NmExMTIxMjBkNiIsImxhc3RfcGFzc3dvcmRfY2hhbmdlIjoxNzUwNjYwODczLCJleHAiOjE3NTU4NDk5NzB9.OEvpJhnzhUNFVMKb3d6UhtQBlQKypl3UcLRGUbm07H0',
      'bx-v': '2.5.31',
      source: 'h5',
      cookie:
        'x-ap=ap-southeast-1; token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjhiYjQ1NjVmLTk3NjUtNDQwNi04OWQ5LTI3NmExMTIxMjBkNiIsImxhc3RfcGFzc3dvcmRfY2hhbmdlIjoxNzUwNjYwODczLCJleHAiOjE3NTU4NDk5NzB9.OEvpJhnzhUNFVMKb3d6UhtQBlQKypl3UcLRGUbm07H0',
    };
  }

  private parseSseToGenerateContentResponse(sseText: string): GenerateContentResponse {
    const lines = sseText.split('\n');
    const contents: string[] = [];
    for (const line of lines) {
      if (!line.startsWith('data:')) continue;
      const payload = line.slice(5).trim();
      try {
        const obj = JSON.parse(payload);
        const delta = obj?.choices?.[0]?.delta;
        const content = delta?.content || '';
        if (typeof content === 'string') contents.push(content);
      } catch {
        // ignore
      }
    }
    const text = contents.join('');
    return {
      candidates: [
        {
          content: { role: 'model', parts: [{ text }] },
        },
      ],
    } as unknown as GenerateContentResponse;
  }

  private deltaToGenerateContentResponse(deltaJson: string): GenerateContentResponse | null {
    try {
      const obj = JSON.parse(deltaJson);
      const delta = obj?.choices?.[0]?.delta;
      const text = delta?.content ?? '';
      const phase = delta?.phase;
      if (typeof text !== 'string' && !phase) return null;
      return {
        candidates: [
          {
            content: { role: 'model', parts: [{ text: text || '' }] },
          },
        ],
        usageMetadata: undefined,
      } as unknown as GenerateContentResponse;
    } catch {
      return null;
    }
  }

  private uuid(): string {
    // Avoid Node crypto import for portability
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
      const r = (Math.random() * 16) | 0,
        v = c === 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  }
}