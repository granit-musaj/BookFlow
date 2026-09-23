import { randomUUID } from 'crypto';
import { Injectable } from '@nestjs/common';
import { BookingDraft, LlmMessage } from './assistant.types';

type Conversation = {
  id: string;
  slug: string;
  messages: LlmMessage[];
  draft: BookingDraft | null;
};

@Injectable()
export class ConversationStore {
  private readonly conversations = new Map<string, Conversation>();

  create(slug: string): Conversation {
    const conversation = { id: randomUUID(), slug, messages: [], draft: null };
    this.conversations.set(conversation.id, conversation);
    return conversation;
  }

  get(id: string, slug: string): Conversation | undefined {
    const conversation = this.conversations.get(id);
    if (!conversation || conversation.slug !== slug) {
      return undefined;
    }
    return conversation;
  }

  getOrCreate(slug: string, id?: string): Conversation {
    if (id) {
      return this.get(id, slug) ?? this.create(slug);
    }
    return this.create(slug);
  }
}
