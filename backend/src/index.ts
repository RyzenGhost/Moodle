// backend/src/index.ts
import express, { Request, Response, NextFunction } from "express";
import { PrismaClient } from "@prisma/client";
import cors, { CorsOptions } from "cors";
import dotenv from "dotenv";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import helmet from "helmet";
import morgan from "morgan";
import rateLimit from "express-rate-limit";
import { z } from "zod";
import nodemailer from "nodemailer";

dotenv.config();

const app = express();
const prisma = new PrismaClient();

// -------------------------- Seguridad / middlewares base --------------------------
app.set("trust proxy", 1);

// Helmet (permitimos descargas CSV desde otros orígenes)
app.use(
  helmet({
    crossOriginResourcePolicy: false,
  })
);

// --- CORS robusto ---
const allowedFromEnv = (process.env.FRONTEND_URL || "http://localhost:5173")
  .split(",")
  .map((s) => s.trim().replace(/\/+$/, ""))
  .filter(Boolean);

const allowVercelPreviews =
  (process.env.ALLOW_VERCEL_PREVIEWS || "false").toLowerCase() === "true";

function isOriginAllowed(origin?: string): boolean {
  if (!origin) return true; // proxy/vercel, curl, server-to-server
  const o = origin.replace(/\/+$/, "");
  if (allowedFromEnv.includes(o)) return true;
  if (allowVercelPreviews && /\.vercel\.app$/.test(o)) return true;
  return false;
}

const corsOptions: CorsOptions = {
  origin(origin, cb) {
    if (isOriginAllowed(origin)) return cb(null, true);
    console.warn("[CORS] Origin NO permitido:", origin, "Permitidos:", allowedFromEnv);
    return cb(new Error("Not allowed by CORS"));
  },
  credentials: true,
  methods: ["GET", "HEAD", "PUT", "PATCH", "POST", "DELETE", "OPTIONS"],
  allowedHeaders: ["Authorization", "Content-Type"],
  exposedHeaders: ["Content-Disposition"],
  optionsSuccessStatus: 200,
};

app.use(cors(corsOptions));
app.options("*", cors(corsOptions));

app.use(express.json());
app.use(morgan(process.env.NODE_ENV === "production" ? "combined" : "dev"));
app.use(rateLimit({ windowMs: 15 * 60 * 1000, max: 300 }));

// -------------------------- Helpers --------------------------
const isUUID = (s: string) => /^[0-9a-fA-F-]{36}$/.test(s);
const isEmail = (s: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);
const clampDay = (n: number) => (Number.isFinite(n) ? Math.max(0, Math.min(6, Math.trunc(n))) : 6);

// -------------------------- Auth helpers --------------------------
const JWT_SECRET = process.env.JWT_SECRET || "dev_secret_change_me";
const QR_SECRET = process.env.QR_SECRET || JWT_SECRET + "_qr";
const DISABLE_ATTENDANCE_WINDOW =
  (process.env.DISABLE_ATTENDANCE_WINDOW || "false").toLowerCase() === "true";

type Role = "STUDENT" | "TEACHER" | "ADMIN";
type JWTPayload = { id: string; email: string; role: Role };

function signToken(payload: JWTPayload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "8h" });
}
function signQrToken(sessionId: string) {
  return jwt.sign({ sessionId }, QR_SECRET, { expiresIn: "5m" });
}
function verifyQrToken(token: string): { sessionId: string } {
  return jwt.verify(token, QR_SECRET) as any;
}

function requireAuth(req: Request, res: Response, next: NextFunction) {
  try {
    const header = req.headers.authorization || "";
    const [, token] = header.split(" ");
    if (!token) return res.status(401).json({ error: "Token requerido" });
    // @ts-ignore
    req.user = jwt.verify(token, JWT_SECRET) as JWTPayload;
    next();
  } catch {
    return res.status(401).json({ error: "Token inválido" });
  }
}
function requireRole(...roles: Role[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    // @ts-ignore
    const user = req.user as JWTPayload | undefined;
    if (!user) return res.status(401).json({ error: "No autenticado" });
    if (!roles.includes(user.role)) return res.status(403).json({ error: "No autorizado" });
    next();
  };
}

// -------------------------- Nodemailer --------------------------
const MAIL_FROM = process.env.FROM_EMAIL || "Soporte <no-reply@localhost>";
const APP_URL = (process.env.APP_URL || allowedFromEnv[0] || "http://localhost:5173").replace(/\/+$/, "");

async function createTransport() {
  if (process.env.SMTP_HOST) {
    return nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT || 587),
      secure: (process.env.SMTP_SECURE || "false") === "true",
      auth: { user: process.env.SMTP_USER!, pass: process.env.SMTP_PASS! },
    });
  } else {
    const testAcc = await nodemailer.createTestAccount();
    return nodemailer.createTransport({
      host: testAcc.smtp.host,
      port: testAcc.smtp.port,
      secure: testAcc.smtp.secure,
      auth: { user: testAcc.user, pass: testAcc.pass },
    });
  }
}

// -------------------------- Zod validate --------------------------
function validate<S extends z.ZodTypeAny>(schema: S) {
  return (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse({ body: req.body, params: req.params, query: req.query });
    if (!result.success) {
      const details = result.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`);
      return res.status(400).json({ error: "Datos inválidos", details });
    }
    (req as any).validated = result.data;
    if ((result.data as any).body !== undefined) req.body = (result.data as any).body;
    next();
  };
}

const RegisterSchema = z.object({
  body: z.object({
    fullName: z.string().min(2),
    email: z.string().email(),
    password: z.string().min(8),
    role: z.enum(["STUDENT", "TEACHER", "ADMIN"]).optional(),
  }),
});
const LoginSchema = z.object({ body: z.object({ email: z.string().email(), password: z.string().min(1) }) });
const ChangePasswordSchema = z.object({ body: z.object({ currentPassword: z.string().min(1), newPassword: z.string().min(8) }) });
const RequestResetSchema = z.object({ body: z.object({ email: z.string().email() }) });
const ResetPasswordSchema = z.object({ body: z.object({ token: z.string().min(10), newPassword: z.string().min(8) }) });

const CourseSchema = z.object({
  body: z.object({
    name: z.string().min(2),
    description: z.string().optional().default(""),
    dayOfWeek: z.coerce.number().int().min(0).max(6),
    startTime: z.coerce.date(),
    endTime: z.coerce.date(),
  }),
});
const CourseUpdateSchema = z.object({
  params: z.object({ id: z.string().uuid() }),
  body: z
    .object({
      name: z.string().min(2).optional(),
      description: z.string().optional(),
      dayOfWeek: z.coerce.number().int().min(0).max(6).optional(),
      startTime: z.coerce.date().optional(),
      endTime: z.coerce.date().optional(),
    })
    .refine((b) => Object.keys(b).length > 0, { message: "Nada que actualizar" }),
});
const IdParamSchema = z.object({ params: z.object({ id: z.string().uuid() }) });

// Sesiones: el front envía ISO "Z" ya normalizado
const SessionSchema = z.object({
  body: z.object({
    courseId: z.string().uuid(),
    sessionDate: z.coerce.date(),
    startAt: z.coerce.date(),
    endAt: z.coerce.date(),
  }),
});
const SessionUpdateSchema = z.object({
  params: z.object({ id: z.string().uuid() }),
  body: z
    .object({
      sessionDate: z.coerce.date().optional(),
      startAt: z.coerce.date().optional(),
      endAt: z.coerce.date().optional(),
    })
    .refine((b) => Object.keys(b).length > 0, { message: "Nada que actualizar" }),
});

const EnrollmentSchema = z.object({ body: z.object({ userId: z.string().uuid(), courseId: z.string().uuid() }) });

const AttendanceCreateSchema = z.object({
  body: z.object({
    sessionId: z.string().uuid(),
    userId: z.string().uuid().optional(),
    userEmail: z.string().email().optional(),
    status: z.string().optional(),
    checkinAt: z.coerce.date().optional(),
  }),
});

// -------------------------- AUTH --------------------------
app.post("/auth/register", validate(RegisterSchema), async (req, res) => {
  try {
    const { fullName, email, password, role } = req.body;
    const passwordHash = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({ data: { fullName, email, role: (role || "STUDENT") as Role, passwordHash } });
    const token = signToken({ id: user.id, email: user.email, role: user.role as Role });
    res.json({ user: { id: user.id, fullName: user.fullName, email: user.email, role: user.role }, token });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/auth/login", validate(LoginSchema), async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !user.passwordHash) return res.status(401).json({ error: "Credenciales inválidas" });
    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) return res.status(401).json({ error: "Credenciales inválidas" });
    const token = signToken({ id: user.id, email: user.email, role: user.role as Role });
    res.json({ user: { id: user.id, fullName: user.fullName, email: user.email, role: user.role }, token });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/auth/me", requireAuth, async (req, res) => {
  // @ts-ignore
  const me = req.user as JWTPayload;
  const user = await prisma.user.findUnique({ where: { id: me.id } });
  if (!user) return res.status(404).json({ error: "Usuario no encontrado" });
  res.json({ id: user.id, fullName: user.fullName, email: user.email, role: user.role });
});

app.post("/auth/change-password", requireAuth, validate(ChangePasswordSchema), async (req, res) => {
  try {
    // @ts-ignore
    const me = req.user as JWTPayload;
    const { currentPassword, newPassword } = req.body;
    const user = await prisma.user.findUnique({ where: { id: me.id } });
    if (!user || !user.passwordHash) return res.status(400).json({ error: "Usuario inválido" });
    const ok = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!ok) return res.status(401).json({ error: "Contraseña actual incorrecta" });
    const newHash = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({ where: { id: me.id }, data: { passwordHash: newHash } });
    res.json({ ok: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// -------------------------- USERS --------------------------
app.post("/users", requireAuth, requireRole("TEACHER", "ADMIN"), async (req, res) => {
  try {
    const { fullName, email, role } = req.body;
    if (!fullName || !email || !isEmail(email)) return res.status(400).json({ error: "fullName y email válidos son requeridos" });
    const user = await prisma.user.create({ data: { fullName, email, role } });
    res.json(user);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/users", requireAuth, requireRole("TEACHER", "ADMIN"), async (_req, res) => {
  try {
    const users = await prisma.user.findMany({ include: { enrollments: true, attendances: true } });
    res.json(users);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/users/:id", requireAuth, requireRole("TEACHER", "ADMIN"), validate(IdParamSchema), async (req, res) => {
  try {
    const { id } = (req as any).validated.params;
    const user = await prisma.user.findUnique({
      where: { id },
      include: { enrollments: { include: { course: true } }, attendances: true },
    });
    if (!user) return res.status(404).json({ error: "Usuario no encontrado" });
    res.json(user);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.put("/users/:id", requireAuth, requireRole("TEACHER", "ADMIN"), validate(IdParamSchema), async (req, res) => {
  try {
    const { id } = (req as any).validated.params;
    const { fullName, email, role } = req.body;
    if (email && !isEmail(email)) return res.status(400).json({ error: "email inválido" });
    const updated = await prisma.user.update({ where: { id }, data: { fullName, email, role } });
    res.json(updated);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.delete("/users/:id", requireAuth, requireRole("TEACHER", "ADMIN"), validate(IdParamSchema), async (req, res) => {
  try {
    const { id } = (req as any).validated.params;
    await prisma.user.delete({ where: { id } });
    res.json({ ok: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// -------------------------- COURSES --------------------------
app.post("/courses", requireAuth, requireRole("TEACHER", "ADMIN"), validate(CourseSchema), async (req, res) => {
  try {
    const { name, description, dayOfWeek, startTime, endTime } = req.body;
    const course = await prisma.course.create({
      data: { name, description, dayOfWeek: clampDay(Number(dayOfWeek)), startTime, endTime },
    });
    res.json(course);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/courses", requireAuth, async (req, res) => {
  try {
    // @ts-ignore
    const me = req.user as JWTPayload;
    if (me.role === "STUDENT") {
      const enrollments = await prisma.enrollment.findMany({ where: { userId: me.id }, include: { course: true } });
      return res.json(enrollments.map((e) => e.course));
    }
    const courses = await prisma.course.findMany({ include: { enrollments: true, sessions: true } });
    res.json(courses);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/courses/:id", requireAuth, validate(IdParamSchema), async (req, res) => {
  try {
    const { id } = (req as any).validated.params;
    const course = await prisma.course.findUnique({
      where: { id },
      include: { enrollments: { include: { user: true } }, sessions: true },
    });
  if (!course) return res.status(404).json({ error: "Curso no encontrado" });
    res.json(course);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.put("/courses/:id", requireAuth, requireRole("TEACHER", "ADMIN"), validate(CourseUpdateSchema), async (req, res) => {
  try {
    const { id } = (req as any).validated.params;
    const { name, description, dayOfWeek, startTime, endTime } = (req as any).validated.body;
    const updated = await prisma.course.update({
      where: { id },
      data: {
        name,
        description,
        dayOfWeek: dayOfWeek !== undefined ? clampDay(Number(dayOfWeek)) : undefined,
        startTime,
        endTime,
      },
    });
    res.json(updated);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.delete("/courses/:id", requireAuth, requireRole("TEACHER", "ADMIN"), validate(IdParamSchema), async (req, res) => {
  try {
    const { id } = (req as any).validated.params;
    await prisma.course.delete({ where: { id } });
    res.json({ ok: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// -------------------------- SESSIONS --------------------------
app.post("/sessions", requireAuth, requireRole("TEACHER", "ADMIN"), validate(SessionSchema), async (req, res) => {
  try {
    const { courseId, sessionDate, startAt, endAt } = req.body;
    const session = await prisma.session.create({ data: { courseId, sessionDate, startAt, endAt } });
    res.json(session);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/sessions", requireAuth, async (req, res) => {
  try {
    // @ts-ignore
    const me = req.user as JWTPayload;
    if (me.role === "STUDENT") {
      const enrollments = await prisma.enrollment.findMany({ where: { userId: me.id }, select: { courseId: true } });
      const courseIds = enrollments.map((e) => e.courseId);
      const sessions = await prisma.session.findMany({
        where: { courseId: { in: courseIds.length ? courseIds : ["00000000-0000-0000-0000-000000000000"] } },
        include: { course: true },
        orderBy: { sessionDate: "asc" },
      });
      return res.json(sessions);
    }
    const sessions = await prisma.session.findMany({
      include: { course: true, attendance: true },
      orderBy: { sessionDate: "asc" },
    });
    res.json(sessions);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/sessions/:id", requireAuth, validate(IdParamSchema), async (req, res) => {
  try {
    const { id } = (req as any).validated.params;
    const session = await prisma.session.findUnique({
      where: { id },
      include: { course: true, attendance: { include: { user: true } } },
    });
    if (!session) return res.status(404).json({ error: "Sesión no encontrada" });
    res.json(session);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.put("/sessions/:id", requireAuth, requireRole("TEACHER", "ADMIN"), validate(SessionUpdateSchema), async (req, res) => {
  try {
    const { id } = (req as any).validated.params;
    const { sessionDate, startAt, endAt } = (req as any).validated.body;
    const updated = await prisma.session.update({ where: { id }, data: { sessionDate, startAt, endAt } });
    res.json(updated);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.delete("/sessions/:id", requireAuth, requireRole("TEACHER", "ADMIN"), validate(IdParamSchema), async (req, res) => {
  try {
    const { id } = (req as any).validated.params;
    await prisma.session.delete({ where: { id } });
    res.json({ ok: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ---- QR endpoints ----
app.get("/sessions/:id/qr", requireAuth, requireRole("TEACHER", "ADMIN"), validate(IdParamSchema), async (req, res) => {
  try {
    const { id } = (req as any).validated.params;
    const session = await prisma.session.findUnique({ where: { id } });
    if (!session) return res.status(404).json({ error: "Sesión no encontrada" });

    const token = signQrToken(id);
    const url = `${APP_URL}/qr-checkin?t=${encodeURIComponent(token)}`;
    res.json({ token, url });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/sessions/:id/qr", requireAuth, requireRole("TEACHER", "ADMIN"), validate(IdParamSchema), async (req, res) => {
  try {
    const { id } = (req as any).validated.params;
    const session = await prisma.session.findUnique({ where: { id } });
    if (!session) return res.status(404).json({ error: "Sesión no encontrada" });

    const token = signQrToken(id);
    const url = `${APP_URL}/qr-checkin?t=${encodeURIComponent(token)}`;
    res.json({ token, url });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/qr/attendance", requireAuth, async (req, res) => {
  try {
    const { token } = req.body as { token: string };
    if (!token) return res.status(400).json({ error: "token requerido" });

    let payload: { sessionId: string };
    try {
      payload = verifyQrToken(token);
    } catch {
      return res.status(400).json({ error: "QR inválido o expirado" });
    }

    // @ts-ignore
    const current = req.user as JWTPayload;
    const session = await prisma.session.findUnique({ where: { id: payload.sessionId } });
    if (!session) return res.status(404).json({ error: "Sesión no existe" });

    const enrolled = await prisma.enrollment.findUnique({
      where: { userId_courseId: { userId: current.id, courseId: session.courseId } },
    });
    const isStaff = current.role === "TEACHER" || current.role === "ADMIN";
    if (!enrolled && !isStaff) return res.status(403).json({ error: "Usuario no inscrito" });

    if (!DISABLE_ATTENDANCE_WINDOW) {
      const now = Date.now();
      const start = new Date(session.startAt).getTime() - 15 * 60 * 1000;
      const end = new Date(session.endAt).getTime() + 15 * 60 * 1000;
      if (now < start || now > end) return res.status(422).json({ error: "Fuera de la ventana de marcación" });
    }

    const exists = await prisma.attendance.findFirst({ where: { sessionId: session.id, userId: current.id } });
    if (exists) return res.status(409).json({ error: "Asistencia ya registrada" });

    const record = await prisma.attendance.create({
      data: { sessionId: session.id, userId: current.id, status: "present", checkinAt: new Date() },
    });
    res.json(record);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// -------------------------- ATTENDANCE (manual) --------------------------
app.post("/attendance", requireAuth, validate(AttendanceCreateSchema), async (req: Request, res: Response) => {
  try {
    const { sessionId, userId, userEmail, status, checkinAt } = req.body;
    // @ts-ignore
    const current = req.user as JWTPayload;

    let resolvedUserId: string | undefined;
    if (current.role === "STUDENT") {
      resolvedUserId = current.id;
    } else {
      if (userId && isUUID(userId)) resolvedUserId = userId;
      else if (userEmail && isEmail(userEmail)) {
        const u = await prisma.user.findUnique({ where: { email: userEmail } });
        if (!u) return res.status(404).json({ error: "Usuario no encontrado por email" });
        resolvedUserId = u.id;
      } else resolvedUserId = current.id;
    }

    const session = await prisma.session.findUnique({ where: { id: sessionId } });
    if (!session) return res.status(404).json({ error: "Sesión no existe" });

    const enrolled = await prisma.enrollment.findUnique({
      where: { userId_courseId: { userId: resolvedUserId!, courseId: session.courseId } },
    });
    const isSelf = resolvedUserId === current.id;
    const isStaff = current.role === "TEACHER" || current.role === "ADMIN";
    if (!enrolled && !(isSelf && isStaff)) return res.status(403).json({ error: "Usuario no inscrito en el curso" });

    if (!DISABLE_ATTENDANCE_WINDOW) {
      const now = checkinAt ? new Date(checkinAt) : new Date();
      const start = new Date(session.startAt).getTime() - 15 * 60 * 1000;
      const end = new Date(session.endAt).getTime() + 15 * 60 * 1000;
      const n = now.getTime();
      if (n < start || n > end) return res.status(422).json({ error: "Fuera de la ventana de marcación" });
    }

    const exists = await prisma.attendance.findFirst({ where: { sessionId, userId: resolvedUserId! } });
    if (exists) return res.status(409).json({ error: "Asistencia ya registrada para este usuario" });

    const attendance = await prisma.attendance.create({
      data: { sessionId, userId: resolvedUserId!, status: status || "present", checkinAt: checkinAt ? new Date(checkinAt) : new Date() },
    });

    res.json(attendance);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/attendance/mine", requireAuth, async (req, res) => {
  // @ts-ignore
  const current = req.user as JWTPayload;
  const records = await prisma.attendance.findMany({
    where: { userId: current.id },
    include: { session: { include: { course: true } } },
    orderBy: { checkinAt: "desc" },
  });
  res.json(records);
});

// -------------------------- Reportes --------------------------
const ReportsQuerySchema = z.object({
  query: z.object({
    courseId: z.string().uuid().optional(),
    from: z.coerce.date().optional(),
    to: z.coerce.date().optional(),
    format: z.enum(["csv", "json"]).optional().default("json"),
    groupBy: z.enum(["student", "course"]).optional().default("student"),
  }),
});

function toCSV<T extends Record<string, any>>(rows: T[]): string {
  if (!rows.length) return "";
  const headers = Object.keys(rows[0]);
  const esc = (v: any) => {
    if (v === null || v === undefined) return "";
    const s = String(v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const lines = [headers.join(","), ...rows.map((r) => headers.map((h) => esc(r[h])).join(","))];
  return lines.join("\n");
}

app.get("/reports/attendance", requireAuth, requireRole("TEACHER", "ADMIN"), validate(ReportsQuerySchema), async (req, res) => {
  try {
    const { courseId, from, to, format } = (req as any).validated.query;
    const where: any = {};
    if (courseId) where.session = { courseId };
    if (from || to) {
      where.checkinAt = {};
      if (from) where.checkinAt.gte = new Date(from);
      if (to) where.checkinAt.lte = new Date(to);
    }
    const records = await prisma.attendance.findMany({
      where,
      include: { user: true, session: { include: { course: true } } },
      orderBy: { checkinAt: "desc" },
    });
    if ((format || "json") === "csv") {
      const rows = records.map((r) => ({
        attendance_id: r.id,
        course: r.session?.course?.name || "",
        course_id: r.session?.courseId,
        session_id: r.sessionId,
        session_date: r.session ? new Date(r.session.sessionDate).toISOString().slice(0, 10) : "",
        start_at: r.session ? new Date(r.session.startAt).toISOString() : "",
        end_at: r.session ? new Date(r.session.endAt).toISOString() : "",
        user: r.user?.fullName || "",
        user_email: r.user?.email || "",
        user_id: r.userId,
        status: r.status,
        checkin_at: r.checkinAt ? new Date(r.checkinAt).toISOString() : "",
      }));
      const csv = toCSV(rows);
      res.setHeader("Content-Type", "text/csv; charset=utf-8");
      res.setHeader("Content-Disposition", `attachment; filename="attendance_${Date.now()}.csv"`);
      return res.send(csv);
    }
    res.json(records);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/reports/summary", requireAuth, requireRole("TEACHER", "ADMIN"), validate(ReportsQuerySchema), async (req, res) => {
  try {
    const { courseId, from, to, groupBy } = (req as any).validated.query;
    const where: any = {};
    if (courseId) where.session = { courseId };
    if (from || to) {
      where.checkinAt = {};
      if (from) where.checkinAt.gte = new Date(from);
      if (to) where.checkinAt.lte = new Date(to);
    }
    const records = await prisma.attendance.findMany({ where, include: { user: true, session: { include: { course: true } } } });

    if (groupBy === "course") {
      const map: Record<string, { courseId: string; course: string; total: number; present: number; absent: number }> = {};
      for (const r of records) {
        const key = r.session?.courseId || "unknown";
        const name = r.session?.course?.name || "—";
        if (!map[key]) map[key] = { courseId: key, course: name, total: 0, present: 0, absent: 0 };
        map[key].total++;
        if ((r.status || "present").toLowerCase() === "present") map[key].present++;
        else map[key].absent++;
      }
      return res.json(Object.values(map));
    }

    const map: Record<string, { userId: string; user: string; email: string; total: number; present: number; absent: number }> = {};
    for (const r of records) {
      const key = r.userId;
      const user = r.user?.fullName || "—";
      const email = r.user?.email || "—";
      if (!map[key]) map[key] = { userId: key, user, email, total: 0, present: 0, absent: 0 };
      map[key].total++;
      if ((r.status || "present").toLowerCase() === "present") map[key].present++;
      else map[key].absent++;
    }
    res.json(Object.values(map));
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// -------------------------- Utilidades --------------------------
app.get("/__health", (_req, res) => res.json({ ok: true, time: new Date().toISOString() }));

// Endpoint de ayuda para depurar CORS
app.get("/__cors-test", (req, res) => {
  res.json({
    ok: true,
    originHeader: req.headers.origin || null,
    allowedFromEnv,
    allowVercelPreviews,
    time: new Date().toISOString(),
  });
});

app.get("/__routes", (_req, res) => {
  const routes: any[] = [];
  const stack: any[] = (app as any)._router?.stack || [];
  stack.forEach((m: any) => {
    if (m.route) {
      routes.push({ path: m.route.path, methods: Object.keys(m.route.methods) });
    } else if (m.name === "router" && m.handle?.stack) {
      m.handle.stack.forEach((h: any) => {
        if (h.route) routes.push({ path: h.route.path, methods: Object.keys(h.route.methods) });
      });
    }
  });
  res.json(routes);
});

app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  console.error("Unhandled error:", err);
  if (!res.headersSent) res.status(500).json({ error: "Error interno del servidor" });
});

// -------------------------- Server --------------------------
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server http://localhost:${PORT}`));

process.on("SIGINT", async () => {
  await prisma.$disconnect();
  process.exit(0);
});
process.on("SIGTERM", async () => {
  await prisma.$disconnect();
  process.exit(0);
});











