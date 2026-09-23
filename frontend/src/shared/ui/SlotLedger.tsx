export function SlotLedger({
  slots,
  selected,
  taken,
  onSelect,
  label,
}: {
  slots: string[];
  selected: string;
  taken?: Set<string>;
  onSelect: (slot: string) => void;
  label?: (slot: string) => string;
}) {
  return (
    <div className="slot-ledger">
      {slots.map((slot) => {
        const isTaken = taken?.has(slot) ?? false;
        const isSelected = selected === slot && !isTaken;
        return (
          <button
            key={slot}
            type="button"
            disabled={isTaken}
            className={`slot-row${isTaken ? ' is-taken' : ''}${isSelected ? ' is-selected' : ''}`}
            onClick={() => onSelect(slot)}
          >
            <span className="slot-time">{label ? label(slot) : slot}</span>
            <span className="slot-meta">{isTaken ? 'e zënë' : isSelected ? 'zgjedhur' : 'e lirë'}</span>
          </button>
        );
      })}
    </div>
  );
}
