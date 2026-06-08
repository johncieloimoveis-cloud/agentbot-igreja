# SheepCare - Sistema CRM Pastoral

Sistema completo de gerenciamento de pessoas para igrejas. Responsivo para PC, tablet e celular.

## 📋 Pré-requisitos

- Node.js 18+ instalado
- npm ou yarn
- Conta Supabase (gratuita em https://supabase.com)
- Git

## 🚀 Quick Start

### 1. Criar Projeto Supabase

1. Acesse https://supabase.com e crie uma nova conta
2. Crie um novo projeto (escolha região mais próxima)
3. Aguarde o projeto ser criado (2-5 minutos)
4. Vá para **Settings → API** e copie:
   - `SUPABASE_URL`
   - `ANON_KEY` (public/anon key)

### 2. Criar Banco de Dados

1. Dentro do projeto Supabase, vá para **SQL Editor**
2. Crie uma nova query
3. Copie todo o conteúdo de `database.sql`
4. Cole no editor SQL e execute
5. Confirme que todas as tabelas foram criadas (verifique em **Database → Tables**)

### 3. Configurar Autenticação (Supabase Auth)

1. No Supabase, vá para **Authentication → Providers**
2. Ative "Email" (já vem ativado por padrão)
3. Vá para **Settings → General**
4. Configure (opcional):
   - Email confirmação
   - Redirect URLs: `http://localhost:3000/auth/callback`

### 4. Clonar e Instalar Projeto

```bash
# Clone ou extraia os arquivos no seu computador
cd sheepcare

# Instale dependências
npm install

# Crie arquivo .env.local com suas credenciais
cp .env.example .env.local
```

### 5. Configurar .env.local

Edite `.env.local` e preencha:

```
NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua-anon-key-aqui
NEXT_PUBLIC_API_URL=http://localhost:3000
```

### 6. Criar Primeira Igreja e Usuário Admin

Execute este SQL no Supabase SQL Editor:

```sql
-- 1. Inserir church
INSERT INTO churches (name, city, email)
VALUES ('Sua Igreja Aqui', 'Sua Cidade', 'contato@sua-igreja.com.br')
RETURNING id;
-- Copie o ID retornado

-- 2. Criar usuário auth (substitua email e password)
-- Use Supabase Dashboard → Authentication → Add user
-- Email: admin@sua-igreja.com.br
-- Password: senha-temporaria-123

-- 3. Inserir user (substitua os UUIDs)
INSERT INTO users (id, church_id, email, full_name, role_id, is_active)
VALUES (
  'UUID-do-usuario-criado-acima', -- copie de Authentication
  'UUID-da-church-criada-acima',  -- copie do INSERT anterior
  'admin@sua-igreja.com.br',
  'Administrador',
  (SELECT id FROM roles WHERE name = 'admin'),
  true
);
```

### 7. Iniciar Servidor

```bash
npm run dev
```

Acesse: http://localhost:3000

### 8. Login

- Email: `admin@sua-igreja.com.br`
- Senha: a que você definiu no passo 6

## 📁 Estrutura do Projeto

```
sheepcare/
├── src/
│   ├── components/       # Componentes React reutilizáveis
│   ├── pages/           # Páginas (Next.js router)
│   ├── services/        # Chamadas API e lógica
│   ├── hooks/           # Custom React hooks
│   ├── context/         # Context API
│   ├── styles/          # CSS global
│   └── utils/           # Funções auxiliares
├── public/              # Assets estáticos
├── database.sql         # Script de criação do BD
├── .env.example         # Variáveis de ambiente template
├── package.json
├── tsconfig.json
├── next.config.js
├── tailwind.config.js
└── README.md
```

## 🔧 Próximos Passos

### Fase 1: Setup ✓ (Você está aqui)

### Fase 2: Criar Tela de Login
- [ ] Componente de login
- [ ] Integração com Supabase Auth
- [ ] Proteção de rotas

### Fase 3: CRUD de Pessoas
- [ ] Lista de pessoas
- [ ] Formulário de cadastro
- [ ] Edição e visualização
- [ ] Upload de foto

### Fase 4: Módulos Complementares
- [ ] Visitantes
- [ ] GCEUs
- [ ] Tarefas
- [ ] Dashboard

## 📱 Responsividade

O projeto usa **TailwindCSS** que já fornece breakpoints móveis:

```
sm: 640px
md: 768px
lg: 1024px
xl: 1280px
2xl: 1536px
```

Use classes como `md:hidden` para ocultar em mobile, `sm:block` para mostrar apenas em small, etc.

## 🔐 Segurança

- Row Level Security (RLS) ativado no BD
- Autenticação via Supabase Auth
- Validações frontend (React Hook Form + Zod)
- Audit logs de todas as ações
- Campos sensíveis restritos por role

## 📊 Banco de Dados

Todas as tabelas já estão criadas em `database.sql`:

- `churches` - Igrejas
- `users` - Usuários
- `roles` - Perfis de acesso
- `people` - Pessoas/membros
- `groups` - GCEUs/células
- `departments` - Ministérios
- `attendance_records` - Presença
- `tasks` - Tarefas
- `pastoral_followups` - Acompanhamento
- `prayer_requests` - Pedidos de oração
- `whatsapp_messages` - Mensagens
- `audit_logs` - Registro de ações

## 🚀 Deploy (Futuro)

Para deploy em produção:

1. **Netlify**:
   ```bash
   npm run build
   # Conectar repo GitHub e fazer deploy automático
   ```

2. **Variáveis de ambiente** em produção (no Netlify):
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`

3. **Configurar Supabase Auth Redirect** para seu domínio

## 🤝 Contribuindo

Este é um projeto MVP. Feedback é bem-vindo!

## 📝 Notas Importantes

- **Backup**: Configure backups automáticos no Supabase
- **LGPD**: O sistema inclui audit logs e RLS para conformidade
- **WhatsApp**: Integração com Z-API será configurada na Fase 8
- **PWA**: Service Worker será adicionado na Fase 9

## 📞 Suporte

Para dúvidas sobre Supabase:
- Docs: https://supabase.com/docs
- Discord: https://discord.supabase.com

Para Next.js:
- Docs: https://nextjs.org/docs
- Discord: https://discord.gg/nextjs

---

**Planejamento técnico completo**: Veja `PLANEJAMENTO_TECNICO.md`
