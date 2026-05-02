import { useState, useRef, useCallback } from "react";
import { Plus, Trash2, FileText, Printer, X, ChevronDown, Pencil, Check } from "lucide-react";
import { PIPE_DATA, PIPE_SIZES, PN_RATINGS, getAvgWeight, getAvailablePNs, type PNRating } from "@/data/pipeData";
import { useToast } from "@/hooks/use-toast";

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

interface EditState {
  id: string;
  field: "size" | "quantity";
  sizeSearch: string;
  quantityVal: string;
  showSizeDrop: boolean;
}

const VAT_RATE = 0.13;

function generateId() {
  return Math.random().toString(36).substring(2, 10);
}

function formatNum(n: number, decimals = 2) {
  return n.toLocaleString("en-IN", { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
}

// Inline size search dropdown for table editing
function SizeSearchDropdown({
  value,
  onChange,
  onSelect,
  onBlur,
}: {
  value: string;
  onChange: (v: string) => void;
  onSelect: (s: string) => void;
  onBlur: () => void;
}) {
  const filtered = PIPE_SIZES.filter((s) => s.toLowerCase().includes(value.toLowerCase()));
  return (
    <div className="relative min-w-[100px]">
      <input
        autoFocus
        type="text"
        value={value}
        className="w-full border border-blue-400 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        onChange={(e) => onChange(e.target.value)}
        onBlur={() => setTimeout(onBlur, 150)}
      />
      {filtered.length > 0 && (
        <div className="absolute z-30 top-full left-0 right-0 mt-0.5 bg-white border border-slate-200 rounded shadow-lg max-h-40 overflow-y-auto">
          {filtered.map((s) => (
            <button
              key={s}
              className="w-full text-left px-3 py-1.5 text-sm hover:bg-blue-50 text-slate-800"
              onMouseDown={() => onSelect(s)}
            >
              {s}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default function QuotationPage() {
  const { toast } = useToast();
  const printRef = useRef<HTMLDivElement>(null);

  // Global rate per kg for entire quotation
  const [globalRatePerKg, setGlobalRatePerKg] = useState<string>("");

  const [items, setItems] = useState<QuotationItem[]>([]);
  const [form, setForm] = useState<FormState>({
    dnLabel: "",
    pn: "",
    quantity: "",
    sizeSearch: "",
  });
  const [showSizeDropdown, setShowSizeDropdown] = useState(false);
  const [showPNDropdown, setShowPNDropdown] = useState(false);
  const [showQuotation, setShowQuotation] = useState(false);

  // Inline edit state
  const [editState, setEditState] = useState<EditState | null>(null);

  const filteredSizes = PIPE_SIZES.filter((s) =>
    s.toLowerCase().includes(form.sizeSearch.toLowerCase())
  );

  const availablePNs = form.dnLabel ? getAvailablePNs(form.dnLabel) : [];

  const rateKg = parseFloat(globalRatePerKg);
  const rateKgValid = !isNaN(rateKg) && rateKg > 0;

  const currentAvgWeight =
    form.dnLabel && form.pn ? getAvgWeight(form.dnLabel, form.pn as PNRating) : undefined;

  const ratePerMeter =
    currentAvgWeight && rateKgValid ? currentAvgWeight * rateKg : undefined;

  const handleSelectSize = (dnLabel: string) => {
    setForm((f) => ({ ...f, dnLabel, sizeSearch: dnLabel, pn: "" }));
    setShowSizeDropdown(false);
  };

  const handleAddItem = () => {
    if (!globalRatePerKg || !rateKgValid) {
      toast({ title: "Enter a valid Rate per kg first", variant: "destructive" });
      return;
    }
    if (!form.dnLabel) { toast({ title: "Select a pipe size", variant: "destructive" }); return; }
    if (!form.pn) { toast({ title: "Select a PN rating", variant: "destructive" }); return; }
    if (!form.quantity || parseFloat(form.quantity) <= 0) {
      toast({ title: "Enter a valid quantity", variant: "destructive" });
      return;
    }

    const avgWeight = getAvgWeight(form.dnLabel, form.pn as PNRating)!;
    setItems((prev) => [
      ...prev,
      {
        id: generateId(),
        dnLabel: form.dnLabel,
        pn: form.pn as PNRating,
        avgWeight,
        quantity: parseFloat(form.quantity),
      },
    ]);
    setForm({ dnLabel: "", pn: "", quantity: "", sizeSearch: "" });
    toast({ title: "Item added" });
  };

  const handleRemoveItem = (id: string) => {
    setItems((prev) => prev.filter((i) => i.id !== id));
    if (editState?.id === id) setEditState(null);
  };

  // Inline edit handlers
  const startEditQty = (item: QuotationItem) => {
    setEditState({ id: item.id, field: "quantity", sizeSearch: item.dnLabel, quantityVal: String(item.quantity), showSizeDrop: false });
  };

  const startEditSize = (item: QuotationItem) => {
    setEditState({ id: item.id, field: "size", sizeSearch: item.dnLabel, quantityVal: String(item.quantity), showSizeDrop: true });
  };

  const commitEdit = useCallback(() => {
    if (!editState) return;
    setItems((prev) =>
      prev.map((item) => {
        if (item.id !== editState.id) return item;
        if (editState.field === "quantity") {
          const q = parseFloat(editState.quantityVal);
          return isNaN(q) || q <= 0 ? item : { ...item, quantity: q };
        }
        if (editState.field === "size") {
          const newDnLabel = editState.sizeSearch;
          const spec = PIPE_DATA.find((p) => p.dnLabel === newDnLabel);
          if (!spec) return item;
          const newAvg = spec.avgWeights[item.pn];
          if (newAvg === undefined) {
            // PN not available for new size — pick first available
            const firstPn = PN_RATINGS.find((pn) => spec.avgWeights[pn] !== undefined);
            if (!firstPn) return item;
            return { ...item, dnLabel: newDnLabel, pn: firstPn, avgWeight: spec.avgWeights[firstPn]! };
          }
          return { ...item, dnLabel: newDnLabel, avgWeight: newAvg };
        }
        return item;
      })
    );
    setEditState(null);
  }, [editState]);

  const subTotal = items.reduce((sum, item) => {
    if (!rateKgValid) return sum;
    const rpm = item.avgWeight * rateKg;
    return sum + item.quantity * rpm;
  }, 0);

  const vat = subTotal * VAT_RATE;
  const totalWithVat = subTotal + vat;

  const handlePrint = () => window.print();

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-blue-900 text-white shadow-lg print:hidden">
        <div className="max-w-5xl mx-auto px-4 py-5 flex items-center gap-3">
          <FileText className="w-7 h-7 text-blue-200" />
          <div>
            <h1 className="text-xl font-bold tracking-tight">PE Pipe Quotation Maker</h1>
            <p className="text-blue-300 text-xs mt-0.5">Manufactured as per ISO 2081</p>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8 print:hidden">

        {/* Global Rate per kg */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5 mb-5">
          <div className="flex items-end gap-4 flex-wrap">
            <div className="flex-1 min-w-[200px]">
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                Rate per kg (Rs.) — applies to all items <span className="text-red-500">*</span>
              </label>
              <input
                data-testid="input-global-rate-per-kg"
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

        {/* Add Item Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 mb-6">
          <h2 className="text-base font-semibold text-slate-800 mb-5 flex items-center gap-2">
            <Plus className="w-4 h-4 text-blue-600" />
            Add Pipe Item
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Size Selector */}
            <div className="relative">
              <label className="block text-xs font-medium text-slate-500 mb-1.5">
                Pipe Size (DN/mm) <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  data-testid="input-size-search"
                  type="text"
                  value={form.sizeSearch}
                  placeholder="e.g. 20mm, 63mm..."
                  className="w-full border border-slate-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 pr-8"
                  onChange={(e) => {
                    setForm((f) => ({ ...f, sizeSearch: e.target.value, dnLabel: "", pn: "" }));
                    setShowSizeDropdown(true);
                  }}
                  onFocus={() => setShowSizeDropdown(true)}
                  onBlur={() => setTimeout(() => setShowSizeDropdown(false), 150)}
                  autoComplete="off"
                />
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
              </div>
              {showSizeDropdown && filteredSizes.length > 0 && (
                <div className="absolute z-20 top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                  {filteredSizes.map((s) => (
                    <button
                      key={s}
                      data-testid={`option-size-${s}`}
                      className="w-full text-left px-4 py-2.5 text-sm hover:bg-blue-50 text-slate-800 transition-colors"
                      onMouseDown={() => handleSelectSize(s)}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              )}
              {showSizeDropdown && form.sizeSearch && filteredSizes.length === 0 && (
                <div className="absolute z-20 top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-lg p-4 text-sm text-slate-500 text-center">
                  No matching size found
                </div>
              )}
            </div>

            {/* PN Selector */}
            <div className="relative">
              <label className="block text-xs font-medium text-slate-500 mb-1.5">
                PN Rating <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <button
                  data-testid="select-pn"
                  disabled={!form.dnLabel}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2.5 text-sm text-left focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed bg-white flex items-center justify-between"
                  onClick={() => setShowPNDropdown((v) => !v)}
                  onBlur={() => setTimeout(() => setShowPNDropdown(false), 150)}
                  type="button"
                >
                  <span className={form.pn ? "text-slate-800" : "text-slate-400"}>
                    {form.pn || "Select PN rating"}
                  </span>
                  <ChevronDown className="w-4 h-4 text-slate-400" />
                </button>
                {showPNDropdown && availablePNs.length > 0 && (
                  <div className="absolute z-20 top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-lg overflow-hidden">
                    {availablePNs.map((pn) => {
                      const aw = getAvgWeight(form.dnLabel, pn);
                      return (
                        <button
                          key={pn}
                          data-testid={`option-pn-${pn}`}
                          className="w-full text-left px-4 py-2.5 text-sm hover:bg-blue-50 text-slate-800 transition-colors flex justify-between items-center"
                          onMouseDown={() => {
                            setForm((f) => ({ ...f, pn }));
                            setShowPNDropdown(false);
                          }}
                        >
                          <span>{pn}</span>
                          <span className="text-xs text-slate-500">Avg: {aw} kg/m</span>
                        </button>
                      );
                    })}
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
                data-testid="input-quantity"
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

          {/* Live calculation preview */}
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
              data-testid="button-add-item"
              onClick={handleAddItem}
              className="flex items-center gap-2 bg-blue-700 hover:bg-blue-800 text-white px-5 py-2.5 rounded-lg text-sm font-medium transition-colors"
            >
              <Plus className="w-4 h-4" />
              Add to Quotation
            </button>
          </div>
        </div>

        {/* Items Table */}
        {items.length > 0 && (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 mb-6">
            <h2 className="text-base font-semibold text-slate-800 mb-4">
              Quotation Items ({items.length})
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200">
                    <th className="text-left text-xs font-semibold text-slate-500 pb-3 pr-2">#</th>
                    <th className="text-left text-xs font-semibold text-slate-500 pb-3 pr-2">Size</th>
                    <th className="text-left text-xs font-semibold text-slate-500 pb-3 pr-2">PN</th>
                    <th className="text-right text-xs font-semibold text-slate-500 pb-3 pr-2">Avg Wt (kg/m)</th>
                    <th className="text-right text-xs font-semibold text-slate-500 pb-3 pr-2">Qty (m)</th>
                    <th className="text-right text-xs font-semibold text-slate-500 pb-3 pr-2">Rate/m (Rs.)</th>
                    <th className="text-right text-xs font-semibold text-slate-500 pb-3">Amount (Rs.)</th>
                    <th className="pb-3"></th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item, idx) => {
                    const rpm = rateKgValid ? item.avgWeight * rateKg : 0;
                    const amount = item.quantity * rpm;
                    const isEditingThis = editState?.id === item.id;

                    return (
                      <tr key={item.id} data-testid={`row-item-${item.id}`} className="border-b border-slate-100 last:border-0">
                        <td className="py-3 pr-2 text-slate-400 text-xs">{idx + 1}</td>

                        {/* Size cell — inline editable */}
                        <td className="py-2 pr-2">
                          {isEditingThis && editState.field === "size" ? (
                            <div className="flex items-center gap-1">
                              <SizeSearchDropdown
                                value={editState.sizeSearch}
                                onChange={(v) => setEditState((s) => s ? { ...s, sizeSearch: v } : s)}
                                onSelect={(s) => setEditState((prev) => prev ? { ...prev, sizeSearch: s, showSizeDrop: false } : prev)}
                                onBlur={commitEdit}
                              />
                              <button onClick={commitEdit} className="text-green-600 hover:text-green-800 flex-shrink-0">
                                <Check className="w-4 h-4" />
                              </button>
                            </div>
                          ) : (
                            <button
                              data-testid={`edit-size-${item.id}`}
                              onClick={() => startEditSize(item)}
                              className="flex items-center gap-1.5 group font-medium text-slate-800 hover:text-blue-700 transition-colors"
                            >
                              {item.dnLabel}
                              <Pencil className="w-3 h-3 opacity-0 group-hover:opacity-100 text-blue-400 transition-opacity" />
                            </button>
                          )}
                        </td>

                        <td className="py-3 pr-2 text-slate-600 text-xs">{item.pn}</td>
                        <td className="py-3 pr-2 text-right text-slate-500 text-xs">{item.avgWeight}</td>

                        {/* Qty cell — inline editable */}
                        <td className="py-2 pr-2 text-right">
                          {isEditingThis && editState.field === "quantity" ? (
                            <div className="flex items-center justify-end gap-1">
                              <input
                                autoFocus
                                type="number"
                                min="0"
                                step="any"
                                value={editState.quantityVal}
                                className="w-20 border border-blue-400 rounded px-2 py-1 text-sm text-right focus:outline-none focus:ring-2 focus:ring-blue-500"
                                onChange={(e) => setEditState((s) => s ? { ...s, quantityVal: e.target.value } : s)}
                                onBlur={commitEdit}
                                onKeyDown={(e) => { if (e.key === "Enter") commitEdit(); if (e.key === "Escape") setEditState(null); }}
                              />
                              <button onClick={commitEdit} className="text-green-600 hover:text-green-800">
                                <Check className="w-4 h-4" />
                              </button>
                            </div>
                          ) : (
                            <button
                              data-testid={`edit-qty-${item.id}`}
                              onClick={() => startEditQty(item)}
                              className="flex items-center gap-1 group ml-auto hover:text-blue-700 transition-colors"
                            >
                              {formatNum(item.quantity, 0)}
                              <Pencil className="w-3 h-3 opacity-0 group-hover:opacity-100 text-blue-400 transition-opacity" />
                            </button>
                          )}
                        </td>

                        <td className="py-3 pr-2 text-right text-slate-600">
                          {rateKgValid ? formatNum(rpm) : <span className="text-slate-300">—</span>}
                        </td>
                        <td className="py-3 text-right font-semibold text-slate-800">
                          {rateKgValid ? formatNum(amount) : <span className="text-slate-300">—</span>}
                        </td>
                        <td className="py-3 pl-3">
                          <button
                            data-testid={`button-remove-${item.id}`}
                            onClick={() => handleRemoveItem(item.id)}
                            className="text-red-300 hover:text-red-600 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
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
                    <span data-testid="text-subtotal" className="font-medium">Rs. {formatNum(subTotal)}</span>
                  </div>
                  <div className="flex justify-between text-sm text-slate-600">
                    <span>VAT (13%)</span>
                    <span data-testid="text-vat" className="font-medium">Rs. {formatNum(vat)}</span>
                  </div>
                  <div className="flex justify-between text-base font-bold text-slate-900 border-t border-slate-200 pt-2">
                    <span>Total (incl. VAT)</span>
                    <span data-testid="text-total-with-vat">Rs. {formatNum(totalWithVat)}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="mt-6 flex justify-between items-center">
              <button
                data-testid="button-clear-all"
                onClick={() => { setItems([]); setEditState(null); }}
                className="text-sm text-red-400 hover:text-red-600 flex items-center gap-1 transition-colors"
              >
                <X className="w-4 h-4" />
                Clear All
              </button>
              <div className="flex gap-3">
                <button
                  data-testid="button-view-quotation"
                  disabled={!rateKgValid}
                  onClick={() => setShowQuotation(true)}
                  className="flex items-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <FileText className="w-4 h-4" />
                  Preview Quotation
                </button>
                <button
                  data-testid="button-print"
                  disabled={!rateKgValid}
                  onClick={() => { setShowQuotation(true); setTimeout(handlePrint, 350); }}
                  className="flex items-center gap-2 bg-blue-700 hover:bg-blue-800 text-white px-4 py-2.5 rounded-lg text-sm font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <Printer className="w-4 h-4" />
                  Print / Download
                </button>
              </div>
            </div>
          </div>
        )}

        {items.length === 0 && (
          <div className="text-center py-16 text-slate-400">
            <FileText className="w-12 h-12 mx-auto mb-3 opacity-20" />
            <p className="text-sm">No items added yet. Enter a rate per kg above, then add pipe items to build your quotation.</p>
          </div>
        )}
      </main>

      {/* ── QUOTATION PREVIEW MODAL ── */}
      {showQuotation && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-start justify-center py-8 px-4 overflow-y-auto print:static print:bg-transparent print:p-0 print:block">
          <div
            ref={printRef}
            className="bg-white w-full max-w-4xl rounded-2xl shadow-2xl print:shadow-none print:rounded-none print:max-w-full"
          >
            {/* Modal toolbar — hidden on print */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 print:hidden">
              <h2 className="font-semibold text-slate-800">Quotation Preview</h2>
              <div className="flex gap-2">
                <button
                  data-testid="button-print-modal"
                  onClick={handlePrint}
                  className="flex items-center gap-2 bg-blue-700 hover:bg-blue-800 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                >
                  <Printer className="w-4 h-4" />
                  Print / Save PDF
                </button>
                <button
                  data-testid="button-close-modal"
                  onClick={() => setShowQuotation(false)}
                  className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-slate-500" />
                </button>
              </div>
            </div>

            {/* Quotation document */}
            <div className="p-10 print:p-8">
              {/* Document header */}
              <div className="text-center mb-10">
                <h1 className="text-3xl font-bold text-blue-900 tracking-tight">QUOTATION</h1>
                <p className="text-sm text-slate-500 mt-2">PE Pipe — Manufactured as per ISO 2081</p>
                <p className="text-xs text-slate-400 mt-1">
                  Date: {new Date().toLocaleDateString("en-IN", { year: "numeric", month: "long", day: "numeric" })}
                </p>
              </div>

              {/* Meta row */}
              <div className="flex justify-between mb-6 text-sm text-slate-600 border-t border-b border-slate-200 py-3">
                <div>
                  <span className="text-xs text-slate-400 block">Rate per kg</span>
                  <span className="font-semibold text-slate-800">Rs. {formatNum(rateKg)}</span>
                </div>
                <div className="text-right">
                  <span className="text-xs text-slate-400 block">Total items</span>
                  <span className="font-semibold text-slate-800">{items.length}</span>
                </div>
              </div>

              {/* Items table */}
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
                      const description = `${item.dnLabel} ${item.pn} PE Pipe`;
                      return (
                        <tr key={item.id} className={idx % 2 === 0 ? "bg-white" : "bg-slate-50"}>
                          <td className="text-center py-3 px-3 border border-slate-200 text-slate-500 text-xs">{idx + 1}</td>
                          <td className="py-3 px-4 border border-slate-200 font-medium text-slate-800">{description}</td>
                          <td className="text-right py-3 px-3 border border-slate-200 text-slate-700">{formatNum(item.quantity, 0)}</td>
                          <td className="text-right py-3 px-3 border border-slate-200 text-slate-700">{formatNum(rpm)}</td>
                          <td className="text-right py-3 px-3 border border-slate-200 font-semibold text-slate-800">{formatNum(amount)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Totals box */}
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

              <p className="text-xs text-slate-400 text-center">
                * Prices are subject to change without prior notice. This quotation is valid for 30 days.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Print — show quotation, hide everything else */}
      <style>{`
        @media print {
          body > * { display: none !important; }
          .fixed { position: static !important; background: transparent !important; padding: 0 !important; display: block !important; }
          .fixed > div { box-shadow: none !important; border-radius: 0 !important; max-width: 100% !important; }
          .print\\:hidden { display: none !important; }
        }
      `}</style>
    </div>
  );
}
