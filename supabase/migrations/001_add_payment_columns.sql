-- Migration: Add payment columns to trips table and create app_config table
-- Run this migration against your Supabase database

-- Add payment-related columns to trips table
ALTER TABLE trips ADD COLUMN IF NOT EXISTS payment_status TEXT DEFAULT 'unpaid'
  CHECK (payment_status IN ('unpaid', 'pending', 'paid', 'failed'));
ALTER TABLE trips ADD COLUMN IF NOT EXISTS stripe_checkout_session_id TEXT;
ALTER TABLE trips ADD COLUMN IF NOT EXISTS stripe_payment_intent_id TEXT;
ALTER TABLE trips ADD COLUMN IF NOT EXISTS paid_at TIMESTAMPTZ;
ALTER TABLE trips ADD COLUMN IF NOT EXISTS payment_amount_cents INTEGER;

-- Create app_config table for dynamic pricing
CREATE TABLE IF NOT EXISTS app_config (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default pricing configuration
INSERT INTO app_config (key, value) VALUES
  ('trip_generation_price', '{"amount_cents": 2997, "currency": "usd", "description": "AI Trip Path Generation"}')
ON CONFLICT (key) DO NOTHING;

-- Create index for faster payment status lookups
CREATE INDEX IF NOT EXISTS idx_trips_payment_status ON trips(payment_status);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for app_config updated_at
DROP TRIGGER IF EXISTS update_app_config_updated_at ON app_config;
CREATE TRIGGER update_app_config_updated_at
  BEFORE UPDATE ON app_config
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
