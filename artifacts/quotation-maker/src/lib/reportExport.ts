import {
  AlignmentType, BorderStyle, Document, LevelFormat, Packer, PageBreak, Paragraph,
  Table, TableCell, TableRow, TextRun, VerticalAlign, VerticalMergeType, WidthType,
} from "docx";
import { buildRows, requirementsFor, type Observed, type ReportRow } from "@/data/ns40";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ReportHeader {
  title: string;
  date: string;
  issuedTo: string;
  delivery: string;
  testAsPer: string;
  visualInspection: string;
  truckNo: string;
  contractId: string;
  labName: string;
}

export interface ReportPipe {
  id: string;
  dnMm: number | null;
  pn: number | null;
  batchNo: string;
  length: string;
  totalQty: string;
  observed: Observed;
}

export const SAMPLE_STAMP = "SAMPLE – NOT ACTUAL TEST RESULTS";

// Page geometry – A4 with room for the Ashirwad letterhead (logo band on top,
// address band at the bottom). Same values as Test_Report_Lamjung.docx.
export const PAGE = {
  topMm: 56, bottomMm: 40, sideMm: 21,
  twips: { top: 3175, bottom: 2268, side: 1191, header: 283, footer: 283 },
  widthTwips: 11906, heightTwips: 16838,
};

export interface PageData {
  pipe: ReportPipe;
  pipeLine: string;
  rows: ReportRow[];
}

export function pagesFor(pipes: ReportPipe[]): PageData[] {
  const out: PageData[] = [];
  for (const pipe of pipes) {
    if (pipe.dnMm == null || pipe.pn == null) continue;
    const req = requirementsFor(pipe.dnMm, pipe.pn);
    if (!req) continue;
    out.push({
      pipe,
      pipeLine: `PE-100 PN ${pipe.pn} DN ${pipe.dnMm} SDR ${req.sdr}`,
      rows: buildRows(req, pipe.observed),
    });
  }
  return out;
}

export function displayTitle(h: ReportHeader, sample: boolean) {
  const t = h.title.trim() || "Test Report of HDPE Pipes";
  return sample && !/^sample\b/i.test(t) ? `Sample ${t}` : t;
}

function detailLines(h: ReportHeader, p: PageData): { label: string; value: string; bold: boolean }[] {
  const lines = [
    { label: "Issued to:", value: h.issuedTo, bold: true },
    { label: "Delivery:", value: h.delivery, bold: true },
    { label: "Pipe Size & pressure:", value: p.pipeLine, bold: true },
    { label: "Test as per:", value: h.testAsPer, bold: false },
    { label: "Batch no:", value: p.pipe.batchNo, bold: false },
    { label: "Length of Pcs./Coil:", value: p.pipe.length, bold: false },
    { label: "Total quantity:", value: p.pipe.totalQty, bold: false },
    { label: "Visual inspection:", value: h.visualInspection, bold: false },
    { label: "Truck no:", value: h.truckNo, bold: false },
  ];
  if (h.contractId.trim()) lines.push({ label: "Contract ID:", value: h.contractId, bold: false });
  return lines;
}

// ─── HTML (preview + PDF via print) ──────────────────────────────────────────

const esc = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

export function buildReportHTML(
  h: ReportHeader, pipes: ReportPipe[], sample: boolean, opts: { print: boolean },
) {
  const pages = pagesFor(pipes);
  const title = esc(displayTitle(h, sample));
  const body = pages.map((p, i) => {
    const lines = detailLines(h, p).map((l) =>
      `<li class="${l.bold ? "b" : ""}"><span class="lbl">${esc(l.label)}</span><span>${esc(l.value)}</span></li>`,
    ).join("");
    const rows = p.rows.map((r, j) => `
      <tr>
        <td class="c">${r.sn}</td>
        <td>${esc(r.characteristic)}</td>
        ${j === 0 ? `<td class="c m" rowspan="${p.rows.length}">${esc(h.testAsPer)}</td>` : ""}
        <td class="c">${esc(r.required)}</td>
        <td class="c">${esc(r.observed)}</td>
        <td class="c ${r.status === "Not OK" ? "bad" : ""}">${esc(r.status)}</td>
      </tr>`).join("");
    return `
    <section class="page${i < pages.length - 1 ? " brk" : ""}">
      ${sample ? `<div class="wm">SAMPLE</div>` : ""}
      <h1>${title}</h1>
      ${sample ? `<p class="stamp">${SAMPLE_STAMP}</p>` : ""}
      <p class="date">Date: ${esc(h.date)}</p>
      <ul>${lines}</ul>
      <table>
        <colgroup><col style="width:7%"><col style="width:25%"><col style="width:12%"><col style="width:23%"><col style="width:21%"><col style="width:12%"></colgroup>
        <thead><tr><th>S.NO.</th><th>Characteristics</th><th>Test method</th><th>Required value</th><th>Observed value</th><th>status</th></tr></thead>
        <tbody>${rows}</tbody>
      </table>
      <p class="lab">${esc(h.labName)}</p>
      ${sample ? `<p class="stamp small">${SAMPLE_STAMP}</p>` : ""}
    </section>`;
  }).join("");

  const screen = !opts.print;
  return `<!doctype html><html><head><meta charset="utf-8"><title>${title}</title>
  <style>
    @page{size:A4;margin:${PAGE.topMm}mm ${PAGE.sideMm}mm ${PAGE.bottomMm}mm ${PAGE.sideMm}mm}
    *{box-sizing:border-box}
    body{margin:0;font-family:Calibri,Carlito,"Segoe UI",Arial,sans-serif;font-size:11pt;color:#000;${screen ? "background:#e2e8f0;padding:16px" : ""}}
    .page{position:relative;${screen ? `width:210mm;min-height:297mm;margin:0 auto 16px;background:#fff;box-shadow:0 1px 4px rgba(0,0,0,.2);padding:${PAGE.topMm}mm ${PAGE.sideMm}mm ${PAGE.bottomMm}mm` : ""}}
    .brk{break-after:page;page-break-after:always}
    h1{text-align:center;font-size:14pt;margin:0 0 4pt}
    .stamp{text-align:center;color:#c00000;font-weight:700;margin:0 0 6pt;letter-spacing:.3px}
    .stamp.small{font-size:9pt;text-align:right;margin-top:4pt}
    .date{text-align:right;margin:14pt 0 14pt}
    ul{margin:0 0 14pt;padding-left:36pt}
    li{margin:0 0 1pt}
    li .lbl{display:inline-block;min-width:145pt}
    li.b{font-weight:700}
    table{width:100%;border-collapse:collapse;font-size:10.5pt;page-break-inside:avoid}
    th,td{border:1px solid #000;padding:2pt 4pt;vertical-align:top}
    th{font-weight:400;text-align:left}
    td.c{text-align:center}
    td.m{vertical-align:middle;font-size:8.5pt}
    td.bad{color:#c00000;font-weight:700}
    .lab{text-align:right;margin-top:28pt}
    .wm{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;font-size:120pt;font-weight:800;color:rgba(192,0,0,.08);transform:rotate(-35deg);pointer-events:none;z-index:0}
    h1,ul,table,p{position:relative;z-index:1}
    @media print{.page{padding:0;box-shadow:none;margin:0;width:auto;min-height:0}.wm{position:fixed}}
  </style></head><body>
  ${pages.length ? body : `<p style="text-align:center;color:#64748b;font-family:sans-serif">Choose a pipe size and pressure to see the report.</p>`}
  ${opts.print
    ? `<script>window.onload=()=>{window.print()}</script>`
    : `<script>(function(){function fit(){var w=document.documentElement.clientWidth-32;document.body.style.zoom=String(Math.min(1,w/794));}fit();window.addEventListener('resize',fit);})()</script>`}
  </body></html>`;
}

// ─── Word (.docx) ────────────────────────────────────────────────────────────

const FONT = "Calibri";
const run = (text: string, o: { bold?: boolean; size?: number; color?: string } = {}) =>
  new TextRun({ text, font: FONT, bold: o.bold, size: o.size ?? 22, color: o.color });

const line = { style: BorderStyle.SINGLE, size: 4, color: "000000" };
const borders = { top: line, bottom: line, left: line, right: line };
const COLS = [680, 2380, 1140, 2190, 2000, 1134]; // sums to 9524 = A4 width − side margins

function cell(text: string, width: number, o: {
  center?: boolean; bold?: boolean; color?: string; size?: number;
  vMerge?: (typeof VerticalMergeType)[keyof typeof VerticalMergeType]; middle?: boolean;
} = {}) {
  return new TableCell({
    width: { size: width, type: WidthType.DXA },
    borders,
    verticalMerge: o.vMerge,
    verticalAlign: o.middle ? VerticalAlign.CENTER : VerticalAlign.TOP,
    margins: { left: 80, right: 80, top: 30, bottom: 30 },
    children: [new Paragraph({
      alignment: o.center ? AlignmentType.CENTER : AlignmentType.LEFT,
      children: [run(text, { bold: o.bold, color: o.color, size: o.size ?? 21 })],
    })],
  });
}

function pageChildren(h: ReportHeader, p: PageData, sample: boolean, first: boolean) {
  const kids: (Paragraph | Table)[] = [];
  kids.push(new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { after: sample ? 60 : 160 },
    children: [...(first ? [] : [new PageBreak()]), run(displayTitle(h, sample), { bold: true, size: 28 })],
  }));
  if (sample) {
    kids.push(new Paragraph({
      alignment: AlignmentType.CENTER, spacing: { after: 120 },
      children: [run(SAMPLE_STAMP, { bold: true, color: "C00000" })],
    }));
  }
  kids.push(new Paragraph({
    alignment: AlignmentType.RIGHT, spacing: { before: 200, after: 280 },
    children: [run(`Date: ${h.date}`)],
  }));
  for (const l of detailLines(h, p)) {
    kids.push(new Paragraph({
      numbering: { reference: "bullets", level: 0 },
      tabStops: [{ type: "left", position: 3600 }],
      children: [run(l.label, { bold: l.bold }), run("\t"), run(l.value, { bold: l.bold })],
    }));
  }
  kids.push(new Paragraph({ children: [], spacing: { after: 120 } }));

  const head = new TableRow({
    tableHeader: true,
    children: ["S.NO.", "Characteristics", "Test method", "Required value", "Observed value", "status"]
      .map((t, i) => cell(t, COLS[i], { center: i >= 2 })),
  });
  const rows = p.rows.map((r, j) => new TableRow({
    cantSplit: true,
    children: [
      cell(String(r.sn), COLS[0]),
      cell(r.characteristic, COLS[1]),
      cell(j === 0 ? h.testAsPer : "", COLS[2], {
        center: true, middle: true, size: 17,
        vMerge: j === 0 ? VerticalMergeType.RESTART : VerticalMergeType.CONTINUE,
      }),
      cell(r.required, COLS[3], { center: true }),
      cell(r.observed, COLS[4], { center: true }),
      cell(r.status, COLS[5], { center: true, bold: r.status === "Not OK", color: r.status === "Not OK" ? "C00000" : undefined }),
    ],
  }));
  kids.push(new Table({ width: { size: 9524, type: WidthType.DXA }, columnWidths: COLS, rows: [head, ...rows] }));

  kids.push(new Paragraph({
    alignment: AlignmentType.RIGHT, spacing: { before: 560 },
    children: [run(h.labName)],
  }));
  if (sample) {
    kids.push(new Paragraph({
      alignment: AlignmentType.RIGHT, spacing: { before: 80 },
      children: [run(SAMPLE_STAMP, { bold: true, color: "C00000", size: 18 })],
    }));
  }
  return kids;
}

export async function buildReportDocx(h: ReportHeader, pipes: ReportPipe[], sample: boolean): Promise<Blob> {
  const pages = pagesFor(pipes);
  const doc = new Document({
    creator: h.labName,
    title: displayTitle(h, sample),
    numbering: {
      config: [{
        reference: "bullets",
        levels: [{
          level: 0, format: LevelFormat.BULLET, text: "•", alignment: AlignmentType.LEFT,
          style: { paragraph: { indent: { left: 720, hanging: 360 } } },
        }],
      }],
    },
    sections: [{
      properties: {
        page: {
          size: { width: PAGE.widthTwips, height: PAGE.heightTwips },
          margin: {
            top: PAGE.twips.top, bottom: PAGE.twips.bottom,
            left: PAGE.twips.side, right: PAGE.twips.side,
            header: PAGE.twips.header, footer: PAGE.twips.footer,
          },
        },
      },
      children: pages.flatMap((p, i) => pageChildren(h, p, sample, i === 0)),
    }],
  });
  return Packer.toBlob(doc);
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = filename;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}
