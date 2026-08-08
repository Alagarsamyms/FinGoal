import XLSXStyle from 'xlsx-js-style';

// ─────────────────────────────────────────────────────────────────
// BRAND COLOR PALETTE (ARGB for xlsx-js-style)
// ─────────────────────────────────────────────────────────────────
const C = {
  // Indigo brand (primary)
  indigo600:  '4F46E5',
  indigo500:  '6366F1',
  indigoLight:'EEF2FF',
  // Per-sheet accents
  violet500:  '8B5CF6',
  violetLight:'F5F3FF',
  rose500:    'F43F5E',
  roseLight:  'FFF1F2',
  emerald500: '10B981',
  emeraldLight:'ECFDF5',
  sky500:     '0EA5E9',
  skyLight:   'F0F9FF',
  // Row alternating
  rowAlt:     'F1F5FF',
  rowWhite:   'FFFFFF',
  // Semantic
  green:      '059669',
  red:        'E11D48',
  amber:      'D97706',
  slate600:   '475569',
  slate300:   'CBD5E1',
  slate100:   'F1F5F9',
  white:      'FFFFFF',
  black:      '0F172A',
  // Chat
  userBg:     'EFF6FF',
  aiBg:       'F5F3FF',
};

// ─────────────────────────────────────────────────────────────────
// STYLE BUILDERS
// ─────────────────────────────────────────────────────────────────
const borderThin = (color = C.slate300) => ({
  top:    { style: 'thin',   color: { rgb: color } },
  bottom: { style: 'thin',   color: { rgb: color } },
  left:   { style: 'thin',   color: { rgb: color } },
  right:  { style: 'thin',   color: { rgb: color } },
});

const borderMedium = (color = C.indigo600) => ({
  top:    { style: 'medium', color: { rgb: color } },
  bottom: { style: 'medium', color: { rgb: color } },
  left:   { style: 'medium', color: { rgb: color } },
  right:  { style: 'medium', color: { rgb: color } },
});

const fill = (rgb) => ({ type: 'pattern', patternType: 'solid', fgColor: { rgb } });

const font = (opts = {}) => ({
  name: 'Calibri',
  sz:   opts.sz   ?? 10,
  bold: opts.bold ?? false,
  italic: opts.italic ?? false,
  color: { rgb: opts.color ?? C.black },
});

const align = (h = 'left', v = 'center', wrap = false) => ({
  horizontal: h, vertical: v, wrapText: wrap
});

// Header cell style
const hdrStyle = (bgRgb) => ({
  fill:   fill(bgRgb),
  font:   font({ sz: 10, bold: true, color: C.white }),
  border: borderMedium(bgRgb),
  alignment: align('center', 'center'),
});

// Banner cell style (large title row)
const bannerStyle = (bgRgb) => ({
  fill: fill(bgRgb),
  font: font({ sz: 15, bold: true, color: C.white }),
  alignment: align('left', 'center'),
});

// Sub-banner (subtitle row)
const subBannerStyle = () => ({
  fill: fill(C.indigoLight),
  font: font({ sz: 9, italic: true, color: C.slate600 }),
  alignment: align('left', 'center'),
});

// Section title row
const sectionStyle = (bgRgb = C.indigoLight) => ({
  fill: fill(bgRgb),
  font: font({ sz: 10, bold: true, color: C.indigo600 }),
  border: { bottom: { style: 'medium', color: { rgb: C.indigo600 } } },
  alignment: align('left', 'center'),
});

// Data row cell
const dataStyle = (isAlt, opts = {}) => ({
  fill: fill(isAlt ? C.rowAlt : C.rowWhite),
  font: font({ sz: opts.sz ?? 10, bold: opts.bold ?? false, color: opts.color ?? C.black }),
  border: borderThin(),
  alignment: align(opts.h ?? 'left', 'center', opts.wrap ?? false),
});

// Totals row cell
const totalsStyle = (bgRgb) => ({
  fill: fill(bgRgb),
  font: font({ sz: 10, bold: true, color: C.white }),
  border: borderMedium(bgRgb),
  alignment: align('right', 'center'),
});

// ─────────────────────────────────────────────────────────────────
// WORKSHEET BUILDER HELPERS
// ─────────────────────────────────────────────────────────────────

/**
 * Create a cell object for xlsx-js-style
 */
function cell(value, style, numFmt) {
  const type = typeof value === 'number' ? 'n' : 's';
  const c = { v: value ?? '', t: value === null || value === undefined ? 's' : type, s: style };
  if (numFmt) c.z = numFmt;
  return c;
}

function emptyCell(style) {
  return { v: '', t: 's', s: style || {} };
}

/**
 * Write a 2D array of cell objects into a worksheet object.
 */
function buildWorksheet(rows2d, colWidths) {
  const ws = {};
  let maxCol = 0;

  rows2d.forEach((row, R) => {
    if (row.length > maxCol) maxCol = row.length;
    row.forEach((c, C) => {
      if (!c) { ws[XLSXStyle.utils.encode_cell({ r: R, c: C })] = emptyCell(); return; }
      ws[XLSXStyle.utils.encode_cell({ r: R, c: C })] = c;
    });
  });

  ws['!ref'] = XLSXStyle.utils.encode_range({ s: { r: 0, c: 0 }, e: { r: rows2d.length - 1, c: maxCol - 1 } });
  if (colWidths) ws['!cols'] = colWidths.map(w => ({ wch: w }));

  return ws;
}

/**
 * Build merge list: merge a single row across n columns
 */
function mergeRow(rowIndex, cols) {
  return { s: { r: rowIndex, c: 0 }, e: { r: rowIndex, c: cols - 1 } };
}

// ─────────────────────────────────────────────────────────────────
// NUMBER FORMATS
// ─────────────────────────────────────────────────────────────────
const INR_FMT  = '"₹"#,##0';
const PCT_FMT  = '0.00"%"';

// ─────────────────────────────────────────────────────────────────
// HTML STRIPPER (for AI chat)
// ─────────────────────────────────────────────────────────────────
function stripHtml(html) {
  if (!html) return '';
  return html
    .replace(/<h3[^>]*>/gi, '→ ').replace(/<\/h3>/gi, '\n')
    .replace(/<strong>/gi, '').replace(/<\/strong>/gi, '')
    .replace(/<em>/gi, '').replace(/<\/em>/gi, '')
    .replace(/<li[^>]*>/gi, '• ').replace(/<\/li>/gi, '\n')
    .replace(/<ul[^>]*>|<\/ul>/gi, '\n')
    .replace(/<p[^>]*>/gi, '').replace(/<\/p>/gi, '\n')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&nbsp;/g, ' ')
    .replace(/\n{3,}/g, '\n\n').trim();
}

// ─────────────────────────────────────────────────────────────────
// MAIN EXPORT
// ─────────────────────────────────────────────────────────────────
export const exportToExcel = (state) => {
  // ── Derived totals ─────────────────────────────────────────────
  const income      = parseFloat(state.income) || 0;
  const expenses    = parseFloat(state.expenses) || 0;
  let   totalEmi    = parseFloat(state.emi) || 0;
  let   totalDebt   = 0;
  let   totalSip    = 0;
  let   totalAssets = 0;
  let   totalInv    = 0;

  state.liabilities.forEach(l => {
    totalDebt += parseFloat(l.value || 0);
    if (l.emi) totalEmi += parseFloat(l.emi);
  });
  state.assets.forEach(a => {
    totalAssets += parseFloat(a.currentValue ?? a.value ?? 0);
    totalInv    += parseFloat(a.invested || 0);
    if (a.sip) totalSip += parseFloat(a.sip);
  });

  const netWorth   = totalAssets - totalDebt;
  const surplus    = income - expenses - totalEmi;
  const idleCash   = surplus - totalSip;
  const gainLossAll = totalAssets - totalInv;
  const fiNumber   = (expenses * 12) * 25;
  const dti        = income > 0 ? (totalEmi / income) * 100 : 0;
  const savingsRt  = income > 0 ? (surplus / income) * 100 : 0;
  const fireProgress = fiNumber > 0 ? (totalAssets / fiNumber) * 100 : 0;
  const dateStr    = new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  const wb = XLSXStyle.utils.book_new();

  // ═════════════════════════════════════════════════════════════
  // SHEET 1 — OVERVIEW  (2 cols: Metric | Value | Note)
  // ═════════════════════════════════════════════════════════════
  const OCOLS = 3;
  const overviewMerges = [];
  const overviewRows = [];

  // Helper to push rows
  const oR = (arr) => { overviewRows.push(arr); return overviewRows.length - 1; };
  const oBanner = (title, sub) => {
    overviewMerges.push(mergeRow(oR([cell(title, bannerStyle(C.indigo500))]), OCOLS));
    if (sub) overviewMerges.push(mergeRow(oR([cell(sub, subBannerStyle())]), OCOLS));
    oR([emptyCell()]);
  };
  const oSection = (title) => {
    const idx = oR([cell('  ' + title, sectionStyle(C.indigoLight))]);
    overviewMerges.push(mergeRow(idx, OCOLS));
  };
  const oRow = (metric, value, note, isAlt, numFmt, positiveGreen = false) => {
    const valColor = positiveGreen
      ? (value >= 0 ? C.green : C.red)
      : C.black;
    overviewRows.push([
      cell('  ' + metric, dataStyle(isAlt, { bold: true })),
      cell(value, { ...dataStyle(isAlt, { bold: true, sz: 11, color: valColor, h: 'right' }), ...(numFmt ? { z: numFmt } : {}) }),
      cell(note || '', dataStyle(isAlt, { sz: 9, italic: true, color: C.slate600 })),
    ]);
  };
  const oBlank = () => oR([emptyCell(), emptyCell(), emptyCell()]);

  oBanner('📊  FinGoal OS — Financial Overview', 'Exported on ' + dateStr);

  oSection('💰  Net Worth Summary');
  oRow('Total Assets (Current Market Value)', totalAssets,   'Sum of all asset current values', false, INR_FMT);
  oRow('Total Amount Invested',               totalInv,      'Sum of original invested amounts', true, INR_FMT);
  oRow('Unrealised Gain / Loss',              gainLossAll,   gainLossAll >= 0 ? '🟢 Portfolio in profit' : '🔴 Portfolio at loss', false, INR_FMT, true);
  oRow('Total Debt Outstanding',              totalDebt,     'Sum of all outstanding principals', true, INR_FMT);
  oRow('✨  Net Worth',                       netWorth,      'Total Assets − Total Debt', false, INR_FMT, true);

  oBlank();
  oSection('🔄  Monthly Cash Flow');
  oRow('Monthly Income',                      income,        'Total monthly inflow',                       false, INR_FMT);
  oRow('Monthly Expenses',                    expenses,      'Regular living expenses',                    true,  INR_FMT);
  oRow('Total Loan EMIs',                     totalEmi,      'All EMIs including individual liabilities', false, INR_FMT);
  oRow('Monthly SIP / Investments',           totalSip,      'Systematic investment contributions',         true,  INR_FMT);
  oRow('Monthly Surplus',                     surplus,       'Income − Expenses − EMIs',                  false, INR_FMT, true);
  oRow('Idle Cash (after investments)',        idleCash,      'Surplus remaining after all SIPs',           true,  INR_FMT, true);

  oBlank();
  oSection('📐  Key Ratios & FIRE');
  oRow('Debt-to-Income Ratio',                dti,           dti <= 20 ? '✅ Healthy (<20%)' : dti <= 35 ? '⚠️ Watch this (20–35%)' : '🔴 High risk (>35%)', false, PCT_FMT);
  oRow('Savings Rate',                        savingsRt,     savingsRt >= 30 ? '🟢 Excellent (≥30%)' : savingsRt >= 20 ? '✅ Good (20–30%)' : '⚠️ Needs improvement', true, PCT_FMT, true);
  oRow('FIRE Number (25× Annual Expenses)',   fiNumber,      'Corpus for 4% safe withdrawal rate',        false, INR_FMT);
  oRow('FIRE Progress',                       fireProgress,  `${fireProgress.toFixed(1)}% of corpus accumulated`, true, PCT_FMT, true);

  oBlank();
  const footerIdx = oR([emptyCell(), emptyCell(), cell(`Generated by FinGoal OS · ${new Date().toLocaleString('en-IN')}`, { font: font({ sz: 9, italic: true, color: C.slate600 }), alignment: align('right', 'center') })]);
  overviewMerges.push(mergeRow(footerIdx, OCOLS));

  const ws1 = buildWorksheet(overviewRows, [34, 22, 38]);
  ws1['!merges'] = overviewMerges;
  ws1['!rows'] = overviewRows.map((_, i) => {
    if (i === 0) return { hpt: 34 };
    if (i === 1) return { hpt: 18 };
    return { hpt: 20 };
  });
  XLSXStyle.utils.book_append_sheet(wb, ws1, '📊 Overview');

  // ═════════════════════════════════════════════════════════════
  // SHEET 2 — ASSETS
  // ═════════════════════════════════════════════════════════════
  const ACOLS = 8;
  const assetMerges = [];
  const assetRows = [];

  const aBannerIdx = assetRows.length;
  assetRows.push([cell(`💼  Assets Manager — ${state.assets.length} Asset(s)`, bannerStyle(C.violet500))]);
  assetMerges.push(mergeRow(aBannerIdx, ACOLS));

  const aSubIdx = assetRows.length;
  assetRows.push([cell(`Total Current Value: ₹${totalAssets.toLocaleString('en-IN')}  |  Total Invested: ₹${totalInv.toLocaleString('en-IN')}  |  Overall Gain/Loss: ₹${gainLossAll.toLocaleString('en-IN')}`, subBannerStyle())]);
  assetMerges.push(mergeRow(aSubIdx, ACOLS));

  assetRows.push(Array(ACOLS).fill(emptyCell()));

  // Headers
  const aHdrLabels = ['Asset Name', 'Type', 'Invested (₹)', 'Current Value (₹)', 'Gain / Loss (₹)', 'Return %', 'Monthly SIP (₹)', 'Exp. ROI %'];
  assetRows.push(aHdrLabels.map(l => cell(l, hdrStyle(C.violet500))));

  state.assets.forEach((a, i) => {
    const current  = parseFloat(a.currentValue ?? a.value ?? 0);
    const invested = parseFloat(a.invested || 0);
    const gl       = current - invested;
    const glPct    = invested > 0 ? (gl / invested) * 100 : null;
    const sip      = parseFloat(a.sip || 0);
    const roi      = parseFloat(a.roi || 0);
    const alt      = i % 2 === 0;

    assetRows.push([
      cell(a.name,  dataStyle(alt, { bold: true })),
      cell(a.type,  { fill: fill(alt ? C.violetLight : C.rowWhite), font: font({ sz: 9, bold: true, color: C.violet500 }), border: borderThin(), alignment: align('center', 'center') }),
      cell(invested, { ...dataStyle(alt, { h: 'right' }), z: INR_FMT }),
      cell(current,  { ...dataStyle(alt, { h: 'right', bold: true }), z: INR_FMT }),
      cell(gl,       { ...dataStyle(alt, { h: 'right', bold: true, color: gl >= 0 ? C.green : C.red }), z: INR_FMT }),
      glPct !== null ? cell(glPct, { ...dataStyle(alt, { h: 'right', bold: true, color: glPct >= 0 ? C.green : C.red }), z: PCT_FMT }) : emptyCell(dataStyle(alt)),
      cell(sip,  { ...dataStyle(alt, { h: 'right' }), z: INR_FMT }),
      cell(roi,  { ...dataStyle(alt, { h: 'right' }), z: PCT_FMT }),
    ]);
  });

  if (state.assets.length > 0) {
    assetRows.push(Array(ACOLS).fill(emptyCell()));
    const totalGlPct = totalInv > 0 ? (gainLossAll / totalInv) * 100 : null;
    assetRows.push([
      cell('  TOTALS', { ...totalsStyle(C.indigo600), alignment: align('left', 'center') }),
      emptyCell(totalsStyle(C.indigo600)),
      cell(totalInv,   { ...totalsStyle(C.indigo600), z: INR_FMT }),
      cell(totalAssets, { ...totalsStyle(C.indigo600), z: INR_FMT }),
      cell(gainLossAll, { ...totalsStyle(C.indigo600), z: INR_FMT }),
      totalGlPct !== null ? cell(totalGlPct, { ...totalsStyle(C.indigo600), z: PCT_FMT }) : emptyCell(totalsStyle(C.indigo600)),
      cell(totalSip,   { ...totalsStyle(C.indigo600), z: INR_FMT }),
      emptyCell(totalsStyle(C.indigo600)),
    ]);
  }

  const ws2 = buildWorksheet(assetRows, [28, 16, 20, 22, 20, 12, 18, 12]);
  ws2['!merges'] = assetMerges;
  ws2['!rows'] = [{ hpt: 34 }, { hpt: 18 }, { hpt: 8 }, { hpt: 22 }];
  XLSXStyle.utils.book_append_sheet(wb, ws2, '💼 Assets');

  // ═════════════════════════════════════════════════════════════
  // SHEET 3 — LIABILITIES
  // ═════════════════════════════════════════════════════════════
  const LCOLS = 6;
  const liabMerges = [];
  const liabRows = [];

  const lBannerIdx = liabRows.length;
  liabRows.push([cell(`🔴  Debt Manager — ${state.liabilities.length} Loan(s)`, bannerStyle(C.rose500))]);
  liabMerges.push(mergeRow(lBannerIdx, LCOLS));

  const lSubIdx = liabRows.length;
  liabRows.push([cell(`Total Outstanding: ₹${totalDebt.toLocaleString('en-IN')}  |  Total Monthly EMIs: ₹${totalEmi.toLocaleString('en-IN')}  |  Sorted by highest interest rate`, subBannerStyle())]);
  liabMerges.push(mergeRow(lSubIdx, LCOLS));

  liabRows.push(Array(LCOLS).fill(emptyCell()));

  const lHdrLabels = ['Loan Name', 'Outstanding (₹)', 'Monthly EMI (₹)', 'Interest Rate %', 'Annual Interest Cost', 'Pay-off Priority'];
  liabRows.push(lHdrLabels.map(l => cell(l, hdrStyle(C.rose500))));

  const sortedLiab = [...state.liabilities].sort((a, b) => parseFloat(b.interest || 0) - parseFloat(a.interest || 0));
  sortedLiab.forEach((l, i) => {
    const val      = parseFloat(l.value || 0);
    const emi      = parseFloat(l.emi || 0);
    const rate     = parseFloat(l.interest || 0);
    const annCost  = val * (rate / 100);
    const priority = i === 0 ? '🔴 Pre-close First' : i === 1 ? '🟡 Second Priority' : i === 2 ? '🟠 Third Priority' : '🟢 Can Wait';
    const alt      = i % 2 === 0;

    liabRows.push([
      cell(l.name,   dataStyle(alt, { bold: true })),
      cell(val,      { ...dataStyle(alt, { h: 'right', bold: true, color: C.red }), z: INR_FMT }),
      cell(emi,      { ...dataStyle(alt, { h: 'right' }), z: INR_FMT }),
      cell(rate,     { ...dataStyle(alt, { h: 'right' }), z: PCT_FMT }),
      cell(annCost,  { ...dataStyle(alt, { h: 'right', color: C.red }), z: INR_FMT }),
      cell(priority, dataStyle(alt, { h: 'center' })),
    ]);
  });

  if (state.liabilities.length > 0) {
    const totalAnnInt = state.liabilities.reduce((s, l) => s + parseFloat(l.value || 0) * (parseFloat(l.interest || 0) / 100), 0);
    liabRows.push(Array(LCOLS).fill(emptyCell()));
    liabRows.push([
      cell('  TOTALS', { ...totalsStyle(C.rose500), alignment: align('left', 'center') }),
      cell(totalDebt,    { ...totalsStyle(C.rose500), z: INR_FMT }),
      cell(totalEmi,     { ...totalsStyle(C.rose500), z: INR_FMT }),
      emptyCell(totalsStyle(C.rose500)),
      cell(totalAnnInt,  { ...totalsStyle(C.rose500), z: INR_FMT }),
      emptyCell(totalsStyle(C.rose500)),
    ]);
  }

  const ws3 = buildWorksheet(liabRows, [28, 22, 18, 16, 22, 22]);
  ws3['!merges'] = liabMerges;
  ws3['!rows'] = [{ hpt: 34 }, { hpt: 18 }, { hpt: 8 }, { hpt: 22 }];
  XLSXStyle.utils.book_append_sheet(wb, ws3, '🔴 Debt Manager');

  // ═════════════════════════════════════════════════════════════
  // SHEET 4 — GOALS
  // ═════════════════════════════════════════════════════════════
  const GCOLS = 9;
  const goalMerges = [];
  const goalRows = [];

  const gBannerIdx = goalRows.length;
  goalRows.push([cell(`🎯  Goals Matrix — ${state.goals.length} Goal(s)`, bannerStyle(C.emerald500))]);
  goalMerges.push(mergeRow(gBannerIdx, GCOLS));

  const gSubIdx = goalRows.length;
  goalRows.push([cell('Financial goals with progress tracking, linked assets, and SIP projections', subBannerStyle())]);
  goalMerges.push(mergeRow(gSubIdx, GCOLS));

  goalRows.push(Array(GCOLS).fill(emptyCell()));

  const gHdrLabels = ['Goal Name', 'Target (₹)', 'Saved / Current (₹)', 'Remaining (₹)', 'Progress %', 'Monthly SIP (₹)', 'Target Date', 'ROI %', 'Linked Assets'];
  goalRows.push(gHdrLabels.map(l => cell(l, hdrStyle(C.emerald500))));

  state.goals.forEach((g, i) => {
    let saved = parseFloat(g.saved || 0);
    let linkedStr = 'None';

    if (g.linkedAssets && g.linkedAssets.length > 0) {
      let linkedVal = 0;
      const names = [];
      g.linkedAssets.forEach(link => {
        const asset = state.assets.find(a => a.id === link.assetId);
        if (asset) {
          linkedVal += parseFloat(asset.currentValue ?? asset.value ?? 0) * (link.allocation / 100);
          names.push(`${asset.name} (${link.allocation}%)`);
        }
      });
      saved = linkedVal;
      linkedStr = names.join(' | ');
    }

    const target    = parseFloat(g.target || 0);
    const remaining = Math.max(0, target - saved);
    const progress  = target > 0 ? Math.min(100, (saved / target) * 100) : 0;
    const contrib   = parseFloat(g.contribution || 0);
    const roi       = parseFloat(g.roi || 0);
    const alt       = i % 2 === 0;
    const progColor = progress >= 100 ? C.green : progress >= 50 ? C.amber : C.red;

    goalRows.push([
      cell(g.name,        dataStyle(alt, { bold: true })),
      cell(target,        { ...dataStyle(alt, { h: 'right' }), z: INR_FMT }),
      cell(saved,         { ...dataStyle(alt, { h: 'right', bold: true, color: C.green }), z: INR_FMT }),
      cell(remaining,     { ...dataStyle(alt, { h: 'right', color: C.red }), z: INR_FMT }),
      cell(progress,      { ...dataStyle(alt, { h: 'right', bold: true, color: progColor }), z: PCT_FMT }),
      cell(contrib,       { ...dataStyle(alt, { h: 'right' }), z: INR_FMT }),
      cell(g.targetDate || 'Not Set', dataStyle(alt, { h: 'center' })),
      cell(roi,           { ...dataStyle(alt, { h: 'right' }), z: PCT_FMT }),
      cell(linkedStr,     dataStyle(alt, { sz: 9, color: C.slate600 })),
    ]);
  });

  const ws4 = buildWorksheet(goalRows, [28, 20, 22, 18, 12, 18, 14, 10, 40]);
  ws4['!merges'] = goalMerges;
  ws4['!rows'] = [{ hpt: 34 }, { hpt: 18 }, { hpt: 8 }, { hpt: 22 }];
  XLSXStyle.utils.book_append_sheet(wb, ws4, '🎯 Goals Matrix');

  // ═════════════════════════════════════════════════════════════
  // SHEET 5 — AI CHAT HISTORY (last 20)
  // ═════════════════════════════════════════════════════════════
  const CHATCOLS = 3;
  const chatMerges = [];
  const chatRows = [];

  let allMessages = [];
  try {
    const raw = localStorage.getItem('fingoal_chat_v1');
    if (raw) allMessages = JSON.parse(raw);
  } catch { /* empty */ }

  const msgs = allMessages.filter(m => !m.isWelcome).slice(-20);

  const cBannerIdx = chatRows.length;
  chatRows.push([cell('🤖  AI Advisor — Chat History', bannerStyle(C.sky500))]);
  chatMerges.push(mergeRow(cBannerIdx, CHATCOLS));

  const cSubIdx = chatRows.length;
  chatRows.push([cell(`Last ${Math.min(msgs.length, 20)} messages exported · ${new Date().toLocaleString('en-IN')}`, subBannerStyle())]);
  chatMerges.push(mergeRow(cSubIdx, CHATCOLS));

  chatRows.push(Array(CHATCOLS).fill(emptyCell()));

  if (msgs.length === 0) {
    const noDataIdx = chatRows.length;
    chatRows.push([cell('No chat history found. Open the AI Advisor tab and start a conversation to see it here.', {
      fill: fill(C.skyLight),
      font: font({ sz: 11, italic: true, color: C.slate600 }),
      alignment: align('center', 'center'),
    })]);
    chatMerges.push(mergeRow(noDataIdx, CHATCOLS));
  } else {
    const cHdrLabels = ['Timestamp', 'Speaker', 'Message'];
    chatRows.push(cHdrLabels.map(l => cell(l, hdrStyle(C.sky500))));

    msgs.forEach((msg) => {
      const isUser = msg.role === 'user';
      const timeStr = msg.timestamp
        ? new Date(msg.timestamp).toLocaleString('en-IN', {
            day: '2-digit', month: 'short', year: 'numeric',
            hour: '2-digit', minute: '2-digit'
          })
        : '—';
      const cleanText = isUser ? msg.content : stripHtml(msg.content);
      const msgBg  = isUser ? C.userBg : C.aiBg;
      const lblColor = isUser ? '1D4ED8' : '6D28D9';

      chatRows.push([
        cell(timeStr, {
          fill: fill(msgBg),
          font: font({ sz: 9, color: C.slate600 }),
          border: { ...borderThin(), left: { style: 'medium', color: { rgb: lblColor } } },
          alignment: align('center', 'top'),
        }),
        cell(isUser ? '👤 You' : '🤖 FinGoal AI', {
          fill: fill(msgBg),
          font: font({ sz: 10, bold: true, color: lblColor }),
          border: borderThin(),
          alignment: align('center', 'top'),
        }),
        cell(cleanText, {
          fill: fill(msgBg),
          font: font({ sz: 10, color: C.black }),
          border: borderThin(),
          alignment: { horizontal: 'left', vertical: 'top', wrapText: true, indent: 1 },
        }),
      ]);
    });

    // Footer
    chatRows.push(Array(CHATCOLS).fill(emptyCell()));
    const footIdx = chatRows.length;
    chatRows.push([cell(`Total: ${msgs.length} message(s) from ${allMessages.filter(m => !m.isWelcome).length} in history · FinGoal OS Export`, {
      font: font({ sz: 9, italic: true, color: C.slate600 }),
      alignment: align('right', 'center'),
    })]);
    chatMerges.push(mergeRow(footIdx, CHATCOLS));
  }

  const ws5 = buildWorksheet(chatRows, [22, 16, 100]);
  ws5['!merges'] = chatMerges;
  // Set row heights for chat messages — taller rows for message content
  ws5['!rows'] = chatRows.map((row, i) => {
    if (i === 0) return { hpt: 34 };
    if (i === 1) return { hpt: 18 };
    if (i < 4)   return { hpt: 8 };
    // Message rows: estimate height by text length
    const msgCell = row[2];
    if (msgCell && msgCell.v) {
      const lineCount = Math.max(2, Math.ceil(String(msgCell.v).length / 90));
      return { hpt: Math.min(200, lineCount * 14 + 10) };
    }
    return { hpt: 20 };
  });
  XLSXStyle.utils.book_append_sheet(wb, ws5, '🤖 AI Chat History');

  // ─── Write file ──────────────────────────────────────────────
  const exportDate = new Date().toISOString().split('T')[0];
  XLSXStyle.writeFile(wb, `FinGoal_Report_${exportDate}.xlsx`);
};
