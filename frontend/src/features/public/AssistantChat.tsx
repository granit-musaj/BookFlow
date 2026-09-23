import { FormEvent, useState } from 'react';
import { API_URL, api, getAccessToken } from '../../shared/lib/api';
import { isDemo } from '../../shared/lib/demo';
import { formatDateTime } from '../../shared/types/domain';

export type BookingDraft = {
  serviceId: string;
  staffId: string;
  startAt: string;
  serviceName: string;
  staffName: string;
};

type ChatItem =
  | { id: string; role: 'user' | 'assistant'; text: string }
  | { id: string; role: 'draft'; draft: BookingDraft };

type StreamEvent =
  | { type: 'token'; text: string }
  | { type: 'draft'; draft: BookingDraft }
  | { type: 'done'; conversationId: string; reply: string; draft: BookingDraft | null }
  | { type: 'error'; message: string };

const FALLBACK =
  'Asistenti nuk është i disponueshëm tani. Përdor «Rezervo vetë» për të zgjedhur shërbimin dhe orën.';

export function AssistantChat({
  slug,
  canBook,
  onBooked,
}: {
  slug: string;
  canBook: boolean;
  onBooked: () => void;
}) {
  const [items, setItems] = useState<ChatItem[]>([
    {
      id: 'intro',
      role: 'assistant',
      text: 'Shkruaj çfarë të duhet, p.sh. «dua masazh të premten pasdite». Unë propozoj orare reale; ti konfirmon.',
    },
  ]);
  const [input, setInput] = useState('');
  const [conversationId, setConversationId] = useState<string>();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    const message = input.trim();
    if (!message || busy) {
      return;
    }
    setInput('');
    setError('');
    setBusy(true);
    const userId = `u-${Date.now()}`;
    const assistantId = `a-${Date.now()}`;
    setItems((current) => [...current, { id: userId, role: 'user', text: message }, { id: assistantId, role: 'assistant', text: '' }]);

    try {
      await readAssistantStream(slug, message, conversationId, (event) => {
        if (event.type === 'token') {
          setItems((current) =>
            current.map((item) =>
              item.id === assistantId && item.role === 'assistant'
                ? { ...item, text: item.text + event.text }
                : item,
            ),
          );
        }
        if (event.type === 'draft') {
          setItems((current) => [...current, { id: `d-${event.draft.startAt}`, role: 'draft', draft: event.draft }]);
        }
        if (event.type === 'done') {
          setConversationId(event.conversationId);
          if (event.reply) {
            setItems((current) =>
              current.map((item) =>
                item.id === assistantId && item.role === 'assistant' && !item.text
                  ? { ...item, text: event.reply }
                  : item,
              ),
            );
          }
          if (event.draft) {
            const draft = event.draft;
            setItems((current) => {
              if (current.some((item) => item.role === 'draft' && item.draft.startAt === draft.startAt)) {
                return current;
              }
              return [...current, { id: `d-${draft.startAt}`, role: 'draft', draft }];
            });
          }
        }
        if (event.type === 'error') {
          setError(event.message);
        }
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : FALLBACK);
    } finally {
      setBusy(false);
    }
  }

  async function confirm(draft: BookingDraft) {
    setError('');
    try {
      await api(`/public/businesses/${slug}/bookings`, {
        method: 'POST',
        body: JSON.stringify({
          staffId: draft.staffId,
          serviceId: draft.serviceId,
          startAt: draft.startAt,
        }),
      });
      onBooked();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Rezervimi nuk u krijua');
    }
  }

  return (
    <section className="card mt-6 p-6">
      <div className="chat-log">
        {items.map((item) => {
          if (item.role === 'draft') {
            return (
              <article key={item.id} className="card p-4">
                <p className="font-medium">{item.draft.serviceName}</p>
                <p className="muted mt-1 text-sm">
                  {item.draft.staffName} · {formatDateTime(item.draft.startAt)}
                </p>
                <button
                  className="btn btn-confirm mt-4"
                  type="button"
                  disabled={!canBook}
                  onClick={() => confirm(item.draft)}
                >
                  Konfirmo rezervimin
                </button>
                {!canBook && (
                  <p className="muted mt-2 text-xs">Hyr si klient (te «Rezervo vetë») para se të konfirmosh.</p>
                )}
              </article>
            );
          }
          return (
            <p key={item.id} className={`chat-bubble chat-bubble-${item.role}`}>
              {item.text || (busy ? '…' : '')}
            </p>
          );
        })}
      </div>
      {error && <p className="text-danger mt-4 text-sm">{error}</p>}
      <form onSubmit={onSubmit} className="mt-4 flex gap-2">
        <input
          className="input"
          placeholder="P.sh. dua masazh të premten pasdite"
          value={input}
          onChange={(event) => setInput(event.target.value)}
          disabled={busy}
        />
        <button className="btn btn-primary" type="submit" disabled={busy || !input.trim()}>
          Dërgo
        </button>
      </form>
    </section>
  );
}

async function readAssistantStream(
  slug: string,
  message: string,
  conversationId: string | undefined,
  onEvent: (event: StreamEvent) => void,
) {
  if (isDemo()) {
    await demoStream(onEvent);
    return;
  }

  const response = await fetch(`${API_URL}/public/businesses/${slug}/assistant`, {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'text/event-stream',
      ...(getAccessToken() ? { Authorization: `Bearer ${getAccessToken()}` } : {}),
    },
    body: JSON.stringify({ message, conversationId }),
  });

  if (!response.ok || !response.body) {
    const data = (await response.json().catch(() => null)) as { message?: string } | null;
    throw new Error(data?.message || FALLBACK);
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const chunk = await reader.read();
    if (chunk.done) {
      break;
    }
    buffer += decoder.decode(chunk.value, { stream: true });
    const parts = buffer.split('\n\n');
    buffer = parts.pop() ?? '';
    for (const part of parts) {
      const event = parseSse(part);
      if (event) {
        onEvent(event);
      }
    }
  }
}

function parseSse(block: string): StreamEvent | null {
  const dataLine = block.split('\n').find((line) => line.startsWith('data:'));
  if (!dataLine) {
    return null;
  }
  try {
    return JSON.parse(dataLine.slice(5).trim()) as StreamEvent;
  } catch {
    return null;
  }
}

async function demoStream(onEvent: (event: StreamEvent) => void) {
  const reply = 'Mund të të ofroj Masazh terapeutik me Ana Hoxha. Ja një orë e lirë; konfirmo nëse të shkon.';
  for (const word of reply.split(' ')) {
    onEvent({ type: 'token', text: `${word} ` });
    await new Promise((resolve) => setTimeout(resolve, 20));
  }
  const date = new Date();
  date.setDate(date.getDate() + ((5 - date.getDay() + 7) % 7 || 7));
  const pad = (value: number) => String(value).padStart(2, '0');
  const day = `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
  const draft: BookingDraft = {
    serviceId: 'svc-massage',
    staffId: 'staff-ana',
    startAt: `${day}T14:00:00.000+02:00`,
    serviceName: 'Masazh terapeutik',
    staffName: 'Ana Hoxha',
  };
  onEvent({ type: 'draft', draft });
  onEvent({ type: 'done', conversationId: 'demo-assistant', reply, draft });
}
