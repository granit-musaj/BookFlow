import Anthropic from '@anthropic-ai/sdk';
import { LlmClient, LlmMessage, LlmResponse, LlmTool, LlmToolCall } from './assistant.types';

const MODEL = 'claude-haiku-4-5-20251001';

export class AnthropicLlmClient implements LlmClient {
  private readonly client: Anthropic;

  constructor(apiKey: string) {
    this.client = new Anthropic({ apiKey });
  }

  async complete(input: {
    system: string;
    messages: LlmMessage[];
    tools: LlmTool[];
  }): Promise<LlmResponse> {
    const response = await this.client.messages.create({
      model: MODEL,
      max_tokens: 1024,
      system: input.system,
      tools: input.tools,
      messages: toAnthropicMessages(input.messages),
    });

    const toolCalls: LlmToolCall[] = [];
    const textParts: string[] = [];

    for (const block of response.content) {
      if (block.type === 'text') {
        textParts.push(block.text);
      }
      if (block.type === 'tool_use') {
        toolCalls.push({
          id: block.id,
          name: block.name,
          input: (block.input ?? {}) as Record<string, unknown>,
        });
      }
    }

    return { text: textParts.join('\n').trim(), toolCalls };
  }
}

function toAnthropicMessages(messages: LlmMessage[]): Anthropic.MessageParam[] {
  const result: Anthropic.MessageParam[] = [];

  for (const message of messages) {
    if (message.role === 'user') {
      result.push({ role: 'user', content: message.content });
      continue;
    }
    if (message.role === 'assistant') {
      const content: Anthropic.ContentBlockParam[] = [];
      if (message.content) {
        content.push({ type: 'text', text: message.content });
      }
      for (const call of message.toolCalls ?? []) {
        content.push({
          type: 'tool_use',
          id: call.id,
          name: call.name,
          input: call.input,
        });
      }
      if (content.length > 0) {
        result.push({ role: 'assistant', content });
      }
      continue;
    }

    const last = result[result.length - 1];
    const toolResult: Anthropic.ToolResultBlockParam = {
      type: 'tool_result',
      tool_use_id: message.toolCallId,
      content: message.content,
    };
    if (last?.role === 'user' && Array.isArray(last.content)) {
      last.content.push(toolResult);
    } else {
      result.push({ role: 'user', content: [toolResult] });
    }
  }

  return result;
}
