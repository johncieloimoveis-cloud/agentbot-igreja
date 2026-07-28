import type { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';
import OpenAI from 'openai';

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

function buildSystemPrompt(activeKeys: string[], churchName: string): string {
  const fieldsList = activeKeys
    .map((k, i) => `${i + 1}. ${ALL_FIELDS[k]?.label ?? k} (${ALL_FIELDS[k]?.hint ?? ''})`)
    .join('\n');

  return `Você é um assistente de cadastro da ${churchName}. Seu objetivo é coletar informações pessoais dos membros de forma amigável, em português simples e acolhedor.

Campos a coletar (nesta ordem):
${fieldsList}

Regras OBRIGATÓRIAS:
- Pergunte apenas UM campo por vez
- Use linguagem muito simples — o público pode ter pouca escolaridade
- Seja acolhedor, breve e paciente
- Interprete respostas informais (ex: "tenho 35 anos" → calcule o ano de nascimento aproximado)
- Confirme o que entendeu e passe para o próximo campo ainda pendente
- Quando TODOS os campos estiverem preenchidos, faça um resumo numerado e pergunte: "Está tudo correto? Posso salvar?"
- Se o usuário confirmar (ex: "sim", "pode", "tá certo", "correto"), retorne confirmed: true e done: true
- Se pedir correção, volte ao campo específico e colete novamente

FORMATO DE RESPOSTA — responda SEMPRE em JSON válido, sem markdown, sem explicação extra:
{"message":"texto a ser falado","collected":{"campo":"valor"},"done":false,"confirmed":false}

O objeto "collected" deve conter TODOS os campos já coletados (acumule, não esqueça os anteriores).
Datas devem ser convertidas para o formato YYYY-MM-DD quando possível; se só souber o mês/ano, use o dia 01.
Campos de texto livre: capitalize adequadamente.`;
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

    const systemPrompt = buildSystemPrompt(keys, church.name);

    // Chama GPT-4 para processar a conversa
    let aiJson: { message: string; collected: Record<string, string>; done: boolean; confirmed: boolean } | null = null;

    try {
      const completion = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        temperature: 0.3,
        messages: [
          { role: 'system', content: systemPrompt },
          // Injeta estado atual dos campos coletados
          {
            role: 'system',
            content: `Estado atual dos campos coletados: ${JSON.stringify(collected ?? {})}`,
          },
          ...messages,
        ],
      });

      const raw = completion.choices[0]?.message?.content ?? '';
      // Extrai JSON da resposta (remove possível markdown)
      const jsonMatch = raw.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        aiJson = JSON.parse(jsonMatch[0]);
      }
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
        return res.status(200).json({ ...aiJson, saved: false });
      }

      const { error: dbErr } = await supabaseAdmin.from('people').insert({
        church_id: church.id,
        status: 'member',
        is_active: true,
        cadastro_atualizado_em: new Date().toISOString(),
        ...dbFields,
      });

      if (dbErr) {
        console.error('DB erro:', dbErr.message);
        return res.status(200).json({
          ...aiJson,
          saved: false,
          message: 'Houve um erro ao salvar. Por favor, tente novamente.',
        });
      }

      return res.status(200).json({ ...aiJson, saved: true });
    }

    return res.status(200).json({ ...aiJson, saved: false });
  }

  return res.status(405).end();
}
