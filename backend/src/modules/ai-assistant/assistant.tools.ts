import { LlmTool } from './assistant.types';

export const ASSISTANT_TOOLS: LlmTool[] = [
  {
    name: 'get_services',
    description: 'Lista e shërbimeve dhe stafit të kësaj studioje.',
    input_schema: {
      type: 'object',
      properties: {},
    },
  },
  {
    name: 'get_available_slots',
    description: 'Oraret e lira për një shërbim në një datë YYYY-MM-DD. staffId është opsional.',
    input_schema: {
      type: 'object',
      properties: {
        serviceId: { type: 'string' },
        staffId: { type: 'string' },
        date: { type: 'string', description: 'YYYY-MM-DD' },
      },
      required: ['serviceId', 'date'],
    },
  },
  {
    name: 'propose_booking',
    description:
      'Propozon një rezervim për konfirmim në UI. Nuk e krijon në databazë. startAt duhet të jetë një slot i kthyer nga get_available_slots.',
    input_schema: {
      type: 'object',
      properties: {
        serviceId: { type: 'string' },
        staffId: { type: 'string' },
        startAt: { type: 'string', description: 'ISO-8601 UTC' },
      },
      required: ['serviceId', 'staffId', 'startAt'],
    },
  },
];
