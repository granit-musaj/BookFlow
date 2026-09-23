export type BookingDraft = {
  serviceId: string;
  staffId: string;
  startAt: string;
  serviceName: string;
  staffName: string;
};

export type ChatTurn = {
  role: 'user' | 'assistant';
  content: string;
};

export type LlmToolCall = {
  id: string;
  name: string;
  input: Record<string, unknown>;
};

export type LlmMessage =
  | { role: 'user'; content: string }
  | { role: 'assistant'; content: string; toolCalls?: LlmToolCall[] }
  | { role: 'tool'; toolCallId: string; content: string };

export type LlmTool = {
  name: string;
  description: string;
  input_schema: {
    type: 'object';
    properties: Record<string, unknown>;
    required?: string[];
  };
};

export type LlmResponse = {
  text: string;
  toolCalls: LlmToolCall[];
};

export type LlmStreamEvent =
  | { type: 'token'; text: string }
  | { type: 'result'; response: LlmResponse };

export interface LlmClient {
  complete(input: {
    system: string;
    messages: LlmMessage[];
    tools: LlmTool[];
  }): Promise<LlmResponse>;
  stream?(input: {
    system: string;
    messages: LlmMessage[];
    tools: LlmTool[];
  }): AsyncIterable<LlmStreamEvent>;
}

export type AssistantEvent =
  | { type: 'token'; text: string }
  | { type: 'draft'; draft: BookingDraft }
  | { type: 'done'; conversationId: string; reply: string; draft: BookingDraft | null }
  | { type: 'error'; message: string };

export const LLM_CLIENT = Symbol('LLM_CLIENT');

export type AssistantReply = {
  conversationId: string;
  reply: string;
  draft: BookingDraft | null;
};

export const FALLBACK_REPLY =
  'Asistenti nuk është i disponueshëm tani. Përdor formularin «Rezervo vetë» për të zgjedhur shërbimin dhe orën.';
