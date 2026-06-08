# ✅ SheepCare - Setup Checklist

Use este checklist para garantir que tudo está configurado corretamente.

## 📋 Fase 1: Supabase

### 1.1 Criar Projeto Supabase
- [ ] Acessar https://supabase.com
- [ ] Criar nova conta (ou fazer login)
- [ ] Criar novo projeto
- [ ] Selecionar região mais próxima (ex: South America - São Paulo)
- [ ] Anotar: `SUPABASE_URL` e `SUPABASE_ANON_KEY`

### 1.2 Criar Banco de Dados
- [ ] No Supabase, ir para **SQL Editor**
- [ ] Criar nova query
- [ ] Copiar conteúdo completo de `database.sql`
- [ ] Colar no editor
- [ ] Executar (⚡ Run ou Ctrl+Enter)
- [ ] Verificar que **todas as tabelas foram criadas** (verificar em **Database → Tables**)

### 1.3 Verificar Autenticação
- [ ] Ir para **Authentication → Settings**
- [ ] Confirmar que "Email" está habilitado
- [ ] Copiar "Redirect URL" para localhost: `http://localhost:3000/auth/callback`

## 🔧 Fase 2: Projeto Local

### 2.1 Clonar/Extrair Arquivos
- [ ] Extrair/clonar projeto SheepCare para sua máquina
- [ ] Abrir pasta em seu editor favorito (VS Code recomendado)

### 2.2 Instalar Dependências
```bash
# No terminal, na raiz do projeto:
npm install
```
- [ ] Aguardar conclusão (pode levar alguns minutos)

### 2.3 Configurar Variáveis de Ambiente
```bash
# Copiar arquivo exemplo
cp .env.example .env.local
```

- [ ] Abrir `.env.local` e preencher:
  ```
  NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
  NEXT_PUBLIC_SUPABASE_ANON_KEY=sua-anon-key-aqui
  ```
- [ ] Salvar arquivo

## 👤 Fase 3: Criar Primeiro Usuário

### 3.1 Criar Usuário no Supabase Auth
- [ ] No Supabase, ir para **Authentication → Users**
- [ ] Clicar "Add user" (ou "Invite new user")
- [ ] Email: `admin@sua-igreja.com.br` (ou seu email)
- [ ] Password: `senha-temporaria-123` (trocar depois)
- [ ] Clicar "Create user"
- [ ] **Copiar o UUID do usuário** (aparece na lista)

### 3.2 Criar Igreja no Banco de Dados
- [ ] No Supabase, ir para **SQL Editor**
- [ ] Criar nova query:
  ```sql
  INSERT INTO churches (name, city, email)
  VALUES ('Sua Igreja Aqui', 'Sua Cidade', 'contato@sua-igreja.com.br')
  RETURNING id;
  ```
- [ ] Executar
- [ ] **Copiar o ID retornado** (será um UUID)

### 3.3 Criar Entrada de Usuário
- [ ] Criar nova query com:
  ```sql
  INSERT INTO users (id, church_id, email, full_name, role_id, is_active)
  VALUES (
    'UUID-DO-USUARIO-AQUI',      -- Cole o UUID do passo 3.1
    'UUID-DA-CHURCH-AQUI',       -- Cole o UUID do passo 3.2
    'admin@sua-igreja.com.br',
    'Administrador',
    (SELECT id FROM roles WHERE name = 'admin'),
    true
  );
  ```
- [ ] Executar

## 🚀 Fase 4: Iniciar Aplicação

### 4.1 Iniciar Servidor de Desenvolvimento
```bash
npm run dev
```
- [ ] Aguardar "compiled client and server successfully"
- [ ] Acessar: http://localhost:3000

### 4.2 Fazer Login
- [ ] Email: `admin@sua-igreja.com.br`
- [ ] Senha: `senha-temporaria-123`
- [ ] Clicar "Entrar"
- [ ] Se bem-sucedido, você verá o Dashboard ✅

### 4.3 Explorar Dashboard
- [ ] Verificar cards de estatísticas
- [ ] Clicar "Sair" para testar logout
- [ ] Fazer login novamente para confirmar

## 📱 Fase 5: Responsividade (Opcional)

### 5.1 Testar no Navegador
- [ ] F12 para abrir DevTools
- [ ] Clicar no ícone de responsividade (telefone)
- [ ] Alternar entre:
  - [ ] Mobile (iPhone 12): 390x844
  - [ ] Tablet (iPad): 768x1024
  - [ ] Desktop: 1920x1080

### 5.2 Testar em Dispositivo Real
- [ ] Seu computador na rede local está em: `http://seu-ip:3000`
- [ ] Abrir em seu smartphone/tablet
- [ ] Verificar se funciona bem em telas menores

## 🔍 Troubleshooting

### Erro: "Variáveis de ambiente Supabase não configuradas"
- [ ] Verificar se `.env.local` existe
- [ ] Confirmar se `NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_ANON_KEY` estão preenchidos
- [ ] Reiniciar servidor (`npm run dev`)

### Erro: "Invalid credentials"
- [ ] Verificar email digitado
- [ ] Confirmar senha (case-sensitive)
- [ ] Verificar se usuário foi criado no Supabase Auth
- [ ] Verificar se entrada de usuário foi criada na tabela `users`

### Erro: "Failed to fetch"
- [ ] Verificar se Supabase está online (https://status.supabase.com)
- [ ] Verificar conexão de internet
- [ ] Verificar se `NEXT_PUBLIC_SUPABASE_URL` está correta (copiar novamente)

### Página carrega mas está em branco
- [ ] Abrir DevTools (F12) → Console
- [ ] Procurar por erros em vermelho
- [ ] Reportar erro se persistir

## ✅ Validação Final

Se tudo funcionou, você deve ter:

- [x] Projeto criado no Supabase
- [x] Banco de dados com todas as tabelas criadas
- [x] Variáveis de ambiente configuradas
- [x] Usuário admin criado
- [x] Igreja criada
- [x] Servidor rodando localmente
- [x] Login funcionando
- [x] Dashboard exibindo

## 📚 Próximos Passos

Com o setup completo, você pode começar a trabalhar na **Fase 2: Criar Tela de Cadastro de Pessoas**.

Veja o arquivo `PLANEJAMENTO_TECNICO.md` para o roadmap completo.

---

**Dúvidas?** Consulte `README.md` para mais informações.
