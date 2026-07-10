-- SheepCare: tabela de configuracoes globais
CREATE TABLE IF NOT EXISTS public.settings (
  key   TEXT PRIMARY KEY,
  value TEXT NOT NULL
);

-- Valor inicial do limite padrao de pessoas
INSERT INTO public.settings (key, value)
VALUES ('default_people_limit', '50')
ON CONFLICT (key) DO NOTHING;

-- Apenas Arcanjo (service role) pode ler/escrever
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "settings_select_authenticated" ON public.settings;
CREATE POLICY "settings_select_authenticated" ON public.settings
  FOR SELECT TO authenticated USING (auth.uid() IS NOT NULL);
