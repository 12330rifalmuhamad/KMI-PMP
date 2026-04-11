-- CreateTable
CREATE TABLE "trTaskUpdate" (
    "intUpdate_ID" BIGSERIAL NOT NULL,
    "intTask_ID" BIGINT NOT NULL,
    "intUser_ID" BIGINT NOT NULL,
    "txtUpdateText" TEXT NOT NULL,
    "dtmInserted" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "txtInsertedBy" TEXT,
    "dtmUpdated" TIMESTAMP(3),
    "txtUpdatedBy" TEXT,
    "bitActive" INTEGER DEFAULT 1,

    CONSTRAINT "trTaskUpdate_pkey" PRIMARY KEY ("intUpdate_ID")
);

-- AddForeignKey
ALTER TABLE "trTaskUpdate" ADD CONSTRAINT "trTaskUpdate_intTask_ID_fkey" FOREIGN KEY ("intTask_ID") REFERENCES "trTask"("intTask_ID") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trTaskUpdate" ADD CONSTRAINT "trTaskUpdate_intUser_ID_fkey" FOREIGN KEY ("intUser_ID") REFERENCES "mUser"("intUser_ID") ON DELETE CASCADE ON UPDATE CASCADE;
