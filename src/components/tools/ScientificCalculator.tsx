"use client";

import { useCallback, useState } from "react";
import { cn } from "@/lib/utils";

type AngleMode = "deg" | "rad";

function toRad(v: number, mode: AngleMode): number {
  return mode === "deg" ? (v * Math.PI) / 180 : v;
}
function fromRad(v: number, mode: AngleMode): number {
  return mode === "deg" ? (v * 180) / Math.PI : v;
}

export default function ScientificCalculator() {
  const [display, setDisplay] = useState("0");
  const [expression, setExpression] = useState("");
  const [memory, setMemory] = useState(0);
  const [angleMode, setAngleMode] = useState<AngleMode>("deg");
  const [history, setHistory] = useState<string[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [lastResult, setLastResult] = useState<number | null>(null);
  const [isNewEntry, setIsNewEntry] = useState(true);

  const appendChar = useCallback((ch: string) => {
    if (isNewEntry) {
      setDisplay(ch === "." ? "0." : ch);
      setIsNewEntry(false);
    } else {
      setDisplay((prev) => {
        if (ch === "." && prev.includes(".")) return prev;
        if (prev === "0" && ch !== ".") return ch;
        return prev + ch;
      });
    }
  }, [isNewEntry]);

  const applyUnary = useCallback((fn: (x: number) => number, label: string) => {
    const val = parseFloat(display);
    if (isNaN(val)) return;
    const res = fn(val);
    const entry = `${label}(${val}) = ${res}`;
    setHistory((h) => [entry, ...h].slice(0, 20));
    setDisplay(String(res));
    setLastResult(res);
    setIsNewEntry(true);
  }, [display]);

  const applyOp = useCallback((op: string) => {
    const val = display;
    if (expression && !isNewEntry) {
      try {
        const parts = expression.split(" ");
        const prev = parseFloat(parts[0]);
        const oper = parts[1];
        const cur = parseFloat(val);
        let res: number;
        switch (oper) {
          case "+": res = prev + cur; break;
          case "−": res = prev - cur; break;
          case "×": res = prev * cur; break;
          case "÷": res = cur === 0 ? NaN : prev / cur; break;
          case "^": res = Math.pow(prev, cur); break;
          case "mod": res = prev % cur; break;
          default: res = cur;
        }
        setDisplay(String(res));
        setExpression(`${res} ${op}`);
        setLastResult(res);
      } catch {
        setDisplay("Error");
      }
    } else {
      setExpression(`${val} ${op}`);
    }
    setIsNewEntry(true);
  }, [display, expression, isNewEntry]);

  const calculate = useCallback(() => {
    if (!expression) return;
    try {
      const parts = expression.split(" ");
      const prev = parseFloat(parts[0]);
      const oper = parts[1];
      const cur = parseFloat(display);
      let res: number;
      switch (oper) {
        case "+": res = prev + cur; break;
        case "−": res = prev - cur; break;
        case "×": res = prev * cur; break;
        case "÷": res = cur === 0 ? NaN : prev / cur; break;
        case "^": res = Math.pow(prev, cur); break;
        case "mod": res = prev % cur; break;
        default: res = cur;
      }
      const entry = `${parts[0]} ${oper} ${cur} = ${res}`;
      setHistory((h) => [entry, ...h].slice(0, 20));
      setDisplay(isNaN(res) || !isFinite(res) ? "Error" : String(res));
      setExpression("");
      setLastResult(isNaN(res) ? null : res);
      setIsNewEntry(true);
    } catch {
      setDisplay("Error");
      setExpression("");
      setIsNewEntry(true);
    }
  }, [display, expression]);

  const clear = () => { setDisplay("0"); setExpression(""); setIsNewEntry(true); };
  const clearEntry = () => { setDisplay("0"); setIsNewEntry(true); };
  const backspace = () => {
    if (isNewEntry) return;
    setDisplay((prev) => (prev.length <= 1 ? "0" : prev.slice(0, -1)));
  };
  const toggleSign = () => {
    setDisplay((prev) => (prev.startsWith("-") ? prev.slice(1) : prev === "0" ? "0" : "-" + prev));
  };

  const btnBase = "flex items-center justify-center rounded-lg font-medium transition-all active:scale-95 text-sm h-12";
  const btnNum = cn(btnBase, "bg-white border border-border hover:bg-slate-50 text-text-primary");
  const btnOp = cn(btnBase, "bg-brand-50 border border-brand-200 hover:bg-brand-100 text-brand-700 font-semibold");
  const btnFn = cn(btnBase, "bg-slate-100 border border-border hover:bg-slate-200 text-text-secondary text-xs");
  const btnEq = cn(btnBase, "bg-brand-600 text-white hover:bg-brand-700 font-bold");
  const btnDanger = cn(btnBase, "bg-red-50 border border-red-200 hover:bg-red-100 text-red-600");

  return (
    <div className="space-y-6">
      <div className="mx-auto max-w-md rounded-2xl border border-border bg-surface-muted/40 shadow-lg overflow-hidden">
        {/* Mode bar */}
        <div className="flex items-center justify-between px-4 py-2 bg-surface-muted border-b border-border">
          <div className="flex gap-1">
            {(["deg", "rad"] as const).map((m) => (
              <button key={m} type="button" onClick={() => setAngleMode(m)}
                className={cn("rounded px-2.5 py-1 text-xs font-medium transition",
                  angleMode === m ? "bg-brand-600 text-white" : "text-text-muted hover:bg-slate-200")}>
                {m.toUpperCase()}
              </button>
            ))}
          </div>
          <div className="flex gap-2">
            <button type="button" onClick={() => setShowHistory(!showHistory)}
              className="text-xs text-text-muted hover:text-text-primary">
              History ({history.length})
            </button>
            <span className="text-xs text-text-muted">M={memory}</span>
          </div>
        </div>

        {/* Display */}
        <div className="px-4 py-3 bg-white border-b border-border">
          <p className="text-right text-xs text-text-muted h-4 overflow-hidden">{expression || "\u00A0"}</p>
          <p className="text-right font-result text-3xl font-bold text-text-primary mt-1 overflow-x-auto whitespace-nowrap">
            {display}
          </p>
        </div>

        {/* History drawer */}
        {showHistory && (
          <div className="max-h-32 overflow-y-auto border-b border-border bg-slate-50 px-4 py-2 text-xs text-text-secondary space-y-0.5">
            {history.length === 0 && <p className="text-text-muted">No history yet</p>}
            {history.map((h, i) => (
              <p key={i} className="font-result">{h}</p>
            ))}
          </div>
        )}

        {/* Scientific functions */}
        <div className="grid grid-cols-5 gap-1 p-2">
          <button type="button" className={btnFn} onClick={() => applyUnary((x) => Math.sin(toRad(x, angleMode)), "sin")}>sin</button>
          <button type="button" className={btnFn} onClick={() => applyUnary((x) => Math.cos(toRad(x, angleMode)), "cos")}>cos</button>
          <button type="button" className={btnFn} onClick={() => applyUnary((x) => Math.tan(toRad(x, angleMode)), "tan")}>tan</button>
          <button type="button" className={btnFn} onClick={() => applyUnary((x) => fromRad(Math.asin(x), angleMode), "asin")}>sin⁻¹</button>
          <button type="button" className={btnFn} onClick={() => applyUnary((x) => fromRad(Math.acos(x), angleMode), "acos")}>cos⁻¹</button>

          <button type="button" className={btnFn} onClick={() => applyUnary((x) => fromRad(Math.atan(x), angleMode), "atan")}>tan⁻¹</button>
          <button type="button" className={btnFn} onClick={() => applyUnary(Math.log10, "log")}>log</button>
          <button type="button" className={btnFn} onClick={() => applyUnary(Math.log, "ln")}>ln</button>
          <button type="button" className={btnFn} onClick={() => applyUnary(Math.exp, "eˣ")}>eˣ</button>
          <button type="button" className={btnFn} onClick={() => applyUnary((x) => Math.pow(10, x), "10ˣ")}>10ˣ</button>

          <button type="button" className={btnFn} onClick={() => applyUnary(Math.sqrt, "√")}>√</button>
          <button type="button" className={btnFn} onClick={() => applyUnary(Math.cbrt, "∛")}>∛</button>
          <button type="button" className={btnFn} onClick={() => applyUnary((x) => x * x, "x²")}>x²</button>
          <button type="button" className={btnFn} onClick={() => applyOp("^")}>xʸ</button>
          <button type="button" className={btnFn} onClick={() => applyUnary((x) => x === 0 ? NaN : 1 / x, "1/x")}>1/x</button>

          <button type="button" className={btnFn} onClick={() => applyUnary((x) => { let r = 1; for (let i = 2; i <= x && i < 171; i++) r *= i; return r; }, "n!")}>n!</button>
          <button type="button" className={btnFn} onClick={() => applyUnary(Math.abs, "|x|")}>|x|</button>
          <button type="button" className={btnFn} onClick={() => { setDisplay(String(Math.PI)); setIsNewEntry(true); }}>π</button>
          <button type="button" className={btnFn} onClick={() => { setDisplay(String(Math.E)); setIsNewEntry(true); }}>e</button>
          <button type="button" className={btnFn} onClick={() => applyOp("mod")}>mod</button>
        </div>

        {/* Memory row */}
        <div className="grid grid-cols-5 gap-1 px-2">
          <button type="button" className={btnFn} onClick={() => setMemory(0)}>MC</button>
          <button type="button" className={btnFn} onClick={() => { setDisplay(String(memory)); setIsNewEntry(true); }}>MR</button>
          <button type="button" className={btnFn} onClick={() => setMemory(memory + (parseFloat(display) || 0))}>M+</button>
          <button type="button" className={btnFn} onClick={() => setMemory(memory - (parseFloat(display) || 0))}>M−</button>
          <button type="button" className={btnFn} onClick={() => setMemory(parseFloat(display) || 0)}>MS</button>
        </div>

        {/* Main keypad */}
        <div className="grid grid-cols-4 gap-1.5 p-2">
          <button type="button" className={btnDanger} onClick={clear}>AC</button>
          <button type="button" className={btnDanger} onClick={clearEntry}>CE</button>
          <button type="button" className={btnFn} onClick={backspace}>⌫</button>
          <button type="button" className={btnOp} onClick={() => applyOp("÷")}>÷</button>

          <button type="button" className={btnNum} onClick={() => appendChar("7")}>7</button>
          <button type="button" className={btnNum} onClick={() => appendChar("8")}>8</button>
          <button type="button" className={btnNum} onClick={() => appendChar("9")}>9</button>
          <button type="button" className={btnOp} onClick={() => applyOp("×")}>×</button>

          <button type="button" className={btnNum} onClick={() => appendChar("4")}>4</button>
          <button type="button" className={btnNum} onClick={() => appendChar("5")}>5</button>
          <button type="button" className={btnNum} onClick={() => appendChar("6")}>6</button>
          <button type="button" className={btnOp} onClick={() => applyOp("−")}>−</button>

          <button type="button" className={btnNum} onClick={() => appendChar("1")}>1</button>
          <button type="button" className={btnNum} onClick={() => appendChar("2")}>2</button>
          <button type="button" className={btnNum} onClick={() => appendChar("3")}>3</button>
          <button type="button" className={btnOp} onClick={() => applyOp("+")}>+</button>

          <button type="button" className={btnNum} onClick={toggleSign}>±</button>
          <button type="button" className={btnNum} onClick={() => appendChar("0")}>0</button>
          <button type="button" className={btnNum} onClick={() => appendChar(".")}>.</button>
          <button type="button" className={btnEq} onClick={calculate}>=</button>
        </div>
      </div>
    </div>
  );
}
