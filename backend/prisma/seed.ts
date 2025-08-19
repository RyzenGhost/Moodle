import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  // Usuarios base
  const teacher = await prisma.user.upsert({
    where: { email: "prof@demo.com" },
    update: {},
    create: { fullName: "Prof Demo", email: "prof@demo.com", role: "TEACHER" }
  });
  const student = await prisma.user.upsert({
    where: { email: "alumno@demo.com" },
    update: {},
    create: { fullName: "Alumno Demo", email: "alumno@demo.com", role: "STUDENT" }
  });

  // Curso de Ofimática (sábado 9:30–13:00)
  const course = await prisma.course.create({
    data: {
      name: "Ofimática",
      description: "Curso de ofimática (sábados)",
      dayOfWeek: 6, // sábado
      startTime: new Date("2025-01-01T09:30:00Z"),
      endTime: new Date("2025-01-01T13:00:00Z"),
    },
  });

  // Inscribir al alumno
  await prisma.enrollment.create({
    data: { userId: student.id, courseId: course.id }
  });

  // Crear una sesión (pon una fecha de sábado real)
  const session = await prisma.session.create({
    data: {
      courseId: course.id,
      sessionDate: new Date("2025-08-16"), // ejemplo sábado
      startAt: new Date("2025-08-16T09:30:00Z"),
      endAt: new Date("2025-08-16T13:00:00Z"),
    },
  });

  console.log({ teacher, student, course, session });
}

main().finally(() => prisma.$disconnect());
