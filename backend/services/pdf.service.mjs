// services/pdf.service.mjs

import PDFDocument from 'pdfkit';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { existsSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname  = dirname(__filename);

const getCompanyInfo = () => ({
  name: 'DEBOX TECHNOLOGY',
  gst: '09EXPK2999M1ZB',
  address: 'Your Company Address, City, State - PIN',
  phone: '+91 00000 00000',
  email: process.env.SMTP_USER || 'info@company.com',
  website: process.env.COMPANY_WEBSITE || 'www.company.com',
  logoPath: join(__dirname, '../assests/logo.png'), 
    logoPath1: join(__dirname, '../assests/logo1.png'),  // ← fixed
 // ← fixed
});

// NOTE: PDFKit's built-in Helvetica font has no glyph for the Unicode
// rupee sign (₹), so it was silently falling back to a stray glyph
// rendered above the number. Using plain "Rs." text instead renders
// correctly with the standard font everywhere this helper is used.
const formatCurrency = (amount) =>
  `Rs. ${parseFloat(amount || 0).toLocaleString('en-IN', {
    minimumFractionDigits: 2,
  })}`;

const formatDate = (date) =>
  date
    ? new Date(date).toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      })
    : 'N/A';

// ─── Color Palette ─────────────────────────────────────────────────
const BLUE       = '#4795fe';
const BLACK      = '#000000';
const WHITE      = '#ffffff';
const TEXT_DARK  = '#1a1a1a';
const TEXT_MID   = '#444444';
const TEXT_LIGHT = '#888888';

// ─── Icon path data (24x24 viewBox, standard glyph icons) ─────────
// Classic "call" handset glyph
const PHONE_ICON_PATH =
  'M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 ' +
  '1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 ' +
  '0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z';

// Classic "map pin / place" marker glyph (teardrop with hollow circle)
const MAP_PIN_ICON_PATH =
  'M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c' +
  '-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z';

// ═══════════════════════════════════════════════════════════════════
//  HEADER WAVE
//
//  Structure (top of white page):
//   Layer 1 – BLACK outer band: taller S-curve, peaks ~95px at sides
//   Layer 2 – BLUE  inner band: shorter S-curve, peaks ~68px at sides
//   Layer 3 – WHITE separator: 2.5px stroke along black's lower edge
//
//  Below the waves (white area):
//   Left  – logo image (constrained box)
//   Right – GSTIN label + 4 icon rows (phone, email, web, address)
// ═══════════════════════════════════════════════════════════════════
const drawWaveHeader = (doc, company) => {

const W = doc.page.width;

// ---------------- BLUE ----------------
doc.save()
  .moveTo(0, 0)
  .lineTo(W+15, 0)
.lineTo(W, 52)
  .bezierCurveTo(
      W * 0.95, 70,
      W * 0.65, 22,
      W * 0.42, 18
  )
  .bezierCurveTo(
      W * 0.28, 18,
      W * 0.10, 30,
      0, 34
  )
  .closePath()
  .fill(BLUE);
doc.restore();

// ---------------- WHITE SEPARATOR ----------------
doc.save()
  .moveTo(0, 34)
   
  .bezierCurveTo(
      W * 0.08, 28,
      W * 0.18, 14,
      W * 0.32, 16
  )
  .bezierCurveTo(
      W * 0.55, 18,
      W * 0.85, 60,
      W, 45
  )
  .lineTo(W, 50)
  .bezierCurveTo(
      W * 0.85, 65,
      W * 0.55, 23,
      W * 0.32, 21
  )
  .bezierCurveTo(
      W * 0.18, 19,
      W * 0.08, 33,
      0, 39
  )
  .closePath()
  .fill(WHITE);
doc.restore();

// ---------------- BLACK ----------------
// ---------------- BLACK ----------------
doc.save()
  .moveTo(0,90)
  .lineTo(0,90)
  .lineTo(0,40)
  // .lineTo(W,72)
.bezierCurveTo( W * 0.08, 36, W * 0.18, 19, W * 0.32, 21 )
  .bezierCurveTo(
      W * 0.55, 23,
      W * 0.85, 65,
      W, 50
  )
  .lineTo(W, 47)
  .bezierCurveTo(
      W * 0.85, 78,
      W * 0.55, 36,
      W * 0.38, 40
  )
  .bezierCurveTo(
      W * 0.18, 40,
      W * 0.20, 49,
      0, 50
  )
  .closePath()
  .fill(BLACK);
doc.restore();



  // ── Logo: image, constrained to a fixed box ──────────────────
  const logoX = -35;
  const logoY = -50;
  const logoBoxW = 370;
  const logoBoxH = 350;

  doc.save();
  try {
    doc.image(company.logoPath, logoX, logoY - 8, {
      fit: [logoBoxW, logoBoxH],
      align: 'left',
      valign: 'center',
    });
  }    catch (err) {
    console.error('Logo load failed:', err.message); // ← add this
    doc.fillColor(BLUE).fontSize(26).font('Helvetica-Bold')
       .text('', logoX, logoY + 18, { lineBreak: false });
  
  }

  doc.restore();

  // ── Contact block (right side) ───────────────────────────────
  const contactX = doc.page.width - 230;
  let cy = 65;
  const lineH = 18;

  // GSTIN — plain bold text, no icon
  doc.fillColor(TEXT_MID).fontSize(8).font('Helvetica-Bold')
     .text(`GSTIN - ${company.gst}`, contactX, cy+15, { width: 200 });
  cy += lineH + 12;

  const rows = [
    { icon: 'phone',   text: '+91 97084 55757' },
    { icon: 'email',   text: company.email },
    { icon: 'globe',   text: 'https://deboxtechnology.com/' },
    { icon: 'pin',     text: 'Office No. 1529, 15Th Floor, GALAXY DIAMOND PLAZA, SECTOR 4 Greater Noida Line Rd, Greater Noida, Noida, Uttar Pradesh 201016', width: 200 },
  ];

  rows.forEach(({ icon, text, width }, i) => {
    const iconCX = contactX + 6;
    const iconCY = cy + 5;
    doc.fillColor(BLUE);

    if (icon === 'phone') {
      // Classic handset glyph, drawn from real icon path data and
      // scaled/centered onto the icon slot so it reads as an actual
      // phone icon rather than a hand-built approximation.
      const scale = 0.5; 
      const px = iconCX - 12 * scale;
      const py = iconCY - 12 * scale;
      doc.save();
      doc.translate(px, py).scale(scale);
      doc.path(PHONE_ICON_PATH).fill(BLUE);
      doc.restore();
} else if (icon === 'email') {
  // smaller envelope
  doc.rect(iconCX - 5, iconCY - 3.5, 10, 7).stroke(BLUE);
  doc.moveTo(iconCX - 5, iconCY - 3.5)
     .lineTo(iconCX, iconCY)
     .lineTo(iconCX + 5, iconCY - 3.5)
     .stroke(BLUE);

} else if (icon === 'globe') {
  // smaller globe
  doc.circle(iconCX, iconCY, 5).stroke(BLUE);
  doc.ellipse(iconCX, iconCY, 2.5, 5).stroke(BLUE);
  doc.moveTo(iconCX - 5, iconCY)
     .lineTo(iconCX + 5, iconCY)
     .stroke(BLUE);
} else if (icon === 'pin') {
      // Classic map-pin/place marker glyph (teardrop with hollow
      // center), drawn from real icon path data so it reads as an
      // actual map pin rather than a circle-plus-flag approximation.
      const scale = 0.6; 
      const px = iconCX - 12 * scale;
      const py = iconCY - 13 * scale;
      doc.save();
      doc.translate(px, py).scale(scale);
      doc.path(MAP_PIN_ICON_PATH).fill(BLUE);
      doc.restore();
    }

    doc.fillColor(TEXT_DARK).fontSize(8.5).font('Helvetica')
       .text(text, contactX + 16, cy, { width: width || 200 });

    cy += icon === 'pin' ? lineH - 20 : lineH;
  });
};
// ═══════════════════════════════════════════════════════════════════
//  FOOTER WAVE  –  exact mirror of header
//
//  Same three layers, same curve geometry, same fill order
//  (BLUE → WHITE separator → BLACK), just reflected vertically
//  (every y-coordinate becomes H - y) and anchored to the
//  bottom edge of the page instead of the top.
// ═══════════════════════════════════════════════════════════════════
const drawWaveFooter = (doc) => {
  const W = doc.page.width;
  const H = doc.page.height;

  // ---------------- BLUE -------------------
  doc.save()
    .moveTo(0, H)
    .lineTo(W, H)
.lineTo(W, H - 52)
    .bezierCurveTo(
        W * 0.85, H - 60,
        W * 0.55, H - 18,
        W * 0.32, H - 16
    )
    .bezierCurveTo(
        W * 0.18, H - 14,
        W * 0.08, H - 28,
        0, H - 34
    )
    .closePath()
    .fill(BLUE);
  doc.restore();

  // ---------------- WHITE SEPARATOR ----------------
  doc.save()
    .moveTo(0, H - 34)

    .bezierCurveTo(
        W * 0.08, H - 28,
        W * 0.18, H - 14,
        W * 0.32, H - 16
    )
    .bezierCurveTo(
        W * 0.55, H - 18,
        W * 0.85, H - 60,
        W, H - 45
    )
    .lineTo(W, H - 50)
    .bezierCurveTo(
        W * 0.85, H - 65,
        W * 0.55, H - 23,
        W * 0.32, H - 21
    )
    .bezierCurveTo(
        W * 0.18, H - 19,
        W * 0.08, H - 33,
        0, H - 39
    )
    .closePath()
    .fill(WHITE);
  doc.restore();

  // ---------------- BLACK ----------------
  doc.save()
    .moveTo(0, H - 90)
    .lineTo(0, H - 90)
    .lineTo(0, H - 40)
    .bezierCurveTo( W * 0.08, H - 36, W * 0.18, H - 19, W * 0.32, H - 21 )
    .bezierCurveTo(
        W * 0.55, H - 23,
        W * 0.85, H - 65,
        W, H - 50
    )
    .lineTo(W, H - 47)
    .bezierCurveTo(
        W * 0.85, H - 78,
        W * 0.55, H - 36,
        W * 0.38, H - 40
    )
    .bezierCurveTo(
        W * 0.18, H - 40,
        W * 0.20, H - 49,
        0, H - 50
    )
    .closePath()
    .fill(BLACK);
  doc.restore();

  // Credit line
  doc.fillColor(WHITE).fontSize(7).font('Helvetica')
     .text('', 0, H - 22, { align: 'center', width: W });
};

// ═══════════════════════════════════════════════════════════════════
//  WATERMARK  –  faded company-logo image, centered on the page
//
//  NOTE: PDFKit's opacity() only accepts values from 0 (fully
//  transparent) to 1 (fully opaque) — there's no "1.5" setting.
//  Using 0.15 (15%) here for a subtle, non-intrusive watermark.
//  Falls back to the old letterform watermark if the image can't load.
// ═══════════════════════════════════════════════════════════════════
const drawWatermark = (doc, company) => {
  const W = doc.page.width;
  const H = doc.page.height;

  doc.save().opacity(0.09);

  if (existsSync(company.logoPath1)) {
    try {
      doc.image(company.logoPath1, (W - 560) / 2, (H - 450) / 2, {
        fit: [560, 450],
        align: 'center',
        valign: 'center',
      });
    } catch (err) {
      console.error('Watermark image load failed:', err.message);
    }
  }

  doc.restore();
};

// ─── Title block ──────────────────────────────────────────────────
const drawTitleBlock = (doc, title, subtitle) => {
  const W = doc.page.width;
  doc.fillColor(TEXT_DARK).fontSize(17).font('Helvetica-Bold')
     .text(title, 0, 240, { align: 'center', width: W, underline: true });
  if (subtitle) {
    doc.fillColor(TEXT_DARK).fontSize(10.5).font('Helvetica-Bold')
       .text(subtitle, 0, 266, { align: 'center', width: W });
  }
};

// ─── Meta info (right-aligned block) ─────────────────────────────
const drawMeta = (doc, lines, yStart) => {
  const blockX = doc.page.width - 220;   // start of the whole label+value block
  const labelW = 78;                     // fixed label column width
  const valueX = blockX + labelW + 6;    // value column starts right after label
  const valueW = (doc.page.width - 40) - valueX; // value column runs to the page margin
  let y = yStart +20;

  lines.forEach(([label, value]) => {
    if (!value) return;
    doc.fillColor(TEXT_LIGHT).fontSize(9).font('Helvetica')
       .text(`${label}:`, blockX, y, { width: labelW, lineBreak: false });
    doc.fillColor(TEXT_DARK).font('Helvetica-Bold')
       .text(value, valueX, y, { width: valueW, lineBreak: false });
    y += 14;
  });
  return y;
};

// ─── Bill To block ────────────────────────────────────────────────
const drawBillTo = (doc, client, yStart) => {
  const boxW = 260;
  const boxH = 90;



  doc.fillColor(BLUE).fontSize(9).font('Helvetica-Bold')
     .text('BILL TO', 52, yStart + 12, { characterSpacing: 1.2 });

  // doc.moveTo(52, yStart + 22).lineTo(52 + boxW - 26, yStart + 22)
  //    .strokeColor('#c8d8f0').lineWidth(0.5).stroke();

  doc.fillColor(TEXT_DARK).fontSize(11).font('Helvetica-Bold')
     .text(client?.name || 'N/A', 52, yStart + 27);

  doc.fontSize(9).font('Helvetica').fillColor(TEXT_MID)
     .text(client?.company || '', 52, yStart + 42)
     .text(client?.billingAddress || '', 52, yStart + 54, { width: 230 });

  if (client?.gstNumber) {
    doc.fillColor(TEXT_MID).fontSize(8.5)
       .text(`GST: ${client.gstNumber}`, 52, yStart + 80);
  }
};

// ─── Items Table ──────────────────────────────────────────────────
const drawItemsTable = (doc, items, yStart) => {
  const colWidths = [200, 60, 55, 70, 55, 65];
  const colX      = [40, 240, 300, 355, 425, 480];
  const headers   = ['Description', 'HSN', 'Qty', 'Unit Price', 'GST%', 'Amount'];
  const tableW    = 515;
  const headerH   = 22;
  const rowH      = 22;

  // ── NEW: clamp rows so table never pushes past the footer safe zone ──
  const maxTableBottom = doc.page.height - 220; // 160px = footer wave + totals space
  const maxRows = Math.floor((maxTableBottom - yStart - headerH) / rowH);
  const visibleItems = items.slice(0, maxRows);
  // ────────────────────────────────────────────────────────────────────

  doc.rect(40, yStart, tableW, headerH).fill(BLUE);
  headers.forEach((h, i) => {
    doc.fillColor(WHITE).fontSize(8).font('Helvetica-Bold')
       .text(h, colX[i] + 4, yStart + 7, { width: colWidths[i] - 8 });
  });

  let y = yStart + headerH;
  visibleItems.forEach((item, idx) => {   // ← use visibleItems
    doc.rect(40, y, tableW, rowH).fill(idx % 2 === 0 ? '#f4f8ff' : WHITE);
    doc.fillColor(TEXT_DARK).fontSize(8.5).font('Helvetica')
       .text(item.description || '',          colX[0] + 4, y + 6, { width: colWidths[0] - 8 })
       .text(item.hsnCode || '-',             colX[1] + 4, y + 6)
       .text(`${item.quantity}`,              colX[2] + 4, y + 6)
       .text(formatCurrency(item.unitPrice),  colX[3] + 4, y + 6)
       .text(`${item.gstRate}%`,              colX[4] + 4, y + 6)
       .text(formatCurrency(item.totalPrice), colX[5] + 4, y + 6);
    y += rowH;
  });

  doc.rect(40, yStart, tableW, y - yStart).stroke('#c8d8f0');
  colX.slice(1).forEach((cx) => {
    doc.moveTo(cx, yStart).lineTo(cx, y)
       .strokeColor('#c8d8f0').lineWidth(0.5).stroke();
  });
  return y;
};

// ─── Totals block ─────────────────────────────────────────────────
const drawTotals = (doc, data, yStart) => {
  let y = yStart + 12;
  const labelX = 370;
  const valueX = 475;
  const blockW = 78;

  const rows = [
    ['Subtotal', formatCurrency(data.subtotal)],
    ...(data.cgst ? [['CGST', formatCurrency(data.cgst)]] : []),
    ...(data.sgst ? [['SGST', formatCurrency(data.sgst)]] : []),
    ...(data.igst ? [['IGST', formatCurrency(data.igst)]] : []),
    ...(!data.cgst && !data.igst ? [['GST', formatCurrency(data.gstAmount)]] : []),
    ...(parseFloat(data.discount || 0) > 0
      ? [['Discount', `-${formatCurrency(data.discount)}`]] : []),
  ];

  rows.forEach(([label, value]) => {
    doc.fillColor(TEXT_MID).fontSize(9).font('Helvetica')
       .text(label, labelX, y)
       .text(value, valueX, y, { align: 'right', width: blockW });
    y += 15;
  });

  doc.moveTo(labelX, y).lineTo(563, y).strokeColor(BLUE).lineWidth(1).stroke();
  y += 5;

  doc.rect(labelX - 6, y, 200, 24).fill(BLUE);
  doc.fillColor(WHITE).fontSize(11).font('Helvetica-Bold')
     .text('TOTAL', labelX, y + 7)
     .text(formatCurrency(data.totalAmount), valueX, y + 7, { align: 'right', width: blockW });
  y += 30;

  if (parseFloat(data.paidAmount || data.advancePaid || 0) > 0) {
    doc.fillColor('#16a34a').fontSize(9).font('Helvetica')
       .text('Amount Paid', labelX, y)
       .text(formatCurrency(data.paidAmount || data.advancePaid), valueX, y,
             { align: 'right', width: blockW });
    y += 16;

    doc.fillColor('#dc2626').fontSize(10).font('Helvetica-Bold')
       .text('Balance Due', labelX, y)
       .text(formatCurrency(data.dueAmount), valueX, y, { align: 'right', width: blockW });
    y += 16;
  }

  return y;
};

// ─── Notes / Terms band (sits above footer wave) ──────────────────
const drawNotesTerms = (doc, notes, termsAndConditions) => {
  const bandY = doc.page.height - 108;

  // doc.moveTo(60, bandY).lineTo(555, bandY)
  //    .strokeColor('#e2e8f0').lineWidth(0.7).stroke();

  if (notes) {
    doc.fillColor(BLUE).fontSize(8).font('Helvetica-Bold')
       .text('Notes:', 40, bandY + 8);
    doc.fillColor(TEXT_LIGHT).fontSize(8).font('Helvetica')
       .text(notes, 40, bandY + 19, { width: 240 });
  }

  if (termsAndConditions) {
    doc.fillColor(BLUE).fontSize(8).font('Helvetica-Bold')
       .text('Terms & Conditions:', 250, bandY + 8);
    doc.fillColor(TEXT_LIGHT).fontSize(8).font('Helvetica')
       .text(termsAndConditions, 240, bandY + 19, { width: 200 });
  }
};

// ─── Buffer helper ────────────────────────────────────────────────
const docToBuffer = (doc) =>
  new Promise((resolve, reject) => {
    const chunks = [];
    doc.on('data',  (c) => chunks.push(c));
    doc.on('end',   ()  => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);
    doc.end();
  });

// ─── Shared page setup ────────────────────────────────────────────
const setupPage = (doc) => {
  doc.rect(0, 0, doc.page.width, doc.page.height).fill(WHITE);
};
const PAGE_OPTS = {
  size: 'A4',
  margins: { top: 0, bottom: 0, left: 40, right: 40 },
};


// ═══════════════════════════════════════════════════════════════════
//  PDF GENERATORS  (business logic unchanged — only layout order)
// ═══════════════════════════════════════════════════════════════════

export const generateQuotationPdf = async (quotation) => {
const doc = new PDFDocument(PAGE_OPTS);
  const company = getCompanyInfo();

  setupPage(doc);
  drawWatermark(doc, company);
  drawWaveHeader(doc, company);
  drawTitleBlock(doc, 'QUOTATION', quotation.subject || '');

  // Bill-to + meta sit side by side starting at y=295
  drawBillTo(doc, quotation.client, 295);
  drawMeta(doc, [
    ['Quotation No', quotation.quotationNumber],
    ['Date',         formatDate(quotation.quotationDate)],
    ['Valid Until',  formatDate(quotation.validUntil)],
    ['Status',       quotation.status?.toUpperCase()],
    ['Currency',     quotation.currency || 'INR'],
  ], 295);

  const afterItems = drawItemsTable(doc, quotation.items || [], 414);
  drawTotals(doc, quotation, afterItems + 10);
  drawNotesTerms(doc, quotation.notes, quotation.termsAndConditions);
  drawWaveFooter(doc);

  return docToBuffer(doc);
};

export const generateProformaPdf = async (pi) => {
const doc = new PDFDocument(PAGE_OPTS);
  const company = getCompanyInfo();

  setupPage(doc);
  drawWatermark(doc, company);
  drawWaveHeader(doc, company);
  drawTitleBlock(doc, 'PROFORMA INVOICE', pi.subject || '');

  drawBillTo(doc, pi.client, 295);
  drawMeta(doc, [
    ['PI No',       pi.piNumber],
    ['Date',        formatDate(pi.piDate)],
    ['Valid Until', formatDate(pi.validUntil)],
    ['Status',      pi.status?.toUpperCase()],
  ], 295);

  const afterItems = drawItemsTable(doc, pi.items || [], 414);
  drawTotals(doc, pi, afterItems + 10);
  drawNotesTerms(doc, pi.notes, pi.termsAndConditions);
  drawWaveFooter(doc);

  return docToBuffer(doc);
};

export const generateFinalInvoicePdf = async (invoice) => {
const doc = new PDFDocument({ ...PAGE_OPTS, autoFirstPage: true });
  const company = getCompanyInfo();

  setupPage(doc);
  drawWatermark(doc, company);
  drawWaveHeader(doc, company);
  drawTitleBlock(doc, 'TAX INVOICE', invoice.subject || '');

  drawBillTo(doc, invoice.client, 295);
  drawMeta(doc, [
    ['Invoice No', invoice.invoiceNumber],
    ['Date',       formatDate(invoice.invoiceDate)],
    ['Due Date',   formatDate(invoice.dueDate)],
    ['Status',     invoice.status?.toUpperCase()],
  ], 295);

  const afterItems = drawItemsTable(doc, invoice.items || [], 414);
  drawTotals(doc, invoice, afterItems + 10);
  drawNotesTerms(doc, invoice.notes, invoice.termsAndConditions);
  drawWaveFooter(doc);

  return docToBuffer(doc);
};

export const generateReceiptPdf = async (payment) => {
const doc = new PDFDocument(PAGE_OPTS);
  const company = getCompanyInfo();

  setupPage(doc);
  drawWatermark(doc, company);
  drawWaveHeader(doc, company);
  drawTitleBlock(doc, 'PAYMENT RECEIPT', '');

  drawBillTo(doc, payment.client, 295);
  drawMeta(doc, [
    ['Receipt No', payment.paymentNumber],
    ['Date',       formatDate(payment.paymentDate)],
    ['Mode',       payment.paymentMode?.replace('_', ' ').toUpperCase()],
    ['Reference',  payment.referenceNumber || 'N/A'],
  ], 295);

  const y = 414;

  // ── Payment Details block — title + two-column grid, fully centered ──
  // (Surrounding box removed per request — content now sits directly
  // on the page background instead of inside a filled/stroked panel.)
  const blockW = 500;
  const blockX = (doc.page.width - blockW) / 2;
  const blockH = 178;

  doc.fillColor(TEXT_DARK).fontSize(12).font('Helvetica-Bold')
     .text('PAYMENT DETAILS', blockX, y + 16, { width: blockW, align: 'center' , underline: true});

  const details = [
    ['Payment Number:',   payment.paymentNumber],
    ['Payment Date:',     formatDate(payment.paymentDate)],
    ['Payment Mode:',     payment.paymentMode?.replace('_', ' ').toUpperCase()],
    ['Reference Number:', payment.referenceNumber || 'N/A'],
    ['Against Invoice:',  payment.finalInvoice?.invoiceNumber || 'Advance Payment'],
  ];

  // Label column (left-aligned) + value column (right-aligned), separated
  // by a fixed gap, with the whole grid centered inside the block.
  const labelColW = 180;
  const colGap    = 0;
  const valueColW = 120;
  const tableW    = labelColW + colGap + valueColW;
  const tableX    = blockX + (blockW - tableW) / 2;
  const labelX    = tableX;
  const valueX    = tableX + labelColW ;
  const rowH      = 22;
  const detailsY  = y + 54;

  details.forEach(([label, value], i) => {
    const rowY = detailsY + i * rowH;
    doc.fillColor(TEXT_LIGHT).fontSize(9).font('Helvetica')
       .text(label, labelX, rowY, { width: labelColW, align: 'left' });
    doc.fillColor(TEXT_DARK).font('Helvetica-Bold')
       .text(value || '', valueX, rowY, { width: valueColW, align: 'left' });
  });

  // ── Amount box — centered on the page, sitting just below the block ──
  const amtBoxW = 220;
  const amtBoxH = 54;
  const amtBoxX = (doc.page.width - amtBoxW) / 2;
  const amtBoxY = y + blockH + 18;

  doc.roundedRect(amtBoxX, amtBoxY, amtBoxW, amtBoxH, 4).fill(BLUE);
  doc.fillColor('#fff').fontSize(8).font('Helvetica')
     .text('AMOUNT RECEIVED', amtBoxX, amtBoxY + 12, { width: amtBoxW, align: 'center', characterSpacing: 0.6 });
  doc.fillColor(WHITE).fontSize(16).font('Helvetica-Bold')
     .text(formatCurrency(payment.amount), amtBoxX, amtBoxY + 26, { width: amtBoxW, align: 'center' });

  if (payment.notes) {
    doc.fillColor(TEXT_LIGHT).fontSize(8).font('Helvetica')
       .text(`Notes: ${payment.notes}`, blockX, amtBoxY + amtBoxH + 12, { width: blockW, align: 'center' });
  }

  drawNotesTerms(doc, null, 'Thank you for your payment!');
  drawWaveFooter(doc);

  return docToBuffer(doc);
};
