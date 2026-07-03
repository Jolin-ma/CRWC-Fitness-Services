function formatTime(iso) {
  return new Date(iso).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

export default function AvailabilityTimeline({ windows, onSelect }) {
  if (windows.length === 0) {
    return (
      <div className="border border-brand-ink/12 bg-brand-paper px-4 py-6 text-center text-sm text-brand-ink/55">
        This coach has no availability on this day.
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {windows.map((window, i) => (
        <div key={i}>
          <div className="mb-2 flex items-center justify-between font-editorial text-sm italic text-brand-ink/60">
            <span>{window.startTime}</span>
            <span>{window.endTime}</span>
          </div>
          <div className="flex border border-brand-ink/12">
            {window.blocks.map((block) => (
              <button
                key={block.time}
                type="button"
                disabled={!block.available}
                onClick={() => onSelect(block.time)}
                title={block.available ? `Book ${formatTime(block.time)}` : `${formatTime(block.time)} — booked`}
                className={`group relative h-14 flex-1 border-r border-brand-ink/12 last:border-r-0 transition-colors ${
                  block.available
                    ? "cursor-pointer bg-white hover:bg-brand-green"
                    : "cursor-not-allowed bg-black/[0.04]"
                }`}
              >
                <span
                  className={`pointer-events-none absolute inset-x-0 bottom-1.5 text-center font-mono text-[10px] ${
                    block.available ? "text-brand-ink/60 group-hover:text-white" : "text-brand-ink/30"
                  }`}
                >
                  {formatTime(block.time)}
                </span>
              </button>
            ))}
          </div>
        </div>
      ))}
      <div className="flex items-center gap-4 text-xs text-brand-ink/45">
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 border-2 border-brand-ink/35 bg-brand-paper" /> Open
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 bg-black/[0.08]" /> Booked
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 bg-brand-green" /> Selected on hover
        </span>
      </div>
    </div>
  );
}
