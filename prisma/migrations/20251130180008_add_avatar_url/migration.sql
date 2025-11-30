/*
  Warnings:

  - You are about to drop the column `email` on the `Student` table. All the data in the column will be lost.
  - Added the required column `nameFather` to the `Student` table without a default value. This is not possible if the table is not empty.
  - Added the required column `nameMother` to the `Student` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "Student_email_idx";

-- DropIndex
DROP INDEX "Student_email_key";

-- AlterTable
ALTER TABLE "Student" DROP COLUMN "email",
ADD COLUMN     "nameFather" TEXT NOT NULL,
ADD COLUMN     "nameMother" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "avatarUrl" TEXT;
