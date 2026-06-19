// services/email.service.js
import nodemailer from 'nodemailer';

const createTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT) || 587,
    secure: parseInt(process.env.SMTP_PORT) === 465,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
    connectionTimeout: 10000,
    greetingTimeout: 10000,
    socketTimeout: 15000,
  });
};

/**
 * Sends an email. Never throws — logs and returns result object.
 * Email failure will NOT crash your API response.
 */
export const sendEmail = async ({ to, subject, html, text, attachments = [] }) => {

  // Guard: skip silently if SMTP not configured
  if (
    !process.env.SMTP_USER ||
    !process.env.SMTP_PASS ||
    process.env.SMTP_USER === 'your_email@gmail.com'
  ) {
    console.warn(`📧 [EMAIL SKIPPED] SMTP not configured.`);
    console.warn(`   To: ${to} | Subject: ${subject}`);
    console.warn(`   → Set SMTP_USER and SMTP_PASS in your .env file`);
    return { skipped: true, reason: 'SMTP not configured' };
  }

  try {
    const transporter = createTransporter();

    const info = await transporter.sendMail({
      from: process.env.EMAIL_FROM || `BillFlow Pro <${process.env.SMTP_USER}>`,
      to,
      subject,
      html,
      text: text || html.replace(/<[^>]*>/g, ''),
      attachments,
    });

    console.log(`📧 [EMAIL SENT] ${info.messageId} → To: ${to}`);
    return { success: true, messageId: info.messageId };

  } catch (error) {
    // Never throw — email failure must NOT crash the API
    console.error(`📧 [EMAIL FAILED] ${error.message}`);
    return { failed: true, error: error.message };
  }
};

/**
 * Pre-built HTML email templates for each document type
 */
export const emailTemplates = {

  quotation: (quotation, companyName) => ({
    subject: `Quotation ${quotation.quotationNumber} from ${companyName}`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto">
        <div style="background:#2563eb;padding:24px;border-radius:8px 8px 0 0">
          <h2 style="color:#fff;margin:0">${companyName}</h2>
        </div>
        <div style="background:#f8fafc;padding:24px;border:1px solid #e2e8f0;border-radius:0 0 8px 8px">
          <p>Dear <strong>${quotation.client?.name}</strong>,</p>
          <p>Please find attached quotation <strong>${quotation.quotationNumber}</strong>.</p>
          <table style="width:100%;border-collapse:collapse;margin:16px 0">
            <tr>
              <td style="padding:8px;color:#64748b">Quotation No.</td>
              <td style="padding:8px;font-weight:bold">${quotation.quotationNumber}</td>
            </tr>
            <tr style="background:#fff">
              <td style="padding:8px;color:#64748b">Date</td>
              <td style="padding:8px">${quotation.quotationDate}</td>
            </tr>
            <tr>
              <td style="padding:8px;color:#64748b">Valid Until</td>
              <td style="padding:8px">${quotation.validUntil || 'N/A'}</td>
            </tr>
            <tr style="background:#fff">
              <td style="padding:8px;color:#64748b">Total Amount</td>
              <td style="padding:8px;font-weight:bold;color:#2563eb">
                &#8377;${parseFloat(quotation.totalAmount || 0).toLocaleString('en-IN')}
              </td>
            </tr>
          </table>
          <p>Please review and revert with your confirmation.</p>
          <p style="color:#64748b;font-size:13px">
            This is an auto-generated email from BillFlow Pro.
          </p>
        </div>
      </div>
    `,
  }),

proformaInvoice: (pi, companyName) => {
    const itemRows = (pi.items || []).map((item, i) => `
        <tr style="${i % 2 === 0 ? '' : 'background:#fff'}">
            <td style="padding:8px;border-bottom:1px solid #e2e8f0">${item.description || '-'}</td>
            <td style="padding:8px;border-bottom:1px solid #e2e8f0;text-align:center">${item.quantity} ${item.unit || ''}</td>
            <td style="padding:8px;border-bottom:1px solid #e2e8f0;text-align:right">&#8377;${parseFloat(item.unitPrice || 0).toLocaleString('en-IN')}</td>
            <td style="padding:8px;border-bottom:1px solid #e2e8f0;text-align:right;font-weight:bold">&#8377;${parseFloat(item.totalPrice || 0).toLocaleString('en-IN')}</td>
        </tr>
    `).join('');

    return {
        subject: `Proforma Invoice ${pi.piNumber} from ${companyName}`,
        html: `
          <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto">
            <div style="background:#7c3aed;padding:24px;border-radius:8px 8px 0 0">
              <h2 style="color:#fff;margin:0">${companyName}</h2>
            </div>
            <div style="background:#f8fafc;padding:24px;border:1px solid #e2e8f0;border-radius:0 0 8px 8px">
              <p>Dear <strong>${pi.client?.name}</strong>,</p>
              <p>Please find attached Proforma Invoice <strong>${pi.piNumber}</strong>.</p>

              ${itemRows ? `
              <table style="width:100%;border-collapse:collapse;margin:16px 0">
                <thead>
                  <tr style="background:#ede9fe">
                    <td style="padding:8px;font-weight:bold;color:#64748b">Description</td>
                    <td style="padding:8px;font-weight:bold;color:#64748b;text-align:center">Qty</td>
                    <td style="padding:8px;font-weight:bold;color:#64748b;text-align:right">Rate</td>
                    <td style="padding:8px;font-weight:bold;color:#64748b;text-align:right">Amount</td>
                  </tr>
                </thead>
                <tbody>${itemRows}</tbody>
              </table>
              ` : ''}

              <table style="width:100%;border-collapse:collapse;margin:16px 0">
                <tr>
                  <td style="padding:8px;color:#64748b">PI Number</td>
                  <td style="padding:8px;font-weight:bold">${pi.piNumber}</td>
                </tr>
                <tr style="background:#fff">
                  <td style="padding:8px;color:#64748b">Date</td>
                  <td style="padding:8px">${pi.piDate}</td>
                </tr>
                <tr>
                  <td style="padding:8px;color:#64748b">Total Amount</td>
                  <td style="padding:8px;font-weight:bold;color:#7c3aed">
                    &#8377;${parseFloat(pi.totalAmount || 0).toLocaleString('en-IN')}
                  </td>
                </tr>
                <tr style="background:#fff">
                  <td style="padding:8px;color:#64748b">Amount Due</td>
                  <td style="padding:8px;font-weight:bold;color:#dc2626">
                    &#8377;${parseFloat(pi.dueAmount || 0).toLocaleString('en-IN')}
                  </td>
                </tr>
              </table>
              <p>Kindly arrange the advance payment to initiate the project.</p>
              <p style="color:#64748b;font-size:13px">
                This is an auto-generated email from BillFlow Pro.
              </p>
            </div>
          </div>
        `,
    };
},
  finalInvoice: (invoice, companyName) => ({
    subject: `Invoice ${invoice.invoiceNumber} from ${companyName}`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto">
        <div style="background:#059669;padding:24px;border-radius:8px 8px 0 0">
          <h2 style="color:#fff;margin:0">${companyName}</h2>
        </div>
        <div style="background:#f8fafc;padding:24px;border:1px solid #e2e8f0;border-radius:0 0 8px 8px">
          <p>Dear <strong>${invoice.client?.name}</strong>,</p>
          <p>Please find attached Invoice <strong>${invoice.invoiceNumber}</strong>.</p>
          <table style="width:100%;border-collapse:collapse;margin:16px 0">
            <tr>
              <td style="padding:8px;color:#64748b">Invoice No.</td>
              <td style="padding:8px;font-weight:bold">${invoice.invoiceNumber}</td>
            </tr>
            <tr style="background:#fff">
              <td style="padding:8px;color:#64748b">Invoice Date</td>
              <td style="padding:8px">${invoice.invoiceDate}</td>
            </tr>
            <tr>
              <td style="padding:8px;color:#64748b">Due Date</td>
              <td style="padding:8px;color:#dc2626">${invoice.dueDate || 'N/A'}</td>
            </tr>
            <tr style="background:#fff">
              <td style="padding:8px;color:#64748b">Total Amount</td>
              <td style="padding:8px;font-weight:bold">
                &#8377;${parseFloat(invoice.totalAmount || 0).toLocaleString('en-IN')}
              </td>
            </tr>
            <tr>
              <td style="padding:8px;color:#64748b">Balance Due</td>
              <td style="padding:8px;font-weight:bold;color:#dc2626">
                &#8377;${parseFloat(invoice.dueAmount || 0).toLocaleString('en-IN')}
              </td>
            </tr>
          </table>
          <p>Please make the payment by the due date to avoid late charges.</p>
          <p style="color:#64748b;font-size:13px">
            This is an auto-generated email from BillFlow Pro.
          </p>
        </div>
      </div>
    `,
  }),

  paymentReceipt: (payment, companyName) => ({
    subject: `Payment Receipt ${payment.paymentNumber} — ${companyName}`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto">
        <div style="background:#0891b2;padding:24px;border-radius:8px 8px 0 0">
          <h2 style="color:#fff;margin:0">${companyName}</h2>
        </div>
        <div style="background:#f8fafc;padding:24px;border:1px solid #e2e8f0;border-radius:0 0 8px 8px">
          <p>Dear <strong>${payment.client?.name}</strong>,</p>
          <p>We have received your payment. Thank you!</p>
          <table style="width:100%;border-collapse:collapse;margin:16px 0">
            <tr>
              <td style="padding:8px;color:#64748b">Receipt No.</td>
              <td style="padding:8px;font-weight:bold">${payment.paymentNumber}</td>
            </tr>
            <tr style="background:#fff">
              <td style="padding:8px;color:#64748b">Date</td>
              <td style="padding:8px">${payment.paymentDate}</td>
            </tr>
            <tr>
              <td style="padding:8px;color:#64748b">Amount Received</td>
              <td style="padding:8px;font-weight:bold;color:#059669">
                &#8377;${parseFloat(payment.amount || 0).toLocaleString('en-IN')}
              </td>
            </tr>
            <tr style="background:#fff">
              <td style="padding:8px;color:#64748b">Payment Mode</td>
              <td style="padding:8px;text-transform:capitalize">
                ${(payment.paymentMode || '').replace('_', ' ')}
              </td>
            </tr>
            <tr>
              <td style="padding:8px;color:#64748b">Reference No.</td>
              <td style="padding:8px">${payment.referenceNumber || 'N/A'}</td>
            </tr>
          </table>
          <p style="color:#64748b;font-size:13px">
            This is an auto-generated email from BillFlow Pro.
          </p>
        </div>
      </div>
    `,
  }),

};