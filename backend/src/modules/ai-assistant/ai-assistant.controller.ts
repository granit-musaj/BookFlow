import { Body, Controller, HttpCode, Param, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { Public } from '../../common/decorators/public.decorator';
import { AiAssistantService } from './ai-assistant.service';
import { AssistantMessageDto } from './dto/assistant-message.dto';

@ApiTags('public')
@Controller('public')
export class AiAssistantController {
  constructor(private readonly assistant: AiAssistantService) {}

  @Public()
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @Post('businesses/:slug/assistant')
  @HttpCode(200)
  chat(@Param('slug') slug: string, @Body() dto: AssistantMessageDto) {
    return this.assistant.reply(slug, dto.message, dto.conversationId);
  }
}
