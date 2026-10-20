-- Public contact-form submissions become secretariat tickets. They have no
-- account and often no phone, so the reply address is kept on the ticket.
ALTER TABLE "SecretariatTicket" ADD COLUMN "fromEmail" TEXT;
