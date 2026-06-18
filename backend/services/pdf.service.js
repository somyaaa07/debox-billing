// services/pdf.service.mjs

import PDFDocument from 'pdfkit';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname  = dirname(__filename);

const getCompanyInfo = () => ({
  name: 'DEBOX TECHNOLOGY',
  gst: '09EXPK2999M1ZB',
  address: 'Your Company Address, City, State - PIN',
  phone: '+91 00000 00000',
  email: process.env.SMTP_USER || 'info@company.com',
  website: process.env.COMPANY_WEBSITE || 'www.company.com',
  logoPath: join(__dirname, '../assests/logo.png'),  // ← fixed
});
const formatCurrency = (amount) =>
  `₹${parseFloat(amount || 0).toLocaleString('en-IN', {
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
  .lineTo(W, 0)
  .lineTo(W, 45)
  .bezierCurveTo(
      W * 0.85, 60,
      W * 0.55, 18,
      W * 0.32, 16
  )
  .bezierCurveTo(
      W * 0.18, 14,
      W * 0.08, 28,
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
  doc.fillColor(TEXT_DARK).fontSize(8.5).font('Helvetica-Bold')
     .text(`GSTIN- ${company.gst}`, contactX, cy, { width: 200 });
  cy += lineH + 4;

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
  doc.save();

  doc
    .strokeColor(BLUE)
    .lineWidth(2.4)
    .lineCap('round')
    .lineJoin('round');

  // Receiver body
  doc
    .moveTo(iconCX - 4, iconCY - 5)
    .quadraticCurveTo(iconCX - 7, iconCY - 4, iconCX - 5.5, iconCY - 1)

    .quadraticCurveTo(iconCX - 3, iconCY + 2, iconCX + 1, iconCY + 5)

    .quadraticCurveTo(iconCX + 4, iconCY + 7, iconCX + 6, iconCY + 4)
    .stroke();

  // Top receiver end
  doc
    .moveTo(iconCX - 5.2, iconCY - 5.5)
    .lineTo(iconCX - 3.5, iconCY - 4)
    .stroke();

  // Bottom receiver end
  doc
    .moveTo(iconCX + 5.2, iconCY + 5.5)
    .lineTo(iconCX + 3.5, iconCY + 4)
    .stroke();

  doc.restore();
}else if (icon === 'email') {
      doc.rect(iconCX - 6, iconCY - 4, 12, 9).stroke(BLUE);
      doc.moveTo(iconCX - 6, iconCY - 4).lineTo(iconCX, iconCY + 1)
         .lineTo(iconCX + 6, iconCY - 4).stroke(BLUE);
    } else if (icon === 'globe') {
      doc.circle(iconCX, iconCY, 6).stroke(BLUE);
      doc.ellipse(iconCX, iconCY, 3, 6).stroke(BLUE);
      doc.moveTo(iconCX - 6, iconCY).lineTo(iconCX + 6, iconCY).stroke(BLUE);
    } else if (icon === 'pin') {
      doc.circle(iconCX, iconCY - 1, 5).fill(BLUE);
      doc.moveTo(iconCX - 3, iconCY + 2).lineTo(iconCX, iconCY + 8)
         .lineTo(iconCX + 3, iconCY + 2).fill(BLUE);
    }

    doc.fillColor(TEXT_DARK).fontSize(8.5).font('Helvetica')
       .text(text, contactX + 16, cy, { width: width || 200 });

    cy += icon === 'pin' ? lineH * 2 : lineH;
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

  // ---------------- BLUE ----------------
  doc.save()
    .moveTo(0, H)
    .lineTo(W, H)
    .lineTo(W, H - 45)
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
     .text('Generated by BillFlow Pro', 0, H - 22, { align: 'center', width: W });
};

// ═══════════════════════════════════════════════════════════════════
//  WATERMARK  –  large faded blue circle + white "D", centre-right
// ═══════════════════════════════════════════════════════════════════
const drawWatermark = (doc) => {
  const W = doc.page.width;
  const H = doc.page.height;
  doc.save().opacity(0.045);
  // doc.circle(W * 0.60, H * 0.52, 160).fill(BLUE);
  doc.fillColor(BLUE).fontSize(600).font('Helvetica-Bold')
     .text('D', W * 0.38 - 85, H * 0.50 - 107, { lineBreak: false });
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
  let y = yStart;

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



  doc.fillColor(BLUE).fontSize(7.5).font('Helvetica-Bold')
     .text('BILL TO', 52, yStart + 10, { characterSpacing: 1.2 });

  doc.moveTo(52, yStart + 22).lineTo(52 + boxW - 26, yStart + 22)
     .strokeColor('#c8d8f0').lineWidth(0.5).stroke();

  doc.fillColor(TEXT_DARK).fontSize(11).font('Helvetica-Bold')
     .text(client?.name || 'N/A', 52, yStart + 27);

  doc.fontSize(9).font('Helvetica').fillColor(TEXT_MID)
     .text(client?.company || '', 52, yStart + 42)
     .text(client?.billingAddress || '', 52, yStart + 54, { width: 230 });

  if (client?.gstNumber) {
    doc.fillColor(TEXT_LIGHT).fontSize(8.5)
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

  doc.rect(40, yStart, tableW, headerH).fill(BLUE);
  headers.forEach((h, i) => {
    doc.fillColor(WHITE).fontSize(8).font('Helvetica-Bold')
       .text(h, colX[i] + 4, yStart + 7, { width: colWidths[i] - 8 });
  });

  let y = yStart + headerH;
  items.forEach((item, idx) => {
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
  const bandY = doc.page.height - 148;

  doc.moveTo(40, bandY).lineTo(555, bandY)
     .strokeColor('#e2e8f0').lineWidth(0.7).stroke();

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
       .text(termsAndConditions, 250, bandY + 19, { width: 240 });
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

// ═══════════════════════════════════════════════════════════════════
//  PDF GENERATORS  (business logic unchanged — only layout order)
// ═══════════════════════════════════════════════════════════════════

export const generateQuotationPdf = async (quotation) => {
  const doc     = new PDFDocument({ margin: 40, size: 'A4' });
  const company = getCompanyInfo();

  setupPage(doc);
  drawWatermark(doc);
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
  const doc     = new PDFDocument({ margin: 40, size: 'A4' });
  const company = getCompanyInfo();

  setupPage(doc);
  drawWatermark(doc);
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
  const doc     = new PDFDocument({ margin: 40, size: 'A4' });
  const company = getCompanyInfo();

  setupPage(doc);
  drawWatermark(doc);
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
  const doc     = new PDFDocument({ margin: 40, size: 'A4', autoFirstPage: true });
  const company = getCompanyInfo();

  setupPage(doc);
  drawWatermark(doc);
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

// ── Payment Details block — center me ──────────────────
const blockW = 500;
const blockX = (doc.page.width - blockW) / 2; // center

doc.roundedRect(blockX, y, blockW, 150, 4).fillAndStroke('#f4f8ff', '#c8d8f0');

doc.fillColor(TEXT_DARK).fontSize(15).font('Helvetica-Bold')
   .text('Payment Details', blockX, y + 14, { width: blockW, align: 'center' });

const details = [
  ['Payment Number',   payment.paymentNumber],
  ['Payment Date',     formatDate(payment.paymentDate)],
  ['Payment Mode',     payment.paymentMode?.replace('_', ' ').toUpperCase()],
  ['Reference Number', payment.referenceNumber || 'N/A'],
  ['Against Invoice',  payment.finalInvoice?.invoiceNumber || 'Advance Payment'],
];

details.forEach(([label, value], i) => {
  doc.fillColor(TEXT_LIGHT).fontSize(12).font('Helvetica')
     .text(label, blockX + 20, y + 38 + i * 19, { width: 180 });
  doc.fillColor(TEXT_DARK).font('Helvetica-Bold')
     .text(value || '', blockX + 160, y + 38 + i * 19, { width: 210 });
});

// ── Amount box — block ke bahar neeche, BLACK, center me ──
const amtBoxW = 200;
const amtBoxX = (doc.page.width - amtBoxW) / 2;
const amtBoxY = y + 160; // block ke thoda neeche

doc.roundedRect(amtBoxX, amtBoxY, amtBoxW, 48, 4).fill(BLACK);
doc.fillColor('#aaaaaa').fontSize(8).font('Helvetica')
   .text('AMOUNT RECEIVED', amtBoxX, amtBoxY + 10, { width: amtBoxW, align: 'center' });
doc.fillColor(WHITE).fontSize(15).font('Helvetica-Bold')
   .text(formatCurrency(payment.amount), amtBoxX, amtBoxY + 24, { width: amtBoxW, align: 'center' });

if (payment.notes) {
  doc.fillColor(TEXT_LIGHT).fontSize(8).font('Helvetica')
     .text(`Notes: ${payment.notes}`, blockX, amtBoxY + 62, { width: blockW, align: 'center' });
}

 

  drawNotesTerms(doc, null, 'Thank you for your payment!');
  drawWaveFooter(doc);

  return docToBuffer(doc);
};