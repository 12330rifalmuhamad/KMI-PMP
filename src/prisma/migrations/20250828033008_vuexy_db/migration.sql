-- CreateEnum
CREATE TYPE "ColumnType" AS ENUM ('TEXT', 'PERSON', 'STATUS', 'DATE');

-- CreateTable
CREATE TABLE "mWorkspace" (
    "intWorkspace_ID" BIGSERIAL NOT NULL,
    "txtWorkspaceName" TEXT NOT NULL,
    "dtmInserted" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "txtInsertedBy" TEXT,
    "dtmUpdated" TIMESTAMP(3),
    "txtUpdatedBy" TEXT,
    "bitActive" INTEGER DEFAULT 1,

    CONSTRAINT "mWorkspace_pkey" PRIMARY KEY ("intWorkspace_ID")
);

-- CreateTable
CREATE TABLE "mUser" (
    "intUser_ID" BIGSERIAL NOT NULL,
    "txtUserName" TEXT NOT NULL,
    "txtEmail" TEXT NOT NULL,
    "txtPasswordHash" TEXT NOT NULL,
    "dtmInserted" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "txtInsertedBy" TEXT,
    "dtmUpdated" TIMESTAMP(3),
    "txtUpdatedBy" TEXT,
    "bitActive" INTEGER DEFAULT 1,

    CONSTRAINT "mUser_pkey" PRIMARY KEY ("intUser_ID")
);

-- CreateTable
CREATE TABLE "mBoard" (
    "intBoard_ID" BIGSERIAL NOT NULL,
    "intWorkspace_ID" BIGINT NOT NULL,
    "txtBoardName" TEXT NOT NULL,
    "txtDescription" TEXT,
    "dtmInserted" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "txtInsertedBy" TEXT,
    "dtmUpdated" TIMESTAMP(3),
    "txtUpdatedBy" TEXT,
    "bitActive" INTEGER DEFAULT 1,

    CONSTRAINT "mBoard_pkey" PRIMARY KEY ("intBoard_ID")
);

-- CreateTable
CREATE TABLE "mGroup" (
    "intGroup_ID" BIGSERIAL NOT NULL,
    "intBoard_ID" BIGINT NOT NULL,
    "txtGroupName" TEXT NOT NULL,
    "txtGroupColor" TEXT DEFAULT '#579BFC',
    "intSortOrder" INTEGER DEFAULT 0,
    "dtmInserted" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "txtInsertedBy" TEXT,
    "dtmUpdated" TIMESTAMP(3),
    "txtUpdatedBy" TEXT,
    "bitActive" INTEGER DEFAULT 1,

    CONSTRAINT "mGroup_pkey" PRIMARY KEY ("intGroup_ID")
);

-- CreateTable
CREATE TABLE "mBoardColumn" (
    "intColumn_ID" BIGSERIAL NOT NULL,
    "intBoard_ID" BIGINT NOT NULL,
    "txtColumnName" TEXT NOT NULL,
    "txtColumnType" "ColumnType" NOT NULL,
    "intSortOrder" INTEGER DEFAULT 0,
    "dtmInserted" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "txtInsertedBy" TEXT,
    "dtmUpdated" TIMESTAMP(3),
    "txtUpdatedBy" TEXT,
    "bitActive" INTEGER DEFAULT 1,

    CONSTRAINT "mBoardColumn_pkey" PRIMARY KEY ("intColumn_ID")
);

-- CreateTable
CREATE TABLE "trWorkspaceMember" (
    "intWorkspaceMember_ID" BIGSERIAL NOT NULL,
    "intWorkspace_ID" BIGINT NOT NULL,
    "intUser_ID" BIGINT NOT NULL,
    "txtRole" TEXT NOT NULL,
    "dtmInserted" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "txtInsertedBy" TEXT,
    "dtmUpdated" TIMESTAMP(3),
    "txtUpdatedBy" TEXT,
    "bitActive" INTEGER DEFAULT 1,

    CONSTRAINT "trWorkspaceMember_pkey" PRIMARY KEY ("intWorkspaceMember_ID")
);

-- CreateTable
CREATE TABLE "trBoardMember" (
    "intBoardMember_ID" BIGSERIAL NOT NULL,
    "intBoard_ID" BIGINT NOT NULL,
    "intUser_ID" BIGINT NOT NULL,
    "txtRole" TEXT NOT NULL,
    "dtmInserted" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "txtInsertedBy" TEXT,
    "dtmUpdated" TIMESTAMP(3),
    "txtUpdatedBy" TEXT,
    "bitActive" INTEGER DEFAULT 1,

    CONSTRAINT "trBoardMember_pkey" PRIMARY KEY ("intBoardMember_ID")
);

-- CreateTable
CREATE TABLE "trTask" (
    "intTask_ID" BIGSERIAL NOT NULL,
    "intGroup_ID" BIGINT NOT NULL,
    "txtTaskTitle" TEXT NOT NULL,
    "intSortOrder" INTEGER DEFAULT 0,
    "dtmInserted" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "txtInsertedBy" TEXT,
    "dtmUpdated" TIMESTAMP(3),
    "txtUpdatedBy" TEXT,
    "bitActive" INTEGER DEFAULT 1,

    CONSTRAINT "trTask_pkey" PRIMARY KEY ("intTask_ID")
);

-- CreateTable
CREATE TABLE "trTaskValue" (
    "intTaskValue_ID" BIGSERIAL NOT NULL,
    "intTask_ID" BIGINT NOT NULL,
    "intColumn_ID" BIGINT NOT NULL,
    "txtValue" TEXT,
    "dtmInserted" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "txtInsertedBy" TEXT,
    "dtmUpdated" TIMESTAMP(3),
    "txtUpdatedBy" TEXT,
    "bitActive" INTEGER DEFAULT 1,

    CONSTRAINT "trTaskValue_pkey" PRIMARY KEY ("intTaskValue_ID")
);

-- CreateTable
CREATE TABLE "trNotification" (
    "intNotification_ID" BIGSERIAL NOT NULL,
    "intUser_ID" BIGINT NOT NULL,
    "txtMessage" TEXT NOT NULL,
    "txtLink" TEXT,
    "bitIsRead" INTEGER DEFAULT 0,
    "dtmInserted" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "txtInsertedBy" TEXT,
    "dtmUpdated" TIMESTAMP(3),
    "txtUpdatedBy" TEXT,
    "bitActive" INTEGER DEFAULT 1,

    CONSTRAINT "trNotification_pkey" PRIMARY KEY ("intNotification_ID")
);

-- CreateTable
CREATE TABLE "trIntegration" (
    "intIntegration_ID" BIGSERIAL NOT NULL,
    "intBoard_ID" BIGINT NOT NULL,
    "txtService" TEXT NOT NULL,
    "txtConfigJson" TEXT,
    "dtmInserted" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "txtInsertedBy" TEXT,
    "dtmUpdated" TIMESTAMP(3),
    "txtUpdatedBy" TEXT,
    "bitActive" INTEGER DEFAULT 1,

    CONSTRAINT "trIntegration_pkey" PRIMARY KEY ("intIntegration_ID")
);

-- CreateTable
CREATE TABLE "logTaskActivity" (
    "intLog_ID" BIGSERIAL NOT NULL,
    "intTask_ID" BIGINT NOT NULL,
    "intUser_ID" BIGINT NOT NULL,
    "txtActionType" TEXT NOT NULL,
    "txtOldValue" TEXT,
    "txtNewValue" TEXT,
    "txtDescription" TEXT,
    "dtmInserted" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "txtInsertedBy" TEXT,
    "dtmUpdated" TIMESTAMP(3),
    "txtUpdatedBy" TEXT,
    "bitActive" INTEGER DEFAULT 1,

    CONSTRAINT "logTaskActivity_pkey" PRIMARY KEY ("intLog_ID")
);

-- CreateIndex
CREATE UNIQUE INDEX "mUser_txtEmail_key" ON "mUser"("txtEmail");

-- CreateIndex
CREATE UNIQUE INDEX "trWorkspaceMember_intWorkspace_ID_intUser_ID_key" ON "trWorkspaceMember"("intWorkspace_ID", "intUser_ID");

-- CreateIndex
CREATE UNIQUE INDEX "trBoardMember_intBoard_ID_intUser_ID_key" ON "trBoardMember"("intBoard_ID", "intUser_ID");

-- CreateIndex
CREATE UNIQUE INDEX "trTaskValue_intTask_ID_intColumn_ID_key" ON "trTaskValue"("intTask_ID", "intColumn_ID");

-- AddForeignKey
ALTER TABLE "mBoard" ADD CONSTRAINT "mBoard_intWorkspace_ID_fkey" FOREIGN KEY ("intWorkspace_ID") REFERENCES "mWorkspace"("intWorkspace_ID") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mGroup" ADD CONSTRAINT "mGroup_intBoard_ID_fkey" FOREIGN KEY ("intBoard_ID") REFERENCES "mBoard"("intBoard_ID") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mBoardColumn" ADD CONSTRAINT "mBoardColumn_intBoard_ID_fkey" FOREIGN KEY ("intBoard_ID") REFERENCES "mBoard"("intBoard_ID") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trWorkspaceMember" ADD CONSTRAINT "trWorkspaceMember_intWorkspace_ID_fkey" FOREIGN KEY ("intWorkspace_ID") REFERENCES "mWorkspace"("intWorkspace_ID") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trWorkspaceMember" ADD CONSTRAINT "trWorkspaceMember_intUser_ID_fkey" FOREIGN KEY ("intUser_ID") REFERENCES "mUser"("intUser_ID") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trBoardMember" ADD CONSTRAINT "trBoardMember_intBoard_ID_fkey" FOREIGN KEY ("intBoard_ID") REFERENCES "mBoard"("intBoard_ID") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trBoardMember" ADD CONSTRAINT "trBoardMember_intUser_ID_fkey" FOREIGN KEY ("intUser_ID") REFERENCES "mUser"("intUser_ID") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trTask" ADD CONSTRAINT "trTask_intGroup_ID_fkey" FOREIGN KEY ("intGroup_ID") REFERENCES "mGroup"("intGroup_ID") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trTaskValue" ADD CONSTRAINT "trTaskValue_intTask_ID_fkey" FOREIGN KEY ("intTask_ID") REFERENCES "trTask"("intTask_ID") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trTaskValue" ADD CONSTRAINT "trTaskValue_intColumn_ID_fkey" FOREIGN KEY ("intColumn_ID") REFERENCES "mBoardColumn"("intColumn_ID") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trNotification" ADD CONSTRAINT "trNotification_intUser_ID_fkey" FOREIGN KEY ("intUser_ID") REFERENCES "mUser"("intUser_ID") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trIntegration" ADD CONSTRAINT "trIntegration_intBoard_ID_fkey" FOREIGN KEY ("intBoard_ID") REFERENCES "mBoard"("intBoard_ID") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "logTaskActivity" ADD CONSTRAINT "logTaskActivity_intTask_ID_fkey" FOREIGN KEY ("intTask_ID") REFERENCES "trTask"("intTask_ID") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "logTaskActivity" ADD CONSTRAINT "logTaskActivity_intUser_ID_fkey" FOREIGN KEY ("intUser_ID") REFERENCES "mUser"("intUser_ID") ON DELETE RESTRICT ON UPDATE CASCADE;
