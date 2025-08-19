// src/lib/mailer.ts
import nodemailer from "nodemailer";

const APP_URL   = process.env.APP_URL || "http://localhost:5173";
const FROM_EMAIL = process.env.FROM_EMAIL || "Sistema <no-reply@localhost>";

async function getTransport() {
  // Si configuraste SMTP_* en .env se usa eso; si no, se usa Ethereal (solo dev)
  if (process.env.SMTP_HOST) {
    return nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT || 587),
      secure: String(process.env.SMTP_SECURE || "false") === "true",
      auth: process.env.SMTP_USER && process.env.SMTP_PASS
        ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
        : undefined,
    });
  } else {
    const test = await nodemailer.createTestAccount();
    return nodemailer.createTransport({
      host: test.smtp.host,
      port: test.smtp.port,
      secure: test.smtp.secure,
      auth: { user: test.user, pass: test.pass },
    });
  }
}

export async function sendPasswordResetEmail(to: string, fullName: string | null, rawToken: string) {
  const transporter = await getTransport();
  const resetLink = `${APP_URL}/reset-password/${encodeURIComponent(rawToken)}`;

  const info = await transporter.sendMail({
    from: FROM_EMAIL,
    to,
    subject: "Restablecer contraseña",
    html: `
      <p>Hola ${fullName ?? ""},</p>
      <p>Solicitaste restablecer tu contraseña. Haz clic en el siguiente enlace:</p>
      <p><a href="${resetLink}">${resetLink}</a></p>
      <p>El enlace expira en 1 hora. Si no fuiste tú, ignora este mensaje.</p>
    `,
  });

  // En dev con Ethereal muestra URL de previsualización en consola
  // (no rompe en prod)
  // @ts-ignore
  if (nodemailer.getTestMessageUrl) {
    // @ts-ignore
    const preview = nodemailer.getTestMessageUrl(info);
    if (preview) console.log("📧 Preview URL:", preview);
  }
}
