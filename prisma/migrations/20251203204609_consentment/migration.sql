-- CreateTable
CREATE TABLE "ConsentLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "necessary" BOOLEAN NOT NULL,
    "analytics" BOOLEAN NOT NULL,
    "marketing" BOOLEAN NOT NULL,
    "accepted" BOOLEAN NOT NULL,
    "declined" BOOLEAN NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL,
    "ip" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ConsentLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ConsentLog_createdAt_idx" ON "ConsentLog"("createdAt");

-- CreateIndex
CREATE INDEX "ConsentLog_userId_idx" ON "ConsentLog"("userId");
