/*
  Warnings:

  - A unique constraint covering the columns `[sessionId,userId]` on the table `Attendance` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "Attendance_sessionId_userId_key" ON "public"."Attendance"("sessionId", "userId");
