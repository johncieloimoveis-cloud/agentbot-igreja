-- Verificar todas as tabelas do schema public
SELECT tablename
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;

-- Verificar estrutura de cada tabela
\d groups
\d ministries
\d people
\d departments
\d attendance_events
\d attendance_records
\d tasks
\d announcements
\d users
