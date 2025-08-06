import {
  AuthType,
  Config,
} from '@qwen-code/qwen-code-core';
import { CommandContext, CommandKind, SlashCommand, ActionReturn } from './types.js';

async function switchAuth(config: Config | null, authType: AuthType, context: CommandContext): Promise<ActionReturn> {
  if (!config) {
    return {
      type: 'message',
      messageType: 'error',
      content: 'Config not loaded yet.',
    };
  }

  try {
    await config.refreshAuth(authType);
    const newModel = config.getModel();
    context.ui.addItem({
      type: 'info',
      text: `Authentication switched to ${authType}. Model set to ${newModel}.`
    }, Date.now());
    return { type: 'handled' };
  } catch (e) {
    return {
      type: 'message',
      messageType: 'error',
      content: `Failed to switch authentication: ${e instanceof Error ? e.message : e}`,
    };
  }
}

export const qwenCommand: SlashCommand = {
  name: 'qwen',
  description: 'Switch to Qwen API.',
  kind: CommandKind.BUILT_IN,
  subCommands: [
    {
      name: 'coder',
      description: 'Switch to Qwen Coder model.',
      kind: CommandKind.BUILT_IN,
      action: async (context) => {
        const config = context.services.config;
        if (config) {
          config.setModel('qwen3-coder-plus');
        }
        return switchAuth(config, AuthType.QWEN, context);
      },
    },
    {
      name: 'flash',
      description: 'Switch to Qwen Coder Flash model.',
      kind: CommandKind.BUILT_IN,
      action: async (context) => {
        const config = context.services.config;
        if (config) {
          config.setModel('qwen3-coder-30b-a3b-instruct');
        }
        return switchAuth(config, AuthType.QWEN, context);
      },
    },
  ],
};
