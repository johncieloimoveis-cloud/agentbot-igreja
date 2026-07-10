-- SheepCare: adicionar limite de pessoas por igreja
ALTER TABLE public.churches ADD COLUMN IF NOT EXISTS people_limit INTEGER DEFAULT 50;
