export function Badge({
  status,
  children,
}: {
  status?: 'PENDING' | 'CONFIRMED' | 'CANCELLED';
  children: string;
}) {
  return (
    <span className="status-pill" data-status={status}>
      {children}
    </span>
  );
}
