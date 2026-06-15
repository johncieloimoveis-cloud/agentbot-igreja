# 🚀 Guia de Deploy: AgentBot Igreja no Netlify

## ✅ Pré-requisitos

1. **Conta no GitHub** (para conectar o repositório)
   - https://github.com

2. **Conta no Netlify** (gratuita)
   - https://app.netlify.com

3. **Repositório Git** (do seu projeto)
   - Se ainda não tem: `git init` na pasta do projeto

---

## 📋 PASSO 1: Preparar o Projeto Local

### 1.1 Instalar dependências
```bash
cd C:\Users\Usuário\PROJETO\ SHEEPCARE\SHEEPCARE
npm install
```

### 1.2 Criar arquivo `.env.local`
Na raiz do projeto, crie (se não existir):

```env
NEXT_PUBLIC_SUPABASE_URL=https://hdfywkehiqxqjnructyy.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=SUA_CHAVE_ANON_AQUI
```

⚠️ **Pegue as chaves em:** Supabase → Settings → API

### 1.3 Testar localmente
```bash
npm run dev
```

Abra http://localhost:3000 - se funcionar, está pronto! ✅

---

## 📦 PASSO 2: Criar Arquivo `netlify.toml`

Na raiz do projeto, crie o arquivo `netlify.toml`:

```toml
[build]
  command = "npm run build"
  functions = "netlify/functions"
  publish = ".next"

[build.environment]
  NODE_VERSION = "18"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200

[[headers]]
  for = "/*"
  [headers.values]
    X-Frame-Options = "SAMEORIGIN"
    X-Content-Type-Options = "nosniff"
    X-XSS-Protection = "1; mode=block"
    Referrer-Policy = "strict-origin-when-cross-origin"
```

---

## 🔧 PASSO 3: Configurar Next.js para Netlify

Abra `next.config.js` e certifique-se de ter:

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  images: {
    unoptimized: true, // Netlify não suporta Image Optimization
  },
}

module.exports = nextConfig
```

---

## 🌐 PASSO 4: Fazer Upload para GitHub

### 4.1 Inicializar Git (se não tiver)
```bash
git init
git add .
git commit -m "Initial commit - AgentBot Igreja"
```

### 4.2 Criar repositório no GitHub
1. Acesse https://github.com/new
2. Nome: `agentbot-igreja`
3. Descrição: `Sistema de Gestão de Pessoas para Igrejas`
4. Escolha **Public** ou **Private**
5. Clique em **Create repository**

### 4.3 Conectar local ao GitHub
```bash
git remote add origin https://github.com/SEU_USUARIO/agentbot-igreja.git
git branch -M main
git push -u origin main
```

---

## 🚀 PASSO 5: Deploy no Netlify

### 5.1 Conectar Netlify ao GitHub
1. Acesse https://app.netlify.com
2. Clique em **Add new site** → **Import an existing project**
3. Escolha **GitHub**
4. Autentique com sua conta GitHub
5. Selecione o repositório `agentbot-igreja`

### 5.2 Configurar Build
- **Base directory**: (deixe vazio)
- **Build command**: `npm run build`
- **Publish directory**: `.next`

### 5.3 Variáveis de Ambiente
Adicione as mesmas do `.env.local`:

```
NEXT_PUBLIC_SUPABASE_URL = https://hdfywkehiqxqjnructyy.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY = SUA_CHAVE_ANON_AQUI
```

### 5.4 Deploy
1. Clique em **Deploy site**
2. Aguarde ~2-3 minutos
3. Seu app estará online! 🎉

---

## ✅ URL Pública

Após deploy, você terá uma URL como:
```
https://agentbot-igreja.netlify.app
```

**Acesse de qualquer navegador/celular!**

---

## 📱 Testar no Celular

### Via QR Code
1. No painel do Netlify, copie a URL
2. Use um gerador QR: https://qr-code-generator.com
3. Aponte câmera do celular

### Via URL Direta
1. Copie a URL do Netlify
2. Compartilhe via WhatsApp/Email
3. Abra no navegador do celular

### Via Network Local
Se quiser testar sem internet:
```bash
npm run dev -- -H 0.0.0.0
```

Depois acesse: `http://SEU_IP_LOCAL:3000`

---

## 🔄 Fazer Atualizações

Sempre que quiser atualizar o site:

```bash
# Fazer alterações no código
git add .
git commit -m "Descrição das alterações"
git push
```

**Netlify detecta automaticamente e faz redeploy!** ✅

---

## ⚠️ Considerações Importantes

### Performance
- ✅ Imagens otimizadas
- ✅ Code splitting automático
- ✅ Cache de assets

### Segurança
- ✅ HTTPS automático
- ✅ Headers de segurança
- ✅ Variáveis de ambiente protegidas

### Limites Gratuitos Netlify
- ✅ 300 minutos de build/mês
- ✅ Banda ilimitada
- ✅ Deploy ilimitado
- ✅ HTTPS grátis

---

## 🆘 Troubleshooting

### Erro: "Build failed"
- Verifique se `npm run build` funciona localmente
- Confirme variáveis de ambiente

### Erro: "ReferenceError: window is not defined"
- Código SSR tentando acessar window
- Use `typeof window !== 'undefined'`

### Aplicação branca/em branco
- Abra DevTools (F12)
- Verifique console por erros
- Confirme variáveis de ambiente

---

## 📊 Monitorar Deploy

No painel do Netlify:
- **Deployments**: Ver histórico
- **Analytics**: Visitantes e performance
- **Functions**: Se usar serverless
- **Logs**: Debug de problemas

---

## ✨ Próximos Passos

Após deploy:
1. ✅ Testar em celular
2. ✅ Compartilhar URL com usuários
3. ✅ Configurar domínio customizado (opcional)
4. ✅ Ativar autenticação (opcional)
5. ✅ Monitorar performance

---

**Seu AgentBot Igreja estará público em ~10 minutos!** 🚀
