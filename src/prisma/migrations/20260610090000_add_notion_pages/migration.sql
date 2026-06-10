-- CreateTable
CREATE TABLE "mNotionPage" (
    "intNotionPage_ID" BIGSERIAL NOT NULL,
    "intUser_ID" BIGINT NOT NULL,
    "txtNotionPageTitle" TEXT NOT NULL DEFAULT 'New page',
    "txtNotionPageIcon" TEXT,
    "txtNotionPageCoverUrl" TEXT,
    "txtNotionPageCoverPosition" TEXT DEFAULT 'center',
    "bitIsFavorite" INTEGER DEFAULT 0,
    "intSortOrder" INTEGER DEFAULT 0,
    "dtmInserted" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "txtInsertedBy" TEXT,
    "dtmUpdated" TIMESTAMP(3),
    "txtUpdatedBy" TEXT,
    "bitActive" INTEGER DEFAULT 1,

    CONSTRAINT "mNotionPage_pkey" PRIMARY KEY ("intNotionPage_ID")
);

-- CreateTable
CREATE TABLE "trNotionPageBlock" (
    "intNotionBlock_ID" BIGSERIAL NOT NULL,
    "intNotionPage_ID" BIGINT NOT NULL,
    "txtNotionBlockType" TEXT NOT NULL DEFAULT 'paragraph',
    "txtNotionBlockContent" TEXT,
    "txtNotionBlockMetadataJson" TEXT,
    "txtNotionBlockColor" TEXT DEFAULT 'default',
    "bitIsChecked" INTEGER DEFAULT 0,
    "intSortOrder" INTEGER DEFAULT 0,
    "dtmInserted" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "txtInsertedBy" TEXT,
    "dtmUpdated" TIMESTAMP(3),
    "txtUpdatedBy" TEXT,
    "bitActive" INTEGER DEFAULT 1,

    CONSTRAINT "trNotionPageBlock_pkey" PRIMARY KEY ("intNotionBlock_ID")
);

-- CreateTable
CREATE TABLE "trNotionPageComment" (
    "intNotionComment_ID" BIGSERIAL NOT NULL,
    "intNotionPage_ID" BIGINT NOT NULL,
    "intUser_ID" BIGINT NOT NULL,
    "txtNotionCommentContent" TEXT NOT NULL,
    "dtmInserted" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "txtInsertedBy" TEXT,
    "dtmUpdated" TIMESTAMP(3),
    "txtUpdatedBy" TEXT,
    "bitActive" INTEGER DEFAULT 1,

    CONSTRAINT "trNotionPageComment_pkey" PRIMARY KEY ("intNotionComment_ID")
);

-- CreateIndex
CREATE INDEX "mNotionPage_intUser_ID_bitActive_idx" ON "mNotionPage"("intUser_ID", "bitActive");

-- CreateIndex
CREATE INDEX "trNotionPageBlock_intNotionPage_ID_bitActive_intSortOrder_idx" ON "trNotionPageBlock"("intNotionPage_ID", "bitActive", "intSortOrder");

-- CreateIndex
CREATE INDEX "trNotionPageComment_intNotionPage_ID_bitActive_dtmInserted_idx" ON "trNotionPageComment"("intNotionPage_ID", "bitActive", "dtmInserted");

-- AddForeignKey
ALTER TABLE "mNotionPage" ADD CONSTRAINT "mNotionPage_intUser_ID_fkey" FOREIGN KEY ("intUser_ID") REFERENCES "mUser"("intUser_ID") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trNotionPageBlock" ADD CONSTRAINT "trNotionPageBlock_intNotionPage_ID_fkey" FOREIGN KEY ("intNotionPage_ID") REFERENCES "mNotionPage"("intNotionPage_ID") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trNotionPageComment" ADD CONSTRAINT "trNotionPageComment_intNotionPage_ID_fkey" FOREIGN KEY ("intNotionPage_ID") REFERENCES "mNotionPage"("intNotionPage_ID") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trNotionPageComment" ADD CONSTRAINT "trNotionPageComment_intUser_ID_fkey" FOREIGN KEY ("intUser_ID") REFERENCES "mUser"("intUser_ID") ON DELETE CASCADE ON UPDATE CASCADE;
