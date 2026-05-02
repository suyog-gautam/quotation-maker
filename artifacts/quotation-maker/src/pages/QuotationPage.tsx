import { useState, useRef } from "react";
import { Plus, Trash2, FileText, Printer, X, ChevronDown } from "lucide-react";
import { PIPE_DATA, PIPE_SIZES, PN_RATINGS, getAvgWeight, type PNRating } from "@/data/pipeData";
import { useToast } from "@/hooks/use-toast";

interface QuotationItem {
  id: string;
  size: string;
  pn: PNRating;
  avgWeight: number;
  quantity: number;
  ratePerKg: number;
}

interface FormState {
  size: string;
  pn: PNRating | "";
  quantity: string;
  ratePerKg: string;
  sizeSearch: string;
}

const VAT_RATE = 0.13;

function generateId() {
  return Math.random().toString(36).substring(2, 10);
}

function formatNum(n: number, decimals = 2) {
  return n.toLocaleString("en-IN", { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
}

export default function QuotationPage() {
  const { toast } = useToast();
  const printRef = useRef<HTMLDivElement>(null);

  const [items, setItems] = useState<QuotationItem[]>([]);
  const [form, setForm] = useState<FormState>({
    size: "",
    pn: "",
    quantity: "",
    ratePerKg: "",
    sizeSearch: "",
  });
  const [showSizeDropdown, setShowSizeDropdown] = useState(false);
  const [showPNDropdown, setShowPNDropdown] = useState(false);
  const [showQuotation, setShowQuotation] = useState(false);

  const filteredSizes = PIPE_SIZES.filter((s) =>
    s.toLowerCase().includes(form.sizeSearch.toLowerCase())
  );

  const availablePNs =
    form.size
      ? PN_RATINGS.filter((pn) => {
          const spec = PIPE_DATA.find((p) => p.size === form.size);
          return spec?.avgWeights[pn] !== undefined;
        })
      : [];

  const currentAvgWeight =
    form.size && form.pn ? getAvgWeight(form.size, form.pn as PNRating) : undefined;

  const ratePerMeter =
    currentAvgWeight && form.ratePerKg ? currentAvgWeight * parseFloat(form.ratePerKg) : undefined;

  const handleSelectSize = (size: string) => {
    setForm((f) => ({ ...f, size, sizeSearch: size, pn: "" }));
    setShowSizeDropdown(false);
  };

  const handleAddItem = () => {
    if (!form.size) { toast({ title: "Select a pipe size", variant: "destructive" }); return; }
    if (!form.pn) { toast({ title: "Select a PN rating", variant: "destructive" }); return; }
    if (!form.quantity || parseFloat(form.quantity) <= 0) { toast({ title: "Enter a valid quantity", variant: "destructive" }); return; }
    if (!form.ratePerKg || parseFloat(form.ratePerKg) <= 0) { toast({ title: "Enter a valid rate per kg", variant: "destructive" }); return; }

    const avgWeight = getAvgWeight(form.size, form.pn as PNRating)!;
    setItems((prev) => [
      ...prev,
      {
        id: generateId(),
        size: form.size,
        pn: form.pn as PNRating,
        avgWeight,
        quantity: parseFloat(form.quantity),
        ratePerKg: parseFloat(form.ratePerKg),
      },
    ]);
    setForm({ size: "", pn: "", quantity: "", ratePerKg: "", sizeSearch: "" });
    toast({ title: "Item added to quotation" });
  };

  const handleRemoveItem = (id: string) => {
    setItems((prev) => prev.filter((i) => i.id !== id));
  };

  const subTotal = items.reduce((sum, item) => {
    const rpm = item.avgWeight * item.ratePerKg;
    return sum + item.quantity * rpm;
  }, 0);

  const vat = subTotal * VAT_RATE;
  const totalWithVat = subTotal + vat;

  const handlePrint = () => {
    window.print();
  };

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
        {/* Add Item Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 mb-6">
          <h2 className="text-base font-semibold text-slate-800 mb-5 flex items-center gap-2">
            <Plus className="w-4 h-4 text-blue-600" />
            Add Pipe Item
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Size Selector */}
            <div className="relative">
              <label className="block text-xs font-medium text-slate-500 mb-1.5">
                Pipe Size <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  data-testid="input-size-search"
                  type="text"
                  value={form.sizeSearch}
                  placeholder="Search size (e.g. 1/2&quot;)..."
                  className="w-full border border-slate-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent pr-10"
                  onChange={(e) => {
                    setForm((f) => ({ ...f, sizeSearch: e.target.value, size: "", pn: "" }));
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
                      className="w-full text-left px-4 py-2.5 text-sm hover:bg-blue-50 text-slate-800 first:rounded-t-lg last:rounded-b-lg transition-colors"
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
                  disabled={!form.size}
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
                      const aw = getAvgWeight(form.size, pn);
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
                          <span className="text-xs text-slate-500">Avg wt: {aw} kg/m</span>
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

            {/* Rate per kg */}
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1.5">
                Rate per kg (Rs.) <span className="text-red-500">*</span>
              </label>
              <input
                data-testid="input-rate-per-kg"
                type="number"
                min="0"
                step="any"
                value={form.ratePerKg}
                placeholder="e.g. 250"
                className="w-full border border-slate-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                onChange={(e) => setForm((f) => ({ ...f, ratePerKg: e.target.value }))}
              />
            </div>
          </div>

          {/* Live calculation preview */}
          {currentAvgWeight && form.ratePerKg && parseFloat(form.ratePerKg) > 0 && (
            <div className="mt-4 p-3 bg-blue-50 border border-blue-100 rounded-lg flex flex-wrap gap-4 text-sm">
              <div>
                <span className="text-slate-500 text-xs">Avg Weight</span>
                <p className="font-semibold text-slate-800">{currentAvgWeight} kg/m</p>
              </div>
              <div>
                <span className="text-slate-500 text-xs">Rate per Meter</span>
                <p className="font-semibold text-blue-700">Rs. {formatNum(ratePerMeter!)}</p>
              </div>
              {form.quantity && parseFloat(form.quantity) > 0 && (
                <div>
                  <span className="text-slate-500 text-xs">Amount ({form.quantity}m)</span>
                  <p className="font-semibold text-green-700">
                    Rs. {formatNum(parseFloat(form.quantity) * ratePerMeter!)}
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
                    <th className="text-left text-xs font-semibold text-slate-500 pb-3 pr-3">#</th>
                    <th className="text-left text-xs font-semibold text-slate-500 pb-3 pr-3">Size</th>
                    <th className="text-left text-xs font-semibold text-slate-500 pb-3 pr-3">PN</th>
                    <th className="text-right text-xs font-semibold text-slate-500 pb-3 pr-3">Avg Wt (kg/m)</th>
                    <th className="text-right text-xs font-semibold text-slate-500 pb-3 pr-3">Qty (m)</th>
                    <th className="text-right text-xs font-semibold text-slate-500 pb-3 pr-3">Rate/kg (Rs.)</th>
                    <th className="text-right text-xs font-semibold text-slate-500 pb-3 pr-3">Rate/m (Rs.)</th>
                    <th className="text-right text-xs font-semibold text-slate-500 pb-3">Amount (Rs.)</th>
                    <th className="pb-3"></th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item, idx) => {
                    const rpm = item.avgWeight * item.ratePerKg;
                    const amount = item.quantity * rpm;
                    return (
                      <tr key={item.id} data-testid={`row-item-${item.id}`} className="border-b border-slate-100 last:border-0">
                        <td className="py-3 pr-3 text-slate-400">{idx + 1}</td>
                        <td className="py-3 pr-3 font-medium text-slate-800">{item.size}</td>
                        <td className="py-3 pr-3 text-slate-600">{item.pn}</td>
                        <td className="py-3 pr-3 text-right text-slate-600">{item.avgWeight}</td>
                        <td className="py-3 pr-3 text-right text-slate-600">{formatNum(item.quantity, 0)}</td>
                        <td className="py-3 pr-3 text-right text-slate-600">{formatNum(item.ratePerKg)}</td>
                        <td className="py-3 pr-3 text-right text-slate-700">{formatNum(rpm)}</td>
                        <td className="py-3 text-right font-semibold text-slate-800">{formatNum(amount)}</td>
                        <td className="py-3 pl-3">
                          <button
                            data-testid={`button-remove-${item.id}`}
                            onClick={() => handleRemoveItem(item.id)}
                            className="text-red-400 hover:text-red-600 transition-colors"
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
                <div className="flex justify-between text-base font-bold text-slate-900 border-t border-slate-200 pt-2 mt-2">
                  <span>Total (incl. VAT)</span>
                  <span data-testid="text-total-with-vat">Rs. {formatNum(totalWithVat)}</span>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="mt-6 flex justify-between items-center">
              <button
                data-testid="button-clear-all"
                onClick={() => setItems([])}
                className="text-sm text-red-500 hover:text-red-700 flex items-center gap-1 transition-colors"
              >
                <X className="w-4 h-4" />
                Clear All
              </button>
              <div className="flex gap-3">
                <button
                  data-testid="button-view-quotation"
                  onClick={() => setShowQuotation(true)}
                  className="flex items-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors"
                >
                  <FileText className="w-4 h-4" />
                  Preview Quotation
                </button>
                <button
                  data-testid="button-print"
                  onClick={() => { setShowQuotation(true); setTimeout(handlePrint, 300); }}
                  className="flex items-center gap-2 bg-blue-700 hover:bg-blue-800 text-white px-4 py-2.5 rounded-lg text-sm font-medium transition-colors"
                >
                  <Printer className="w-4 h-4" />
                  Print Quotation
                </button>
              </div>
            </div>
          </div>
        )}

        {items.length === 0 && (
          <div className="text-center py-16 text-slate-400">
            <FileText className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="text-sm">No items added yet. Add pipe items above to build your quotation.</p>
          </div>
        )}
      </main>

      {/* Quotation Preview Modal */}
      {showQuotation && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-start justify-center py-8 px-4 overflow-y-auto print:static print:bg-transparent print:p-0">
          <div
            ref={printRef}
            className="bg-white w-full max-w-4xl rounded-2xl shadow-2xl print:shadow-none print:rounded-none print:max-w-full"
          >
            {/* Modal header (hide on print) */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 print:hidden">
              <h2 className="font-semibold text-slate-800">Quotation Preview</h2>
              <div className="flex gap-2">
                <button
                  data-testid="button-print-modal"
                  onClick={handlePrint}
                  className="flex items-center gap-2 bg-blue-700 hover:bg-blue-800 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                >
                  <Printer className="w-4 h-4" />
                  Print
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

            {/* Quotation content */}
            <div className="p-8 print:p-6">
              {/* Header */}
              <div className="text-center mb-8">
                <h1 className="text-2xl font-bold text-blue-900 tracking-tight">QUOTATION</h1>
                <p className="text-sm text-slate-500 mt-1">PE Pipe — Manufactured as per ISO 2081</p>
                <p className="text-xs text-slate-400 mt-0.5">Effective from Sharaban 01, 2081 (Calculate Base Rate)</p>
                <p className="text-xs text-slate-400">Date: {new Date().toLocaleDateString("en-IN", { year: "numeric", month: "long", day: "numeric" })}</p>
              </div>

              {/* Table */}
              <div className="overflow-x-auto mb-8">
                <table className="w-full text-sm border-collapse">
                  <thead>
                    <tr className="bg-blue-900 text-white">
                      <th className="text-center py-2.5 px-3 font-semibold text-xs border border-blue-800">S.N</th>
                      <th className="text-center py-2.5 px-3 font-semibold text-xs border border-blue-800">Size</th>
                      <th className="text-center py-2.5 px-3 font-semibold text-xs border border-blue-800">PN Rating</th>
                      <th className="text-center py-2.5 px-3 font-semibold text-xs border border-blue-800">Avg Wt (kg/m)</th>
                      <th className="text-center py-2.5 px-3 font-semibold text-xs border border-blue-800">Qty (m)</th>
                      <th className="text-center py-2.5 px-3 font-semibold text-xs border border-blue-800">Rate/kg (Rs.)</th>
                      <th className="text-center py-2.5 px-3 font-semibold text-xs border border-blue-800">Rate/m (Rs.)</th>
                      <th className="text-center py-2.5 px-3 font-semibold text-xs border border-blue-800">Amount (Rs.)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((item, idx) => {
                      const rpm = item.avgWeight * item.ratePerKg;
                      const amount = item.quantity * rpm;
                      return (
                        <tr key={item.id} className={idx % 2 === 0 ? "bg-white" : "bg-slate-50"}>
                          <td className="text-center py-2.5 px-3 border border-slate-200 text-slate-600">{idx + 1}</td>
                          <td className="text-center py-2.5 px-3 border border-slate-200 font-medium text-slate-800">{item.size}</td>
                          <td className="text-center py-2.5 px-3 border border-slate-200 text-slate-600">{item.pn}</td>
                          <td className="text-center py-2.5 px-3 border border-slate-200 text-slate-600">{item.avgWeight}</td>
                          <td className="text-right py-2.5 px-3 border border-slate-200 text-slate-600">{formatNum(item.quantity, 0)}</td>
                          <td className="text-right py-2.5 px-3 border border-slate-200 text-slate-600">{formatNum(item.ratePerKg)}</td>
                          <td className="text-right py-2.5 px-3 border border-slate-200 text-slate-700">{formatNum(rpm)}</td>
                          <td className="text-right py-2.5 px-3 border border-slate-200 font-semibold text-slate-800">{formatNum(amount)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Totals */}
              <div className="flex justify-end">
                <div className="w-72 border border-slate-200 rounded-lg overflow-hidden">
                  <div className="flex justify-between px-4 py-3 bg-slate-50 border-b border-slate-200">
                    <span className="text-sm text-slate-600">Sub Total</span>
                    <span className="text-sm font-medium text-slate-800">Rs. {formatNum(subTotal)}</span>
                  </div>
                  <div className="flex justify-between px-4 py-3 bg-slate-50 border-b border-slate-200">
                    <span className="text-sm text-slate-600">VAT @ 13%</span>
                    <span className="text-sm font-medium text-slate-800">Rs. {formatNum(vat)}</span>
                  </div>
                  <div className="flex justify-between px-4 py-3 bg-blue-900 text-white">
                    <span className="text-sm font-bold">Grand Total (incl. VAT)</span>
                    <span className="text-sm font-bold">Rs. {formatNum(totalWithVat)}</span>
                  </div>
                </div>
              </div>

              {/* Footer note */}
              <p className="text-xs text-slate-400 mt-8 text-center">
                * Prices are subject to change without prior notice. This quotation is valid for 30 days.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Print styles */}
      <style>{`
        @media print {
          body * { visibility: hidden !important; }
          #quotation-print, #quotation-print * { visibility: visible !important; }
        }
      `}</style>
    </div>
  );
}
