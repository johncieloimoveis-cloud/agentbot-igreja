import type { NextApiRequest, NextApiResponse } from 'next';
import OpenAI from 'openai';

const SYSTEM_PROMPT = `Você é um especialista em Bíblia Sagrada e gerador de quiz bíblico.
Gere exatamente 10 perguntas de múltipla escolha sobre a Bíblia conforme os parâmetros fornecidos.
Cada pergunta deve ter 4 opções (a, b, c, d), apenas uma correta.
As perguntas devem ser variadas, criativas e precisas teologicamente.
Inclua uma explicação curta (1-2 frases) com a referência bíblica da resposta correta.

Responda SOMENTE com JSON válido puro, sem markdown, neste formato exato:
{
  "perguntas": [
    {
      "pergunta": "string",
      "opcoes": ["string", "string", "string", "string"],
      "correta": 0,
      "explicacao": "string com referência bíblica"
    }
  ]
}
O campo "correta" é o índice (0-3) da opção correta no array "opcoes".`;

const CATEGORIAS: Record<string, string> = {
  geral:         'Bíblia Geral (Antigo e Novo Testamento)',
  at:            'Antigo Testamento',
  nt:            'Novo Testamento',
  personagens:   'Personagens Bíblicos',
  evangelhos:    'Evangelhos (Mateus, Marcos, Lucas e João)',
  salmos:        'Salmos e Provérbios',
  profecias:     'Profecias e Profetas',
  vida_jesus:    'Vida e Ensinamentos de Jesus',
};

const DIFICULDADES: Record<string, string> = {
  facil:  'fácil (perguntas conhecidas, adequadas para iniciantes)',
  medio:  'médio (conhecimento intermediário da Bíblia)',
  dificil:'difícil (conhecimento aprofundado, detalhes específicos)',
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end();

  const { categoria = 'geral', dificuldade = 'medio' } = req.body;

  const categoriaDesc = CATEGORIAS[categoria] || CATEGORIAS.geral;
  const dificuldadeDesc = DIFICULDADES[dificuldade] || DIFICULDADES.medio;

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return res.status(500).json({ error: 'OPENAI_API_KEY não configurada' });

  const openai = new OpenAI({ apiKey });

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: `Categoria: ${categoriaDesc}\nDificuldade: ${dificuldadeDesc}\nGere 10 perguntas variadas sobre esse tema.` },
      ],
      max_tokens: 2000,
      temperature: 0.9,
    });

    const raw = completion.choices[0]?.message?.content?.trim() || '';
    let quiz;
    try {
      quiz = JSON.parse(raw);
    } catch {
      return res.status(500).json({ error: 'Erro ao interpretar resposta da IA', raw });
    }

    return res.status(200).json(quiz);
  } catch (err: any) {
    console.error('Erro OpenAI:', err);
    return res.status(500).json({ error: 'Erro ao gerar perguntas', detail: err.message });
  }
}
