-- =======================================================
-- Spark Point Infotech - Database Initialization Migration
-- =======================================================

-- 1. Contact Form Submissions Table
CREATE TABLE IF NOT EXISTS public.contact_submissions (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  company TEXT,
  service TEXT,
  budget TEXT,
  message TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Talent / Careers Submissions Table
CREATE TABLE IF NOT EXISTS public.talent_submissions (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  role TEXT NOT NULL,
  experience TEXT,
  location TEXT,
  notice_period TEXT,
  resume_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.contact_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.talent_submissions ENABLE ROW LEVEL SECURITY;

-- Allow public insert (for website form submissions)
CREATE POLICY "Allow public inserts on contact_submissions"
  ON public.contact_submissions FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Allow public inserts on talent_submissions"
  ON public.talent_submissions FOR INSERT
  WITH CHECK (true);

-- Allow authenticated backend / full access (or service role) for selects
CREATE POLICY "Allow backend full access on contact_submissions"
  ON public.contact_submissions FOR ALL
  USING (true);

CREATE POLICY "Allow backend full access on talent_submissions"
  ON public.talent_submissions FOR ALL
  USING (true);
