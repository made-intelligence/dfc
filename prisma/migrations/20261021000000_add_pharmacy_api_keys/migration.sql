-- Each partner pharmacy gets its own API key in place of the shared
-- PHARMACY_API_KEY, so the key identifies the pharmacy and one can be revoked
-- alone. Only a SHA-256 of the key is stored.
ALTER TABLE "PartnerPharmacy" ADD COLUMN "apiKeyHash" TEXT;
ALTER TABLE "PartnerPharmacy" ADD COLUMN "apiKeyPrefix" TEXT;
ALTER TABLE "PartnerPharmacy" ADD COLUMN "apiKeyIssuedAt" TIMESTAMP(3);

CREATE UNIQUE INDEX "PartnerPharmacy_apiKeyHash_key" ON "PartnerPharmacy"("apiKeyHash");
