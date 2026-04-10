"use client";

import { type CurrencyCode, formatMoney } from "@/lib/currency";
import CurrencyPicker from "@/components/shared/CurrencyPicker";
import { useMemo, useRef, useState } from "react";
import { cn } from "@/lib/utils";

type LineItem = {
  id: number;
  description: string;
  quantity: string;
  rate: string;
};

let nextItemId = 4;

const DEFAULT_ITEMS: LineItem[] = [
  { id: 1, description: "Web Design & Development", quantity: "40", rate: "85" },
  { id: 2, description: "Logo Design", quantity: "1", rate: "500" },
  { id: 3, description: "Hosting Setup", quantity: "1", rate: "150" },
];

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

function dueDateStr(days: number) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

export default function InvoiceGenerator() {
  const [currency, setCurrency] = useState<CurrencyCode>("USD");
  const [invoiceNumber, setInvoiceNumber] = useState("INV-001");
  const [invoiceDate, setInvoiceDate] = useState(todayStr());
  const [dueDate, setDueDate] = useState(dueDateStr(30));

  const [fromName, setFromName] = useState("Your Company Name");
  const [fromAddress, setFromAddress] = useState("123 Business St\nCity, State 10001\nUnited States");
  const [fromEmail, setFromEmail] = useState("billing@yourcompany.com");

  const [toName, setToName] = useState("Client Name");
  const [toAddress, setToAddress] = useState("456 Client Ave\nCity, State 20002\nUnited States");
  const [toEmail, setToEmail] = useState("client@example.com");

  const [items, setItems] = useState<LineItem[]>(DEFAULT_ITEMS);
  const [taxRate, setTaxRate] = useState("0");
  const [discount, setDiscount] = useState("0");
  const [notes, setNotes] = useState("Payment is due within 30 days. Thank you for your business!");

  const printRef = useRef<HTMLDivElement>(null);

  const fmt = (n: number) => formatMoney(n, currency);

  const updateItem = (id: number, field: keyof LineItem, value: string) => {
    setItems((prev) => prev.map((it) => (it.id === id ? { ...it, [field]: value } : it)));
  };

  const addItem = () => {
    setItems((prev) => [...prev, { id: nextItemId++, description: "", quantity: "1", rate: "0" }]);
  };

  const removeItem = (id: number) => {
    if (items.length <= 1) return;
    setItems((prev) => prev.filter((it) => it.id !== id));
  };

  const totals = useMemo(() => {
    let subtotal = 0;
    const lineAmounts: number[] = [];
    for (const it of items) {
      const qty = parseFloat(it.quantity) || 0;
      const rate = parseFloat(it.rate) || 0;
      const amount = qty * rate;
      lineAmounts.push(amount);
      subtotal += amount;
    }
    const discountAmt = (parseFloat(discount) || 0) / 100 * subtotal;
    const afterDiscount = subtotal - discountAmt;
    const taxAmt = (parseFloat(taxRate) || 0) / 100 * afterDiscount;
    const total = afterDiscount + taxAmt;
    return { subtotal, discountAmt, afterDiscount, taxAmt, total, lineAmounts };
  }, [items, taxRate, discount]);

  const handlePrint = () => {
    const printWindow = window.open("", "_blank");
    if (!printWindow || !printRef.current) return;
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Invoice ${invoiceNumber}</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; color: #1a1a1a; padding: 40px; font-size: 14px; }
          .invoice-header { display: flex; justify-content: space-between; margin-bottom: 40px; }
          .invoice-title { font-size: 32px; font-weight: 700; color: #3b82f6; }
          .invoice-meta { text-align: right; }
          .invoice-meta dt { font-size: 11px; color: #666; text-transform: uppercase; letter-spacing: 0.5px; }
          .invoice-meta dd { font-size: 14px; font-weight: 600; margin-bottom: 8px; }
          .parties { display: flex; gap: 40px; margin-bottom: 32px; }
          .party { flex: 1; }
          .party-label { font-size: 11px; color: #666; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 6px; }
          .party-name { font-weight: 600; font-size: 15px; }
          .party-detail { color: #444; white-space: pre-line; line-height: 1.5; margin-top: 4px; }
          table { width: 100%; border-collapse: collapse; margin-bottom: 24px; }
          thead th { background: #f1f5f9; padding: 10px 12px; text-align: left; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; color: #666; }
          tbody td { padding: 10px 12px; border-bottom: 1px solid #e2e8f0; }
          .text-right { text-align: right; }
          .totals { width: 300px; margin-left: auto; }
          .totals tr td { padding: 6px 12px; }
          .totals .total-row { font-size: 18px; font-weight: 700; color: #3b82f6; border-top: 2px solid #1a1a1a; }
          .notes { margin-top: 32px; padding: 16px; background: #f8fafc; border-radius: 8px; font-size: 13px; color: #444; }
          .notes-label { font-weight: 600; font-size: 12px; text-transform: uppercase; color: #666; margin-bottom: 4px; }
          @media print { body { padding: 20px; } }
        </style>
      </head>
      <body>
        ${printRef.current.innerHTML}
        <script>window.onload = function() { window.print(); }</script>
      </body>
      </html>
    `);
    printWindow.document.close();
  };

  const inputCls =
    "h-10 w-full rounded-lg border border-border bg-surface-card px-2.5 outline-none focus:ring-2 focus:ring-brand-500/30 text-sm";

  return (
    <div className="space-y-8">
      <CurrencyPicker value={currency} onChange={setCurrency} />

      {/* Invoice details */}
      <div className="rounded-xl border border-border bg-surface-muted/40 p-4">
        <p className="text-sm font-medium text-text-primary mb-3">Invoice details</p>
        <div className="grid gap-4 sm:grid-cols-3">
          <label className="block text-sm text-text-secondary">
            Invoice #
            <input type="text" value={invoiceNumber} onChange={(e) => setInvoiceNumber(e.target.value)} className={cn(inputCls, "mt-1")} />
          </label>
          <label className="block text-sm text-text-secondary">
            Invoice date
            <input type="date" value={invoiceDate} onChange={(e) => setInvoiceDate(e.target.value)} className={cn(inputCls, "mt-1")} />
          </label>
          <label className="block text-sm text-text-secondary">
            Due date
            <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} className={cn(inputCls, "mt-1")} />
          </label>
        </div>
      </div>

      {/* From / To */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-xl border border-border bg-surface-muted/40 p-4 space-y-3">
          <p className="text-sm font-medium text-text-primary">From</p>
          <input type="text" value={fromName} onChange={(e) => setFromName(e.target.value)} className={inputCls} placeholder="Your name / company" />
          <textarea value={fromAddress} onChange={(e) => setFromAddress(e.target.value)} rows={3} className={cn(inputCls, "h-auto py-2")} placeholder="Address" />
          <input type="email" value={fromEmail} onChange={(e) => setFromEmail(e.target.value)} className={inputCls} placeholder="Email" />
        </div>
        <div className="rounded-xl border border-border bg-surface-muted/40 p-4 space-y-3">
          <p className="text-sm font-medium text-text-primary">Bill to</p>
          <input type="text" value={toName} onChange={(e) => setToName(e.target.value)} className={inputCls} placeholder="Client name / company" />
          <textarea value={toAddress} onChange={(e) => setToAddress(e.target.value)} rows={3} className={cn(inputCls, "h-auto py-2")} placeholder="Address" />
          <input type="email" value={toEmail} onChange={(e) => setToEmail(e.target.value)} className={inputCls} placeholder="Email" />
        </div>
      </div>

      {/* Line items */}
      <div className="rounded-xl border border-border bg-surface-muted/40 p-4">
        <p className="text-sm font-medium text-text-primary mb-3">Line items</p>
        <div className="space-y-2">
          <div className="hidden sm:grid sm:grid-cols-[3fr_1fr_1fr_1fr_auto] gap-2 text-xs font-medium text-text-muted px-1">
            <span>Description</span>
            <span>Qty</span>
            <span>Rate</span>
            <span className="text-right">Amount</span>
            <span className="w-8" />
          </div>
          {items.map((it, idx) => (
            <div key={it.id} className="grid grid-cols-[3fr_1fr_1fr_1fr_auto] gap-2 items-center">
              <input
                type="text"
                value={it.description}
                onChange={(e) => updateItem(it.id, "description", e.target.value)}
                className={inputCls}
                placeholder={`Item ${idx + 1}`}
              />
              <input
                type="number"
                inputMode="decimal"
                min={0}
                value={it.quantity}
                onChange={(e) => updateItem(it.id, "quantity", e.target.value)}
                className={inputCls}
              />
              <input
                type="number"
                inputMode="decimal"
                min={0}
                value={it.rate}
                onChange={(e) => updateItem(it.id, "rate", e.target.value)}
                className={inputCls}
              />
              <span className="font-result text-sm text-right pr-1">
                {fmt(totals.lineAmounts[idx] ?? 0)}
              </span>
              <button
                type="button"
                onClick={() => removeItem(it.id)}
                disabled={items.length <= 1}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-text-muted hover:bg-red-50 hover:text-red-600 disabled:opacity-30"
              >
                &times;
              </button>
            </div>
          ))}
        </div>
        <button
          type="button"
          onClick={addItem}
          className="mt-3 rounded-lg border border-dashed border-border px-4 py-2 text-sm font-medium text-brand-600 hover:bg-brand-50"
        >
          + Add item
        </button>
      </div>

      {/* Tax, discount, notes */}
      <div className="rounded-xl border border-border bg-surface-muted/40 p-4">
        <div className="grid gap-4 sm:grid-cols-3">
          <label className="block text-sm text-text-secondary">
            Tax rate (%)
            <input type="number" inputMode="decimal" min={0} max={100} step={0.5} value={taxRate} onChange={(e) => setTaxRate(e.target.value)} className={cn(inputCls, "mt-1")} />
          </label>
          <label className="block text-sm text-text-secondary">
            Discount (%)
            <input type="number" inputMode="decimal" min={0} max={100} step={0.5} value={discount} onChange={(e) => setDiscount(e.target.value)} className={cn(inputCls, "mt-1")} />
          </label>
        </div>
        <label className="block text-sm text-text-secondary mt-4">
          Notes / Terms
          <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} className={cn(inputCls, "mt-1 h-auto py-2")} />
        </label>
      </div>

      {/* Summary cards */}
      <div className="grid gap-3 sm:grid-cols-4">
        <div className="rounded-xl bg-surface-muted p-4 text-center">
          <p className="text-xs text-text-muted">Subtotal</p>
          <p className="font-result mt-0.5 text-lg font-semibold">{fmt(totals.subtotal)}</p>
        </div>
        {totals.discountAmt > 0 && (
          <div className="rounded-xl bg-surface-muted p-4 text-center">
            <p className="text-xs text-text-muted">Discount</p>
            <p className="font-result mt-0.5 text-lg font-semibold text-red-600">-{fmt(totals.discountAmt)}</p>
          </div>
        )}
        {totals.taxAmt > 0 && (
          <div className="rounded-xl bg-surface-muted p-4 text-center">
            <p className="text-xs text-text-muted">Tax</p>
            <p className="font-result mt-0.5 text-lg font-semibold">{fmt(totals.taxAmt)}</p>
          </div>
        )}
        <div className="rounded-xl bg-brand-50 border border-brand-200 p-4 text-center">
          <p className="text-xs text-brand-600 font-medium">Total due</p>
          <p className="font-result mt-0.5 text-2xl font-bold text-brand-700">{fmt(totals.total)}</p>
        </div>
      </div>

      {/* Print / Download */}
      <div className="flex gap-3">
        <button
          type="button"
          onClick={handlePrint}
          className="rounded-lg bg-brand-600 px-6 py-2.5 text-sm font-medium text-white hover:bg-brand-700 transition"
        >
          Print / Save as PDF
        </button>
      </div>

      {/* Hidden printable invoice */}
      <div ref={printRef} className="hidden">
        <div className="invoice-header">
          <div>
            <div className="invoice-title">INVOICE</div>
          </div>
          <div className="invoice-meta">
            <dl>
              <dt>Invoice Number</dt>
              <dd>{invoiceNumber}</dd>
              <dt>Invoice Date</dt>
              <dd>{invoiceDate}</dd>
              <dt>Due Date</dt>
              <dd>{dueDate}</dd>
            </dl>
          </div>
        </div>

        <div className="parties">
          <div className="party">
            <div className="party-label">From</div>
            <div className="party-name">{fromName}</div>
            <div className="party-detail">{fromAddress}</div>
            <div className="party-detail">{fromEmail}</div>
          </div>
          <div className="party">
            <div className="party-label">Bill To</div>
            <div className="party-name">{toName}</div>
            <div className="party-detail">{toAddress}</div>
            <div className="party-detail">{toEmail}</div>
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th>Description</th>
              <th className="text-right">Qty</th>
              <th className="text-right">Rate</th>
              <th className="text-right">Amount</th>
            </tr>
          </thead>
          <tbody>
            {items.map((it, idx) => (
              <tr key={it.id}>
                <td>{it.description || `Item ${idx + 1}`}</td>
                <td className="text-right">{it.quantity}</td>
                <td className="text-right">{fmt(parseFloat(it.rate) || 0)}</td>
                <td className="text-right">{fmt(totals.lineAmounts[idx] ?? 0)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <table className="totals">
          <tbody>
            <tr>
              <td>Subtotal</td>
              <td className="text-right">{fmt(totals.subtotal)}</td>
            </tr>
            {totals.discountAmt > 0 && (
              <tr>
                <td>Discount ({discount}%)</td>
                <td className="text-right">-{fmt(totals.discountAmt)}</td>
              </tr>
            )}
            {totals.taxAmt > 0 && (
              <tr>
                <td>Tax ({taxRate}%)</td>
                <td className="text-right">{fmt(totals.taxAmt)}</td>
              </tr>
            )}
            <tr className="total-row">
              <td>Total Due</td>
              <td className="text-right">{fmt(totals.total)}</td>
            </tr>
          </tbody>
        </table>

        {notes && (
          <div className="notes">
            <div className="notes-label">Notes</div>
            {notes}
          </div>
        )}
      </div>

      <p className="text-xs leading-relaxed text-text-muted">
        Your invoice is generated entirely in the browser. No data is stored
        or sent to any server. Click &quot;Print / Save as PDF&quot; to export —
        use your browser&apos;s &quot;Save as PDF&quot; option for a downloadable file.
      </p>
    </div>
  );
}
