import express from 'express';
import { PrismaClient } from '@prisma/client';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const prisma = new PrismaClient();

// Middleware
// Configura CORS para permitir peticiones solo desde tu frontend de Vercel
// Asegúrate de que process.env.FRONTEND_URL esté configurado en Vercel
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173'
}));
app.use(express.json()); // Permite al servidor leer JSON en las peticiones

// ------------------------------------
// Rutas de la API
// ------------------------------------

// Ruta de prueba para verificar que el servidor está funcionando
app.get("/", (req, res) => {
  res.send("Servidor de Asistencia funcionando");
});

// ------------------------------------
// Rutas para Usuarios
// ------------------------------------

// POST /users: Crear un nuevo usuario
// Este endpoint podría ser para profesores o estudiantes, dependiendo del 'role'
app.post("/users", async (req, res) => {
  const { fullName, email, role } = req.body;
  try {
    const newUser = await prisma.user.create({
      data: {
        fullName,
        email,
        role,
      },
    });
    res.status(201).json(newUser); // 201 Created
  } catch (error) {
    console.error("Error al crear usuario:", error);
    res.status(500).json({ error: "Error interno del servidor al crear usuario" });
  }
});

// GET /users: Obtener todos los usuarios
app.get("/users", async (req, res) => {
  try {
    const users = await prisma.user.findMany();
    res.json(users);
  } catch (error) {
    console.error("Error al obtener usuarios:", error);
    res.status(500).json({ error: "Error interno del servidor al obtener usuarios" });
  }
});

// ------------------------------------
// Rutas para Cursos
// ------------------------------------

// GET /courses: Obtener todos los cursos
app.get("/courses", async (req, res) => {
  try {
    const courses = await prisma.course.findMany({
      include: {
        sessions: true, // Incluye las sesiones asociadas a cada curso
      },
    });
    res.json(courses);
  } catch (error) {
    console.error("Error al obtener cursos:", error);
    res.status(500).json({ error: "Error interno del servidor al obtener cursos" });
  }
});

// POST /courses: Crear un nuevo curso
// Asume que un profesor creará los cursos
app.post("/courses", async (req, res) => {
  const { name, description, dayOfWeek, startTime, endTime } = req.body;
  try {
    const newCourse = await prisma.course.create({
      data: {
        name,
        description,
        dayOfWeek: parseInt(dayOfWeek), // Asegúrate de que dayOfWeek sea un número
        startTime: new Date(startTime),
        endTime: new Date(endTime),
      },
    });
    res.status(201).json(newCourse);
  } catch (error) {
    console.error("Error al crear el curso:", error);
    res.status(500).json({ error: "Error interno del servidor al crear el curso" });
  }
});

// ------------------------------------
// Rutas para Sesiones
// ------------------------------------

// POST /sessions: Crear una nueva sesión para un curso
app.post("/sessions", async (req, res) => {
  const { courseId, sessionDate, startAt, endAt } = req.body;
  try {
    const newSession = await prisma.session.create({
      data: {
        courseId,
        sessionDate: new Date(sessionDate),
        startAt: new Date(startAt),
        endAt: new Date(endAt),
      },
    });
    res.status(201).json(newSession);
  } catch (error) {
    console.error("Error al crear la sesión:", error);
    res.status(500).json({ error: "Error interno del servidor al crear la sesión" });
  }
});

// GET /courses/:courseId/sessions: Obtener todas las sesiones para un curso específico
app.get("/courses/:courseId/sessions", async (req, res) => {
  const { courseId } = req.params;
  try {
    const sessions = await prisma.session.findMany({
      where: { courseId },
      include: {
        course: true, // Opcional: incluye los datos del curso para cada sesión
        attendance: true, // Opcional: incluye la asistencia de cada sesión
      },
    });
    res.json(sessions);
  } catch (error) {
    console.error("Error al obtener las sesiones del curso:", error);
    res.status(500).json({ error: "Error interno del servidor al obtener las sesiones" });
  }
});


// ------------------------------------
// Rutas para Asistencia
// ------------------------------------

// POST /attendance: Registrar una nueva asistencia
app.post("/attendance", async (req, res) => {
  const { sessionId, userId, status, checkinAt } = req.body;
  try {
    const newAttendance = await prisma.attendance.create({
      data: {
        sessionId,
        userId,
        status,
        checkinAt: new Date(checkinAt),
      },
    });
    res.status(201).json(newAttendance);
  } catch (error) {
    console.error("Error al registrar la asistencia:", error);
    res.status(500).json({ error: "Error interno del servidor al registrar la asistencia" });
  }
});

// GET /sessions/:sessionId/attendance: Obtener todos los registros de asistencia para una sesión
app.get("/sessions/:sessionId/attendance", async (req, res) => {
  const { sessionId } = req.params;
  try {
    const attendanceRecords = await prisma.attendance.findMany({
      where: { sessionId },
      include: {
        user: true, // Incluye los datos del usuario para cada registro de asistencia
      },
    });
    res.json(attendanceRecords);
  } catch (error) {
    console.error("Error al obtener la asistencia de la sesión:", error);
    res.status(500).json({ error: "Error interno del servidor al obtener la asistencia" });
  }
});


// ------------------------------------
// Configuración del Servidor
// ------------------------------------

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});

