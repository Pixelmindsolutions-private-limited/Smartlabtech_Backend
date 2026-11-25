import nodemailer from 'nodemailer';

const ADMIN_EMAIL = 'syam.pixelmindsolutions@gmail.com';

const escapeHtml = (value) => String(value).replace(/[&<>"']/g, (character) => ({
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;'
})[character]);

export const sendFormSubmissionEmail = async (formName, submission) => {
  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS } = process.env;
  const missingSettings = [
    ['SMTP_HOST', SMTP_HOST],
    ['SMTP_PORT', SMTP_PORT],
    ['SMTP_USER', SMTP_USER],
    ['SMTP_PASS', SMTP_PASS]
  ].filter(([, value]) => !value).map(([name]) => name);

  if (missingSettings.length) {
    console.error(`Form submission email not sent; missing configuration: ${missingSettings.join(', ')}`);
    return;
  }

  const details = Object.entries(submission)
    .filter(([, value]) => value !== undefined && value !== null)
    .map(([field, value]) => [field, String(value)]);
  const textDetails = details
    .map(([field, value]) => `${field}: ${value || '-'}`)
    .join('\n');
  const htmlRows = details
    .map(([field, value]) => `
      <tr>
        <th style="padding:12px 16px;text-align:left;vertical-align:top;color:#475569;background:#f8fafc;border-bottom:1px solid #e2e8f0;width:35%;">${escapeHtml(field)}</th>
        <td style="padding:12px 16px;color:#0f172a;border-bottom:1px solid #e2e8f0;white-space:pre-wrap;">${escapeHtml(value || '-')}</td>
      </tr>`)
    .join('');

  try {
    const transporter = nodemailer.createTransport({
      host: SMTP_HOST,
      port: Number(SMTP_PORT),
      secure: process.env.SMTP_SECURE === 'true',
      auth: { user: SMTP_USER, pass: SMTP_PASS }
    });

    await transporter.sendMail({
      from: process.env.SMTP_FROM || SMTP_USER,
      to: process.env.ADMIN_EMAIL || ADMIN_EMAIL,
      subject: `New ${formName} form submission`,
      text: `A new ${formName} form submission was received.\n\n${textDetails}`,
      html: `
        <div style="font-family:Arial,sans-serif;color:#0f172a;max-width:720px;margin:0 auto;">
          <h2 style="margin:0;padding:20px 24px;background:#0f172a;color:#fff;font-size:20px;">New ${escapeHtml(formName)} Submission</h2>
          <p style="margin:20px 0 12px;">A new submission was received with the following details:</p>
          <table style="width:100%;border-collapse:collapse;border:1px solid #e2e8f0;font-size:14px;">
            <tbody>${htmlRows}</tbody>
          </table>
        </div>`
    });
  } catch (error) {
    console.error(`Failed to send ${formName} submission email:`, error);
  }
};
