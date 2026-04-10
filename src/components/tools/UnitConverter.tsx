"use client";

import { useState, useMemo } from "react";
import { cn } from "@/lib/utils";

type UnitDef = { value: string; label: string; factor: number };

type Category = {
  id: string;
  label: string;
  units: UnitDef[];
  convert: (val: number, from: UnitDef, to: UnitDef) => number;
};

const linearConvert = (val: number, from: UnitDef, to: UnitDef) =>
  (val * from.factor) / to.factor;

const CATEGORIES: Category[] = [
  {
    id: "length",
    label: "Length",
    units: [
      { value: "m", label: "Meter (m)", factor: 1 },
      { value: "km", label: "Kilometer (km)", factor: 1000 },
      { value: "cm", label: "Centimeter (cm)", factor: 0.01 },
      { value: "mm", label: "Millimeter (mm)", factor: 0.001 },
      { value: "mi", label: "Mile (mi)", factor: 1609.344 },
      { value: "yd", label: "Yard (yd)", factor: 0.9144 },
      { value: "ft", label: "Foot (ft)", factor: 0.3048 },
      { value: "in", label: "Inch (in)", factor: 0.0254 },
      { value: "nm", label: "Nautical mile (nmi)", factor: 1852 },
      { value: "um", label: "Micrometer (\u00b5m)", factor: 1e-6 },
    ],
    convert: linearConvert,
  },
  {
    id: "weight",
    label: "Weight",
    units: [
      { value: "kg", label: "Kilogram (kg)", factor: 1 },
      { value: "g", label: "Gram (g)", factor: 0.001 },
      { value: "mg", label: "Milligram (mg)", factor: 1e-6 },
      { value: "t", label: "Metric ton (t)", factor: 1000 },
      { value: "lb", label: "Pound (lb)", factor: 0.45359237 },
      { value: "oz", label: "Ounce (oz)", factor: 0.0283495231 },
      { value: "st", label: "Stone (st)", factor: 6.35029318 },
      { value: "ust", label: "US ton (short ton)", factor: 907.18474 },
      { value: "ukt", label: "Imperial ton (long ton)", factor: 1016.0469088 },
    ],
    convert: linearConvert,
  },
  {
    id: "temperature",
    label: "Temperature",
    units: [
      { value: "c", label: "Celsius (\u00b0C)", factor: 0 },
      { value: "f", label: "Fahrenheit (\u00b0F)", factor: 0 },
      { value: "k", label: "Kelvin (K)", factor: 0 },
    ],
    convert: (val, from, to) => {
      let celsius = val;
      if (from.value === "f") celsius = (val - 32) * (5 / 9);
      else if (from.value === "k") celsius = val - 273.15;

      if (to.value === "c") return celsius;
      if (to.value === "f") return celsius * (9 / 5) + 32;
      return celsius + 273.15;
    },
  },
  {
    id: "area",
    label: "Area",
    units: [
      { value: "m2", label: "Square meter (m\u00b2)", factor: 1 },
      { value: "km2", label: "Square kilometer (km\u00b2)", factor: 1e6 },
      { value: "cm2", label: "Square centimeter (cm\u00b2)", factor: 1e-4 },
      { value: "ha", label: "Hectare (ha)", factor: 10000 },
      { value: "ac", label: "Acre (ac)", factor: 4046.8564224 },
      { value: "sqmi", label: "Square mile (mi\u00b2)", factor: 2589988.110336 },
      { value: "sqyd", label: "Square yard (yd\u00b2)", factor: 0.83612736 },
      { value: "sqft", label: "Square foot (ft\u00b2)", factor: 0.09290304 },
      { value: "sqin", label: "Square inch (in\u00b2)", factor: 6.4516e-4 },
    ],
    convert: linearConvert,
  },
  {
    id: "volume",
    label: "Volume",
    units: [
      { value: "l", label: "Liter (L)", factor: 1 },
      { value: "ml", label: "Milliliter (mL)", factor: 0.001 },
      { value: "m3", label: "Cubic meter (m\u00b3)", factor: 1000 },
      { value: "gal", label: "US gallon (gal)", factor: 3.785411784 },
      { value: "qt", label: "US quart (qt)", factor: 0.946352946 },
      { value: "pt", label: "US pint (pt)", factor: 0.473176473 },
      { value: "cup", label: "US cup", factor: 0.2365882365 },
      { value: "floz", label: "US fluid ounce (fl oz)", factor: 0.0295735296 },
      { value: "tbsp", label: "Tablespoon (tbsp)", factor: 0.0147867648 },
      { value: "tsp", label: "Teaspoon (tsp)", factor: 0.0049289216 },
      { value: "impgal", label: "Imperial gallon", factor: 4.54609 },
      { value: "impfloz", label: "Imperial fl oz", factor: 0.0284130625 },
    ],
    convert: linearConvert,
  },
  {
    id: "speed",
    label: "Speed",
    units: [
      { value: "ms", label: "Meter/second (m/s)", factor: 1 },
      { value: "kmh", label: "Kilometer/hour (km/h)", factor: 0.277777778 },
      { value: "mph", label: "Mile/hour (mph)", factor: 0.44704 },
      { value: "kn", label: "Knot (kn)", factor: 0.514444444 },
      { value: "fts", label: "Foot/second (ft/s)", factor: 0.3048 },
      { value: "mach", label: "Mach (at sea level)", factor: 340.29 },
    ],
    convert: linearConvert,
  },
];

function formatResult(n: number): string {
  if (n === 0) return "0";
  const abs = Math.abs(n);
  if (abs >= 1e15 || (abs < 1e-10 && abs > 0)) return n.toExponential(8);
  if (abs >= 1) return parseFloat(n.toPrecision(12)).toString();
  return parseFloat(n.toPrecision(10)).toString();
}

export default function UnitConverter() {
  const [catId, setCatId] = useState("length");
  const [fromVal, setFromVal] = useState("1");
  const [fromUnit, setFromUnit] = useState("m");
  const [toUnit, setToUnit] = useState("ft");

  const cat = CATEGORIES.find((c) => c.id === catId)!;

  const switchCategory = (id: string) => {
    setCatId(id);
    const c = CATEGORIES.find((x) => x.id === id)!;
    setFromUnit(c.units[0]!.value);
    setToUnit(c.units[1]!.value);
    setFromVal("1");
  };

  const swapUnits = () => {
    const result = converted;
    setFromUnit(toUnit);
    setToUnit(fromUnit);
    if (result !== null) setFromVal(formatResult(result));
  };

  const fromDef = cat.units.find((u) => u.value === fromUnit) ?? cat.units[0]!;
  const toDef = cat.units.find((u) => u.value === toUnit) ?? cat.units[1]!;
  const inputNum = parseFloat(fromVal);

  const converted = useMemo(() => {
    if (Number.isNaN(inputNum)) return null;
    return cat.convert(inputNum, fromDef, toDef);
  }, [inputNum, fromDef, toDef, cat]);

  const allConversions = useMemo(() => {
    if (Number.isNaN(inputNum)) return [];
    return cat.units
      .filter((u) => u.value !== fromUnit)
      .map((u) => ({
        label: u.label,
        value: cat.convert(inputNum, fromDef, u),
      }));
  }, [inputNum, fromDef, cat, fromUnit]);

  const inputCls =
    "h-12 w-full rounded-lg border border-border bg-surface-card px-3 outline-none focus:ring-2 focus:ring-brand-500/30 text-sm";

  return (
    <div className="space-y-8">
      {/* Category tabs */}
      <div className="flex flex-wrap gap-2">
        {CATEGORIES.map((c) => (
          <button
            key={c.id}
            type="button"
            onClick={() => switchCategory(c.id)}
            className={cn(
              "rounded-full px-4 py-2 text-sm font-medium transition",
              catId === c.id
                ? "bg-brand-600 text-white"
                : "bg-surface-muted text-text-secondary hover:bg-slate-200",
            )}
          >
            {c.label}
          </button>
        ))}
      </div>

      {/* Converter */}
      <div className="space-y-4">
        {/* From */}
        <div className="rounded-xl border border-border bg-surface-muted/40 p-4">
          <p className="mb-2 text-sm font-medium text-text-primary">From</p>
          <div className="grid gap-3 sm:grid-cols-2">
            <input
              type="number"
              inputMode="decimal"
              value={fromVal}
              onChange={(e) => setFromVal(e.target.value)}
              className={inputCls}
              placeholder="Enter value"
            />
            <select
              value={fromUnit}
              onChange={(e) => setFromUnit(e.target.value)}
              className={inputCls}
            >
              {cat.units.map((u) => (
                <option key={u.value} value={u.value}>
                  {u.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Swap button */}
        <div className="flex justify-center">
          <button
            type="button"
            onClick={swapUnits}
            className="rounded-full border border-border bg-white p-2 shadow-sm hover:bg-surface-muted"
            title="Swap units"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M7 16V4m0 0L3 8m4-4l4 4M17 8v12m0 0l4-4m-4 4l-4-4" />
            </svg>
          </button>
        </div>

        {/* To */}
        <div className="rounded-xl border border-border bg-surface-muted/40 p-4">
          <p className="mb-2 text-sm font-medium text-text-primary">To</p>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="flex h-12 items-center rounded-lg border border-border bg-white px-3">
              <span className="font-result text-lg font-semibold text-brand-700">
                {converted !== null ? formatResult(converted) : "—"}
              </span>
            </div>
            <select
              value={toUnit}
              onChange={(e) => setToUnit(e.target.value)}
              className={inputCls}
            >
              {cat.units.map((u) => (
                <option key={u.value} value={u.value}>
                  {u.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Formula display */}
      {converted !== null && (
        <div className="animate-[fadeUp_0.35s_ease_both] space-y-6">
          <div className="rounded-xl bg-surface-muted p-4 text-center">
            <p className="text-sm text-text-secondary">
              <span className="font-result font-semibold">{fromVal}</span>{" "}
              {fromDef.label} ={" "}
              <span className="font-result font-semibold text-brand-700">
                {formatResult(converted)}
              </span>{" "}
              {toDef.label}
            </p>
          </div>

          {/* All conversions table */}
          <div className="rounded-xl border border-border">
            <p className="border-b border-border p-3 text-sm font-medium text-text-primary">
              {fromVal} {fromDef.label} in other units
            </p>
            <div className="max-h-[320px] overflow-y-auto">
              {allConversions.map((row, i) => (
                <div
                  key={row.label}
                  className={cn(
                    "flex items-center justify-between px-4 py-2.5 text-sm",
                    i % 2 === 1 && "bg-surface-muted/60",
                  )}
                >
                  <span className="text-text-secondary">{row.label}</span>
                  <span className="font-result font-semibold">
                    {formatResult(row.value)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
