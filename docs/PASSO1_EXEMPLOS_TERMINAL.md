# 🖥️ PASSO 1 - EXEMPLOS DE TERMINAL

Aqui estão exemplos exatos do que você verá em cada etapa do Passo 1.

---

## ✅ EXEMPLO 1: Verificar Node.js

### Comando:
```bash
node --version
```

### Saída Esperada (✓ Correto):
```
v18.17.0
```
ou
```
v20.10.0
```

### Saída com Erro (✗ Incorreto):
```
'node' is not recognized as an internal or external command, operable program or batch file.
```
ou
```
-bash: node: command not found
```

**Solução:** Reinstalar Node.js (https://nodejs.org)

---

## ✅ EXEMPLO 2: Verificar npm

### Comando:
```bash
npm --version
```

### Saída Esperada (✓ Correto):
```
9.6.7
```

### Saída com Erro (✗ Incorreto):
```
'npm' is not recognized as an internal or external command
```

**Solução:** Reinstalar Node.js (npm vem junto)

---

## ✅ EXEMPLO 3: Abrir Terminal na Pasta

### No Windows PowerShell:
Você deve ver algo como:
```
PS C:\Users\SeuUsuario\Documentos\SHEEPCARE>
```

Se vir assim:
```
C:\Users\SeuUsuario\Documentos>
```
Então não abriu na pasta SHEEPCARE. Navegue:
```bash
cd SHEEPCARE
```

### No Mac Terminal:
Você deve ver:
```
SeuMac:SHEEPCARE usuario$
```

### No Linux Terminal:
Você deve ver:
```
usuario@computador:~/SHEEPCARE$
```

---

## ✅ EXEMPLO 4: Executar npm install

### Comando:
```bash
npm install
```

### Início da Saída (Primeiros segundos):
```
npm notice
npm notice Welcome to npm 9.6.7
npm notice
npm notice New minor version of npm available! 9.8.1
npm notice To update run: npm install -g npm@latest
npm notice
npm WARN deprecated uuid@3.4.0: Please upgrade  to version 4 or higher
```

### Meio da Saída (Depois de alguns segundos):
```
added 250 packages, and audited 251 packages in 35s
found 0 vulnerabilities
```

### Saída Final (✓ Sucesso):
```
npm notice
npm notice New minor version of npm available! 9.8.1
npm notice To update run: npm install -g npm@latest
npm notice
added 500 packages, and audited 501 packages in 45s

found 0 vulnerabilities
```

**Tempo:** Entre 30 segundos e 3 minutos (depende de internet)

### Saída com Erro (✗ Incorreto):

#### Erro 1: Sem acesso
```
npm ERR! code EACCES
npm ERR! syscall open
npm ERR! path /usr/lib/node_modules/...
npm ERR! errno -13
```
**Solução (Mac/Linux):**
```bash
sudo npm install
```

#### Erro 2: Dependência conflitante
```
npm ERR! code ERESOLVE
npm ERR! ERESOLVE unable to resolve dependency tree
```
**Solução:**
```bash
npm install --legacy-peer-deps
```

---

## ✅ EXEMPLO 5: Verificar node_modules

### Comando (Windows PowerShell):
```powershell
Get-Item node_modules
```

### Saída Esperada:
```
    Directory: C:\Users\SeuUsuario\Documentos\SHEEPCARE

Mode                 LastWriteTime         Length Name
----                 -------------         ------ ----
d----            1/22/2024  3:45 PM                node_modules
```

### Comando (Mac/Linux):
```bash
ls node_modules
```

### Saída Esperada:
```
@hookform              @tailwindcss           date-fns                lucide-react           react-dom              zustand
@supabase              autoprefixer           eslint                 next                   react-hook-form
@types                 axios                  lucide-react           postcss                recharts
```

Se vir isto:
```
ls: cannot access 'node_modules': No such file or directory
```

**Significa:** `npm install` não completou ou falhou. Tente novamente.

---

## ✅ EXEMPLO 6: Criar .env.local

### Comando (Mac/Linux):
```bash
cp .env.example .env.local
```

### Saída Esperada:
```
(nada, apenas volta ao prompt)
```

### Comando (Windows PowerShell):
```powershell
Copy-Item .env.example .env.local
```

### Verificar se foi criado (Mac/Linux):
```bash
ls -la .env.local
```

### Saída Esperada:
```
-rw-r--r--  1 usuario  staff  234 Jan 22 15:45 .env.local
```

### Verificar se foi criado (Windows PowerShell):
```powershell
Get-Item .env.local
```

### Saída Esperada:
```
    Directory: C:\Users\SeuUsuario\Documentos\SHEEPCARE

Mode                 LastWriteTime         Length Name
----                 -------------         ------ ----
-a---            1/22/2024  3:47 PM        234 .env.local
```

---

## ✅ EXEMPLO 7: Ver conteúdo de .env.local

### Comando (Mac/Linux):
```bash
cat .env.local
```

### Comando (Windows PowerShell):
```powershell
Get-Content .env.local
```

### Saída Esperada:
```
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here

# API
NEXT_PUBLIC_API_URL=http://localhost:3000

# Node Environment
NODE_ENV=development
```

---

## ✅ EXEMPLO 8: Listar Arquivos Principais

Para confirmar que tudo foi criado corretamente:

### Comando (Mac/Linux):
```bash
ls -la | grep -E "^-.*\.(json|js|md|sql)$|^d"
```

### Comando (Windows PowerShell):
```powershell
Get-ChildItem | Select-Object Name, Mode
```

### Saída Esperada (mostrará muitos arquivos):
```
d----  node_modules
d----  public
d----  src
-a---  .env.local
-a---  .env.example
-a---  .gitignore
-a---  README.md
-a---  database.sql
-a---  package.json
-a---  next.config.js
-a---  tsconfig.json
-a---  tailwind.config.js
-a---  postcss.config.js
... (mais arquivos)
```

---

## 📋 CHECKLIST COM EXEMPLOS

Copie e execute cada comando abaixo. Se tudo aparecer como esperado, está tudo certo!

```bash
# 1. Verificar Node.js (esperado: v18+)
node --version

# 2. Verificar npm (esperado: v9+)
npm --version

# 3. Verificar se está na pasta certa (esperado: SHEEPCARE na saída)
pwd

# 4. Verificar node_modules (esperado: lista de pastas)
ls node_modules | head -20

# 5. Verificar .env.local (esperado: mostra o arquivo)
cat .env.local

# 6. Tudo pronto? Execute:
npm run dev
```

### Se tudo der certo, a última linha será:
```
▲ Ready in 2.5s
```

---

## 🎯 PRÓXIMO PASSO

Quando você ver:
```
▲ Ready in X.Xs
```

Acesse: **http://localhost:3000**

Você verá a página de login do SheepCare (mesmo sem Supabase, ela carrega!)

---

## 🆘 PRECISA DE AJUDA?

Se algo não parecer com os exemplos:

1. **Copie o erro exato** que apareceu no terminal
2. **Verifique** qual exemplo acima é o mais parecido
3. **Siga a solução** indicada no exemplo

Erros comuns:
- "npm: command not found" → Reinstalar Node.js
- "ERESOLVE unable to resolve" → Usar `--legacy-peer-deps`
- "EACCES permission denied" → Usar `sudo` (Mac/Linux)

---

**Status:** Passo 1 está 100% completo quando você consegue rodar `npm run dev` com sucesso ✅
