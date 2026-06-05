const nodemailer = require('nodemailer');

let transporter = null;

async function getTransporter() {
  if (transporter) return transporter;

  if (process.env.SMTP_HOST && process.env.SMTP_USER) {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  } else {
    const testAccount = await nodemailer.createTestAccount();
    transporter = nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass,
      },
    });
    console.log('📧 Usando Ethereal Email para pruebas');
    console.log(`   Usuario: ${testAccount.user}`);
    console.log(`   Contraseña: ${testAccount.pass}`);
    console.log('   Ver emails en: https://ethereal.email/login');
  }

  return transporter;
}

function buildConfirmationHtml(appointment) {
  const servicesList = appointment.services
    .map(s => `<li style="margin:4px 0">${s.name} — ${s.price}€</li>`)
    .join('');

  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family:Arial,sans-serif;background:#0a0a0a;color:#e5e5e5;padding:40px">
  <div style="max-width:600px;margin:0 auto;background:#141414;border-radius:12px;padding:40px;border:1px solid rgba(255,255,255,0.05)">
    <div style="text-align:center;margin-bottom:30px">
      <h1 style="color:#d4a853;font-size:28px;margin:0">Corte Premium</h1>
      <p style="color:#888;font-size:14px">Barbería & Peluquería · Madrid</p>
    </div>
    <h2 style="color:#fff;font-size:20px;margin-bottom:20px">✅ Cita Confirmada</h2>
    <table style="width:100%;font-size:14px">
      <tr><td style="color:#888;padding:6px 0">Fecha</td><td style="color:#fff;padding:6px 0">${appointment.date}</td></tr>
      <tr><td style="color:#888;padding:6px 0">Hora</td><td style="color:#d4a853;padding:6px 0">${appointment.time} h</td></tr>
      <tr><td style="color:#888;padding:6px 0">Barbero</td><td style="color:#fff;padding:6px 0">${appointment.stylist.name}</td></tr>
    </table>
    <div style="margin-top:20px;padding-top:20px;border-top:1px solid rgba(255,255,255,0.05)">
      <p style="color:#888;font-size:14px;margin-bottom:10px">Servicios:</p>
      <ul style="list-style:none;padding:0;margin:0;font-size:14px">${servicesList}</ul>
      <p style="margin-top:12px;font-size:16px;color:#d4a853;font-weight:bold">Total: ${appointment.totalPrice}€</p>
    </div>
    <div style="margin-top:20px;padding-top:20px;border-top:1px solid rgba(255,255,255,0.05);font-size:12px;color:#666">
      <p>Datos del cliente: ${appointment.client.name} · ${appointment.client.email} · ${appointment.client.phone}</p>
      ${appointment.client.notes ? `<p>Notas: ${appointment.client.notes}</p>` : ''}
    </div>
    <div style="margin-top:30px;text-align:center;font-size:12px;color:#444">
      <p>Corte Premium · Madrid · ${new Date().getFullYear()}</p>
    </div>
  </div>
</body>
</html>`;
}

async function sendConfirmation(appointment) {
  const t = await getTransporter();
  const info = await t.sendMail({
    from: '"Corte Premium" <noreply@cortepremium.com>',
    to: appointment.client.email,
    subject: '✅ Tu cita en Corte Premium ha sido confirmada',
    html: buildConfirmationHtml(appointment),
  });

  if (process.env.SMTP_HOST) {
    console.log(`📧 Email enviado a ${appointment.client.email}: ${info.messageId}`);
  } else {
    const previewUrl = nodemailer.getTestMessageUrl(info);
    console.log(`📧 Email de prueba: ${previewUrl}`);
  }

  return info;
}

module.exports = { sendConfirmation };
