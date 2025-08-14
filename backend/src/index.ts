// src/index.ts
import express from 'express';
import cors from 'cors';
import { PrismaClient } from '@prisma/client';

const app = express();
const prisma = new PrismaClient();

// Middleware
app.use(cors());
app.use(express.json());

// Rutas
app.get("/", (req, res) => {
  res.send("Servidor de asistencia funcionando");
});

// API para obtener todos los cursos
app.get("/courses", async (req, res) => {
  const courses = await prisma.course.findMany();
  res.json(courses);
});

// Configuración básica de puerto
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
