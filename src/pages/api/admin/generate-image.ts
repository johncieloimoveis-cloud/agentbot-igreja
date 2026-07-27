import type { NextApiRequest, NextApiResponse } from 'next';
import OpenAI from 'openai';
import { withAuth, AuthUser } from '@/lib/withAuth';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

function buildPrompt(tipo: string, nome: string, tema: string): string {
  if (tipo === 'aniversario') {
    return `A vibrant, joyful biblical birthday celebration square image, style: ${tema}. Inspired by Psalm 139 — wonderfully made by God. Elements: open Bible, golden cross, dove of peace, olive branches, rays of divine light, colorful flowers. Deep warm colors — gold, blue, green. Soft watercolor or digital painting style. No text, no words, no letters anywhere in the image. Square 1:1 format.`;
  }
  // efemeride
  const descricao = nome ? `${nome}${tema ? ` — ${tema}` : ''}` : tema;
  return `A deeply meaningful biblical commemorative square image for the occasion: ${descricao}. Style: ${tema}. Elements: open Bible, cross of Christ, rays of light breaking through clouds, olive branch, dove, praying hands, or relevant biblical scene. Rich warm colors — gold, deep blue, white light. Painterly digital art style. No text, no words, no letters anywhere in the image. Square 1:1 format.`;
}

export default withAuth(
  ['Arcanjo', 'Querubim'],
  async (req: NextApiRequest, res: NextApiResponse, user: AuthUser) => {
    if (req.method !== 'POST') return res.status(405).end();

    const { tipo, nome, tema } = req.body;
    if (!tipo || (!nome && !tema)) {
      return res.status(400).json({ error: 'tipo e nome/tema sao obrigatorios' });
    }

    const prompt = buildPrompt(tipo, nome || '', tema || '');

    const models = ['gpt-image-1', 'dall-e-3', 'dall-e-2'];
    let lastErr = '';

    for (const model of models) {
      try {
        const response = await openai.images.generate({
          model,
          prompt,
          n: 1,
          size: '1024x1024',
        } as any);

        const item = response.data[0] as any;
        // gpt-image-1 retorna base64; dall-e-* retorna url
        const url = item?.url || (item?.b64_json ? `data:image/png;base64,${item.b64_json}` : null);
        if (!url) throw new Error('Imagem nao gerada');

        console.log(`Imagem gerada com modelo: ${model}`);
        return res.status(200).json({ url, prompt, model });
      } catch (e: any) {
        lastErr = e?.message || String(e);
        console.warn(`Modelo ${model} falhou:`, lastErr);
      }
    }

    return res.status(500).json({ error: `Nenhum modelo disponível. Último erro: ${lastErr}` });
  }
);
