import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PublicModule } from '../public/public.module';
import { AiAssistantController } from './ai-assistant.controller';
import { AiAssistantService } from './ai-assistant.service';
import { AnthropicLlmClient } from './anthropic.llm';
import { ConversationStore } from './conversation.store';
import { LLM_CLIENT } from './assistant.types';

@Module({
  imports: [PublicModule],
  controllers: [AiAssistantController],
  providers: [
    ConversationStore,
    AiAssistantService,
    {
      provide: LLM_CLIENT,
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const key = config.get<string>('ANTHROPIC_API_KEY');
        return key ? new AnthropicLlmClient(key) : null;
      },
    },
  ],
})
export class AiAssistantModule {}
