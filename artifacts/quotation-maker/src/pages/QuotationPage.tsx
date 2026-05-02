import { useState, useRef, useCallback, useEffect } from "react";
import * as XLSX from "xlsx";
import {
  Plus, Trash2, FileText, Printer, X, ChevronDown,
  Pencil, Check, Download, FileSpreadsheet, FileDown,
} from "lucide-react";
import {
  PIPE_DATA, PIPE_SIZES, PN_RATINGS, getAvgWeight,
  getAvailablePNs, type PNRating,
} from "@/data/pipeData";
import { useToast } from "@/hooks/use-toast";

// ─── Types ────────────────────────────────────────────────────────────────────

interface QuotationItem {
  id: string;
  dnLabel: string;
  pn: PNRating;
  avgWeight: number;
  quantity: number;
}

interface FormState {
  dnLabel: string;
  pn: PNRating | "";
  quantity: string;
  sizeSearch: string;
}

interface RowEditState {
  id: string;
  sizeSearch: string;
  selectedDnLabel: string;
  selectedPn: PNRating | "";
  quantityVal: string;
  showSizeDrop: boolean;
  showPNDrop: boolean;
}

interface QuotationHeader {
  title: string;
  subtitle: string;
  note: string;
  date: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const VAT_RATE = 0.13;

function generateId() {
  return Math.random().toString(36).substring(2, 10);
}

function formatNum(n: number, decimals = 2) {
  return n.toLocaleString("en-IN", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

function todayString() {
  return new Date().toLocaleDateString("en-IN", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

// ─── Reusable inline size search dropdown ─────────────────────────────────────

function SizeDropdown({
  value,
  onChange,
  onSelect,
  open,
  onOpen,
  onClose,
  autoFocus = false,
  placeholder = "Search size…",
}: {
  value: string;
  onChange: (v: string) => void;
  onSelect: (s: string) => void;
  open: boolean;
  onOpen: () => void;
  onClose: () => void;
  autoFocus?: boolean;
  placeholder?: string;
}) {
  const filtered = PIPE_SIZES.filter((s) =>
    s.toLowerCase().includes(value.toLowerCase())
  );
  return (
    <div className="relative">
      <input
        autoFocus={autoFocus}
        type="text"
        value={value}
        placeholder={placeholder}
        className="w-full border border-blue-400 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        onChange={(e) => { onChange(e.target.value); onOpen(); }}
        onFocus={onOpen}
        onBlur={() => setTimeout(onClose, 150)}
        autoComplete="off"
      />
      {open && filtered.length > 0 && (
        <div className="absolute z-30 top-full left-0 right-0 mt-0.5 bg-white border border-slate-200 rounded-lg shadow-lg max-h-44 overflow-y-auto">
          {filtered.map((s) => (
            <button
              key={s}
              className="w-full text-left px-3 py-2 text-sm hover:bg-blue-50 text-slate-800"
              onMouseDown={() => { onSelect(s); onClose(); }}
            >
              {s}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function PNDropdown({
  dnLabel,
  selected,
  onSelect,
  open,
  onToggle,
  onClose,
  showAvgWt = false,
}: {
  dnLabel: string;
  selected: PNRating | "";
  onSelect: (pn: PNRating) => void;
  open: boolean;
  onToggle: () => void;
  onClose: () => void;
  showAvgWt?: boolean;
}) {
  const pns = dnLabel ? getAvailablePNs(dnLabel) : [];
  return (
    <div className="relative">
      <button
        type="button"
        disabled={!dnLabel}
        onClick={onToggle}
        onBlur={() => setTimeout(onClose, 150)}
        className="w-full border border-blue-400 rounded-lg px-3 py-2 text-sm text-left bg-white flex items-center justify-between focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-40 disabled:cursor-not-allowed"
      >
        <span className={selected ? "text-slate-800" : "text-slate-400"}>
          {selected || "Select PN"}
        </span>
        <ChevronDown className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
      </button>
      {open && pns.length > 0 && (
        <div className="absolute z-30 top-full left-0 right-0 mt-0.5 bg-white border border-slate-200 rounded-lg shadow-lg overflow-hidden">
          {pns.map((pn) => (
            <button
              key={pn}
              className="w-full text-left px-3 py-2 text-sm hover:bg-blue-50 text-slate-800 flex justify-between items-center"
              onMouseDown={() => { onSelect(pn); onClose(); }}
            >
              <span>{pn}</span>
              {showAvgWt && (
                <span className="text-xs text-slate-400">
                  {getAvgWeight(dnLabel, pn)} kg/m
                </span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Print / Excel helpers ────────────────────────────────────────────────────

function buildPrintHTML(
  header: QuotationHeader,
  items: QuotationItem[],
  rateKg: number,
  subTotal: number,
  vat: number,
  totalWithVat: number,
) {
  const rows = items
    .map(
      (item, i) => {
        const rpm = item.avgWeight * rateKg;
        const amount = item.quantity * rpm;
        const bg = i % 2 === 0 ? "#ffffff" : "#f8fafc";
        return `
        <tr style="background:${bg}">
          <td style="text-align:center;color:#94a3b8">${i + 1}</td>
          <td style="font-weight:600">${item.dnLabel} ${item.pn} PE Pipe</td>
          <td style="text-align:right">${item.quantity.toLocaleString("en-IN")}</td>
          <td style="text-align:right">${formatNum(rpm)}</td>
          <td style="text-align:right;font-weight:600">${formatNum(amount)}</td>
        </tr>`;
      },
    )
    .join("");

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>${header.title}</title>
  <style>
    *{box-sizing:border-box;margin:0;padding:0}
    body{font-family:Arial,Helvetica,sans-serif;padding:32px 40px;color:#1e293b;font-size:13px}
    .header{text-align:center;margin-bottom:28px}
    .header h1{font-size:26px;font-weight:700;color:#1e3a8a;letter-spacing:1px}
    .header p{color:#64748b;margin-top:4px;font-size:12px}
    table{width:100%;border-collapse:collapse;margin-bottom:24px}
    thead tr{background:#1e3a8a}
    th{color:#fff;padding:10px 12px;font-size:11px;font-weight:600;border:1px solid #1e40af}
    th:first-child{text-align:center;width:48px}
    th:nth-child(2){text-align:left}
    th:not(:first-child):not(:nth-child(2)){text-align:right}
    td{padding:9px 12px;border:1px solid #e2e8f0;font-size:13px}
    td:first-child{text-align:center;color:#94a3b8}
    td:not(:first-child):not(:nth-child(2)){text-align:right}
    .totals{float:right;width:288px;border:1px solid #e2e8f0;border-radius:6px;overflow:hidden;margin-bottom:24px}
    .total-row{display:flex;justify-content:space-between;padding:10px 16px;border-bottom:1px solid #e2e8f0;background:#f8fafc;font-size:13px}
    .grand{display:flex;justify-content:space-between;padding:13px 16px;background:#1e3a8a;color:#fff;font-weight:700;font-size:14px}
    .clearfix::after{content:"";display:table;clear:both}
    .note{text-align:center;font-size:10px;color:#94a3b8;margin-top:32px}
    @media print{body{padding:20px 28px}}
  </style>
</head>
<body>
  <div class="header">
    <h1>${header.title}</h1>
    ${header.subtitle ? `<p>${header.subtitle}</p>` : ""}
    ${header.note ? `<p>${header.note}</p>` : ""}
    ${header.date ? `<p>Date: ${header.date}</p>` : ""}
  </div>
  <table>
    <thead>
      <tr>
        <th>S.N</th>
        <th>Item Description</th>
        <th>Quantity (m)</th>
        <th>Rate/m (Rs.)</th>
        <th>Amount (Rs.)</th>
      </tr>
    </thead>
    <tbody>${rows}</tbody>
  </table>
  <div class="clearfix">
    <div class="totals">
      <div class="total-row"><span>Sub Total</span><span>Rs. ${formatNum(subTotal)}</span></div>
      <div class="total-row"><span>VAT @ 13%</span><span>Rs. ${formatNum(vat)}</span></div>
      <div class="grand"><span>Grand Total (incl. VAT)</span><span>Rs. ${formatNum(totalWithVat)}</span></div>
    </div>
  </div>
  <script>window.onload=()=>{ window.print(); }</script>
</body>
</html>`;
}

function exportExcel(
  header: QuotationHeader,
  items: QuotationItem[],
  rateKg: number,
) {
  const wb = XLSX.utils.book_new();

  // Data starts at row index 0 (A1)
  // Layout:
  //   Row 1: Title
  //   Row 2: Subtitle
  //   Row 3: Note
  //   Row 4: Date label | date value
  //   Row 5: (blank)
  //   Row 6: "Rate per kg (Rs.)" | rateKg   ← B6 is the rate reference cell
  //   Row 7: (blank)
  //   Row 8: Column headers
  //   Row 9+: Item data rows
  //   ...
  //   Sub Total / VAT / Grand Total rows

  // Column layout:
  //   A: S.N
  //   B: Item Description
  //   C: Qty (m)          — editable
  //   D: Rate/m (Rs.)     — formula: G{row} * $B$RATE_ROW
  //   E: Amount (Rs.)     — formula: C{row} * D{row}
  //   F: (blank gap)
  //   G: Avg Wt (kg/m)   — editable, drives Rate/m

  const RATE_ROW = 6; // 1-indexed Excel row for rate per kg
  const DATA_START_ROW = 9; // 1-indexed first data row

  const aoa: (string | number | null)[][] = [
    [header.title],
    [header.subtitle],
    [header.note],
    ["Date:", header.date],
    [],
    ["Rate per kg (Rs.)", rateKg],
    [],
    ["S.N", "Item Description", "Qty (m)", "Rate/m (Rs.)", "Amount (Rs.)", "", "Avg Wt (kg/m)"],
  ];

  items.forEach((item, i) => {
    aoa.push([
      i + 1,
      `${item.dnLabel} ${item.pn} PE Pipe`,
      item.quantity,
      0,           // placeholder — formula set below (Rate/m)
      0,           // placeholder — formula set below (Amount)
      null,        // blank gap column
      item.avgWeight,
    ]);
  });

  const subTotalRow = DATA_START_ROW + items.length;
  const vatRow = subTotalRow + 1;
  const grandRow = vatRow + 1;

  aoa.push(["", "", "", "Sub Total", 0]);
  aoa.push(["", "", "", "VAT (13%)", 0]);
  aoa.push(["", "", "", "Grand Total (incl. VAT)", 0]);

  const ws = XLSX.utils.aoa_to_sheet(aoa);

  // Set formulas for each item row
  items.forEach((_, i) => {
    const r = DATA_START_ROW + i;
    const ec = XLSX.utils.encode_cell;
    // Rate/m (col D, index 3) = Avg Wt (G{r}) × Rate/kg ($B$RATE_ROW)
    ws[ec({ r: r - 1, c: 3 })] = { t: "n", f: `G${r}*$B$${RATE_ROW}` };
    // Amount (col E, index 4) = Qty (C{r}) × Rate/m (D{r})
    ws[ec({ r: r - 1, c: 4 })] = { t: "n", f: `C${r}*D${r}` };
  });

  // Totals in column E
  if (items.length > 0) {
    const amtRange = `E${DATA_START_ROW}:E${DATA_START_ROW + items.length - 1}`;
    const ec = XLSX.utils.encode_cell;
    ws[ec({ r: subTotalRow - 1, c: 4 })] = { t: "n", f: `SUM(${amtRange})` };
    ws[ec({ r: vatRow - 1, c: 4 })]      = { t: "n", f: `E${subTotalRow}*0.13` };
    ws[ec({ r: grandRow - 1, c: 4 })]    = { t: "n", f: `E${subTotalRow}+E${vatRow}` };
  }

  // Column widths
  ws["!cols"] = [
    { wch: 5 },  // A: S.N
    { wch: 34 }, // B: Item Description
    { wch: 11 }, // C: Qty
    { wch: 16 }, // D: Rate/m
    { wch: 17 }, // E: Amount
    { wch: 4 },  // F: gap
    { wch: 14 }, // G: Avg Wt
  ];

  // Set sheet range (cols A–G = indices 0–6)
  ws["!ref"] = XLSX.utils.encode_range({
    s: { r: 0, c: 0 },
    e: { r: grandRow, c: 6 },
  });

  XLSX.utils.book_append_sheet(wb, ws, "Quotation");
  XLSX.writeFile(wb, "PE_Pipe_Quotation.xlsx");
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function QuotationPage() {
  const { toast } = useToast();
  const downloadBtnRef = useRef<HTMLDivElement>(null);

  const [header, setHeader] = useState<QuotationHeader>({
    title: "Ashirwad Pipe Industries Pvt Ltd",
    subtitle: "Bharatpur-15, Chitwan",
    note: "",
    date: todayString(),
  });
  const [editingHeaderField, setEditingHeaderField] = useState<keyof QuotationHeader | null>(null);

  const [globalRatePerKg, setGlobalRatePerKg] = useState<string>("");

  const [items, setItems] = useState<QuotationItem[]>([]);
  const [form, setForm] = useState<FormState>({ dnLabel: "", pn: "", quantity: "", sizeSearch: "" });
  const [showFormSizeDrop, setShowFormSizeDrop] = useState(false);
  const [showFormPNDrop, setShowFormPNDrop] = useState(false);
  const [showQuotation, setShowQuotation] = useState(false);
  const [showDownloadMenu, setShowDownloadMenu] = useState(false);

  // Row inline edit state (covers size + PN + qty together)
  const [rowEdit, setRowEdit] = useState<RowEditState | null>(null);

  const filteredFormSizes = PIPE_SIZES.filter((s) =>
    s.toLowerCase().includes(form.sizeSearch.toLowerCase())
  );
  const formPNs = form.dnLabel ? getAvailablePNs(form.dnLabel) : [];

  const rateKg = parseFloat(globalRatePerKg);
  const rateKgValid = !isNaN(rateKg) && rateKg > 0;

  const currentAvgWeight =
    form.dnLabel && form.pn ? getAvgWeight(form.dnLabel, form.pn as PNRating) : undefined;

  // Close download menu on outside click
  useEffect(() => {
    if (!showDownloadMenu) return;
    const handler = (e: MouseEvent) => {
      if (downloadBtnRef.current && !downloadBtnRef.current.contains(e.target as Node)) {
        setShowDownloadMenu(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [showDownloadMenu]);

  const subTotal = items.reduce((sum, item) => {
    if (!rateKgValid) return sum;
    return sum + item.quantity * item.avgWeight * rateKg;
  }, 0);
  const vat = subTotal * VAT_RATE;
  const totalWithVat = subTotal + vat;

  // ── Add item ──
  const handleAddItem = () => {
    if (!rateKgValid) { toast({ title: "Enter a valid Rate per kg first", variant: "destructive" }); return; }
    if (!form.dnLabel) { toast({ title: "Select a pipe size", variant: "destructive" }); return; }
    if (!form.pn) { toast({ title: "Select a PN rating", variant: "destructive" }); return; }
    if (!form.quantity || parseFloat(form.quantity) <= 0) { toast({ title: "Enter a valid quantity", variant: "destructive" }); return; }
    const avgWeight = getAvgWeight(form.dnLabel, form.pn as PNRating)!;
    setItems((prev) => [...prev, { id: generateId(), dnLabel: form.dnLabel, pn: form.pn as PNRating, avgWeight, quantity: parseFloat(form.quantity) }]);
    setForm({ dnLabel: "", pn: "", quantity: "", sizeSearch: "" });
    toast({ title: "Item added" });
  };

  const handleRemoveItem = (id: string) => {
    setItems((prev) => prev.filter((i) => i.id !== id));
    if (rowEdit?.id === id) setRowEdit(null);
  };

  // ── Row edit ──
  const startRowEdit = (item: QuotationItem) => {
    setRowEdit({
      id: item.id,
      sizeSearch: item.dnLabel,
      selectedDnLabel: item.dnLabel,
      selectedPn: item.pn,
      quantityVal: String(item.quantity),
      showSizeDrop: false,
      showPNDrop: false,
    });
  };

  const commitRowEdit = useCallback(() => {
    if (!rowEdit) return;
    const { selectedDnLabel, selectedPn, quantityVal } = rowEdit;
    if (!selectedDnLabel || !selectedPn) { setRowEdit(null); return; }
    const qty = parseFloat(quantityVal);
    const avgWeight = getAvgWeight(selectedDnLabel, selectedPn as PNRating);
    if (!avgWeight || isNaN(qty) || qty <= 0) { setRowEdit(null); return; }
    setItems((prev) =>
      prev.map((item) =>
        item.id === rowEdit.id
          ? { ...item, dnLabel: selectedDnLabel, pn: selectedPn as PNRating, avgWeight, quantity: qty }
          : item
      )
    );
    setRowEdit(null);
  }, [rowEdit]);

  // ── PDF print via new window ──
  const handlePrintPDF = () => {
    if (!rateKgValid || items.length === 0) {
      toast({ title: "Add items and set rate per kg first", variant: "destructive" });
      return;
    }
    const html = buildPrintHTML(header, items, rateKg, subTotal, vat, totalWithVat);
    const win = window.open("", "_blank");
    if (!win) { toast({ title: "Pop-up blocked — allow pop-ups and try again", variant: "destructive" }); return; }
    win.document.write(html);
    win.document.close();
  };

  // ── Excel export ──
  const handleExportExcel = () => {
    if (items.length === 0) { toast({ title: "Add items first", variant: "destructive" }); return; }
    exportExcel(header, items, rateKg || 0);
  };

  const headerFieldLabel: Record<keyof QuotationHeader, string> = {
    title: "Title",
    subtitle: "Address",
    note: "Effective Date Note",
    date: "Quotation Date",
  };

  // ─────────────────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-blue-900 text-white shadow-lg">
        <div className="max-w-5xl mx-auto px-4 py-5 flex items-center gap-3">
          <FileText className="w-7 h-7 text-blue-200" />
          <div>
            <h1 className="text-xl font-bold tracking-tight">PE Pipe Quotation Maker</h1>
            <p className="text-blue-300 text-xs mt-0.5">Manufactured as per ISO 2081</p>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8 space-y-5">

        {/* ── Quotation Header Editor ── */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5">
          <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-4 flex items-center gap-2">
            <Pencil className="w-3.5 h-3.5" />
            Quotation Header Details
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {(Object.keys(header) as (keyof QuotationHeader)[]).map((field) => (
              <div key={field}>
                <label className="block text-xs font-medium text-slate-400 mb-1">
                  {headerFieldLabel[field]}
                </label>
                {editingHeaderField === field ? (
                  <div className="flex items-center gap-2">
                    <input
                      autoFocus
                      type="text"
                      value={header[field]}
                      className="flex-1 border border-blue-400 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      onChange={(e) => setHeader((h) => ({ ...h, [field]: e.target.value }))}
                      onBlur={() => setEditingHeaderField(null)}
                      onKeyDown={(e) => { if (e.key === "Enter" || e.key === "Escape") setEditingHeaderField(null); }}
                    />
                    <button onClick={() => setEditingHeaderField(null)} className="text-green-600 hover:text-green-800 flex-shrink-0">
                      <Check className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setEditingHeaderField(field)}
                    className="w-full text-left flex items-center justify-between gap-2 group border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-700 hover:border-blue-300 hover:bg-blue-50 transition-colors"
                  >
                    <span className="truncate">{header[field] || <span className="text-slate-400 italic">Click to edit…</span>}</span>
                    <Pencil className="w-3.5 h-3.5 text-slate-300 group-hover:text-blue-400 flex-shrink-0 transition-colors" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* ── Global Rate per kg ── */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5">
          <div className="flex items-end gap-4 flex-wrap">
            <div className="flex-1 min-w-[200px]">
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                Rate per kg (Rs.) — applies to all items <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                min="0"
                step="any"
                value={globalRatePerKg}
                placeholder="e.g. 250"
                className="w-full border border-slate-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                onChange={(e) => setGlobalRatePerKg(e.target.value)}
              />
            </div>
            {rateKgValid && (
              <div className="text-sm text-blue-700 bg-blue-50 border border-blue-100 rounded-lg px-4 py-2.5 font-medium whitespace-nowrap">
                Rs. {formatNum(rateKg)} / kg
              </div>
            )}
          </div>
        </div>

        {/* ── Add Item ── */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
          <h2 className="text-base font-semibold text-slate-800 mb-5 flex items-center gap-2">
            <Plus className="w-4 h-4 text-blue-600" />
            Add Pipe Item
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Size */}
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1.5">
                Pipe Size (DN/mm) <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={form.sizeSearch}
                  placeholder="e.g. 20mm, 63mm…"
                  className="w-full border border-slate-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 pr-8"
                  onChange={(e) => { setForm((f) => ({ ...f, sizeSearch: e.target.value, dnLabel: "", pn: "" })); setShowFormSizeDrop(true); }}
                  onFocus={() => setShowFormSizeDrop(true)}
                  onBlur={() => setTimeout(() => setShowFormSizeDrop(false), 150)}
                  autoComplete="off"
                />
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                {showFormSizeDrop && filteredFormSizes.length > 0 && (
                  <div className="absolute z-20 top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                    {filteredFormSizes.map((s) => (
                      <button
                        key={s}
                        className="w-full text-left px-4 py-2.5 text-sm hover:bg-blue-50 text-slate-800 transition-colors"
                        onMouseDown={() => { setForm((f) => ({ ...f, dnLabel: s, sizeSearch: s, pn: "" })); setShowFormSizeDrop(false); }}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* PN Rating */}
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1.5">
                PN Rating <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <button
                  type="button"
                  disabled={!form.dnLabel}
                  onClick={() => setShowFormPNDrop((v) => !v)}
                  onBlur={() => setTimeout(() => setShowFormPNDrop(false), 150)}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2.5 text-sm text-left bg-white flex items-center justify-between focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <span className={form.pn ? "text-slate-800" : "text-slate-400"}>
                    {form.pn || "Select PN rating"}
                  </span>
                  <ChevronDown className="w-4 h-4 text-slate-400" />
                </button>
                {showFormPNDrop && formPNs.length > 0 && (
                  <div className="absolute z-20 top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-lg overflow-hidden">
                    {formPNs.map((pn) => (
                      <button
                        key={pn}
                        className="w-full text-left px-4 py-2.5 text-sm hover:bg-blue-50 text-slate-800 flex justify-between"
                        onMouseDown={() => { setForm((f) => ({ ...f, pn })); setShowFormPNDrop(false); }}
                      >
                        <span>{pn}</span>
                        <span className="text-xs text-slate-400">{getAvgWeight(form.dnLabel, pn)} kg/m</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Quantity */}
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1.5">
                Quantity (meters) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                min="0"
                step="any"
                value={form.quantity}
                placeholder="e.g. 100"
                className="w-full border border-slate-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                onChange={(e) => setForm((f) => ({ ...f, quantity: e.target.value }))}
              />
            </div>
          </div>

          {/* Live calc preview */}
          {currentAvgWeight && rateKgValid && (
            <div className="mt-4 p-3 bg-blue-50 border border-blue-100 rounded-lg flex flex-wrap gap-5 text-sm">
              <div>
                <span className="text-slate-500 text-xs">Avg Weight</span>
                <p className="font-semibold text-slate-800">{currentAvgWeight} kg/m</p>
              </div>
              <div>
                <span className="text-slate-500 text-xs">Rate per Meter</span>
                <p className="font-semibold text-blue-700">Rs. {formatNum(currentAvgWeight * rateKg)}</p>
              </div>
              {form.quantity && parseFloat(form.quantity) > 0 && (
                <div>
                  <span className="text-slate-500 text-xs">Amount ({form.quantity}m)</span>
                  <p className="font-semibold text-green-700">
                    Rs. {formatNum(parseFloat(form.quantity) * currentAvgWeight * rateKg)}
                  </p>
                </div>
              )}
            </div>
          )}

          <div className="mt-5 flex justify-end">
            <button
              onClick={handleAddItem}
              className="flex items-center gap-2 bg-blue-700 hover:bg-blue-800 text-white px-5 py-2.5 rounded-lg text-sm font-medium transition-colors"
            >
              <Plus className="w-4 h-4" />
              Add to Quotation
            </button>
          </div>
        </div>

        {/* ── Items Table ── */}
        {items.length > 0 && (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
            <h2 className="text-base font-semibold text-slate-800 mb-1">
              Quotation Items ({items.length})
            </h2>
            <p className="text-xs text-slate-400 mb-4">Click the pencil icon on any row to edit size, PN, or quantity inline.</p>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200">
                    <th className="text-left text-xs font-semibold text-slate-400 pb-3 pr-2 w-6">#</th>
                    <th className="text-left text-xs font-semibold text-slate-400 pb-3 pr-2">Size</th>
                    <th className="text-left text-xs font-semibold text-slate-400 pb-3 pr-2">PN</th>
                    <th className="text-right text-xs font-semibold text-slate-400 pb-3 pr-2">Avg Wt</th>
                    <th className="text-right text-xs font-semibold text-slate-400 pb-3 pr-2">Qty (m)</th>
                    <th className="text-right text-xs font-semibold text-slate-400 pb-3 pr-2">Rate/m (Rs.)</th>
                    <th className="text-right text-xs font-semibold text-slate-400 pb-3">Amount (Rs.)</th>
                    <th className="pb-3 w-16" />
                  </tr>
                </thead>
                <tbody>
                  {items.map((item, idx) => {
                    const rpm = rateKgValid ? item.avgWeight * rateKg : 0;
                    const amount = item.quantity * rpm;
                    const isEditing = rowEdit?.id === item.id;

                    if (isEditing && rowEdit) {
                      // ── Edit row ──────────────────────────────────────────
                      const editPNs = rowEdit.selectedDnLabel
                        ? getAvailablePNs(rowEdit.selectedDnLabel)
                        : [];

                      return (
                        <tr key={item.id} className="border-b border-blue-100 bg-blue-50">
                          <td className="py-2 pr-2 text-slate-400 text-xs">{idx + 1}</td>
                          <td className="py-2 pr-2 min-w-[130px]">
                            <SizeDropdown
                              value={rowEdit.sizeSearch}
                              onChange={(v) =>
                                setRowEdit((s) => s ? { ...s, sizeSearch: v, selectedDnLabel: "", selectedPn: "", showSizeDrop: true } : s)
                              }
                              onSelect={(s) =>
                                setRowEdit((prev) => prev ? { ...prev, sizeSearch: s, selectedDnLabel: s, selectedPn: "", showSizeDrop: false } : prev)
                              }
                              open={rowEdit.showSizeDrop}
                              onOpen={() => setRowEdit((s) => s ? { ...s, showSizeDrop: true } : s)}
                              onClose={() => setRowEdit((s) => s ? { ...s, showSizeDrop: false } : s)}
                              autoFocus
                            />
                          </td>
                          <td className="py-2 pr-2 min-w-[110px]">
                            <PNDropdown
                              dnLabel={rowEdit.selectedDnLabel}
                              selected={rowEdit.selectedPn}
                              onSelect={(pn) => setRowEdit((s) => s ? { ...s, selectedPn: pn, showPNDrop: false } : s)}
                              open={rowEdit.showPNDrop}
                              onToggle={() => setRowEdit((s) => s ? { ...s, showPNDrop: !s.showPNDrop } : s)}
                              onClose={() => setRowEdit((s) => s ? { ...s, showPNDrop: false } : s)}
                            />
                          </td>
                          <td className="py-2 pr-2 text-right text-slate-400 text-xs">
                            {rowEdit.selectedDnLabel && rowEdit.selectedPn
                              ? getAvgWeight(rowEdit.selectedDnLabel, rowEdit.selectedPn as PNRating)
                              : "—"}
                          </td>
                          <td className="py-2 pr-2">
                            <input
                              type="number"
                              min="0"
                              step="any"
                              value={rowEdit.quantityVal}
                              className="w-20 ml-auto block border border-blue-400 rounded px-2 py-1 text-sm text-right focus:outline-none focus:ring-2 focus:ring-blue-500"
                              onChange={(e) => setRowEdit((s) => s ? { ...s, quantityVal: e.target.value } : s)}
                              onKeyDown={(e) => { if (e.key === "Enter") commitRowEdit(); if (e.key === "Escape") setRowEdit(null); }}
                            />
                          </td>
                          <td className="py-2 pr-2 text-right text-slate-400 text-xs">—</td>
                          <td className="py-2 text-right text-slate-400 text-xs">—</td>
                          <td className="py-2 pl-2">
                            <div className="flex items-center gap-1 justify-end">
                              <button
                                onClick={commitRowEdit}
                                className="text-green-600 hover:text-green-800 p-1 rounded hover:bg-green-50"
                                title="Save"
                              >
                                <Check className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => setRowEdit(null)}
                                className="text-slate-400 hover:text-slate-600 p-1 rounded hover:bg-slate-100"
                                title="Cancel"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    }

                    // ── Normal row ────────────────────────────────────────────
                    return (
                      <tr key={item.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50 transition-colors">
                        <td className="py-3 pr-2 text-slate-400 text-xs">{idx + 1}</td>
                        <td className="py-3 pr-2 font-medium text-slate-800">{item.dnLabel}</td>
                        <td className="py-3 pr-2 text-slate-600 text-xs">{item.pn}</td>
                        <td className="py-3 pr-2 text-right text-slate-500 text-xs">{item.avgWeight}</td>
                        <td className="py-3 pr-2 text-right">{formatNum(item.quantity, 0)}</td>
                        <td className="py-3 pr-2 text-right text-slate-600">
                          {rateKgValid ? formatNum(rpm) : <span className="text-slate-300">—</span>}
                        </td>
                        <td className="py-3 text-right font-semibold text-slate-800">
                          {rateKgValid ? formatNum(amount) : <span className="text-slate-300">—</span>}
                        </td>
                        <td className="py-3 pl-2">
                          <div className="flex items-center gap-1 justify-end">
                            <button
                              onClick={() => startRowEdit(item)}
                              className="text-slate-300 hover:text-blue-500 p-1 rounded hover:bg-blue-50 transition-colors"
                              title="Edit row"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleRemoveItem(item.id)}
                              className="text-slate-300 hover:text-red-500 p-1 rounded hover:bg-red-50 transition-colors"
                              title="Remove"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Totals */}
            {rateKgValid && (
              <div className="mt-6 flex justify-end">
                <div className="w-full max-w-xs space-y-2">
                  <div className="flex justify-between text-sm text-slate-600">
                    <span>Sub Total</span>
                    <span className="font-medium">Rs. {formatNum(subTotal)}</span>
                  </div>
                  <div className="flex justify-between text-sm text-slate-600">
                    <span>VAT (13%)</span>
                    <span className="font-medium">Rs. {formatNum(vat)}</span>
                  </div>
                  <div className="flex justify-between text-base font-bold text-slate-900 border-t border-slate-200 pt-2">
                    <span>Grand Total (incl. VAT)</span>
                    <span>Rs. {formatNum(totalWithVat)}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="mt-6 flex justify-between items-center flex-wrap gap-3">
              <button
                onClick={() => { setItems([]); setRowEdit(null); }}
                className="text-sm text-red-400 hover:text-red-600 flex items-center gap-1 transition-colors"
              >
                <X className="w-4 h-4" />
                Clear All
              </button>

              <div className="flex gap-3 items-center">
                {/* Preview button */}
                <button
                  disabled={!rateKgValid}
                  onClick={() => setShowQuotation(true)}
                  className="flex items-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <FileText className="w-4 h-4" />
                  Preview
                </button>

                {/* Download dropdown */}
                <div ref={downloadBtnRef} className="relative">
                  <button
                    disabled={!rateKgValid || items.length === 0}
                    onClick={() => setShowDownloadMenu((v) => !v)}
                    className="flex items-center gap-2 bg-blue-700 hover:bg-blue-800 text-white px-4 py-2.5 rounded-lg text-sm font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <Download className="w-4 h-4" />
                    Download
                    <ChevronDown className="w-3.5 h-3.5" />
                  </button>
                  {showDownloadMenu && (
                    <div className="absolute right-0 bottom-full mb-2 w-52 bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden z-20">
                      <button
                        onClick={() => { setShowDownloadMenu(false); handlePrintPDF(); }}
                        className="w-full flex items-center gap-3 px-4 py-3.5 text-sm text-slate-700 hover:bg-blue-50 transition-colors"
                      >
                        <FileDown className="w-4 h-4 text-blue-600 flex-shrink-0" />
                        <div className="text-left">
                          <div className="font-medium">Download PDF</div>
                          <div className="text-xs text-slate-400">Print-ready quotation</div>
                        </div>
                      </button>
                      <div className="border-t border-slate-100" />
                      <button
                        onClick={() => { setShowDownloadMenu(false); handleExportExcel(); }}
                        className="w-full flex items-center gap-3 px-4 py-3.5 text-sm text-slate-700 hover:bg-green-50 transition-colors"
                      >
                        <FileSpreadsheet className="w-4 h-4 text-green-600 flex-shrink-0" />
                        <div className="text-left">
                          <div className="font-medium">Download Excel</div>
                          <div className="text-xs text-slate-400">Editable with formulas</div>
                        </div>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {items.length === 0 && (
          <div className="text-center py-16 text-slate-400">
            <FileText className="w-12 h-12 mx-auto mb-3 opacity-20" />
            <p className="text-sm">No items yet. Set a rate per kg and add pipe items above.</p>
          </div>
        )}
      </main>

      {/* ── Quotation Preview Modal ── */}
      {showQuotation && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-start justify-center py-8 px-4 overflow-y-auto">
          <div className="bg-white w-full max-w-4xl rounded-2xl shadow-2xl">
            {/* Modal toolbar */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
              <h2 className="font-semibold text-slate-800">Quotation Preview</h2>
              <div className="flex gap-2">
                <button
                  onClick={handlePrintPDF}
                  className="flex items-center gap-2 bg-blue-700 hover:bg-blue-800 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                >
                  <Printer className="w-4 h-4" />
                  Print / Save PDF
                </button>
                <button
                  onClick={handleExportExcel}
                  className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                >
                  <FileSpreadsheet className="w-4 h-4" />
                  Excel
                </button>
                <button onClick={() => setShowQuotation(false)} className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
                  <X className="w-5 h-5 text-slate-500" />
                </button>
              </div>
            </div>

            {/* Document */}
            <div className="p-10">
              <div className="text-center mb-8">
                <h1 className="text-3xl font-bold text-blue-900 tracking-tight">{header.title}</h1>
                {header.subtitle && <p className="text-sm text-slate-500 mt-2">{header.subtitle}</p>}
                {header.note && <p className="text-xs text-slate-400 mt-1">{header.note}</p>}
                {header.date && <p className="text-xs text-slate-400 mt-0.5">Date: {header.date}</p>}
              </div>

              <div className="overflow-x-auto mb-8">
                <table className="w-full text-sm border-collapse">
                  <thead>
                    <tr className="bg-blue-900 text-white">
                      <th className="text-center py-3 px-3 font-semibold text-xs border border-blue-800 w-10">S.N</th>
                      <th className="text-left py-3 px-4 font-semibold text-xs border border-blue-800">Item Description</th>
                      <th className="text-right py-3 px-3 font-semibold text-xs border border-blue-800">Quantity (m)</th>
                      <th className="text-right py-3 px-3 font-semibold text-xs border border-blue-800">Rate/m (Rs.)</th>
                      <th className="text-right py-3 px-3 font-semibold text-xs border border-blue-800">Amount (Rs.)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((item, idx) => {
                      const rpm = item.avgWeight * rateKg;
                      const amount = item.quantity * rpm;
                      return (
                        <tr key={item.id} className={idx % 2 === 0 ? "bg-white" : "bg-slate-50"}>
                          <td className="text-center py-3 px-3 border border-slate-200 text-slate-500 text-xs">{idx + 1}</td>
                          <td className="py-3 px-4 border border-slate-200 font-medium text-slate-800">
                            {item.dnLabel} {item.pn} PE Pipe
                          </td>
                          <td className="text-right py-3 px-3 border border-slate-200 text-slate-700">{formatNum(item.quantity, 0)}</td>
                          <td className="text-right py-3 px-3 border border-slate-200 text-slate-700">{formatNum(rpm)}</td>
                          <td className="text-right py-3 px-3 border border-slate-200 font-semibold text-slate-800">{formatNum(amount)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div className="flex justify-end mb-8">
                <div className="w-72 border border-slate-200 rounded-lg overflow-hidden text-sm">
                  <div className="flex justify-between px-4 py-3 bg-slate-50 border-b border-slate-200">
                    <span className="text-slate-600">Sub Total</span>
                    <span className="font-medium text-slate-800">Rs. {formatNum(subTotal)}</span>
                  </div>
                  <div className="flex justify-between px-4 py-3 bg-slate-50 border-b border-slate-200">
                    <span className="text-slate-600">VAT @ 13%</span>
                    <span className="font-medium text-slate-800">Rs. {formatNum(vat)}</span>
                  </div>
                  <div className="flex justify-between px-4 py-4 bg-blue-900 text-white">
                    <span className="font-bold">Grand Total (incl. VAT)</span>
                    <span className="font-bold">Rs. {formatNum(totalWithVat)}</span>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>
      )}
    </div>
  );
}
