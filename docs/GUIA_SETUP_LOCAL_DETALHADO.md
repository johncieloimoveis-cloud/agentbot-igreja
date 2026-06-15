# 🔧 SETUP LOCAL - GUIA DETALHADO (PASSO 1)

Este guia detalha exatamente como fazer o setup local do SheepCare no seu computador.

---

## ✅ PRÉ-REQUISITOS

Antes de começar, verifique se tem:

### 1. Node.js Instalado

Abra um terminal e execute:
```bash
node --version
```

**Esperado:** Algo como `v18.17.0` ou superior (versão 18+)

**Se não aparecer nada ou erro:**
- Baixe em: https://nodejs.org
- Escolha "LTS" (Long Term Support)
- Instale com as opções padrão
- Reinicie o terminal/computador
- Execute `node --version` novamente

### 2. npm (Gerenciador de Pacotes)

Normalmente já vem com Node.js. Verifique:
```bash
npm --version
```

**Esperado:** Algo como `v9.6.7` ou superior

### 3. Git (Opcional, mas Recomendado)

```bash
git --version
```

**Se não tiver:**
- Baixe em: https://git-scm.com
- Instale com opções padrão

### 4. Um Editor de Código

Recomendado: **VS Code** (https://code.visualstudio.com)

---

## 📂 PASSO 1: CLONAR/EXTRAIR ARQUIVOS

### Opção A: Se você tem os arquivos em ZIP

1. **Extraia a pasta `SHEEPCARE`** para um local confortável:
   - Exemplo: `C:\Users\SeuUsuario\Documentos\SHEEPCARE`
   - Ou: `/Users/SeuUsuario/Documentos/SHEEPCARE`
   - Ou: `/home/usuario/SHEEPCARE`

2. **Abra o terminal/prompt de comando** nessa pasta:
   - Windows: Shift + Click direito na pasta → "Abrir PowerShell aqui"
   - Mac: Finder → Pasta → Cmd + Shift + E (ou abra Terminal e digite `cd`)
   - Linux: Clique direito → "Abrir no Terminal"

3. **Verifique que está no local correto:**
   ```bash
   pwd
   # Esperado: o caminho da pasta SHEEPCARE
   ```

### Opção B: Se for clonar com Git

```bash
git clone https://seu-repositorio/sheepcare.git
cd sheepcare
```

---

## 📦 PASSO 2: INSTALAR DEPENDÊNCIAS

### O que é?
`npm install` lê `package.json` e baixa todas as bibliotecas necessárias.

### Execute:
```bash
npm install
```

### O que você verá:

```
npm notice 
npm notice Welcome to npm v9.6.7
npm notice 
added 500 packages, and audited 501 packages in 45s
```

**Tempo esperado:** 1-3 minutos (depende da internet)

### Se der erro?

#### Erro: "npm: command not found"
- Node.js não está instalado corretamente
- Reinstale Node.js e reinicie o terminal

#### Erro: "Permission denied"
**Mac/Linux:**
```bash
sudo npm install
# Digite sua senha
```

#### Erro: "404 not found" para algum pacote
- Problema temporário no npm
- Tente novamente:
```bash
rm -rf node_modules package-lock.json
npm install
```

#### Erro: "ERESOLVE unable to resolve dependency tree"
Execute:
```bash
npm install --legacy-peer-deps
```

---

## ⚙️ PASSO 3: CRIAR ARQUIVO .env.local

### O que é?
`.env.local` contém as credenciais do Supabase (senha de acesso).
**Nunca** compartilhe esse arquivo!

### Duas formas:

#### Opção A: Copiar arquivo exemplo (Recomendado)

**Windows (PowerShell):**
```powershell
Copy-Item .env.example .env.local
```

**Mac/Linux:**
```bash
cp .env.example .env.local
```

#### Opção B: Criar manualmente

1. Abra seu editor (VS Code)
2. Crie novo arquivo: `New File`
3. Salve como `.env.local` na **raiz da pasta SHEEPCARE**
4. Copie este conteúdo:
```
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=xxx
NEXT_PUBLIC_API_URL=http://localhost:3000
NODE_ENV=development
```

### Verificar se foi criado:

**Windows (PowerShell):**
```powershell
Get-Item .env.local
```

**Mac/Linux:**
```bash
ls -la .env.local
```

**Esperado:** Arquivo `.env.local` aparece

---

## 📝 PASSO 4: PREENCHER .env.local

### Ainda não temos as chaves do Supabase ainda!

Por enquanto, preencha assim:
```
NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua-anon-key-aqui
NEXT_PUBLIC_API_URL=http://localhost:3000
NODE_ENV=development
```

### Onde obter as chaves? (Próximo passo)

Você vai:
1. Criar conta no Supabase (passo 2)
2. Criar um projeto
3. Ir para **Settings → API**
4. Copiar `SUPABASE_URL` e `ANON_KEY`
5. Colar aqui em `.env.local`

---

## 🔍 VERIFICAÇÃO FINAL DO SETUP LOCAL

Execute para confirmar que tudo está certo:

```bash
# Verificar Node.js
node --version

# Verificar npm
npm --version

# Verificar que pasta node_modules foi criada
ls node_modules
# ou no Windows PowerShell:
# Get-Item node_modules

# Verificar que .env.local existe
cat .env.local
# ou no Windows PowerShell:
# Get-Content .env.local
```

**Esperado:**
```
v18.17.0          # Node.js
v9.6.7            # npm
react recharts    # alguns pacotes (muitos mais)
NEXT_PUBLIC_...   # conteúdo do .env.local
```

---

## 📋 CHECKLIST - PASSO 1 COMPLETO

- [ ] Node.js v18+ instalado (`node --version`)
- [ ] npm v9+ instalado (`npm --version`)
- [ ] Pasta SHEEPCARE extraída e aberta em terminal
- [ ] `npm install` executado com sucesso
- [ ] Pasta `node_modules/` criada (centenas de arquivos)
- [ ] Arquivo `.env.local` criado
- [ ] Arquivo `.env.local` preenchido (mesmo que com valores placeholder)

---

## ⏭️ PRÓXIMA ETAPA

Quando terminar este passo, você estará pronto para:

**PASSO 2: Configurar Supabase**
- Criar conta no Supabase
- Criar projeto
- Executar script SQL
- Copiar chaves para `.env.local`

---

## 🆘 PROBLEMAS COMUNS

### Terminal está lento/travado
- Pressione `Ctrl + C` para parar qualquer comando
- Feche e abra um novo terminal

### "npm install" demora muito
- Normal! Pode levar 2-5 minutos
- Verifique sua conexão de internet
- Se ficar mais de 10 minutos, cancele (`Ctrl + C`) e tente novamente

### Não consegue abrir terminal na pasta
**Windows:**
- Vá para a pasta SHEEPCARE no File Explorer
- Shift + Click direito → "Open PowerShell window here"

**Mac:**
- Abra Terminal
- Digite: `cd ` (com espaço)
- Arraste a pasta SHEEPCARE para o terminal e pressione Enter

**Linux:**
- Click direito na pasta → "Abrir Terminal Aqui"

### "command not found: npm" mesmo após instalar
- Reinicie completamente o terminal
- Reinicie o computador (às vezes ajuda)
- Verifique PATH do sistema (procure online para seu SO)

### Arquivo `.env.local` não aparece
- Pode estar oculto (começa com ponto)
**Windows:** File Explorer → View → "Show hidden files"
**Mac:** Cmd + Shift + . (ponto)
**Linux:** Ctrl + H

---

## 💡 DICAS

### Deixar terminal aberto para próximos passos
Recomendo deixar este terminal aberto porque você vai usar:
```bash
npm run dev  # Para iniciar servidor (passo 4)
```

### Copiar comandos
Selecione o comando acima, clique direito e "Copy", depois:
- **Windows PowerShell:** Click direito → Paste
- **Mac/Linux Terminal:** Cmd+V ou Ctrl+V

### Limpeza se precisar recomeçar
Se algo deu errado e quer resetar tudo:
```bash
rm -rf node_modules
rm package-lock.json
npm install
```

---

## 📞 PRÓXIMO PASSO

Quando terminar este PASSO 1, você terá:
- ✅ Projeto configurado localmente
- ✅ Dependências instaladas
- ✅ Arquivo .env.local criado

**Prossiga para PASSO 2: Configurar Supabase** (veja `README.md` ou `SETUP_CHECKLIST.md`)

---

**Status:** PASSO 1 completo quando `npm install` termina com sucesso ✅
