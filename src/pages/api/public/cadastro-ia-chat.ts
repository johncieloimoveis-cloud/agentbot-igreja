import type { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';
import OpenAI from 'openai';

export const config = { maxDuration: 30 };

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const ALL_FIELDS: Record<string, { label: string; hint: string }> = {
  full_name:       { label: 'Nome completo',          hint: 'ex: João da Silva' },
  date_of_birth:   { label: 'Data de nascimento',     hint: 'ex: 15 de março de 1990' },
  sex:             { label: 'Sexo',                   hint: 'Masculino ou Feminino' },
  estado_civil:    { label: 'Estado civil',           hint: 'ex: solteiro, casado, viúvo' },
  conjuge_nome:    { label: 'Nome do cônjuge',        hint: 'ex: Maria da Silva' },
  data_casamento:  { label: 'Data do casamento',      hint: 'ex: 10 de junho de 2005' },
  nacionalidade:   { label: 'Nacionalidade',          hint: 'ex: Brasileiro(a)' },
  naturalidade:    { label: 'Cidade natal',           hint: 'ex: São Paulo - SP' },
  escolaridade:    { label: 'Escolaridade',           hint: 'ex: ensino médio completo' },
  profissao:       { label: 'Profissão',              hint: 'ex: pedreiro, cozinheira' },
  cpf:             { label: 'CPF',                    hint: 'ex: 123.456.789-00' },
  data_conversao:  { label: 'Data de conversão',      hint: 'ex: março de 2015' },
  data_batismo:    { label: 'Data de batismo',        hint: 'ex: junho de 2015' },
  email:           { label: 'E-mail',                 hint: 'ex: joao@gmail.com' },
  phone:           { label: 'Telefone',               hint: 'ex: 11 91234-5678' },
  address:         { label: 'Endereço (rua)',         hint: 'ex: Rua das Flores, 123' },
  city:            { label: 'Cidade',                 hint: 'ex: Campinas - SP' },
};

const SKIP_IF: Record<string, (collected: Record<string, string>) => boolean> = {
  conjuge_nome:    (c) => !['casado', 'casada', 'união estável', 'uniao estavel'].some(v => c.estado_civil?.toLowerCase().includes(v)),
  data_casamento:  (c) => !['casado', 'casada', 'união estável', 'uniao estavel'].some(v => c.estado_civil?.toLowerCase().includes(v)),
};

function resolveActiveKeys(keys: string[], collected: Record<string, string>): string[] {
  return keys.filter(k => {
    const skipFn = SKIP_IF[k];
    if (skipFn && collected.estado_civil) return !skipFn(collected);
    return true;
  });
}

// Formata data YYYY-MM-DD para texto humano
function formatDateHuman(val: string): string {
  const MONTHS = ['janeiro','fevereiro','março','abril','maio','junho',
                  'julho','agosto','setembro','outubro','novembro','dezembro'];
  const m = val.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) return val;
  const year = parseInt(m[1]), month = parseInt(m[2]) - 1, day = parseInt(m[3]);
  if (day === 1 && month === 0) return `ano de ${year}`;
  if (day === 1) return `${MONTHS[month]} de ${year}`;
  return `${day} de ${MONTHS[month]} de ${year}`;
}

// Gera o resumo no servidor a partir de collected — garante que nunca apareça "[não informado]"
function buildSummaryText(keys: string[], collected: Record<string, string>): string {
  const effectiveKeys = resolveActiveKeys(keys, collected);
  const filled = effectiveKeys.filter(k => collected[k]?.trim());
  const lines = filled.map((k, i) => {
    let val = collected[k].trim();
    const DATE_FIELDS = ['date_of_birth','data_casamento','data_conversao','data_batismo'];
    if (DATE_FIELDS.includes(k)) val = formatDateHuman(val);
    if (k === 'cpf') {
      const d = val.replace(/\D/g, '');
      if (d.length === 11) val = `${d.slice(0,3)}.${d.slice(3,6)}.${d.slice(6,9)}-${d.slice(9)}`;
    }
    if (k === 'phone') {
      const d = val.replace(/\D/g, '');
      if (d.length >= 10) val = d.length === 11
        ? `(${d.slice(0,2)}) ${d.slice(2,7)}-${d.slice(7)}`
        : `(${d.slice(0,2)}) ${d.slice(2,6)}-${d.slice(6)}`;
    }
    return `${i + 1}. ${ALL_FIELDS[k]?.label ?? k}: ${val}`;
  });
  return lines.join('\n');
}

function buildSystemPrompt(activeKeys: string[], churchName: string, collected: Record<string, string>): string {
  const effectiveKeys = resolveActiveKeys(activeKeys, collected);
  const pending = effectiveKeys.filter(k => !collected[k]);
  const allDone = pending.length === 0;

  const fieldsList = effectiveKeys
    .map(k => {
      const done = collected[k] ? ` ✓ (${collected[k]})` : '';
      return `• ${ALL_FIELDS[k]?.label ?? k} [chave:"${k}"]${done}`;
    })
    .join('\n');

  const missingList = pending.map(k => ALL_FIELDS[k]?.label ?? k).join(', ');

  // Serializa o collected atual para incluir no prompt — a IA DEVE copiar isso de volta
  const collectedJson = JSON.stringify(collected);
  const hasCollected = Object.keys(collected).length > 0;

  return `Você é um assistente de cadastro da ${churchName}. Seja conversacional e natural — linguagem simples.

CAMPOS (✓ = já obtido):
${fieldsList}

${allDone
  ? 'TODOS os campos foram obtidos. Aguarde o usuário confirmar os dados.'
  : `AINDA FALTAM: ${missingList}`}

COMO OPERAR:
${pending.length === effectiveKeys.length
  ? `PRIMEIRO TURNO — nenhum dado coletado ainda:
   O usuário acaba de iniciar. Convide-o a falar TUDO de uma vez, listando os campos de forma compacta.
   Exemplo: "Pode me contar tudo de uma vez: nome, data de nascimento, estado civil, CPF, telefone, endereço... Vou anotando tudo e só peço o que faltar!"
   NÃO faça perguntas de campo específico neste turno.`
  : `1. Extraia TODOS os dados que o usuário mencionar em cada mensagem.
2. Agrupe os campos ainda faltantes e pergunte todos juntos: "Faltam só: X, Y e Z. Pode me passar?"
3. Quando tudo estiver ✓, diga "Confirma os dados acima?"
4. Quando o usuário confirmar, retorne done:true e confirmed:true.`}

REGRAS:
- Aceite dados em QUALQUER ORDEM — não force sequência
- Aceite respostas informais: "tenho 35 anos" → calcule o ano de nascimento; "casado" → Casado(a)
- CAMPOS CONDICIONAIS: se solteiro/divorciado/viúvo, NÃO pergunte cônjuge nem data de casamento
- EMAIL: "arroba"→"@", "ponto"→".". NUNCA adicione underscore sem o usuário pedir. Remova espaços na parte local: "john lobo arroba gmail"→"johnlobo@gmail.com". Sempre minúsculo.
- CPF: aceite qualquer sequência de 11 dígitos — sem validação matemática
- DATAS nas mensagens: SEMPRE por extenso ("19 de julho de 1964"), NUNCA YYYY-MM-DD

Retorne SOMENTE JSON:
{"message":"texto da resposta","spoken":"versão curta para áudio (máx 2 frases)","collected":{"campo":"valor"},"done":false,"confirmed":false}

ARMAZENAMENTO em "collected" — USE EXATAMENTE as chaves entre colchetes acima:
- Datas: YYYY-MM-DD (só ano → YYYY-01-01; mês/ano → YYYY-MM-01)
- Email: correto com @ e ponto
- CPF: só dígitos (ex: 55671772915)
- Telefone: só dígitos com DDD (ex: 43996446224)
- Sexo: SOMENTE "M" ou "F" (uma letra maiúscula — "Masculino"→"M", "Feminino"→"F")
- "collected" DEVE conter TODOS os campos já obtidos — nunca omita campos anteriores
- NUNCA invente chaves — use somente as chaves listadas acima (ex: "full_name" não "nome_completo")
${hasCollected ? `
⚠️ MEMÓRIA ATUAL — OBRIGATÓRIO: copie EXATAMENTE este JSON no campo "collected" da sua resposta, acrescentando apenas os campos novos extraídos da mensagem do usuário. NUNCA omita campos desta memória:
${collectedJson}` : ''}
`
}

function mapCollectedToDb(collected: Record<string, string>): Record<string, unknown> {
  const db: Record<string, unknown> = {};
  const DATE_FIELDS = ['date_of_birth','data_casamento','data_conversao','data_batismo'];
  for (const [key, val] of Object.entries(collected)) {
    if (!val?.trim()) continue;
    if (DATE_FIELDS.includes(key)) {
      const m = val.match(/(\d{4})-(\d{2})-(\d{2})/);
      db[key] = m ? val : null;
    } else if (key === 'sex') {
      // Coluna varchar(1) — normaliza para 'M' ou 'F'
      const v = val.trim().toLowerCase();
      db[key] = v.startsWith('f') ? 'F' : 'M';
    } else {
      db[key] = val;
    }
  }
  return db;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    const { slug } = req.query;
    if (!slug) return res.status(400).json({ error: 'slug obrigatorio' });
    const { data: church } = await supabaseAdmin
      .from('churches').select('id, name, cadastro_ia_campos').eq('slug', slug as string).single();
    if (!church) return res.status(404).json({ error: 'Igreja não encontrada' });
    const campos: { key: string; active: boolean }[] = church.cadastro_ia_campos ?? [];
    const activeKeys = campos.filter(c => c.active).map(c => c.key);
    const keys = activeKeys.length > 0 ? activeKeys : ['full_name','date_of_birth','sex','phone'];
    return res.status(200).json({
      churchName: church.name,
      fields: keys.map(k => ({ key: k, label: ALL_FIELDS[k]?.label ?? k })),
    });
  }

  if (req.method === 'POST') {
    const { slug, messages, collected } = req.body;
    if (!slug) return res.status(400).json({ error: 'slug obrigatorio' });
    if (!Array.isArray(messages)) return res.status(400).json({ error: 'messages invalido' });

    const { data: church } = await supabaseAdmin
      .from('churches').select('id, name, cadastro_ia_campos').eq('slug', slug as string).single();
    if (!church) return res.status(404).json({ error: 'Igreja não encontrada' });

    const campos: { key: string; active: boolean }[] = church.cadastro_ia_campos ?? [];
    const activeKeys = campos.filter(c => c.active).map(c => c.key);
    const keys = activeKeys.length > 0 ? activeKeys : ['full_name','date_of_birth','sex','phone'];

    const currentCollected: Record<string, string> = collected ?? {};
    const systemPrompt = buildSystemPrompt(keys, church.name, currentCollected);

    let aiJson: { message: string; spoken?: string; collected: Record<string, string>; done: boolean; confirmed: boolean } | null = null;
    let isSummary = false;

    try {
      const completion = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        temperature: 0.2,
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: systemPrompt },
          ...messages.slice(-16),
        ],
      });
      const raw = completion.choices[0]?.message?.content ?? '';
      aiJson = JSON.parse(raw);

      // Merge: campos anteriores nunca se perdem
      const aiCollected: Record<string, string> = aiJson!.collected ?? {};
      const mergedCollected: Record<string, string> = { ...currentCollected };
      for (const [k, v] of Object.entries(aiCollected)) {
        if (v?.trim()) mergedCollected[k] = v.trim();
      }
      aiJson!.collected = mergedCollected;

      // Garante que campos condicionais não apareçam em collected se não aplicável
      const MARRIED_STATES = ['casado', 'casada', 'união estável', 'uniao estavel'];
      const estadoCivil = mergedCollected.estado_civil?.toLowerCase() ?? '';
      const isMarried = estadoCivil && MARRIED_STATES.some(v => estadoCivil.includes(v));
      const isNotMarried = estadoCivil && !isMarried;
      if (isNotMarried) {
        delete mergedCollected['conjuge_nome'];
        delete mergedCollected['data_casamento'];
      }
      aiJson!.collected = mergedCollected;

      // Redireciona se a IA pedir campo condicional indevido.
      // Dispara em dois casos:
      //   1. estado_civil foi coletado NESSE turno como não-casado (sempre override, sem regex)
      //   2. a mensagem menciona cônjuge/casamento mesmo em turno posterior
      const justSetEstadoCivil = ('estado_civil' in aiCollected) && !currentCollected['estado_civil'];
      const mentionsSpouse = /c[oô]njuge|casamento|casar|esposo|esposa|marido|parceiro|companheiro/i.test(aiJson!.message);
      if (isNotMarried && (justSetEstadoCivil || mentionsSpouse) && !aiJson!.confirmed) {
        const nextKeys = resolveActiveKeys(keys, mergedCollected);
        const nextPending = nextKeys.filter(k => !mergedCollected[k]);
        const nextField = nextPending[0];
        if (nextField) {
          const label = ALL_FIELDS[nextField]?.label?.toLowerCase() ?? nextField;
          aiJson!.message = `Certo! Qual é o seu ${label}?`;
        } else {
          aiJson!.message = 'Certo! Verifique os dados e confirme se está tudo certo.';
        }
        aiJson!.spoken = aiJson!.message;
      }

      // Segurança: a IA não pode setar done=true sem confirmed=true
      if (aiJson!.done && !aiJson!.confirmed) {
        aiJson!.done = false;
      }

      // Detecta momento do resumo (todos os campos preenchidos, ainda não confirmado)
      const effectiveKeys = resolveActiveKeys(keys, mergedCollected);
      const pending = effectiveKeys.filter(k => !mergedCollected[k]);
      isSummary = pending.length === 0 && !aiJson!.confirmed;

      // RESUMO GERADO NO SERVIDOR — elimina "[não informado]" definitivamente
      if (isSummary) {
        const summaryText = buildSummaryText(keys, mergedCollected);
        aiJson!.message = `Aqui estão os dados coletados:\n\n${summaryText}\n\nEstá tudo certo?`;
        aiJson!.spoken = 'Por favor, leia os dados acima e me diga se está tudo certo.';
        aiJson!.done = false;
        aiJson!.confirmed = false;
      } else if (!aiJson!.spoken) {
        aiJson!.spoken = aiJson!.message;
      }

    } catch (e: any) {
      console.error('GPT erro:', e?.message);
      return res.status(500).json({ error: 'Erro ao processar resposta da IA' });
    }

    if (!aiJson) return res.status(500).json({ error: 'Resposta da IA inválida' });

    // Salva quando confirmado
    if (aiJson.confirmed && aiJson.done) {
      const dbFields = mapCollectedToDb(aiJson.collected);

      // Nome ausente: volta a pedir em vez de mostrar erro
      if (!dbFields.full_name) {
        console.error('Cadastro IA: full_name ausente', JSON.stringify({ currentCollected, merged: aiJson.collected }));
        return res.status(200).json({
          ...aiJson,
          saved: false,
          done: false,
          confirmed: false,
          message: 'Precisamos do seu nome completo. Qual é o seu nome completo?',
          spoken: 'Precisamos do seu nome completo. Qual é o seu nome?',
        });
      }

      try {
        const { error: dbErr } = await supabaseAdmin.from('people').insert({
          church_id: church.id,
          status: 'active_member',
          is_active: true,
          cadastro_atualizado_em: new Date().toISOString(),
          ...dbFields,
        });
        if (dbErr) {
          console.error('DB erro:', dbErr.message, dbErr.details, dbErr.hint);
          return res.status(200).json({ ...aiJson, saved: false, message: `Erro ao salvar: ${dbErr.message}` });
        }
        console.log('Cadastro IA salvo:', church.id, dbFields.full_name);
        return res.status(200).json({ ...aiJson, saved: true });
      } catch (insertErr: any) {
        console.error('Exceção ao salvar:', insertErr?.message);
        return res.status(200).json({ ...aiJson, saved: false, message: 'Erro inesperado ao salvar. Tente novamente.' });
      }
    }

    return res.status(200).json({ ...aiJson, saved: false, isSummary });
  }

  return res.status(405).end();
}
