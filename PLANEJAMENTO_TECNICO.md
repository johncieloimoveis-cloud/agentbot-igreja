# SheepCare - Planejamento Técnico

## 1. ARQUITETURA DO SISTEMA

```
┌─────────────────────────────────────────────────────┐
│                   CLIENTE (PWA)                      │
│  React/Next.js + TailwindCSS + Responsivo           │
│  (Desktop, Tablet, Mobile)                          │
└────────────────┬────────────────────────────────────┘
                 │ API REST
┌────────────────▼────────────────────────────────────┐
│              BACKEND (Node.js/Supabase)              │
│  - Autenticação (JWT via Supabase Auth)             │
│  - Lógica de negócio                                │
│  - Validações                                       │
│  - Integração com APIs externas                     │
└────────────────┬────────────────────────────────────┘
                 │ SQL
┌────────────────▼────────────────────────────────────┐
│      BANCO DE DADOS (Supabase/PostgreSQL)           │
│  - Tabelas relacionais                              │
│  - Row Level Security (RLS)                         │
│  - Triggers e funções                               │
└─────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────┐
│          INTEGRAÇÕES EXTERNAS                        │
│  - Z-API / WhatsApp Business API                    │
│  - N8N (automações futuras)                         │
│  - Armazenamento de arquivos (Supabase Storage)     │
└─────────────────────────────────────────────────────┘
```

## 2. MODELO DE DADOS

### 2.1 Tabelas Principais

#### `churches`
```sql
- id (uuid, PK)
- name (varchar)
- cnpj (varchar, unique)
- email (varchar)
- phone (varchar)
- address (varchar)
- city (varchar)
- state (varchar)
- zip_code (varchar)
- created_at (timestamp)
- updated_at (timestamp)
```

#### `users`
```sql
- id (uuid, PK)
- church_id (uuid, FK → churches)
- email (varchar, unique)
- password_hash (varchar)
- full_name (varchar)
- role_id (uuid, FK → roles)
- is_active (boolean)
- last_login (timestamp)
- created_at (timestamp)
- updated_at (timestamp)
```

#### `roles`
```sql
- id (uuid, PK)
- name (varchar) → admin, pastor, secretary, group_leader, ministry_leader
- description (text)
```

#### `permissions`
```sql
- id (uuid, PK)
- role_id (uuid, FK → roles)
- resource (varchar) → people, groups, tasks, reports, settings
- action (varchar) → create, read, update, delete
- constraint (varchar, nullable) → own_groups, own_ministry
```

#### `people`
```sql
- id (uuid, PK)
- church_id (uuid, FK → churches)
- full_name (varchar)
- photo_url (varchar, nullable)
- date_of_birth (date, nullable)
- sex (varchar) → M, F
- marital_status (varchar) → single, married, divorced, widowed
- cpf (varchar, nullable, unique per church)
- rg (varchar, nullable)
- phone (varchar, nullable)
- whatsapp (varchar, nullable)
- email (varchar, nullable)
- address (varchar, nullable)
- neighborhood (varchar, nullable)
- city (varchar, nullable)
- profession (varchar, nullable)
- education_level (varchar, nullable)
- spouse_name (varchar, nullable)
- children_count (integer, default 0)
- responsible_id (uuid, FK → people, nullable) → para menores
- first_contact_date (date, nullable)
- how_met_church (varchar, nullable)
- status (varchar) → visitor, active_member, new_convert, in_discipleship, absent, transferred, leader, child, adolescent, young
- notes (text, nullable)
- is_active (boolean, default true)
- created_by (uuid, FK → users)
- created_at (timestamp)
- updated_at (timestamp)
```

#### `groups` (GCEUs/Células)
```sql
- id (uuid, PK)
- church_id (uuid, FK → churches)
- name (varchar)
- leader_id (uuid, FK → people)
- vice_leader_id (uuid, FK → people, nullable)
- meeting_address (varchar, nullable)
- meeting_day (varchar) → monday, tuesday, ...
- meeting_time (time, nullable)
- description (text, nullable)
- status (varchar) → active, inactive
- created_at (timestamp)
- updated_at (timestamp)
```

#### `group_members`
```sql
- id (uuid, PK)
- group_id (uuid, FK → groups)
- person_id (uuid, FK → people)
- joined_date (date)
- is_visitor (boolean, default false)
- notes (text, nullable)
- created_at (timestamp)
```

#### `departments` (Ministérios)
```sql
- id (uuid, PK)
- church_id (uuid, FK → churches)
- name (varchar) → Louvor, Infantil, Jovens, Intercessão, Ação Social, Obreiros, Recepção, Ensino, Comunicação, etc.
- description (text, nullable)
- leader_id (uuid, FK → people, nullable)
- is_custom (boolean)
- status (varchar) → active, inactive
- created_at (timestamp)
```

#### `department_members`
```sql
- id (uuid, PK)
- department_id (uuid, FK → departments)
- person_id (uuid, FK → people)
- role (varchar) → leader, member
- joined_date (date)
- is_active (boolean, default true)
```

#### `attendance_events`
```sql
- id (uuid, PK)
- church_id (uuid, FK → churches)
- name (varchar) → Culto Domingo, Culto Quinta, Escola Bíblica, etc.
- event_type (varchar) → service, bible_class, group_meeting, special_event
- event_date (date)
- created_at (timestamp)
```

#### `attendance_records`
```sql
- id (uuid, PK)
- event_id (uuid, FK → attendance_events)
- person_id (uuid, FK → people)
- attendance_date (date)
- attended (boolean)
- notes (varchar, nullable)
- recorded_by (uuid, FK → users)
- recorded_at (timestamp)
```

#### `pastoral_followups`
```sql
- id (uuid, PK)
- church_id (uuid, FK → churches)
- person_id (uuid, FK → people)
- followup_type (varchar) → discipleship, prayer_request, pastoral_visit, counseling, leadership_talk, new_convert, absent_person, social_need, ministry_referral
- description (text)
- confidential (boolean, default false) → visível apenas para perfis autorizados
- responsible_id (uuid, FK → users, nullable)
- status (varchar) → open, in_progress, completed, archived
- created_at (timestamp)
- updated_at (timestamp)
```

#### `prayer_requests`
```sql
- id (uuid, PK)
- church_id (uuid, FK → churches)
- person_id (uuid, FK → people)
- title (varchar)
- description (text)
- request_date (date)
- is_urgent (boolean, default false)
- is_confidential (boolean, default false)
- status (varchar) → open, answered, archived
- created_at (timestamp)
- updated_at (timestamp)
```

#### `tasks`
```sql
- id (uuid, PK)
- church_id (uuid, FK → churches)
- person_id (uuid, FK → people, nullable)
- title (varchar)
- description (text, nullable)
- task_type (varchar) → contact_visitor, accompany_convert, check_absent, pastoral_visit, prayer_request, birthday_call, invite_group, update_incomplete
- responsible_id (uuid, FK → users)
- priority (varchar) → low, medium, high, urgent
- due_date (date)
- status (varchar) → pending, in_progress, completed, cancelled
- created_at (timestamp)
- updated_at (timestamp)
- completed_at (timestamp, nullable)
```

#### `whatsapp_messages`
```sql
- id (uuid, PK)
- church_id (uuid, FK → churches)
- person_id (uuid, FK → people)
- message_text (text)
- message_type (varchar) → visitor_welcome, birthday, absent_reminder, group_update, urgent_prayer, custom
- sent_by (uuid, FK → users)
- sent_at (timestamp)
- delivery_status (varchar) → pending, sent, delivered, failed
- notes (text, nullable)
```

#### `birthdays`
```sql
- id (uuid, PK)
- person_id (uuid, FK → people)
- birthday_month (integer)
- birthday_day (integer)
- has_notified_today (boolean, default false)
```

#### `audit_logs`
```sql
- id (uuid, PK)
- church_id (uuid, FK → churches)
- user_id (uuid, FK → users)
- action (varchar) → create, read, update, delete
- resource (varchar) → people, groups, tasks, etc.
- resource_id (uuid)
- old_values (jsonb, nullable)
- new_values (jsonb, nullable)
- timestamp (timestamp)
- ip_address (varchar, nullable)
```

### 2.2 Índices Principais
```sql
-- Busca rápida
CREATE INDEX idx_people_name ON people(full_name);
CREATE INDEX idx_people_phone ON people(phone);
CREATE INDEX idx_people_whatsapp ON people(whatsapp);
CREATE INDEX idx_people_status ON people(status);
CREATE INDEX idx_people_church ON people(church_id);

-- Filtros comuns
CREATE INDEX idx_groups_church ON groups(church_id);
CREATE INDEX idx_group_members_group ON group_members(group_id);
CREATE INDEX idx_attendance_event ON attendance_records(event_id);
CREATE INDEX idx_tasks_responsible ON tasks(responsible_id);
CREATE INDEX idx_tasks_status ON tasks(status);
```

## 3. SEGURANÇA E CONTROLE DE ACESSO

### 3.1 Row Level Security (RLS) - Supabase

```sql
-- Pessoas: cada usuário vê apenas membros de sua igreja
CREATE POLICY "Users see people from their church"
  ON people FOR SELECT
  USING (church_id IN (SELECT church_id FROM users WHERE id = auth.uid()));

-- Tarefas: secretária vê todas, líderes veem apenas as suas
CREATE POLICY "Users see own or managed tasks"
  ON tasks FOR SELECT
  USING (
    church_id IN (SELECT church_id FROM users WHERE id = auth.uid())
    AND (
      responsible_id = auth.uid()
      OR (SELECT role_id FROM users WHERE id = auth.uid()) 
        IN (SELECT id FROM roles WHERE name IN ('admin', 'secretary', 'pastor'))
    )
  );

-- Acompanhamento sigiloso: apenas perfis autorizados
CREATE POLICY "View confidential followups"
  ON pastoral_followups FOR SELECT
  USING (
    NOT confidential 
    OR (SELECT role_id FROM users WHERE id = auth.uid())
      IN (SELECT id FROM roles WHERE name IN ('admin', 'pastor'))
  );
```

### 3.2 Permissões por Perfil

| Ação | Admin | Pastor | Secretária | Líder GCEU | Líder Ministério |
|------|-------|--------|-----------|-----------|-----------------|
| Ver todas pessoas | ✓ | ✓ | ✓ | Só do grupo | Só do ministério |
| Criar/Editar pessoa | ✓ | ✓ | ✓ | - | - |
| Ver relatórios | ✓ | ✓ | ✓ | - | - |
| Gerenciar usuários | ✓ | - | - | - | - |
| Editar config. | ✓ | - | - | - | - |
| Acompanhamento sigiloso | ✓ | ✓ | - | - | - |
| Presença GCEU | ✓ | ✓ | ✓ | ✓ | - |
| Gerenciar GCEU | ✓ | ✓ | ✓ | ✓ | - |

## 4. FLUXOS PRINCIPAIS

### 4.1 Cadastro de Visitante (Mobile - Prioridade)
```
1. Tela inicial → "Novo Visitante"
2. Cadastro rápido (nome, telefone, culto/evento)
3. Opções: interesse em GCEU? interesse em estudo bíblico? deseja contato?
4. Salvar → criar alerta para contato dentro de 48h
5. Sugestão: enviar mensagem de boas-vindas via WhatsApp
```

### 4.2 Acompanhamento de Novo Convertido
```
1. Visitante retorna/se converte → status muda para "novo_convertido"
2. Sistema cria tarefas automáticas:
   - Visita pastoral (prazo: 7 dias)
   - Convite para GCEU (prazo: 14 dias)
   - Encaminhamento para discipulado (prazo: 21 dias)
3. Líderes veem notificações
4. Histórico de atendimentos fica registrado
```

### 4.3 Presença Rápida (Mobile)
```
1. Líder/Secretária → "Registrar Presença"
2. Seleciona evento (Culto Domingo, por ex.)
3. Vê lista de pessoas do grupo/ministério
4. Clica em cada nome para marcar presente/ausente
5. Salva → registra quem faltou para alertas posteriores
```

### 4.4 Dashboard (Desktop)
```
1. Login → Dashboard com cards de:
   - Total pessoas
   - Visitantes mês
   - Novos convertidos
   - Ausências recorrentes (alertas)
   - Tarefas pendentes
   - Aniversariantes próximos
2. Gráficos de tendência
3. Acesso rápido aos módulos principais
```

### 4.5 Relatórios Filtrados
```
1. Menu → "Relatórios"
2. Seleciona tipo: visitantes, convertidos, afastados, por GCEU, por ministério, etc.
3. Filtros: data, status, grupo, ministério
4. Opções: visualizar, PDF, Excel
5. Dados: nome, telefone, data última presença, status, responsável
```

## 5. ESTRUTURA DE PASTAS (Frontend)

```
sheepcare-frontend/
├── public/
│   ├── manifest.json (PWA)
│   └── icons/
├── src/
│   ├── components/
│   │   ├── common/
│   │   │   ├── Header.tsx
│   │   │   ├── Sidebar.tsx
│   │   │   └── LoadingSpinner.tsx
│   │   ├── layout/
│   │   │   ├── AdminLayout.tsx
│   │   │   ├── MobileLayout.tsx
│   │   │   └── AuthLayout.tsx
│   │   └── features/
│   │       ├── people/
│   │       │   ├── PeopleList.tsx
│   │       │   ├── PersonForm.tsx
│   │       │   ├── PersonDetail.tsx
│   │       │   └── QuickVisitorForm.tsx
│   │       ├── groups/
│   │       │   ├── GroupList.tsx
│   │       │   ├── GroupForm.tsx
│   │       │   └── GroupAttendance.tsx
│   │       ├── attendance/
│   │       │   ├── AttendanceForm.tsx
│   │       │   └── AttendanceHistory.tsx
│   │       ├── tasks/
│   │       │   ├── TaskList.tsx
│   │       │   └── TaskForm.tsx
│   │       ├── reports/
│   │       │   ├── ReportGenerator.tsx
│   │       │   ├── VisitorReport.tsx
│   │       │   └── AttendanceReport.tsx
│   │       └── dashboard/
│   │           ├── Dashboard.tsx
│   │           ├── StatCard.tsx
│   │           └── ChartWidget.tsx
│   ├── pages/
│   │   ├── login.tsx
│   │   ├── dashboard.tsx
│   │   ├── people/
│   │   │   ├── index.tsx
│   │   │   ├── [id].tsx
│   │   │   └── new.tsx
│   │   ├── groups/
│   │   │   ├── index.tsx
│   │   │   ├── [id].tsx
│   │   │   └── new.tsx
│   │   └── ... (outras páginas)
│   ├── services/
│   │   ├── api.ts (cliente HTTP)
│   │   ├── auth.ts
│   │   ├── people.ts
│   │   ├── groups.ts
│   │   ├── tasks.ts
│   │   ├── reports.ts
│   │   └── whatsapp.ts
│   ├── hooks/
│   │   ├── useAuth.ts
│   │   ├── usePeople.ts
│   │   └── useNotifications.ts
│   ├── context/
│   │   ├── AuthContext.tsx
│   │   └── ChurchContext.tsx
│   ├── utils/
│   │   ├── validators.ts
│   │   ├── formatters.ts
│   │   └── helpers.ts
│   ├── styles/
│   │   ├── globals.css
│   │   └── tailwind.config.js
│   └── App.tsx
├── package.json
├── next.config.js
└── tsconfig.json
```

## 6. ESTRUTURA DE PASTAS (Backend)

```
sheepcare-backend/
├── src/
│   ├── routes/
│   │   ├── auth.ts
│   │   ├── people.ts
│   │   ├── groups.ts
│   │   ├── attendance.ts
│   │   ├── tasks.ts
│   │   ├── reports.ts
│   │   ├── whatsapp.ts
│   │   └── admin.ts
│   ├── controllers/
│   │   ├── authController.ts
│   │   ├── peopleController.ts
│   │   ├── groupsController.ts
│   │   ├── tasksController.ts
│   │   └── reportsController.ts
│   ├── services/
│   │   ├── authService.ts
│   │   ├── peopleService.ts
│   │   ├── groupService.ts
│   │   ├── whatsappService.ts
│   │   └── reportService.ts
│   ├── middleware/
│   │   ├── auth.ts
│   │   ├── permissions.ts
│   │   ├── errorHandler.ts
│   │   └── audit.ts
│   ├── models/
│   │   └── types.ts
│   ├── config/
│   │   ├── database.ts
│   │   ├── supabase.ts
│   │   └── env.ts
│   └── index.ts
├── .env.example
├── package.json
└── tsconfig.json
```

## 7. ROADMAP - MVP

### Fase 1: Configuração Base (Semana 1)
- [ ] Setup projeto Next.js + Supabase
- [ ] Criar BD e tabelas
- [ ] Autenticação (login)
- [ ] RLS policies
- [ ] Estrutura de pastas

### Fase 2: Cadastro de Pessoas (Semana 2)
- [ ] CRUD de pessoas
- [ ] Formulário completo
- [ ] Upload de foto (Supabase Storage)
- [ ] Validações
- [ ] Busca e filtros básicos

### Fase 3: Visitantes (Semana 2-3)
- [ ] Fluxo rápido de visitante (mobile)
- [ ] Cadastro simplificado
- [ ] Interessses (GCEU, estudo bíblico, contato)
- [ ] Alertas para contato

### Fase 4: GCEUs (Semana 3)
- [ ] CRUD de grupos
- [ ] Adicionar/remover participantes
- [ ] Presença por grupo
- [ ] Relatório de ausências

### Fase 5: Tarefas (Semana 3-4)
- [ ] CRUD de tarefas
- [ ] Atribuição de responsáveis
- [ ] Filtro por status e prioridade
- [ ] Notificações

### Fase 6: Dashboard (Semana 4)
- [ ] Estatísticas principais
- [ ] Gráficos (Chart.js)
- [ ] Widgets com dados relevantes
- [ ] Acesso rápido

### Fase 7: Relatórios Básicos (Semana 4-5)
- [ ] Relatório de visitantes
- [ ] Relatório de presença
- [ ] Relatório de grupos
- [ ] Exportação PDF/Excel

### Fase 8: WhatsApp (Semana 5)
- [ ] Integração wa.me
- [ ] Mensagens pré-preenchidas
- [ ] Mensagem de boas-vindas
- [ ] Aniversariantes

### Fase 9: Responsividade e PWA (Semana 5-6)
- [ ] Layout mobile otimizado
- [ ] PWA manifest
- [ ] Service Worker
- [ ] Testes em dispositivos reais

### Fase 10: Testes e Deploy (Semana 6)
- [ ] Testes de usabilidade
- [ ] Correção de bugs
- [ ] Deploy em Netlify
- [ ] Documentação

## 8. CONSIDERAÇÕES TÉCNICAS

### 8.1 Autenticação
- **Supabase Auth** com email/senha
- Sessions via JWT armazenadas em localStorage (se PWA offline)
- Refresh tokens automáticos
- Logout seguro (limpar tokens)

### 8.2 Offline-First
- Cache de dados críticos com Service Worker
- Sincronização quando online
- Modo offline limitado (leitura de cache)

### 8.3 Performance
- Code splitting por rota (Next.js)
- Lazy loading de componentes
- Compressão de imagens
- CDN para assets estáticos

### 8.4 Validação
- Frontend: ZOD ou Yup
- Backend: schemas compartilhadas
- Rate limiting em APIs
- CSRF protection

### 8.5 Tratamento de Erros
- Mensagens amigáveis ao usuário
- Logging de erros (Sentry, opcional)
- Fallbacks graceful
- Retry automático para falhas de rede

## 9. CONFIGURAÇÃO SUPABASE

### 9.1 Variáveis de Ambiente
```
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=xxx
SUPABASE_SERVICE_ROLE_KEY=xxx
```

### 9.2 Segredos Adicionais
```
WHATSAPP_API_KEY=xxx (Z-API)
NEXT_PUBLIC_API_URL=http://localhost:3000 (dev) ou seu domínio
```

## 10. PRINCIPAIS DECISÕES ARQUITETURAIS

| Decisão | Escolha | Motivo |
|---------|---------|--------|
| Frontend | Next.js | SSR, PWA, TypeScript, deployment fácil |
| DB | Supabase | PostgreSQL, RLS built-in, autenticação integrada |
| Styling | TailwindCSS | Utility-first, responsivo por padrão |
| State | React Context + SWR | Simples, evita over-engineering |
| API | REST | Simples, bem documentada, integra com Supabase |
| Hosting | Netlify | Deploy contínuo, PWA suportado |
| Payments | N/A para MVP | Considerar no futuro (Stripe) |
| Analytics | Opcional | Plausible ou Umami (LGPD-friendly) |

## 11. MÉTRICAS DE SUCESSO (MVP)

- [ ] Sistema funciona em PC, tablet, celular sem bugs críticos
- [ ] Tempo de resposta < 2s (P95)
- [ ] Cadastro de visitante < 30 segundos (mobile)
- [ ] Todos os 12 features do MVP implementados
- [ ] Documentação completa
- [ ] Testado com usuários reais (church feedback)

---

**Próximo passo**: Começar com setup do projeto e criação do BD. Quer que eu ajude com isso?
