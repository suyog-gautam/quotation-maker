import { useMemo, useState } from "react";
import NepaliDate from "nepali-date-converter";
import {
  ClipboardCheck, Plus, Trash2, Copy, FileDown, Printer, FlaskConical, RefreshCw, AlertTriangle,
} from "lucide-react";
import { PIPE_DATA } from "@/data/pipeData";
import {
  EMPTY_OBSERVED, STANDARD, nsPNsForSize, pnNumber, requirementsFor, sampleObserved, buildRows,
  type Observed, type Status,
} from "@/data/ns40";
import {
  buildReportDocx, buildReportHTML, downloadBlob, pagesFor,
  type ReportHeader, type ReportPipe,
} from "@/lib/reportExport";
import { useToast } from "@/hooks/use-toast";

// ─── helpers ──────────────────────────────────────────────────────────────────

function todayBSDotted() {
  try {
    const nd = new NepaliDate(new Date());
    const p = (n: number) => String(n).padStart(2, "0");
    return `${nd.getYear()}.${p(nd.getMonth() + 1)}.${p(nd.getDate())}`;
  } catch {
    return "";
  }
}

const newId = () => Math.random().toString(36).slice(2, 10);

const newPipe = (): ReportPipe => ({
  id: newId(), dnMm: null, pn: null, batchNo: "", length: "", totalQty: "",
  observed: { ...EMPTY_OBSERVED },
});

/** Sizes from the price list that NS 40 covers. */
const SIZES = PIPE_DATA.filter((p) => nsPNsForSize(p.dnMm).length > 0);

/** PN classes offered for a size: in the price list AND in NS 40 Table 4 for PE 100. */
function pnsFor(dnMm: number): number[] {
  const spec = PIPE_DATA.find((p) => p.dnMm === dnMm);
  const ns = new Set(nsPNsForSize(dnMm));
  const listed = spec ? Object.keys(spec.avgWeights).map(pnNumber) : [];
  return [...new Set(listed)].filter((pn) => ns.has(pn)).sort((a, b) => a - b);
}

const inputCls =
  "w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-slate-50 disabled:text-slate-500";
const labelCls = "block text-xs font-medium text-slate-500 mb-1";

function StatusPill({ s }: { s: Status }) {
  if (!s) return <span className="text-xs text-slate-300">—</span>;
  return (
    <span className={`inline-block text-xs font-semibold px-2 py-0.5 rounded-full ${
      s === "OK" ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"}`}>
      {s}
    </span>
  );
}

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <label className={labelCls}>
        {label}{required && <span className="text-red-500"> *</span>}
      </label>
      {children}
    </div>
  );
}

// ─── page ─────────────────────────────────────────────────────────────────────

export default function TestReportPage() {
  const { toast } = useToast();
  const [header, setHeader] = useState<ReportHeader>({
    title: "Test Report of HDPE Pipes",
    date: todayBSDotted(),
    issuedTo: "",
    delivery: "site- ",
    testAsPer: STANDARD,
    visualInspection: "Good-Internal & External surface are free of contaminants.",
    truckNo: "",
    contractId: "",
    labName: "Ashirwad Testing Laboratory",
  });
  const [pipes, setPipes] = useState<ReportPipe[]>([newPipe()]);
  const [sample, setSample] = useState(false);
  const [busy, setBusy] = useState(false);

  const setH = (k: keyof ReportHeader) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setHeader((h) => ({ ...h, [k]: e.target.value }));

  const updatePipe = (id: string, patch: Partial<ReportPipe>) =>
    setPipes((ps) => ps.map((p) => (p.id === id ? { ...p, ...patch } : p)));

  const updateObs = (id: string, patch: Partial<Observed>) =>
    setPipes((ps) => ps.map((p) => (p.id === id ? { ...p, observed: { ...p.observed, ...patch } } : p)));

  const fillSample = (p: ReportPipe): ReportPipe => {
    const req = p.dnMm != null && p.pn != null ? requirementsFor(p.dnMm, p.pn) : undefined;
    return { ...p, observed: req ? sampleObserved(req) : { ...EMPTY_OBSERVED } };
  };

  const choose = (id: string, dnMm: number | null, pn: number | null) =>
    setPipes((ps) => ps.map((p) => {
      if (p.id !== id) return p;
      const next = { ...p, dnMm, pn };
      return sample ? fillSample(next) : next;
    }));

  const toggleSample = () => {
    if (sample) {
      // Leaving sample mode: wipe the illustrative values so they can't end up in a real report.
      setPipes((ps) => ps.map((p) => ({ ...p, observed: { ...EMPTY_OBSERVED } })));
      setSample(false);
      toast({ title: "Sample mode off", description: "Sample values were cleared. Enter the measured values." });
    } else {
      setPipes((ps) => ps.map(fillSample));
      setSample(true);
    }
  };

  const pages = useMemo(() => pagesFor(pipes), [pipes]);
  const previewHTML = useMemo(() => buildReportHTML(header, pipes, sample, { print: false }), [header, pipes, sample]);

  // ── validation ──
  const problems = useMemo(() => {
    const out: string[] = [];
    if (!header.issuedTo.trim()) out.push("Issued to is required.");
    if (!header.date.trim()) out.push("Date is required.");
    pipes.forEach((p, i) => {
      const n = `Pipe ${i + 1}`;
      if (p.dnMm == null || p.pn == null) { out.push(`${n}: choose size and pressure.`); return; }
      if (!p.batchNo.trim()) out.push(`${n}: batch no is required.`);
      if (!p.length.trim()) out.push(`${n}: length of pcs./coil is required.`);
      if (!p.totalQty.trim()) out.push(`${n}: total quantity is required.`);
      if (!sample) {
        const o = p.observed;
        if ([o.odMin, o.odMax, o.wallMin, o.wallMax, o.reversion, o.carbonBlack, o.dispersion, o.mfr, o.creep].some((v) => !String(v).trim()))
          out.push(`${n}: fill in every observed value.`);
      }
    });
    return out;
  }, [header, pipes, sample]);

  const notOkCount = pages.reduce((n, p) => n + p.rows.filter((r) => r.status === "Not OK").length, 0);

  const guard = () => {
    if (problems.length) {
      toast({ title: "Report incomplete", description: problems[0], variant: "destructive" });
      return false;
    }
    if (notOkCount > 0) {
      toast({ title: `${notOkCount} result(s) are Not OK`, description: "They will be shown as Not OK on the report." });
    }
    return true;
  };

  const fileBase = () => {
    const who = header.issuedTo.trim().replace(/[^\w]+/g, "_").slice(0, 40) || "Report";
    return `${sample ? "SAMPLE_" : ""}Test_Report_${who}`;
  };

  const handlePDF = () => {
    if (!guard()) return;
    const win = window.open("", "_blank");
    if (!win) { toast({ title: "Pop-up blocked — allow pop-ups and try again", variant: "destructive" }); return; }
    win.document.write(buildReportHTML(header, pipes, sample, { print: true }));
    win.document.close();
  };

  const handleWord = async () => {
    if (!guard()) return;
    setBusy(true);
    try {
      downloadBlob(await buildReportDocx(header, pipes, sample), `${fileBase()}.docx`);
    } catch (e) {
      toast({ title: "Could not create the Word file", description: String(e), variant: "destructive" });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-blue-900 text-white shadow-lg">
        <div className="max-w-6xl mx-auto px-4 py-5 flex items-center gap-3">
          <ClipboardCheck className="w-7 h-7 text-blue-200" />
          <div>
            <h1 className="text-xl font-bold tracking-tight">HDPE Pipe Test Report Maker</h1>
            <p className="text-xs text-blue-200">PE 100 · requirements from {STANDARD}</p>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8 grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] gap-6 items-start">
        <div className="space-y-5 min-w-0">

          {/* Sample mode */}
          <div className={`rounded-2xl border p-4 flex items-start gap-3 ${sample ? "bg-amber-50 border-amber-300" : "bg-white border-slate-200"}`}>
            <FlaskConical className={`w-5 h-5 mt-0.5 flex-shrink-0 ${sample ? "text-amber-600" : "text-slate-400"}`} />
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <p className="text-sm font-semibold text-slate-800">Sample mode</p>
                <button
                  type="button" role="switch" aria-checked={sample} onClick={toggleSample}
                  className={`relative inline-flex h-6 w-11 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-amber-500 ${sample ? "bg-amber-500" : "bg-slate-300"}`}
                >
                  <span className={`inline-block h-5 w-5 mt-0.5 rounded-full bg-white shadow transition-transform ${sample ? "translate-x-5" : "translate-x-0.5"}`} />
                </button>
              </div>
              <p className="text-xs text-slate-600 mt-1">
                {sample
                  ? <>Observed values are auto-filled with example numbers inside the NS limits. Every page of the PDF and Word file carries a large diagonal <b className="text-red-700">SAMPLE</b> watermark. Turning sample mode off clears these values.</>
                  : "Off: enter the values measured by the lab. Status is checked against NS 40 automatically."}
              </p>
            </div>
          </div>

          {/* Report details */}
          <section className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5 space-y-3">
            <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Report details</h2>
            <Field label="Heading">
              <input className={inputCls} value={header.title} onChange={setH("title")} />
            </Field>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Field label="Date (BS)" required><input className={inputCls} value={header.date} onChange={setH("date")} placeholder="2082.06.21" /></Field>
              <Field label="Test as per"><input className={inputCls} value={header.testAsPer} onChange={setH("testAsPer")} /></Field>
            </div>
            <Field label="Issued to" required>
              <input className={inputCls} value={header.issuedTo} onChange={setH("issuedTo")} placeholder="e.g. Water Supply and Sewerage Management Office, Lamjung" />
            </Field>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Field label="Delivery"><input className={inputCls} value={header.delivery} onChange={setH("delivery")} /></Field>
              <Field label="Truck no"><input className={inputCls} value={header.truckNo} onChange={setH("truckNo")} placeholder="State2-03-001ka0141" /></Field>
              <Field label="Contract ID (optional)"><input className={inputCls} value={header.contractId} onChange={setH("contractId")} /></Field>
              <Field label="Laboratory"><input className={inputCls} value={header.labName} onChange={setH("labName")} /></Field>
            </div>
            <Field label="Visual inspection"><input className={inputCls} value={header.visualInspection} onChange={setH("visualInspection")} /></Field>
          </section>

          {/* Pipes */}
          {pipes.map((p, idx) => {
            const req = p.dnMm != null && p.pn != null ? requirementsFor(p.dnMm, p.pn) : undefined;
            const rows = req ? buildRows(req, p.observed) : [];
            const o = p.observed;
            const st = (i: number) => rows[i]?.status ?? "";
            const ro = sample;
            return (
              <section key={p.id} className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5 space-y-4">
                <div className="flex items-center justify-between gap-2">
                  <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Pipe {idx + 1} · page {idx + 1}
                  </h2>
                  <div className="flex items-center gap-1">
                    {sample && req && (
                      <button type="button" title="New sample values" onClick={() => setPipes((ps) => ps.map((x) => x.id === p.id ? fillSample(x) : x))}
                        className="p-1.5 rounded-md text-amber-600 hover:bg-amber-50"><RefreshCw className="w-4 h-4" /></button>
                    )}
                    <button type="button" title="Duplicate pipe"
                      onClick={() => setPipes((ps) => { const i = ps.findIndex((x) => x.id === p.id); const c = { ...ps[i], id: newId(), observed: { ...ps[i].observed } }; return [...ps.slice(0, i + 1), c, ...ps.slice(i + 1)]; })}
                      className="p-1.5 rounded-md text-slate-500 hover:bg-slate-100"><Copy className="w-4 h-4" /></button>
                    {pipes.length > 1 && (
                      <button type="button" title="Remove pipe" onClick={() => setPipes((ps) => ps.filter((x) => x.id !== p.id))}
                        className="p-1.5 rounded-md text-red-500 hover:bg-red-50"><Trash2 className="w-4 h-4" /></button>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <Field label="Size (DN)" required>
                    <select className={inputCls} value={p.dnMm ?? ""}
                      onChange={(e) => {
                        const dn = e.target.value ? Number(e.target.value) : null;
                        const keep = dn != null && p.pn != null && pnsFor(dn).includes(p.pn) ? p.pn : null;
                        choose(p.id, dn, keep);
                      }}>
                      <option value="">Select size</option>
                      {SIZES.map((s) => <option key={s.dnMm} value={s.dnMm}>{s.dnLabel}</option>)}
                    </select>
                  </Field>
                  <Field label="Pressure (PN)" required>
                    <select className={inputCls} value={p.pn ?? ""} disabled={p.dnMm == null}
                      onChange={(e) => choose(p.id, p.dnMm, e.target.value ? Number(e.target.value) : null)}>
                      <option value="">Select PN</option>
                      {p.dnMm != null && pnsFor(p.dnMm).map((pn) => <option key={pn} value={pn}>PN {pn}</option>)}
                    </select>
                  </Field>
                  <Field label="SDR (NS 40)">
                    <input className={inputCls} value={req ? `SDR ${req.sdr}` : ""} disabled readOnly />
                  </Field>
                  <Field label="Batch no" required>
                    <input className={inputCls} value={p.batchNo} onChange={(e) => updatePipe(p.id, { batchNo: e.target.value })} />
                  </Field>
                  <div className="col-span-2">
                    <Field label="Length of Pcs./Coil" required>
                      <input className={inputCls} value={p.length} placeholder="e.g. 100 meters" onChange={(e) => updatePipe(p.id, { length: e.target.value })} />
                    </Field>
                  </div>
                  <div className="col-span-2">
                    <Field label="Total quantity" required>
                      <input className={inputCls} value={p.totalQty} placeholder="e.g. 5,000.00 meters" onChange={(e) => updatePipe(p.id, { totalQty: e.target.value })} />
                    </Field>
                  </div>
                </div>

                {req ? (
                  <div className="overflow-x-auto -mx-1">
                    <table className="w-full text-sm min-w-[520px]">
                      <thead>
                        <tr className="text-left text-xs text-slate-500 border-b border-slate-200">
                          <th className="py-2 px-1 font-medium">Test</th>
                          <th className="py-2 px-1 font-medium">Required (NS 40)</th>
                          <th className="py-2 px-1 font-medium">Observed {sample && <span className="text-amber-600">(sample)</span>}</th>
                          <th className="py-2 px-1 font-medium text-center">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        <tr>
                          <td className="py-2 px-1">Outside diameter</td>
                          <td className="py-2 px-1 text-slate-600 tabular-nums">{rows[0].required}</td>
                          <td className="py-2 px-1"><div className="flex items-center gap-1">
                            <input className={inputCls} inputMode="decimal" placeholder="min" value={o.odMin} disabled={ro} onChange={(e) => updateObs(p.id, { odMin: e.target.value })} />
                            <span className="text-slate-400">–</span>
                            <input className={inputCls} inputMode="decimal" placeholder="max" value={o.odMax} disabled={ro} onChange={(e) => updateObs(p.id, { odMax: e.target.value })} />
                          </div></td>
                          <td className="py-2 px-1 text-center"><StatusPill s={st(0)} /></td>
                        </tr>
                        <tr>
                          <td className="py-2 px-1">Wall thickness</td>
                          <td className="py-2 px-1 text-slate-600 tabular-nums">{rows[1].required}</td>
                          <td className="py-2 px-1"><div className="flex items-center gap-1">
                            <input className={inputCls} inputMode="decimal" placeholder="min" value={o.wallMin} disabled={ro} onChange={(e) => updateObs(p.id, { wallMin: e.target.value })} />
                            <span className="text-slate-400">–</span>
                            <input className={inputCls} inputMode="decimal" placeholder="max" value={o.wallMax} disabled={ro} onChange={(e) => updateObs(p.id, { wallMax: e.target.value })} />
                          </div></td>
                          <td className="py-2 px-1 text-center"><StatusPill s={st(1)} /></td>
                        </tr>
                        <tr>
                          <td className="py-2 px-1">Reversion at 110°C (%)</td>
                          <td className="py-2 px-1 text-slate-600">Maximum 3%</td>
                          <td className="py-2 px-1"><input className={inputCls} inputMode="decimal" value={o.reversion} disabled={ro} onChange={(e) => updateObs(p.id, { reversion: e.target.value })} /></td>
                          <td className="py-2 px-1 text-center"><StatusPill s={st(2)} /></td>
                        </tr>
                        <tr>
                          <td className="py-2 px-1">Carbon black (%)</td>
                          <td className="py-2 px-1 text-slate-600">2.5±0.5%</td>
                          <td className="py-2 px-1"><input className={inputCls} inputMode="decimal" value={o.carbonBlack} disabled={ro} onChange={(e) => updateObs(p.id, { carbonBlack: e.target.value })} /></td>
                          <td className="py-2 px-1 text-center"><StatusPill s={st(3)} /></td>
                        </tr>
                        <tr>
                          <td className="py-2 px-1">Carbon black dispersion</td>
                          <td className="py-2 px-1 text-slate-600">Should be satisfactory</td>
                          <td className="py-2 px-1">
                            <select className={inputCls} value={o.dispersion} disabled={ro} onChange={(e) => updateObs(p.id, { dispersion: e.target.value as Observed["dispersion"] })}>
                              <option value="">Select</option><option>Satisfactory</option><option>Not satisfactory</option>
                            </select>
                          </td>
                          <td className="py-2 px-1 text-center"><StatusPill s={st(4)} /></td>
                        </tr>
                        <tr>
                          <td className="py-2 px-1">Melt flow rate (gm/10 min)</td>
                          <td className="py-2 px-1 text-slate-600">0.40-1.10gm/10 min</td>
                          <td className="py-2 px-1"><input className={inputCls} inputMode="decimal" value={o.mfr} disabled={ro} onChange={(e) => updateObs(p.id, { mfr: e.target.value })} /></td>
                          <td className="py-2 px-1 text-center"><StatusPill s={st(5)} /></td>
                        </tr>
                        <tr>
                          <td className="py-2 px-1">Creep rupture 80°C (48 hrs)</td>
                          <td className="py-2 px-1 text-slate-600">Should not burst {req.pn} kgf/cm²</td>
                          <td className="py-2 px-1">
                            <select className={inputCls} value={o.creep} disabled={ro} onChange={(e) => updateObs(p.id, { creep: e.target.value as Observed["creep"] })}>
                              <option value="">Select</option><option>Did not burst during testing</option><option>Burst during testing</option>
                            </select>
                          </td>
                          <td className="py-2 px-1 text-center"><StatusPill s={st(6)} /></td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="text-sm text-slate-400">Choose a size and pressure to load the NS 40 required values.</p>
                )}
              </section>
            );
          })}

          <button type="button" onClick={() => setPipes((ps) => [...ps, sample ? fillSample(newPipe()) : newPipe()])}
            className="w-full border-2 border-dashed border-slate-300 rounded-2xl py-3 text-sm font-medium text-slate-600 hover:border-blue-400 hover:text-blue-700 flex items-center justify-center gap-2">
            <Plus className="w-4 h-4" /> Add another pipe (new page)
          </button>
        </div>

        {/* Preview + downloads */}
        <div className="space-y-3 lg:sticky lg:top-4 min-w-0">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4 space-y-3">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <p className="text-sm font-semibold text-slate-800">
                Preview <span className="font-normal text-slate-500">· {pages.length} page{pages.length === 1 ? "" : "s"}, A4 letterhead margins</span>
              </p>
              <div className="flex gap-2">
                <button type="button" onClick={handlePDF}
                  className="inline-flex items-center gap-1.5 bg-blue-900 hover:bg-blue-800 text-white text-sm font-medium rounded-lg px-3 py-2">
                  <Printer className="w-4 h-4" /> PDF
                </button>
                <button type="button" onClick={handleWord} disabled={busy}
                  className="inline-flex items-center gap-1.5 bg-white border border-blue-900 text-blue-900 hover:bg-blue-50 text-sm font-medium rounded-lg px-3 py-2 disabled:opacity-50">
                  <FileDown className="w-4 h-4" /> Word
                </button>
              </div>
            </div>
            {(problems.length > 0 || notOkCount > 0) && (
              <div className="text-xs rounded-lg bg-slate-50 border border-slate-200 p-2 space-y-0.5">
                {problems.slice(0, 4).map((m) => <p key={m} className="text-slate-600">• {m}</p>)}
                {notOkCount > 0 && (
                  <p className="text-red-700 flex items-center gap-1"><AlertTriangle className="w-3.5 h-3.5" /> {notOkCount} result(s) Not OK against NS 40.</p>
                )}
              </div>
            )}
            <iframe title="Report preview" srcDoc={previewHTML} className="w-full h-[70vh] rounded-lg border border-slate-200 bg-slate-200" />
            <p className="text-[11px] text-slate-500">
              PDF opens the print dialog — choose “Save as PDF”. Print on letterhead paper; margins are 56 mm top, 40 mm bottom, 21 mm sides.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
