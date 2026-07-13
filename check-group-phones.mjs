/**
 * Verificação de telefones do grupo de jovens
 * Uso: node check-group-phones.mjs
 *
 * Lê as variáveis do .env.local e consulta o Supabase REST API.
 * Requer Node 18+ (fetch nativo).
 */

import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Lê .env.local
const dir = dirname(fileURLToPath(import.meta.url));
const envPath = join(dir, '.env.local');
const envText = readFileSync(envPath, { encoding: 'utf-16le' }).replace(/\r/g, '');
const env = Object.fromEntries(
  envText.split('\n')
    .filter(l => l.includes('=') && !l.startsWith('#'))
    .map(l => { const i = l.indexOf('='); return [l.slice(0,i).trim(), l.slice(i+1).trim()]; })
);

// Tenta utf-16 e utf-8 para o .env.local
let SUPABASE_URL, SERVICE_KEY;
try {
  SUPABASE_URL = env['NEXT_PUBLIC_SUPABASE_URL'];
  SERVICE_KEY  = env['SUPABASE_SERVICE_ROLE_KEY'];
} catch {}

// Fallback: decodifica a partir do JWT
if (!SERVICE_KEY) {
  const envRaw = readFileSync(envPath, 'utf8').replace(/\0/g, '');
  const lines = Object.fromEntries(
    envRaw.split('\n')
      .filter(l => l.includes('=') && !l.startsWith('#'))
      .map(l => { const i = l.indexOf('='); return [l.slice(0,i).trim(), l.slice(i+1).trim()]; })
  );
  SUPABASE_URL = lines['NEXT_PUBLIC_SUPABASE_URL'];
  SERVICE_KEY  = lines['SUPABASE_SERVICE_ROLE_KEY'];
}

// Se URL não estiver no .env.local, extrai do JWT
if (!SUPABASE_URL && SERVICE_KEY) {
  const payload = JSON.parse(Buffer.from(SERVICE_KEY.split('.')[1], 'base64').toString());
  SUPABASE_URL = `https://${payload.ref}.supabase.co`;
}

if (!SERVICE_KEY) {
  console.error('SUPABASE_SERVICE_ROLE_KEY não encontrada no .env.local');
  process.exit(1);
}

const HEADERS = {
  apikey: SERVICE_KEY,
  Authorization: `Bearer ${SERVICE_KEY}`,
};

function stripDigits(s) { return s.replace(/\D/g,''); }

async function checkPhone(phone) {
  const d = stripDigits(phone);
  const last9 = d.slice(-9);
  const last8 = d.slice(-8);
  const or = [
    `phone.ilike.%${last9}%`,
    `whatsapp.ilike.%${last9}%`,
    `phone.ilike.%${last8}%`,
    `whatsapp.ilike.%${last8}%`,
  ].join(',');
  const url = `${SUPABASE_URL}/rest/v1/people?or=(${encodeURIComponent(or)})&select=id,full_name,phone,whatsapp,is_active,status&limit=3`;
  const r = await fetch(url, { headers: HEADERS });
  if (!r.ok) { console.error('Erro HTTP', r.status); return []; }
  return r.json();
}

// ── Contatos extraídos do grupo de jovens ──────────────────────────
const contacts = [
  ['~.',                '+55 43 9618-9541'],
  ['~Ana Paula Carvalho','+55 43 9126-0844'],
  ['~Eduardo',          '+55 43 9170-1429'],
  ['~Erick Garcia',     '+55 43 9119-7212'],
  ['~Gabriel Bernardes','+55 43 9834-3848'],
  ['~joãoo',            '+55 43 9617-6087'],
  ['~LucãoMC',          '+55 43 9907-4771'],
  ['~Luma',             '+55 41 8785-6590'],
  ['~Michel',           '+55 43 9647-0613'],
  ['~MILY LEITE',       '+55 43 9183-7674'],
  ['~Moniike*',         '+55 43 9962-1992'],
  ['~Suellen',          '+55 43 9110-5117'],
  ['~Thiagão',          '+55 43 9952-5355'],
  ['~thomas',           '+55 43 9634-9629'],
  ['(sem nome)',        '+55 43 9175-4333'],
  ['(sem nome)',        '+55 43 9699-6239'],
  ['(sem nome)',        '+55 43 9804-4067'],
  ['(sem nome)',        '+55 43 8834-0370'],
  ['(sem nome)',        '+55 43 9637-0895'],
  ['(sem nome)',        '+55 41 9776-8392'],
  ['(sem nome)',        '+55 43 92000-2759'],
  ['(sem nome)',        '+55 43 9604-1743'],
  ['(sem nome)',        '+55 43 9682-7422'],
  ['(sem nome)',        '+55 43 92003-4524'],
  ['(sem nome)',        '+55 43 9938-3238'],
  ['(sem nome)',        '+55 43 9115-9096'],
  ['(sem nome)',        '+55 14 99885-1927'],
  ['(sem nome)',        '+55 43 8485-6701'],
];

console.log(`\nConectando em: ${SUPABASE_URL}\n`);
console.log(`${'NOME WHATSAPP'.padEnd(26)} ${'TELEFONE'.padEnd(22)} CADASTRO`);
console.log('-'.repeat(85));

const notFound = [];
let foundCount = 0;

for (const [waName, phone] of contacts) {
  const matches = await checkPhone(phone);
  if (matches.length > 0) {
    foundCount++;
    for (const m of matches) {
      const atv = m.is_active ? 'ativo' : 'inativo';
      console.log(`${waName.padEnd(26)} ${phone.padEnd(22)} ✅  ${m.full_name}  [${m.status} / ${atv}]`);
    }
  } else {
    notFound.push([waName, phone]);
    console.log(`${waName.padEnd(26)} ${phone.padEnd(22)} ❌  NÃO ENCONTRADO`);
  }
}

console.log();
console.log(`Total: ${contacts.length}  |  Encontrados: ${foundCount}  |  Não cadastrados: ${notFound.length}`);

if (notFound.length > 0) {
  console.log('\n=== LISTA PARA CONTATAR (solicitar cadastro) ===');
  notFound.forEach(([n, p], i) => console.log(`  ${String(i+1).padStart(2)}. ${p}  (${n})`));
}
