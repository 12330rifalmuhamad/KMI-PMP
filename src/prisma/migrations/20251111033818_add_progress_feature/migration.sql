-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "ColumnType" ADD VALUE 'PROGRESS';
ALTER TYPE "ColumnType" ADD VALUE 'DROPDOWN';
ALTER TYPE "ColumnType" ADD VALUE 'TIMELINE';
ALTER TYPE "ColumnType" ADD VALUE 'FORMULA';
ALTER TYPE "ColumnType" ADD VALUE 'CONNECT';
ALTER TYPE "ColumnType" ADD VALUE 'DOC';

-- DropForeignKey
ALTER TABLE "logTaskActivity" DROP CONSTRAINT "logTaskActivity_intTask_ID_fkey";

-- DropForeignKey
ALTER TABLE "logTaskActivity" DROP CONSTRAINT "logTaskActivity_intUser_ID_fkey";

-- CreateTable
CREATE TABLE "trColumnProgressLink" (
    "id" BIGSERIAL NOT NULL,
    "progressColumnId" BIGINT NOT NULL,
    "statusColumnId" BIGINT NOT NULL,

    CONSTRAINT "trColumnProgressLink_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "trColumnProgressLink_progressColumnId_statusColumnId_key" ON "trColumnProgressLink"("progressColumnId", "statusColumnId");

-- AddForeignKey
ALTER TABLE "logTaskActivity" ADD CONSTRAINT "logTaskActivity_intTask_ID_fkey" FOREIGN KEY ("intTask_ID") REFERENCES "trTask"("intTask_ID") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "logTaskActivity" ADD CONSTRAINT "logTaskActivity_intUser_ID_fkey" FOREIGN KEY ("intUser_ID") REFERENCES "mUser"("intUser_ID") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trColumnProgressLink" ADD CONSTRAINT "trColumnProgressLink_progressColumnId_fkey" FOREIGN KEY ("progressColumnId") REFERENCES "mBoardColumn"("intColumn_ID") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trColumnProgressLink" ADD CONSTRAINT "trColumnProgressLink_statusColumnId_fkey" FOREIGN KEY ("statusColumnId") REFERENCES "mBoardColumn"("intColumn_ID") ON DELETE CASCADE ON UPDATE CASCADE;
