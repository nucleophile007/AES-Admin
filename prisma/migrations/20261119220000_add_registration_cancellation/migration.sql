ALTER TABLE "WebinarRegistration"
ADD COLUMN "cancelled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "cancellationReason" TEXT,
ADD COLUMN "cancelledAt" TIMESTAMP(3),
ADD COLUMN "cancelledBy" TEXT;
