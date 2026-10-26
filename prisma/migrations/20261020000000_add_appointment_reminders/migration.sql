-- Appointment reminder emails are sent once each; these record when.
ALTER TABLE "Appointment" ADD COLUMN "reminderDaySentAt" TIMESTAMP(3);
ALTER TABLE "Appointment" ADD COLUMN "reminderHourSentAt" TIMESTAMP(3);
