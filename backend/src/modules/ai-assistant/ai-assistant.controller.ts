import { Body, Controller, HttpCode, Param, Post, Req, Res } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { Request, Response } from 'express';
import { Public } from '../../common/decorators/public.decorator';
import { AiAssistantService } from './ai-assistant.service';
import { FALLBACK_REPLY } from './assistant.types';
import { AssistantMessageDto } from './dto/assistant-message.dto';

@ApiTags('public')
@Controller('public')
export class AiAssistantController {
  constructor(private readonly assistant: AiAssistantService) {}

  @Public()
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @Post('businesses/:slug/assistant')
  @HttpCode(200)
  async chat(
    @Param('slug') slug: string,
    @Body() dto: AssistantMessageDto,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    const stream = String(req.headers.accept ?? '').includes('text/event-stream');
    if (!stream) {
      try {
        const result = await this.assistant.reply(slug, dto.message, dto.conversationId);
        res.status(200).json(result);
      } catch (error) {
        const message = error instanceof Error ? error.message : FALLBACK_REPLY;
        res.status(503).json({ statusCode: 503, message });
      }
      return;
    }

    res.status(200);
    res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
    res.setHeader('Cache-Control', 'no-cache, no-transform');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders?.();

    try {
      for await (const event of this.assistant.streamReply(slug, dto.message, dto.conversationId)) {
        res.write(`event: ${event.type}\ndata: ${JSON.stringify(event)}\n\n`);
      }
    } catch {
      res.write(`event: error\ndata: ${JSON.stringify({ type: 'error', message: FALLBACK_REPLY })}\n\n`);
    }
    res.end();
  }
}
