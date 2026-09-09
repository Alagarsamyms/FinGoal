-- FinGoal OS Master Database Fix & Schema Script for Supabase
-- Copy and run this ENTIRE script in Supabase Dashboard → SQL Editor → New Query

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- STEP 1: DROP ALL OLD/DUPLICATE POLICIES (AUTOMATIC CLEAN SLATE)
-- ============================================================================
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN (
        SELECT policyname, tablename
        FROM pg_policies
        WHERE schemaname = 'public'
    ) LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I;', r.policyname, r.tablename);
    END LOOP;
END $$;

-- ============================================================================
-- STEP 2: CREATE TABLES & FORCE ADD ANY MISSING COLUMNS
-- ============================================================================

-- 1. PROFILES TABLE
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  dob DATE,
  full_name TEXT,
  avatar_url TEXT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS dob DATE;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS full_name TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS avatar_url TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now());
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "profiles_owner_policy" ON public.profiles FOR ALL USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- 2. FINANCIAL SUMMARIES TABLE
CREATE TABLE IF NOT EXISTS public.financial_summaries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  monthly_income NUMERIC DEFAULT 0,
  monthly_expenses NUMERIC DEFAULT 0,
  monthly_emi NUMERIC DEFAULT 0,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);
ALTER TABLE public.financial_summaries ADD COLUMN IF NOT EXISTS monthly_income NUMERIC DEFAULT 0;
ALTER TABLE public.financial_summaries ADD COLUMN IF NOT EXISTS monthly_expenses NUMERIC DEFAULT 0;
ALTER TABLE public.financial_summaries ADD COLUMN IF NOT EXISTS monthly_emi NUMERIC DEFAULT 0;
ALTER TABLE public.financial_summaries ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now());

DELETE FROM public.financial_summaries a WHERE a.ctid NOT IN (SELECT max(b.ctid) FROM public.financial_summaries b GROUP BY b.user_id);
CREATE UNIQUE INDEX IF NOT EXISTS financial_summaries_user_id_idx ON public.financial_summaries (user_id);
ALTER TABLE public.financial_summaries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "financial_summaries_owner_policy" ON public.financial_summaries FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- 3. ASSETS TABLE
CREATE TABLE IF NOT EXISTS public.assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  value NUMERIC DEFAULT 0,
  type TEXT DEFAULT 'Other',
  invested NUMERIC DEFAULT 0,
  sip NUMERIC DEFAULT 0,
  roi NUMERIC DEFAULT 0,
  owner TEXT DEFAULT 'Self',
  auto_grow BOOLEAN DEFAULT true,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);
ALTER TABLE public.assets ADD COLUMN IF NOT EXISTS name TEXT;
ALTER TABLE public.assets ADD COLUMN IF NOT EXISTS value NUMERIC DEFAULT 0;
ALTER TABLE public.assets ADD COLUMN IF NOT EXISTS type TEXT DEFAULT 'Other';
ALTER TABLE public.assets ADD COLUMN IF NOT EXISTS invested NUMERIC DEFAULT 0;
ALTER TABLE public.assets ADD COLUMN IF NOT EXISTS sip NUMERIC DEFAULT 0;
ALTER TABLE public.assets ADD COLUMN IF NOT EXISTS roi NUMERIC DEFAULT 0;
ALTER TABLE public.assets ADD COLUMN IF NOT EXISTS owner TEXT DEFAULT 'Self';
ALTER TABLE public.assets ADD COLUMN IF NOT EXISTS auto_grow BOOLEAN DEFAULT true;
ALTER TABLE public.assets ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now());
ALTER TABLE public.assets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "assets_owner_policy" ON public.assets FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- 4. LIABILITIES TABLE
CREATE TABLE IF NOT EXISTS public.liabilities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  value NUMERIC DEFAULT 0,
  interest_rate NUMERIC DEFAULT 0,
  emi NUMERIC DEFAULT 0,
  type TEXT DEFAULT 'Loan',
  tenure NUMERIC DEFAULT 0,
  original_amount NUMERIC DEFAULT 0,
  first_emi_date DATE,
  owner TEXT DEFAULT 'Self',
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);
ALTER TABLE public.liabilities ADD COLUMN IF NOT EXISTS name TEXT;
ALTER TABLE public.liabilities ADD COLUMN IF NOT EXISTS value NUMERIC DEFAULT 0;
ALTER TABLE public.liabilities ADD COLUMN IF NOT EXISTS interest_rate NUMERIC DEFAULT 0;
ALTER TABLE public.liabilities ADD COLUMN IF NOT EXISTS emi NUMERIC DEFAULT 0;
ALTER TABLE public.liabilities ADD COLUMN IF NOT EXISTS type TEXT DEFAULT 'Loan';
ALTER TABLE public.liabilities ADD COLUMN IF NOT EXISTS tenure NUMERIC DEFAULT 0;
ALTER TABLE public.liabilities ADD COLUMN IF NOT EXISTS original_amount NUMERIC DEFAULT 0;
ALTER TABLE public.liabilities ADD COLUMN IF NOT EXISTS first_emi_date DATE;
ALTER TABLE public.liabilities ADD COLUMN IF NOT EXISTS owner TEXT DEFAULT 'Self';
ALTER TABLE public.liabilities ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now());
ALTER TABLE public.liabilities ENABLE ROW LEVEL SECURITY;
CREATE POLICY "liabilities_owner_policy" ON public.liabilities FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- 5. GOALS TABLE
CREATE TABLE IF NOT EXISTS public.goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  target_amount NUMERIC DEFAULT 0,
  saved_amount NUMERIC DEFAULT 0,
  monthly_contribution NUMERIC DEFAULT 0,
  expected_roi NUMERIC DEFAULT 8,
  target_date DATE,
  linked_assets JSONB DEFAULT '[]',
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);
ALTER TABLE public.goals ADD COLUMN IF NOT EXISTS name TEXT;
ALTER TABLE public.goals ADD COLUMN IF NOT EXISTS target_amount NUMERIC DEFAULT 0;
ALTER TABLE public.goals ADD COLUMN IF NOT EXISTS saved_amount NUMERIC DEFAULT 0;
ALTER TABLE public.goals ADD COLUMN IF NOT EXISTS monthly_contribution NUMERIC DEFAULT 0;
ALTER TABLE public.goals ADD COLUMN IF NOT EXISTS expected_roi NUMERIC DEFAULT 8;
ALTER TABLE public.goals ADD COLUMN IF NOT EXISTS target_date DATE;
ALTER TABLE public.goals ADD COLUMN IF NOT EXISTS linked_assets JSONB DEFAULT '[]';
ALTER TABLE public.goals ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now());
ALTER TABLE public.goals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "goals_owner_policy" ON public.goals FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);


-- 6. PROTECTION SETTINGS TABLE
CREATE TABLE IF NOT EXISTS public.protection_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  term_insurance NUMERIC DEFAULT 0,
  health_insurance NUMERIC DEFAULT 0,
  emergency_target NUMERIC DEFAULT 0,
  emergency_current NUMERIC DEFAULT 0,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);
ALTER TABLE public.protection_settings ADD COLUMN IF NOT EXISTS term_insurance NUMERIC DEFAULT 0;
ALTER TABLE public.protection_settings ADD COLUMN IF NOT EXISTS health_insurance NUMERIC DEFAULT 0;
ALTER TABLE public.protection_settings ADD COLUMN IF NOT EXISTS emergency_target NUMERIC DEFAULT 0;
ALTER TABLE public.protection_settings ADD COLUMN IF NOT EXISTS emergency_current NUMERIC DEFAULT 0;
ALTER TABLE public.protection_settings ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now());

DELETE FROM public.protection_settings a WHERE a.ctid NOT IN (SELECT max(b.ctid) FROM public.protection_settings b GROUP BY b.user_id);
CREATE UNIQUE INDEX IF NOT EXISTS protection_settings_user_id_idx ON public.protection_settings (user_id);
ALTER TABLE public.protection_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "protection_settings_owner_policy" ON public.protection_settings FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- 7. USER SETTINGS TABLE
CREATE TABLE IF NOT EXISTS public.user_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  theme TEXT DEFAULT 'light',
  asset_types JSONB,
  ai_queries_count INTEGER DEFAULT 0,
  shares_count INTEGER DEFAULT 0,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);
ALTER TABLE public.user_settings ADD COLUMN IF NOT EXISTS theme TEXT DEFAULT 'light';
ALTER TABLE public.user_settings ADD COLUMN IF NOT EXISTS asset_types JSONB;
ALTER TABLE public.user_settings ADD COLUMN IF NOT EXISTS ai_queries_count INTEGER DEFAULT 0;
ALTER TABLE public.user_settings ADD COLUMN IF NOT EXISTS shares_count INTEGER DEFAULT 0;
ALTER TABLE public.user_settings ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now());

DELETE FROM public.user_settings a WHERE a.ctid NOT IN (SELECT max(b.ctid) FROM public.user_settings b GROUP BY b.user_id);
CREATE UNIQUE INDEX IF NOT EXISTS user_settings_user_id_idx ON public.user_settings (user_id);
ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "user_settings_owner_policy" ON public.user_settings FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- 8. AI CONVERSATIONS TABLE
CREATE TABLE IF NOT EXISTS public.ai_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  messages JSONB DEFAULT '[]'::jsonb,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);
ALTER TABLE public.ai_conversations ADD COLUMN IF NOT EXISTS messages JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.ai_conversations ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now());

-- Clean up legacy obsolete columns that cause NOT-NULL violations (error 23502)
DO $$ BEGIN
  ALTER TABLE public.ai_conversations ALTER COLUMN role DROP NOT NULL;
EXCEPTION WHEN OTHERS THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE public.ai_conversations ALTER COLUMN content DROP NOT NULL;
EXCEPTION WHEN OTHERS THEN NULL; END $$;

ALTER TABLE public.ai_conversations DROP COLUMN IF EXISTS role;
ALTER TABLE public.ai_conversations DROP COLUMN IF EXISTS content;

DELETE FROM public.ai_conversations a WHERE a.ctid NOT IN (SELECT max(b.ctid) FROM public.ai_conversations b GROUP BY b.user_id);
CREATE UNIQUE INDEX IF NOT EXISTS ai_conversations_user_id_idx ON public.ai_conversations (user_id);
ALTER TABLE public.ai_conversations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ai_conversations_owner_policy" ON public.ai_conversations FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ============================================================================
-- STEP 3: AUTOMATIC PROFILE CREATION TRIGGER
-- ============================================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, avatar_url, updated_at)
  VALUES (
    NEW.id, 
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', ''), 
    COALESCE(NEW.raw_user_meta_data->>'avatar_url', NEW.raw_user_meta_data->>'picture', ''), 
    NOW()
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = COALESCE(NULLIF(EXCLUDED.full_name, ''), public.profiles.full_name),
    avatar_url = COALESCE(NULLIF(EXCLUDED.avatar_url, ''), public.profiles.avatar_url),
    updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================================
-- STEP 4: ADMIN STATS VIEW (Bypasses RLS to count all users/queries)
-- ============================================================================
DROP VIEW IF EXISTS public.admin_stats_view;
CREATE VIEW public.admin_stats_view AS
SELECT 
  (SELECT count(*) FROM public.profiles) as total_users,
  (SELECT COALESCE(sum(ai_queries_count), 0) FROM public.user_settings) as total_ai_queries,
  (SELECT COALESCE(sum(shares_count), 0) FROM public.user_settings) as total_shares,
  (SELECT COALESCE(sum(value), 0) FROM public.assets) as total_wealth,
  (SELECT COALESCE(sum(value), 0) FROM public.liabilities) as total_debt,
  (SELECT count(*) FROM public.goals) as total_goals,
  (SELECT COALESCE(avg(monthly_income), 0) FROM public.financial_summaries) as avg_monthly_income;

GRANT SELECT ON public.admin_stats_view TO authenticated;
