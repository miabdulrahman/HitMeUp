import { useState } from "react";
import { formatLKR } from "./AdminUI";

/**
 * Date range selector pills: 7d | 30d | 90d | 12m
 */
export function RangeSelector({ value, onChange }) {
  const options = [
    { value: "7d", label: "7 days" },
    { value: "30d", label: "30 days" },
    { value: "90d", label: "90 days" },
    { value: "12m", label: "12 months" }
  ];

  return (
    <div className="inline-flex items-center rounded-[8px] border border-[#E5E7EB] bg-[#F3F4F6] p-0.5">
      {options.map((opt) => {
        const active = value === opt.value;
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            className={`h-7 rounded-[6px] px-2.5 text-[12px] font-medium transition-colors cursor-pointer ${
              active
                ? "bg-white text-[#111827] shadow-[0_1px_2px_rgba(15,23,42,0.06)]"
                : "text-[#4B5563] hover:text-[#111827]"
            }`}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

/**
 * Clean Enterprise SVG Time-Series Line/Column Chart
 * Renders real bucketed records with muted gridlines, tabular axis labels,
 * interactive hover crosshair, and explicit empty-data handling.
 */
export function TimeSeriesChart({
  data = [],
  metric = "orders", // "orders" | "revenue" | "sellers" | "customers" | "deals"
  variant = "area", // "area" | "bars"
  height = 240,
  formatValue
}) {
  const [hoverIndex, setHoverIndex] = useState(null);

  const fmt =
    formatValue ||
    ((val) => (metric === "revenue" ? formatLKR(val) : Number(val || 0).toLocaleString()));

  const values = data.map((d) => Number(d[metric] || 0));
  const totalSum = values.reduce((a, b) => a + b, 0);
  const maxRaw = Math.max(...values, 0);
  const yMax = maxRaw === 0 ? 4 : Math.ceil(maxRaw * 1.15);

  if (!data.length || totalSum === 0) {
    return (
      <div
        style={{ height }}
        className="flex flex-col items-center justify-center rounded-[8px] border border-dashed border-[#E5E7EB] bg-[#F9FAFB] px-4 text-center"
      >
        <p className="text-[13px] font-medium text-[#374151]">
          No recorded activity in this date window
        </p>
        <p className="mt-1 text-[12px] text-[#6B7280]">
          Try expanding the date range (for example, 90 days or 12 months) to inspect earlier records.
        </p>
      </div>
    );
  }

  const width = 720;
  const padLeft = metric === "revenue" ? 68 : 38;
  const padRight = 16;
  const padTop = 16;
  const padBottom = 28;
  const innerW = width - padLeft - padRight;
  const innerH = height - padTop - padBottom;

  const getX = (idx) =>
    data.length === 1
      ? padLeft + innerW / 2
      : padLeft + (idx / (data.length - 1)) * innerW;
  const getY = (val) => padTop + innerH - (val / yMax) * innerH;

  const yTicks = [0, Math.round(yMax / 2), yMax];

  const points = data.map((d, i) => ({
    x: getX(i),
    y: getY(Number(d[metric] || 0)),
    raw: d,
    val: Number(d[metric] || 0)
  }));

  const linePath = points
    .map((p, i) => `${i === 0 ? "M" : "L"} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`)
    .join(" ");

  const areaPath = `${linePath} L ${points[points.length - 1].x.toFixed(1)} ${(
    padTop + innerH
  ).toFixed(1)} L ${points[0].x.toFixed(1)} ${(padTop + innerH).toFixed(1)} Z`;

  // X-axis label stride to prevent crowding
  const labelStep = Math.max(1, Math.ceil(data.length / 7));
  const hovered = hoverIndex !== null ? points[hoverIndex] : null;

  return (
    <div className="relative select-none">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="w-full overflow-visible"
        role="img"
        aria-label={`Time series chart for ${metric}`}
        onMouseLeave={() => setHoverIndex(null)}
      >
        {/* Horizontal Gridlines & Y-Axis Ticks */}
        {yTicks.map((tick, i) => {
          const y = getY(tick);
          return (
            <g key={`yt-${i}`}>
              <line
                x1={padLeft}
                x2={width - padRight}
                y1={y}
                y2={y}
                stroke="#E5E7EB"
                strokeDasharray={i === 0 ? undefined : "3 3"}
                strokeWidth="1"
              />
              <text
                x={padLeft - 8}
                y={y + 3.5}
                textAnchor="end"
                className="fill-[#6B7280] font-mono text-[10px] tabular-nums"
              >
                {metric === "revenue"
                  ? tick >= 1000
                    ? `${(tick / 1000).toFixed(tick % 1000 === 0 ? 0 : 1)}k`
                    : tick
                  : tick}
              </text>
            </g>
          );
        })}

        {variant === "bars" ? (
          points.map((pt, i) => {
            const barSlot = innerW / Math.max(data.length, 1);
            const barW = Math.max(6, Math.min(28, barSlot * 0.62));
            const barX =
              padLeft + i * barSlot + (barSlot - barW) / 2;
            const barH = Math.max(pt.val > 0 ? 3 : 0, padTop + innerH - pt.y);
            const isHovered = hoverIndex === i;
            return (
              <g key={pt.raw.key || i}>
                <rect
                  x={barX}
                  y={padTop + innerH - barH}
                  width={barW}
                  height={barH}
                  rx="3"
                  fill={isHovered ? "#1E40AF" : "#1D4ED8"}
                />
                <rect
                  x={padLeft + i * barSlot}
                  y={padTop}
                  width={barSlot}
                  height={innerH}
                  fill="transparent"
                  onMouseEnter={() => setHoverIndex(i)}
                />
              </g>
            );
          })
        ) : (
          <>
            <path d={areaPath} fill="#1D4ED8" fillOpacity="0.07" />
            <path
              d={linePath}
              fill="none"
              stroke="#1D4ED8"
              strokeWidth="2"
              strokeLinejoin="round"
              strokeLinecap="round"
            />

            {hovered && (
              <line
                x1={hovered.x}
                x2={hovered.x}
                y1={padTop}
                y2={padTop + innerH}
                stroke="#9CA3AF"
                strokeDasharray="3 3"
                strokeWidth="1"
              />
            )}

            {points.map((pt, i) => {
              const slotW = innerW / Math.max(data.length - 1, 1);
              return (
                <g key={pt.raw.key || i}>
                  {(pt.val > 0 || hoverIndex === i) && (
                    <circle
                      cx={pt.x}
                      cy={pt.y}
                      r={hoverIndex === i ? 4.5 : 2.75}
                      fill={hoverIndex === i ? "#1D4ED8" : "#FFFFFF"}
                      stroke="#1D4ED8"
                      strokeWidth="2"
                    />
                  )}
                  <rect
                    x={pt.x - slotW / 2}
                    y={padTop}
                    width={slotW}
                    height={innerH}
                    fill="transparent"
                    onMouseEnter={() => setHoverIndex(i)}
                  />
                </g>
              );
            })}
          </>
        )}

        {/* X-Axis Labels */}
        {points.map((pt, i) => {
          if (i % labelStep !== 0 && i !== points.length - 1) return null;
          const xPos =
            variant === "bars"
              ? padLeft +
                (i + 0.5) * (innerW / Math.max(data.length, 1))
              : pt.x;
          return (
            <text
              key={`xl-${i}`}
              x={xPos}
              y={height - 6}
              textAnchor="middle"
              className="fill-[#6B7280] font-mono text-[10px] tabular-nums"
            >
              {pt.raw.label}
            </text>
          );
        })}
      </svg>

      {/* Interactive Tooltip */}
      {hovered && (
        <div className="pointer-events-none absolute right-2 top-1 rounded-[8px] border border-[#E5E7EB] bg-white px-3 py-1.5 shadow-[0_4px_12px_rgba(15,23,42,0.08)]">
          <div className="font-mono text-[11px] text-[#6B7280]">
            {hovered.raw.label}
          </div>
          <div className="font-mono text-[13px] font-medium text-[#111827] tabular-nums">
            {fmt(hovered.val)}
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Segmented Distribution Bar + Legend (for Funnel & Lifecycle Statuses)
 */
export function SegmentedDistribution({ segments = [] }) {
  const total = segments.reduce((s, item) => s + Number(item.value || 0), 0);

  return (
    <div className="space-y-3">
      <div className="flex h-2.5 w-full overflow-hidden rounded-full bg-[#F3F4F6]">
        {total === 0 ? (
          <div className="h-full w-full bg-[#E5E7EB]" />
        ) : (
          segments.map((seg) => {
            const pct = (Number(seg.value || 0) / total) * 100;
            if (pct <= 0) return null;
            return (
              <div
                key={seg.label}
                style={{ width: `${pct}%`, backgroundColor: seg.color }}
                title={`${seg.label}: ${seg.value}`}
              />
            );
          })
        )}
      </div>

      <div className="grid grid-cols-2 gap-2.5 pt-1">
        {segments.map((seg) => {
          const pct = total > 0 ? Math.round((Number(seg.value || 0) / total) * 100) : 0;
          return (
            <div
              key={seg.label}
              className="flex items-center justify-between rounded-[8px] border border-[#E5E7EB] bg-[#F9FAFB] px-3 py-2"
            >
              <div className="flex items-center gap-2 min-w-0">
                <span
                  className="h-2 w-2 shrink-0 rounded-full"
                  style={{ backgroundColor: seg.color }}
                />
                <span className="truncate text-[12px] text-[#4B5563]">
                  {seg.label}
                </span>
              </div>
              <div className="flex items-center gap-1.5 font-mono text-[12px] tabular-nums">
                <span className="font-medium text-[#111827]">{seg.value}</span>
                <span className="text-[11px] text-[#9CA3AF]">({pct}%)</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/**
 * Ranked Horizontal Bar List (Secondary Comparative Visualization)
 */
export function HorizontalBarList({
  items = [],
  labelKey = "label",
  sublabelKey,
  valueKey = "value",
  formatValue = (v) => v,
  emptyText = "No records available yet"
}) {
  if (!items.length) {
    return (
      <div className="rounded-[8px] border border-dashed border-[#E5E7EB] bg-[#F9FAFB] px-4 py-8 text-center text-[12px] text-[#6B7280]">
        {emptyText}
      </div>
    );
  }

  const maxVal = Math.max(...items.map((i) => Number(i[valueKey] || 0)), 1);

  return (
    <div className="space-y-3">
      {items.map((item, index) => {
        const val = Number(item[valueKey] || 0);
        const widthPct = Math.max(4, Math.round((val / maxVal) * 100));
        return (
          <div key={item._id || item[labelKey] || index} className="space-y-1">
            <div className="flex items-center justify-between gap-2 text-[13px]">
              <div className="min-w-0 truncate">
                <span className="font-medium text-[#111827]">{item[labelKey]}</span>
                {sublabelKey && item[sublabelKey] && (
                  <span className="ml-1.5 text-[12px] text-[#6B7280]">
                    · {item[sublabelKey]}
                  </span>
                )}
              </div>
              <span className="shrink-0 font-mono text-[12px] font-medium text-[#111827] tabular-nums">
                {formatValue(val)}
              </span>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-[#F3F4F6]">
              <div
                className="h-full rounded-full transition-[width] duration-200"
                style={{
                  width: `${widthPct}%`,
                  backgroundColor: index === 0 ? "#1D4ED8" : "#64748B"
                }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

