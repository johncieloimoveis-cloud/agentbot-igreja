import type { NextApiRequest, NextApiResponse } from 'next';
import OpenAI from 'openai';

const SYSTEM_PROMPT = `Você é um analista teológico e literário especializado em música cristã evangélica.
Sua tarefa é avaliar letras de músicas gospel quanto à teocentricidade — o grau em que a música centra-se em Deus (Pai, Filho e Espírito Santo) versus no eu, emoções humanas ou benefícios pessoais.

Você deve analisar as seguintes dimensões:
1. Foco em Deus (Trindade): quanto a letra fala de Deus, Jesus ou o Espírito Santo como sujeito principal
2. Centralidade da graça e obra divina: presença da obra redentora, graça, misericórdia, soberania de Deus
3. Linguagem bíblica: uso de vocabulário, imagens e conceitos bíblicos reconhecíveis
4. Proporção Deus × eu: relação entre exaltação a Deus versus foco em sentimentos, bênçãos recebidas ou experiências pessoais
5. Adequação ao culto coletivo: se a letra convida a comunidade à adoração a Deus ou é mais uma expressão individual

Para cada dimensão, atribua uma nota de 0 a 10 e justifique com 1–2 frases, citando trecho da letra quando possível (trecho CURTO, máximo 10 palavras).

Ao final, calcule a nota geral de teocentricidade (média ponderada) e classifique em:
- 0–3: Baixa teocentricidade
- 4–6: Média teocentricidade
- 7–10: Alta teocentricidade

E conclua com uma recomendação:
- "Culto público" (adequada para adoração coletiva)
- "Devocional particular" (mais adequada para devoção individual)
- "Ambos" (adequada para ambos os contextos)

Responda SOMENTE em JSON válido, sem markdown, sem \`\`\`json, apenas o objeto JSON puro, neste formato exato:
{
  "titulo_detectado": "string ou null",
  "nota_geral": número de 0 a 10,
  "nivel": "Baixa" | "Média" | "Alta",
  "recomendacao": "Culto público" | "Devocional particular" | "Ambos",
  "resumo": "2-3 frases sobre a música como um todo",
  "dimensoes": [
    {
      "nome": "string",
      "nota": número,
      "justificativa": "string",
      "trecho": "string ou null"
    }
  ],
  "pontos_positivos": ["string", ...],
  "pontos_atencao": ["string", ...]
}`;

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end();

  const { letra, titulo } = req.body;
  if (!letra?.trim()) {
    return res.status(400).json({ error: 'A letra da música é obrigatória' });
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'OPENAI_API_KEY não configurada' });
  }

  const openai = new OpenAI({ apiKey });

  const userMessage = titulo
    ? `Música: "${titulo}"\n\nLetra:\n${letra.trim()}`
    : `Letra:\n${letra.trim()}`;

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: userMessage },
      ],
      max_tokens: 1200,
      temperature: 0.3,
    });

    const raw = completion.choices[0]?.message?.content?.trim() || '';

    let analise;
    try {
      analise = JSON.parse(raw);
    } catch {
      return res.status(500).json({ error: 'Erro ao interpretar resposta da IA', raw });
    }

    return res.status(200).json(analise);
  } catch (err: any) {
    console.error('Erro OpenAI:', err);
    return res.status(500).json({ error: 'Erro ao analisar letra', detail: err.message });
  }
}
