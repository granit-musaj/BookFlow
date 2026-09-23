-- AlterEnum
ALTER TYPE "NotificationType" ADD VALUE 'BOOKING_REMINDER';

-- AlterTable
ALTER TABLE "notifications" ADD COLUMN "offset_minutes" INTEGER;

-- One reminder per user/booking/offset (offset_minutes is only set on reminder rows)
CREATE UNIQUE INDEX "notifications_reminder_dedupe_idx"
  ON "notifications" ("booking_id", "user_id", "offset_minutes")
  WHERE "offset_minutes" IS NOT NULL
    AND "booking_id" IS NOT NULL;
