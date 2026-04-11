-- CreateTable
CREATE TABLE "mColumnOption" (
    "intOption_ID" BIGSERIAL NOT NULL,
    "intColumn_ID" BIGINT NOT NULL,
    "txtLabel" TEXT NOT NULL,
    "txtColor" TEXT NOT NULL,
    "intSortOrder" INTEGER DEFAULT 0,
    "dtmInserted" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "txtInsertedBy" TEXT,
    "dtmUpdated" TIMESTAMP(3),
    "txtUpdatedBy" TEXT,
    "bitActive" INTEGER DEFAULT 1,

    CONSTRAINT "mColumnOption_pkey" PRIMARY KEY ("intOption_ID")
);

-- AddForeignKey
ALTER TABLE "mColumnOption" ADD CONSTRAINT "mColumnOption_intColumn_ID_fkey" FOREIGN KEY ("intColumn_ID") REFERENCES "mBoardColumn"("intColumn_ID") ON DELETE CASCADE ON UPDATE CASCADE;
