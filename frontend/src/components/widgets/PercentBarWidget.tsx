import React from 'react';

interface PercentBarWidgetProps {
  label: string;
  value?: number | null; // 0 to 150
}

export const PercentBarWidget: React.FC<PercentBarWidgetProps> = ({ label, value }) => {
  const clampedValue = Math.max(0, value ?? 0);
  const exceeded = clampedValue >= 100.0;
  const fillRatio = Math.min(clampedValue / 150.0, 1.0);
  const markerLeftPercent = (100.0 / 150.0) * 100; // 66.67%

  return (
    <div className="flex flex-col gap-0.5 mb-1.5">
      {/* Label above */}
      {label && (
        <span className="text-[11px] text-main leading-tight select-none">
          {label}
        </span>
      )}

      {/* Bar Row: [ Track with 100% marker ] [ XX% ] */}
      <div className="flex items-center gap-2">
        {/* Track Container */}
        <div className="flex-1 h-1.5 bg-border-subtle rounded-[3px] relative overflow-visible">
          {/* Filled Pill */}
          <div
            className={`h-full rounded-[3px] transition-[width] duration-200 ${
              exceeded ? 'bg-[#CC2222]' : 'bg-accent'
            }`}
            style={{ width: `${fillRatio * 100}%` }}
          />

          {/* 100% Limit Marker Line */}
          <div
            className="absolute -top-0.5 -bottom-0.5 w-0.5 bg-main left-[66.67%] z-[2] pointer-events-none"
            title="100% Limit"
          />
        </div>

        {/* Value Label (fixed 46px width) */}
        <span className="w-[46px] text-center text-[11px] font-bold text-main select-none tabular-nums">
          {Math.round(clampedValue)}%
        </span>
      </div>
    </div>
  );
};
