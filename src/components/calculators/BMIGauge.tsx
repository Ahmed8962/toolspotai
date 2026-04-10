"use client";

import { bmiGaugeNeedleDegrees } from "@/lib/bmi";

const CX = 100;
const CY = 100;
const R = 82;

/** Map BMI 16–40 to angle (rad): left of semicircle = high BMI end, right = low — match needle */
function theta(bmi: number): number {
  const b = Math.min(40, Math.max(16, bmi));
  return (Math.PI * (40 - b)) / 24;
}

function pt(bmi: number) {
  const t = theta(bmi);
  return { x: CX + R * Math.cos(t), y: CY - R * Math.sin(t) };
}

function arcPath(b1: number, b2: number): string {
  const p1 = pt(b1);
  const p2 = pt(b2);
  const largeArc = Math.abs(b2 - b1) > 12 ? 1 : 0;
  return `M ${p1.x} ${p1.y} A ${R} ${R} 0 ${largeArc} 1 ${p2.x} ${p2.y}`;
}

export function BMIGauge({ bmi }: { bmi: number }) {
  const deg = bmiGaugeNeedleDegrees(bmi);
  const rad = (deg * Math.PI) / 180;
  const needleLen = 70;
  const nx = CX + needleLen * Math.cos(rad);
  const ny = CY - needleLen * Math.sin(rad);

  const bands: { from: number; to: number; color: string }[] = [
    { from: 16, to: 18.5, color: "#f87171" },
    { from: 18.5, to: 25, color: "#22c55e" },
    { from: 25, to: 30, color: "#eab308" },
    { from: 30, to: 35, color: "#f97316" },
    { from: 35, to: 40, color: "#b91c1c" },
  ];

  return (
    <div className="relative mx-auto w-full max-w-[240px]">
      <svg viewBox="0 0 200 112" className="w-full" aria-hidden>
        {bands.map((b) => (
          <path
            key={`${b.from}-${b.to}`}
            d={arcPath(b.from, b.to)}
            fill="none"
            stroke={b.color}
            strokeWidth="16"
            strokeLinecap="butt"
          />
        ))}
        {[16, 18.5, 25, 30, 35, 40].map((mark) => {
          const t = theta(mark);
          const ix = CX + (R + 10) * Math.cos(t);
          const iy = CY - (R + 10) * Math.sin(t);
          return (
            <text
              key={mark}
              x={ix}
              y={iy}
              textAnchor="middle"
              dominantBaseline="middle"
              className="fill-slate-500"
              style={{ fontSize: "10px" }}
            >
              {mark}
            </text>
          );
        })}
        <line
          x1={CX}
          y1={CY}
          x2={nx}
          y2={ny}
          stroke="#334155"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
        <circle cx={CX} cy={CY} r="5" fill="#334155" />
      </svg>
      <p className="text-center font-result text-sm font-semibold text-text-primary">
        BMI = {bmi.toFixed(1)}
      </p>
    </div>
  );
}
