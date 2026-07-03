import { useMemo, useState } from "react";

const WIDTH = 600;
const HEIGHT = 220;
const PAD = { top: 16, right: 48, bottom: 28, left: 40 };

function niceTicks(min, max, count = 4) {
  if (min === max) {
    min -= 1;
    max += 1;
  }
  const span = max - min;
  const rawStep = span / count;
  const magnitude = 10 ** Math.floor(Math.log10(rawStep));
  const residual = rawStep / magnitude;
  const step = (residual >= 5 ? 10 : residual >= 2 ? 5 : residual >= 1 ? 2 : 1) * magnitude;
  const niceMin = Math.floor(min / step) * step;
  const niceMax = Math.ceil(max / step) * step;
  const ticks = [];
  for (let v = niceMin; v <= niceMax + step / 2; v += step) ticks.push(Math.round(v * 10) / 10);
  return ticks;
}

export default function WeightChart({ entries }) {
  const [hoverIndex, setHoverIndex] = useState(null);

  const plot = useMemo(() => {
    const weights = entries.map((e) => e.weight);
    const ticks = niceTicks(Math.min(...weights), Math.max(...weights));
    const yMin = ticks[0];
    const yMax = ticks[ticks.length - 1];
    const innerW = WIDTH - PAD.left - PAD.right;
    const innerH = HEIGHT - PAD.top - PAD.bottom;

    const points = entries.map((e, i) => ({
      ...e,
      x: PAD.left + (entries.length === 1 ? innerW / 2 : (innerW * i) / (entries.length - 1)),
      y: PAD.top + innerH - ((e.weight - yMin) / (yMax - yMin)) * innerH,
    }));

    return { points, ticks, yMin, yMax, innerW, innerH };
  }, [entries]);

  if (entries.length === 0) return null;

  const { points, ticks, yMin, yMax } = plot;
  const path = points.map((p, i) => `${i === 0 ? "M" : "L"}${p.x},${p.y}`).join(" ");
  const hovered = hoverIndex === null ? null : points[hoverIndex];
  const last = points[points.length - 1];

  function handlePointerMove(e) {
    const rect = e.currentTarget.getBoundingClientRect();
    const px = ((e.clientX - rect.left) / rect.width) * WIDTH;
    let nearest = 0;
    let nearestDist = Infinity;
    points.forEach((p, i) => {
      const dist = Math.abs(p.x - px);
      if (dist < nearestDist) {
        nearestDist = dist;
        nearest = i;
      }
    });
    setHoverIndex(nearest);
  }

  return (
    <div className="relative">
      <svg
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        className="w-full touch-none"
        role="img"
        aria-label={`Weight trend from ${entries[0].weight} to ${entries[entries.length - 1].weight} pounds across ${entries.length} entries`}
        onPointerMove={handlePointerMove}
        onPointerLeave={() => setHoverIndex(null)}
      >
        {ticks.map((t) => {
          const y = PAD.top + plot.innerH - ((t - yMin) / (yMax - yMin)) * plot.innerH;
          return (
            <g key={t}>
              <line
                x1={PAD.left}
                x2={WIDTH - PAD.right}
                y1={y}
                y2={y}
                stroke="var(--color-brand-ink)"
                strokeOpacity="0.08"
                strokeWidth="1"
              />
              <text x={PAD.left - 8} y={y} textAnchor="end" dominantBaseline="middle" fontSize="10" fill="var(--color-brand-ink)" fillOpacity="0.45">
                {t}
              </text>
            </g>
          );
        })}

        {hovered && (
          <line
            x1={hovered.x}
            x2={hovered.x}
            y1={PAD.top}
            y2={HEIGHT - PAD.bottom}
            stroke="var(--color-brand-ink)"
            strokeOpacity="0.2"
            strokeWidth="1"
          />
        )}

        <path d={path} fill="none" stroke="var(--color-brand-green)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />

        {points.map((p, i) => (
          <circle
            key={i}
            cx={p.x}
            cy={p.y}
            r={i === hoverIndex ? 5 : 4}
            fill="var(--color-brand-green)"
            stroke="var(--color-brand-paper)"
            strokeWidth="2"
          />
        ))}

        <text x={last.x + 8} y={last.y} dominantBaseline="middle" fontSize="11" fontWeight="600" fill="var(--color-brand-green)">
          {last.weight}
        </text>
      </svg>

      {hovered && (
        <div
          className="pointer-events-none absolute top-0 -translate-x-1/2 -translate-y-full border border-brand-ink/12 bg-white px-2.5 py-1.5 text-xs shadow-sm"
          style={{ left: `${(hovered.x / WIDTH) * 100}%` }}
        >
          <p className="font-semibold text-brand-ink">{hovered.weight} lbs</p>
          <p className="text-brand-ink/50">{new Date(hovered.recordedAt).toLocaleDateString()}</p>
        </div>
      )}
    </div>
  );
}
