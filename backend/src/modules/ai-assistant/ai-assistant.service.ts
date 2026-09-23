import { Inject, Injectable, Optional, ServiceUnavailableException } from '@nestjs/common';
import { PublicCatalogService } from '../public/public.service';
import { ASSISTANT_SYSTEM_PROMPT } from './assistant.prompt';
import { ASSISTANT_TOOLS } from './assistant.tools';
import {
  AssistantEvent,
  AssistantReply,
  BookingDraft,
  FALLBACK_REPLY,
  LLM_CLIENT,
  LlmClient,
  LlmMessage,
  LlmResponse,
} from './assistant.types';
import { ConversationStore } from './conversation.store';

const MAX_TOOL_ROUNDS = 4;

@Injectable()
export class AiAssistantService {
  constructor(
    private readonly catalog: PublicCatalogService,
    private readonly conversations: ConversationStore,
    @Optional() @Inject(LLM_CLIENT) private readonly llm: LlmClient | null,
  ) {}

  async reply(slug: string, message: string, conversationId?: string): Promise<AssistantReply> {
    let done: AssistantReply | null = null;
    for await (const event of this.streamReply(slug, message, conversationId)) {
      if (event.type === 'done') {
        done = {
          conversationId: event.conversationId,
          reply: event.reply,
          draft: event.draft,
        };
      }
      if (event.type === 'error') {
        throw new ServiceUnavailableException(event.message);
      }
    }
    return done ?? { conversationId: conversationId ?? '', reply: FALLBACK_REPLY, draft: null };
  }

  async *streamReply(
    slug: string,
    message: string,
    conversationId?: string,
  ): AsyncGenerator<AssistantEvent> {
    if (!this.llm) {
      yield { type: 'error', message: FALLBACK_REPLY };
      return;
    }

    const conversation = this.conversations.getOrCreate(slug, conversationId);
    conversation.messages.push({ role: 'user', content: message });

    try {
      for (let round = 0; round < MAX_TOOL_ROUNDS; round += 1) {
        const turn = yield* this.nextTurn(conversation.messages);

        if (turn.toolCalls.length === 0) {
          const reply = turn.text || FALLBACK_REPLY;
          conversation.messages.push({ role: 'assistant', content: reply });
          yield {
            type: 'done',
            conversationId: conversation.id,
            reply,
            draft: conversation.draft,
          };
          return;
        }

        conversation.messages.push({
          role: 'assistant',
          content: turn.text,
          toolCalls: turn.toolCalls,
        });

        for (const call of turn.toolCalls) {
          const result = await this.executeTool(slug, call.name, call.input);
          if (result.draft) {
            conversation.draft = result.draft;
            yield { type: 'draft', draft: result.draft };
          }
          conversation.messages.push({
            role: 'tool',
            toolCallId: call.id,
            content: JSON.stringify(result.payload),
          });
        }
      }

      conversation.messages.push({ role: 'assistant', content: FALLBACK_REPLY });
      yield {
        type: 'done',
        conversationId: conversation.id,
        reply: FALLBACK_REPLY,
        draft: conversation.draft,
      };
    } catch {
      yield { type: 'error', message: FALLBACK_REPLY };
    }
  }

  private async *nextTurn(messages: LlmMessage[]): AsyncGenerator<AssistantEvent, LlmResponse> {
    const request = {
      system: ASSISTANT_SYSTEM_PROMPT,
      messages,
      tools: ASSISTANT_TOOLS,
    };

    if (this.llm?.stream) {
      let result: LlmResponse | null = null;
      for await (const event of this.llm.stream(request)) {
        if (event.type === 'token') {
          yield event;
        } else {
          result = event.response;
        }
      }
      if (result) {
        return result;
      }
    }

    const turn = await this.llm!.complete(request);
    if (turn.toolCalls.length === 0 && turn.text) {
      yield { type: 'token', text: turn.text };
    }
    return turn;
  }

  async executeTool(
    slug: string,
    name: string,
    input: Record<string, unknown>,
  ): Promise<{ payload: unknown; draft?: BookingDraft }> {
    const crossed = this.crossTenant(input, slug);
    if (crossed) {
      return { payload: crossed };
    }

    if (name === 'get_services') {
      return { payload: await this.catalog.catalog(slug) };
    }

    if (name === 'get_available_slots') {
      return { payload: await this.availableSlots(slug, input) };
    }

    if (name === 'propose_booking') {
      return this.proposeBooking(slug, input);
    }

    return { payload: { error: 'UNKNOWN_TOOL' } };
  }

  private crossTenant(input: Record<string, unknown>, slug: string) {
    const given = input.businessSlug ?? input.slug;
    if (typeof given === 'string' && given.trim() && given.trim() !== slug) {
      return {
        error: 'CROSS_TENANT',
        message: 'Assistant cannot query another business',
      };
    }
    return null;
  }

  private async availableSlots(slug: string, input: Record<string, unknown>) {
    const serviceId = String(input.serviceId ?? '');
    const date = String(input.date ?? '');
    const staffId = typeof input.staffId === 'string' && input.staffId ? input.staffId : undefined;

    if (staffId) {
      return this.catalog.slots(slug, { serviceId, staffId, date });
    }

    const catalog = await this.catalog.catalog(slug);
    const staff = catalog.staff.filter((row) => row.serviceIds.includes(serviceId));
    const rows = [];
    for (const member of staff) {
      const result = await this.catalog.slots(slug, { serviceId, staffId: member.id, date });
      rows.push({ staffId: member.id, displayName: member.displayName, slots: result.slots });
    }
    return { date, staff: rows };
  }

  private async proposeBooking(slug: string, input: Record<string, unknown>) {
    const serviceId = String(input.serviceId ?? '');
    const staffId = String(input.staffId ?? '');
    const startAt = String(input.startAt ?? '');
    const catalog = await this.catalog.catalog(slug);
    const service = catalog.services.find((row) => row.id === serviceId);
    const staff = catalog.staff.find((row) => row.id === staffId);

    if (!service || !staff || !staff.serviceIds.includes(serviceId)) {
      return { payload: { error: 'UNKNOWN_OFFERING' } };
    }

    const date = isoDateInZone(new Date(startAt), catalog.business.timezone);
    const open = await this.catalog.slots(slug, { serviceId, staffId, date });
    if (!open.slots.some((slot) => slot.startAt === startAt)) {
      return { payload: { error: 'SLOT_NOT_AVAILABLE' } };
    }

    const draft: BookingDraft = {
      serviceId,
      staffId,
      startAt,
      serviceName: service.name,
      staffName: staff.displayName,
    };
    return { payload: { proposed: true, ...draft }, draft };
  }
}

function isoDateInZone(instant: Date, timeZone: string) {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(instant);
}
