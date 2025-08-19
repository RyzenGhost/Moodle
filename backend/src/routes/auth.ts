// src/routes/auth.ts
import { Router } from "express";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import prisma from "../lib/prisma";
import { sendPasswordResetEmail } from "../lib/mailer";

const router = Router();

/**
 * POST /auth/request-password-reset
 * body: { email: string }
 */
router.post("/request-password-reset", async (req, res) => {
  const { email } = req.body ?? {};
  if (!email || typeof email !== "string") {
    return res.status(400).json({ error: "Email inválido" });
  }

  const user = await prisma.user.findUnique({ where: { email } });
  // Para no revelar si existe o no, devolvemos ok siempre
  if (!user) return res.json({ ok: true });

  const rawToken = crypto.randomBytes(32).toString("hex");
  const tokenHash = crypto.createHash("sha256").update(rawToken).digest("hex");
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hora

  // invalida tokens previos no usados
  await prisma.passwordReset.updateMany({
    where: { userId: user.id, used: false, expiresAt: { gt: new Date() } },
    data: { used: true },
  });

  await prisma.passwordReset.create({
    data: { userId: user.id, tokenHash, expiresAt },
  });

  await sendPasswordResetEmail(user.email, user.fullName, rawToken);

  return res.json({ ok: true });
});

/**
 * POST /auth/reset-password
 * body: { token: string, newPassword: string }
 */
router.post("/reset-password", async (req, res) => {
  const { token, newPassword } = req.body ?? {};
  if (!token || typeof token !== "string" || !newPassword || String(newPassword).length < 8) {
    return res.status(400).json({ error: "Datos inválidos" });
  }

  const tokenHash = crypto.createHash("sha256").update(token).digest("hex");

  const pr = await prisma.passwordReset.findFirst({
    where: { tokenHash, used: false, expiresAt: { gt: new Date() } },
    include: { user: true },
  });

  if (!pr || !pr.user) {
    return res.status(400).json({ error: "Token inválido o expirado" });
  }

  const hash = await bcrypt.hash(newPassword, 10);

  await prisma.$transaction([
    prisma.user.update({ where: { id: pr.userId }, data: { passwordHash: hash } }),
    prisma.passwordReset.update({ where: { id: pr.id }, data: { used: true } }),
  ]);

  return res.json({ ok: true });
});

export default router;

