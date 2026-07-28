import type { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';
import OpenAI from 'openai';

// Aumenta limite de execução para 30s (plano Vercel hobby permite até 60s em alguns casos)
export const config = { maxDuration: 30 };

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Todos os campos suportados (master list)
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

// Campos que dependem de outro campo ter um valor específico
// Se a condição não for atendida, o campo é pulado automaticamente
const SKIP_IF: Record<string, (collected: Record<string, string>) => boolean> = {
  conjuge_nome:    (c) => !['Casado(a)', 'casado', 'casada', 'união estável', 'uniao estavel'].some(v => c.estado_civil?.toLowerCase().includes(v.toLowerCase())),
  data_casamento:  (c) => !['Casado(a)', 'casado', 'casada', 'união estável', 'uniao estavel'].some(v => c.estado_civil?.toLowerCase().includes(v.toLowerCase())),
};

function resolveActiveKeys(keys: string[], collected: Record<string, string>): string[] {
  return keys.filter(k => {
    const skipFn = SKIP_IF[k];
    // Só pula se o campo de controle já foi respondido E a condição não se aplica
    if (skipFn && collected.estado_civil) return !skipFn(collected);
    return true;
  });
}

function buildSystemPrompt(activeKeys: string[], churchName: string, collected: Record<string, string>): string {
  // Aplica regras condicionais (ex: pular cônjuge se solteiro)
  const effectiveKeys = resolveActiveKeys(activeKeys, collected);

  const fieldsList = effectiveKeys
    .map((k, i) => {
      const done = collected[k] ? ` ✓ (${collected[k]})` : '';
      return `${i + 1}. ${ALL_FIELDS[k]?.label ?? k}${done}`;
    })
    .join('\n');

  const pending = effectiveKeys.filter(k => !collected[k]);
  const nextField = pending[0] ? ALL_FIELDS[pending[0]]?.label ?? pending[0] : null;
  const allDone = pending.length === 0;

  return `Você é um assistente de cadastro da ${churchName}. Colete as informações abaixo em português muito simples.

CAMPOS (✓ = já coletado):
${fieldsList}

${allDone
  ? 'TODOS os campos foram coletados. Faça um resumo numerado e pergunte se pode salvar.'
  : `PRÓXIMO CAMPO A PERGUNTAR AGORA: "${nextField}" — não peça nenhum outro campo antes deste.`
}

REGRA CRÍTICA — formato de resposta em cada turno:
A) Quando receber resposta válida: confirme em 1 frase curta E imediatamente pergunte o campo indicado em "PRÓXIMO CAMPO". Tudo na mesma mensagem.
B) Quando todos os campos estiverem ✓: faça um resumo numerado e pergunte se pode salvar.
C) Quando o usuário confirmar o resumo ("sim", "pode", "tá certo"): retorne done:true e confirmed:true.

REGRAS DE LINGUAGEM:
- Linguagem simples (público de baixa escolaridade)
- Aceite respostas informais ("tenho 35 anos" → calcule o ano; "casado" → Casado(a))
- CAMPOS CONDICIONAIS: se o usuário disser que é solteiro, divorciado ou viúvo, NÃO pergunte cônjuge nem data de casamento — pule direto para o próximo campo da lista acima
- EMAIL falado por voz: "arroba" → "@", "ponto" → ".", "underline" → "_" (reconstrua o endereço corretamente). IMPORTANTE: remova todos os espaços da parte local (antes do @). Ex: "john lobo arroba gmail ponto com" → "johnlobo@gmail.com". Email sempre em minúsculo.
- Se pedir correção, volte ao campo específico

REGRAS DE DATAS NAS MENSAGENS (muito importante):
- NUNCA escreva datas no formato YYYY-MM-DD nas suas mensagens para o usuário
- SEMPRE escreva datas por extenso: "19 de julho de 1964", "abril de 1993", "junho de 2015"
- Quando o usuário disser "19 07 1964" ou "1964-07-19", confirme como "19 de julho de 1964"
- Datas com só o ano: "2015" → confirme como "ano de 2015"
- Datas com mês e ano: "04/1993" → confirme como "abril de 1993"

REGRA DO CPF (muito importante):
- Aceite QUALQUER sequência de 11 dígitos como CPF válido — NÃO faça validação matemática
- NÃO rejeite CPF, NÃO diga que o CPF é inválido, NÃO peça para repetir por causa dos dígitos
- O usuário pode falar os dígitos em grupos: "556 717 729 15" → armazene como "55671772915"
- Se o usuário disser que não sabe o CPF ou não tem, aceite e siga para o próximo campo

Retorne SOMENTE JSON (sem markdown):
{"message":"texto","spoken":"frase curta para áudio","collected":{"campo":"valor"},"done":false,"confirmed":false}

REGRA DO CAMPO "spoken" (o que será lido em voz alta):
- Em turnos normais (confirmando um campo e perguntando o próximo): "spoken" = igual ao "message"
- Quando apresentar o RESUMO FINAL: "spoken" = APENAS "Por favor, leia o resumo acima e me diga se está tudo certo." — NÃO leia todos os campos em voz alta
- Quando o usuário confirmar e o cadastro for salvo: "spoken" = "Perfeito! Seu cadastro foi salvo com sucesso."

REGRAS DE ARMAZENAMENTO em "collected" (interno — nunca exibir ao usuário):
- Datas: YYYY-MM-DD (se só ano → use YYYY-01-01; se só mês/ano → use YYYY-MM-01)
- Email: formato correto com @ e . (ex: joao@gmail.com)
- CPF: apenas os dígitos sem pontuação (ex: 55671772915)
- Telefone: apenas dígitos com DDD (ex: 43996446224)
- "collected" DEVE conter ABSOLUTAMENTE TODOS os campos já coletados anteriormente — NUNCA omita campos anteriores

REGRAS DO RESUMO FINAL (quando todos os campos estiverem prontos):
- Exiba datas em formato humano (ex: "19 de julho de 1964", "abril de 1993"), NUNCA como YYYY-MM-DD
- Formate CPF como XXX.XXX.XXX-XX
- Formate telefone como (XX) XXXXX-XXXX
- Omita do resumo qualquer campo que estiver vazio ou não se aplicar`
}


function mapCollectedToDb(collected: Record<string, string>): Record<string, unknown> {
  const db: Record<string, unknown> = {};
  const dateFields = ['date_of_birth', 'data_casamento', 'data_conversao', 'data_batismo'];

  for (const [key, val] of Object.entries(collected)) {
    if (!val || val === '') continue;
    if (dateFields.includes(key)) {
      // Aceita YYYY-MM-DD ou tenta parse
      const m = val.match(/(\d{4})-(\d{2})-(\d{2})/);
      db[key] = m ? val : null;
    } else {
      db[key] = val;
    }
  }
  return db;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // GET: retorna os campos configurados para a igreja
  if (req.method === 'GET') {
    const { slug } = req.query;
    if (!slug) return res.status(400).json({ error: 'slug obrigatorio' });

    const { data: church } = await supabaseAdmin
      .from('churches')
      .select('id, name, cadastro_ia_campos')
      .eq('slug', slug as string)
      .single();

    if (!church) return res.status(404).json({ error: 'Igreja não encontrada' });

    const campos: { key: string; active: boolean }[] = church.cadastro_ia_campos ?? [];
    const activeKeys = campos.filter(c => c.active).map(c => c.key);

    // Se admin não configurou nada, usa set padrão mínimo
    const defaults = ['full_name', 'date_of_birth', 'sex', 'phone'];
    const keys = activeKeys.length > 0 ? activeKeys : defaults;

    return res.status(200).json({
      churchName: church.name,
      fields: keys.map(k => ({ key: k, label: ALL_FIELDS[k]?.label ?? k })),
    });
  }

  // POST: processa uma mensagem do chat
  if (req.method === 'POST') {
    const { slug, messages, collected } = req.body;

    if (!slug) return res.status(400).json({ error: 'slug obrigatorio' });
    if (!Array.isArray(messages)) return res.status(400).json({ error: 'messages invalido' });

    // Resolve slug → church
    const { data: church } = await supabaseAdmin
      .from('churches')
      .select('id, name, cadastro_ia_campos')
      .eq('slug', slug as string)
      .single();

    if (!church) return res.status(404).json({ error: 'Igreja não encontrada' });

    const campos: { key: string; active: boolean }[] = church.cadastro_ia_campos ?? [];
    const activeKeys = campos.filter(c => c.active).map(c => c.key);
    const defaults = ['full_name', 'date_of_birth', 'sex', 'phone'];
    const keys = activeKeys.length > 0 ? activeKeys : defaults;

    const currentCollected: Record<string, string> = collected ?? {};
    // Prompt já inclui estado de collected e próximo campo a perguntar
    const systemPrompt = buildSystemPrompt(keys, church.name, currentCollected);

    // Chama GPT-4 para processar a conversa
    let aiJson: { message: string; spoken?: string; collected: Record<string, string>; done: boolean; confirmed: boolean } | null = null;

    try {
      // response_format garante JSON válido sempre
      const completion = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        temperature: 0.2,
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: systemPrompt },
          // Limita histórico para evitar context bloat (últimas 16 mensagens)
          ...messages.slice(-16),
        ],
      });

      const raw = completion.choices[0]?.message?.content ?? '';
      aiJson = JSON.parse(raw);

      // Merge server-side: garante que campos anteriores nunca sejam perdidos
      // A IA pode retornar collected incompleto — completamos com o que já sabíamos
      const aiCollected: Record<string, string> = aiJson.collected ?? {};
      const mergedCollected: Record<string, string> = { ...currentCollected };
      for (const [k, v] of Object.entries(aiCollected)) {
        if (v && v.trim()) mergedCollected[k] = v.trim(); // IA retornou valor → usa
      }
      aiJson.collected = mergedCollected;
    } catch (e: any) {
      console.error('GPT erro:', e?.message);
      return res.status(500).json({ error: 'Erro ao processar resposta da IA' });
    }

    if (!aiJson) {
      return res.status(500).json({ error: 'Resposta da IA inválida' });
    }

    // Se confirmado, salva no banco
    if (aiJson.confirmed && aiJson.done) {
      const dbFields = mapCollectedToDb(aiJson.collected);

      if (!dbFields.full_name) {
        console.error('Cadastro IA: full_name ausente no collected', aiJson.collected);
        return res.status(200).json({ ...aiJson, saved: false, message: 'Nome não foi coletado. Por favor, tente novamente.' });
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
          console.error('DB erro ao salvar cadastro IA:', dbErr.message, dbErr.details, dbErr.hint);
          return res.status(200).json({
            ...aiJson,
            saved: false,
            message: `Erro ao salvar: ${dbErr.message}`,
          });
        }

        console.log('Cadastro IA salvo com sucesso para church_id:', church.id, 'nome:', dbFields.full_name);
        return res.status(200).json({ ...aiJson, saved: true });
      } catch (insertErr: any) {
        console.error('Exceção ao salvar cadastro IA:', insertErr?.message);
        return res.status(200).json({
          ...aiJson,
          saved: false,
          message: 'Erro inesperado ao salvar. Por favor, tente novamente.',
        });
      }
    }

    return res.status(200).json({ ...aiJson, saved: false });
  }

  return res.status(405).end();
}
