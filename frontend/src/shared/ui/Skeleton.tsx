export function Skeleton({ lines = 3 }: { lines?: number }) {
  return (
    <div className="card p-6" aria-busy="true" aria-label="Po ngarkohet">
      {Array.from({ length: lines }).map((_, index) => (
        <div key={index} className="skeleton-line" style={{ width: `${88 - index * 12}%` }} />
      ))}
    </div>
  );
}

export function EmptyState({ title, body }: { title: string; body: string }) {
  return (
    <div className="card empty-state p-8">
      <p className="font-medium">{title}</p>
      <p className="muted mt-2 text-sm">{body}</p>
    </div>
  );
}

export function ErrorState({ message }: { message: string }) {
  return (
    <p className="text-danger mb-4 text-sm" role="alert">
      {message}
    </p>
  );
}
