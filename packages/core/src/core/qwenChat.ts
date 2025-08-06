/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

// This file is adapted from the original geminiChat.ts file to use the reverse-engineered Qwen API.
// The original license header has been kept as the file structure is similar.
/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  GenerateContentResponse,
  Content,
  GenerateContentConfig,
  SendMessageParameters,
  createUserContent,
  Part,
  GenerateContentResponseUsageMetadata,
  Tool,
} from '@google/genai';
import { isFunctionResponse } from '../utils/messageInspectors.js';
import { ContentGenerator } from './contentGenerator.js';
import { Config } from '../config/config.js';
import {
  logApiRequest,
  logApiResponse,
  logApiError,
} from '../telemetry/loggers.js';
import {
  ApiErrorEvent,
  ApiRequestEvent,
  ApiResponseEvent,
} from '../telemetry/types.js';
import { v4 as uuidv4 } from 'uuid';

// TODO: Move these to a separate file
const QWEN_API_NEW_CHAT_URL = 'https://chat.qwen.ai/api/v2/chats/new';
const QWEN_API_COMPLETIONS_URL = 'https://chat.qwen.ai/api/v2/chat/completions';

/**
 * Chat session that enables sending messages to the model with previous
 * conversation context.
 */
export class QwenChat {
  private chatId: string | null = null;
  private parentId: string | null = null;

  constructor(
    private readonly config: Config,
    private readonly contentGenerator: ContentGenerator,
    private readonly generationConfig: GenerateContentConfig = {},
    private history: Content[] = [],
  ) {}

  private async getNewChatId(): Promise<string> {
    const headers = this.config.getQwenHeaders();
    const body = {
      title: 'New Chat',
      models: [this.config.getModel()],
      chat_mode: 'normal',
      chat_type: 't2t',
      timestamp: Date.now(),
    };

    const response = await fetch(QWEN_API_NEW_CHAT_URL, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      throw new Error(`Failed to create new chat: ${response.statusText}`);
    }

    const data = await response.json();
    return data.data.id;
  }

  async sendMessage(
    params: SendMessageParameters,
    prompt_id: string,
  ): Promise<GenerateContentResponse> {
    throw new Error('sendMessage is not implemented for QwenChat');
  }

  async sendMessageStream(
    params: SendMessageParameters,
    prompt_id: string,
  ): Promise<AsyncGenerator<GenerateContentResponse>> {
    if (!this.chatId) {
      this.chatId = await this.getNewChatId();
    }

    const userContent = createUserContent(params.message);
    const requestContents = this.history.concat(userContent);

    const headers = this.config.getQwenHeaders();
    const body = {
      stream: true,
      incremental_output: true,
      chat_id: this.chatId,
      chat_mode: 'normal',
      model: this.config.getModel(),
      parent_id: this.parentId,
      messages: [
        {
          fid: uuidv4(),
          parentId: this.parentId,
          childrenIds: [uuidv4()],
          role: 'user',
          content: params.message,
          user_action: 'chat',
          files: [],
          timestamp: Math.floor(Date.now() / 1000),
          models: [this.config.getModel()],
          chat_type: 't2t',
          feature_config: {
            thinking_enabled: true,
            output_schema: 'phase',
            thinking_budget': 38912,
          },
          extra: { meta: { subChatType: 't2t' } },
          sub_chat_type: 't2t',
          parent_id: this.parentId,
        },
      ],
      timestamp: Date.now(),
    };

    const response = await fetch(`${QWEN_API_COMPLETIONS_URL}?chat_id=${this.chatId}`, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      throw new Error(`Failed to send message: ${response.statusText}`);
    }

    // The rest of this method needs to be implemented to handle the streaming response
    // and convert it to the GenerateContentResponse format.
    // This is a placeholder implementation.
    const reader = response.body?.getReader();
    const decoder = new TextDecoder();

    async function* stream(): AsyncGenerator<GenerateContentResponse> {
      while (reader) {
        const { done, value } = await reader.read();
        if (done) {
          break;
        }
        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = JSON.parse(line.substring(6));
            if (data['response.created']) {
                // this.parentId = data['response.created'].response_id;
            } else if (data.choices) {
                const delta = data.choices[0].delta;
                if (delta.content) {
                    yield {
                        candidates: [{
                            content: {
                                role: 'model',
                                parts: [{ text: delta.content }],
                            }
                        }]
                    } as GenerateContentResponse;
                }
            }
          }
        }
      }
    }

    return stream();
  }

  getHistory(): Content[] {
    return this.history;
  }

  clearHistory(): void {
    this.history = [];
    this.chatId = null;
    this.parentId = null;
  }

  addHistory(content: Content): void {
    this.history.push(content);
  }

  setHistory(history: Content[]): void {
    this.history = history;
  }

  setTools(tools: Tool[]): void {
    this.generationConfig.tools = tools;
  }
}
