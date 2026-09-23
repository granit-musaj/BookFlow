import { describe, expect, it, vi } from 'vitest';
import { PublicCatalogService } from '../public/public.service';
import { AiAssistantService } from './ai-assistant.service';
import { ConversationStore } from './conversation.store';
import { LlmClient } from './assistant.types';

function createService(catalog: Partial<PublicCatalogService>, llm: LlmClient | null = null) {
  return new AiAssistantService(
    catalog as PublicCatalogService,
    new ConversationStore(),
    llm,
  );
}

describe('AiAssistantService tools', () => {
  it('get_services calls catalog with the route slug', async () => {
    const catalog = { catalog: vi.fn().mockResolvedValue({ services: [] }) };
    const service = createService(catalog);
    await service.executeTool('studio-aurel', 'get_services', {});
    expect(catalog.catalog).toHaveBeenCalledWith('studio-aurel');
  });

  it('rejects a tool call that targets another tenant', async () => {
    const catalog = { catalog: vi.fn() };
    const service = createService(catalog);
    const result = await service.executeTool('studio-aurel', 'get_services', {
      businessSlug: 'studio-tjeter',
    });
    expect(result.payload).toEqual({
      error: 'CROSS_TENANT',
      message: 'Assistant cannot query another business',
    });
    expect(catalog.catalog).not.toHaveBeenCalled();
  });

  it('get_available_slots calls PublicCatalogService.slots', async () => {
    const catalog = {
      slots: vi.fn().mockResolvedValue({ slots: [{ startAt: '2026-09-25T12:00:00.000Z' }] }),
    };
    const service = createService(catalog);
    await service.executeTool('studio-aurel', 'get_available_slots', {
      serviceId: 'svc-1',
      staffId: 'staff-1',
      date: '2026-09-25',
    });
    expect(catalog.slots).toHaveBeenCalledWith('studio-aurel', {
      serviceId: 'svc-1',
      staffId: 'staff-1',
      date: '2026-09-25',
    });
  });

  it('propose_booking only returns a draft when slots() includes startAt', async () => {
    const startAt = '2026-09-25T12:00:00.000Z';
    const catalog = {
      catalog: vi.fn().mockResolvedValue({
        business: { timezone: 'UTC' },
        services: [{ id: 'svc-1', name: 'Masazh' }],
        staff: [{ id: 'staff-1', displayName: 'Ana', serviceIds: ['svc-1'] }],
      }),
      slots: vi.fn().mockResolvedValue({ slots: [{ startAt }] }),
    };
    const service = createService(catalog);
    const result = await service.executeTool('studio-aurel', 'propose_booking', {
      serviceId: 'svc-1',
      staffId: 'staff-1',
      startAt,
    });
    expect(result.draft).toEqual({
      serviceId: 'svc-1',
      staffId: 'staff-1',
      startAt,
      serviceName: 'Masazh',
      staffName: 'Ana',
    });
    expect(catalog.slots).toHaveBeenCalled();
  });

  it('propose_booking refuses an invented slot', async () => {
    const catalog = {
      catalog: vi.fn().mockResolvedValue({
        business: { timezone: 'UTC' },
        services: [{ id: 'svc-1', name: 'Masazh' }],
        staff: [{ id: 'staff-1', displayName: 'Ana', serviceIds: ['svc-1'] }],
      }),
      slots: vi.fn().mockResolvedValue({ slots: [] }),
    };
    const service = createService(catalog);
    const result = await service.executeTool('studio-aurel', 'propose_booking', {
      serviceId: 'svc-1',
      staffId: 'staff-1',
      startAt: '2026-09-25T12:00:00.000Z',
    });
    expect(result.draft).toBeUndefined();
    expect(result.payload).toEqual({ error: 'SLOT_NOT_AVAILABLE' });
  });
});
