-- Add Janua multi-provider billing fields to tenants table
-- Supports Conekta for MX, Polar for international billing

ALTER TABLE "tenants" ADD COLUMN IF NOT EXISTS "janua_customer_id" TEXT;
ALTER TABLE "tenants" ADD COLUMN IF NOT EXISTS "billing_provider" TEXT;
ALTER TABLE "tenants" ADD COLUMN IF NOT EXISTS "country_code" TEXT;
ALTER TABLE "tenants" ADD COLUMN IF NOT EXISTS "billing_email" TEXT;

-- Add unique constraint on janua_customer_id
CREATE UNIQUE INDEX IF NOT EXISTS "tenants_janua_customer_id_key" ON "tenants"("janua_customer_id");
