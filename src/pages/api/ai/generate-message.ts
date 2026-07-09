import { getAuthUser } from '@/lib/withAuth';
import type { NextApiRequest, NextApiResponse } from 'next';
import OpenAI from 'openai';

const PROMPTS: Record<string, (ctx: any) => string> = {
  checkin: (ctx) =>
    `Você é um assistente pastoral que ajuda líderes de igreja a se comunicar com cuidado e afeto com os membros do grupo.
Escreva uma mensagem de WhatsApp curta e calorosa de check-in para ${ctx.name}.
A mensagem deve ser informal, amorosa, demonstrar interesse genuíno pela pessoa e perguntar como ela está.
Use linguagem cristã natural (sem ser excessivamente formal ou religioso).
Máximo 3 frases. Não use emojis em excesso. Não inclua saudação formal.`,

  resgate: (ctx) =>
    `Você é um assistente pastoral. Um membro chamado ${ctx.name} não aparece nos cultos/reuniões há ${ctx.weeksAbsent || 'algumas'} semanas.
Escreva uma mensagem de WhatsApp acolhedora e sem julgamento, demonstrando que a pessoa faz falta e que o líder está pensando nela.
Não pergunte diretamente "por que você sumiu". Mostre amor e abertura.
Máximo 4 frases. Tom caloroso e pastoral.`,

  aniversario: (ctx) =>
    `Você é um assistente pastoral. Hoje é aniversário de ${ctx.name}.
Escreva uma mensagem de parabéns genuína e personalizada, com bênçãos e afeto.
Tom: caloroso, cristão, alegre. Máximo 3 frases. Pode incluir 1 versículo curto se fizer sentido.`,

  tarefa: (ctx) =>
    `Você é um assistente pastoral. Existe uma tarefa de acompanhamento pendente relacionada a ${ctx.name}: "${ctx.taskTitle || 'acompanhamento pastoral'}".
Escreva uma mensagem de WhatsApp para iniciar esse acompanhamento de forma natural e acolhedora.
Não mencione diretamente que é uma "tarefa". Apenas inicie a conversa com cuidado e interesse genuíno.
Máximo 3 frases.`,
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Verifica autenticacao e plano
  const authUser = await getAuthUser(req);
  if (!authUser) {
    return res.status(401).json({ error: 'Nao autenticado' });
  }
  if (authUser.plano !== 'pagante') {
    return res.status(403).json({ error: 'Recurso disponivel apenas no plano pagante', upgrade: true });
  }

  const { messageType, personName, weeksAbsent, taskTitle } = req.body;

  if (!messageType || !personName) {
    return res.status(400).json({ error: 'messageType e personName são obrigatórios' });
  }

  const promptFn = PROMPTS[messageType];
  if (!promptFn) {
    return res.status(400).json({ error: 'Tipo de mensagem inválido' });
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'OPENAI_API_KEY não configurada no servidor' });
  }

  const openai = new OpenAI({ apiKey });

  try {
    const prompt = promptFn({ name: personName, weeksAbsent, taskTitle });

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'Você é um assistente pastoral especializado em comunicação cristã amorosa. Responda APENAS com o texto da mensagem, sem aspas, sem explicações adicionais.',
        },
        { role: 'user', content: prompt },
      ],
      max_tokens: 200,
      temperature: 0.8,
    });

    const message = completion.choices[0]?.message?.content?.trim() || '';
    return res.status(200).json({ message });
  } catch (err: any) {
    console.error('Erro OpenAI:', err);
    return res.status(500).json({ error: 'Erro ao gerar mensagem', detail: err.message });
  }
}
