import type { NextApiRequest, NextApiResponse } from 'next';
import OpenAI from 'openai';
import { withAuth, AuthUser } from '@/lib/withAuth';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Temas visuais específicos por palavra-chave do evento
const EVENT_THEMES: Record<string, string> = {
  'natal':         'a nativity scene with the baby Jesus in a manger, the Star of Bethlehem shining overhead, Mary and Joseph, shepherds and wise men, warm candlelight glowing in a humble stable',
  'páscoa':        'the empty tomb of Christ at sunrise, the stone rolled away, rays of golden light flooding the entrance, a white linen cloth, blooming lilies and olive trees',
  'pentecostes':   'tongues of fire descending from heaven, a diverse group in prayer with uplifted hands, a dove surrounded by radiant light, deep red and gold tones',
  'mães':          'a loving mother holding her child tenderly, soft golden light, white lilies and pink roses, open Bible with gentle glow, warm pastel tones',
  'pais':          'a strong father with his child outdoors at sunset, a Bible in his hand, oak trees and open sky, warm amber and earth tones',
  'avós':          'gentle elderly hands holding a child\'s hands, a family Bible, autumn leaves, soft warm afternoon light, shades of gold and amber',
  'crianças':      'joyful children playing in a sunlit meadow, Jesus welcoming them with open arms, colorful butterflies and flowers, bright cheerful colors',
  'trabalhador':   'strong working hands raised in worship at sunset, tools of labor beside an open Bible, golden light breaking over a field',
  'missões':       'a globe surrounded by rays of light, diverse hands reaching toward each other, a cross at the center, world map in the background, deep blue and gold',
  'pastor':        'a shepherd on a hillside at dawn, staff in hand, sheep around him, a radiant sunrise, deep blues and warm gold tones',
  'reforma':       'an open Bible bathed in golden light on a stone desk, a quill pen, a cross, autumn leaves, rich dark tones with warm highlights',
  'bíblia':        'a large open Bible radiating divine light, rays emanating from its pages, pages turning in a gentle wind, deep blue and gold background',
  'evangelista':   'a figure on a hilltop with arms raised preaching to a crowd, a cross of light in the sky, sunrise, bold gold and amber tones',
  'mulher':        'a strong, graceful woman in prayer at sunrise, surrounded by blooming flowers and soft light, a Bible open beside her',
  'namorados':     'two hands gently joined, wedding rings, white and pink roses, soft candlelight, open Bible with hearts and golden glow',
  'independência': 'a sunrise over rolling hills with a golden cross and an open Bible, gentle patriotic symbolism, green and gold warm tones',
  'professor':     'an open book surrounded by warm light, a teacher\'s hands over a globe, children learning around a table bathed in sunshine',
  'médico':        'healing hands bathed in warm light, a dove above, simple medical elements, a cross of light, soft blues and whites',
  'músico':        'a musician worshipping with raised hands, musical notes rising into beams of light, a choir in the background, warm gold and purple tones',
  'idoso':         'an elderly person reading the Bible in a rocking chair bathed in afternoon sunlight, flowers on the windowsill, soft warm tones',
  'agricultor':    'a farmer\'s hands holding wheat grains, a sunrise over a harvest field, a small cross on a hill in the background, earth tones and gold',
  'pedreiro':      'strong hands laid on a cornerstone with a cross engraved, a building under construction at sunrise, warm amber light',
  'ramos':         'a crowd waving palm branches on a sunlit road, Jesus entering humbly on a donkey, Jerusalem in the background, warm golden tones',
};

function getEventualTheme(descricao: string): string {
  const lower = descricao.toLowerCase();
  for (const [key, theme] of Object.entries(EVENT_THEMES)) {
    if (lower.includes(key)) return theme;
  }
  // genérico para eventos sem mapeamento específico
  return 'a meaningful biblical scene with rays of divine light, an open Bible, and symbolic elements that represent the occasion';
}

// Variações de composição para evitar imagens idênticas
const COMPOSITIONS = [
  'centered composition with radiant light from above',
  'wide angle with dramatic sky and foreground details',
  'close-up intimate scene with soft bokeh background',
  'golden hour side lighting with long shadows',
  'overhead view with symmetrical arrangement',
];

function buildPrompt(tipo: string, nome: string, descricao: string, tema: string): string {
  const comp = COMPOSITIONS[Math.floor(Math.random() * COMPOSITIONS.length)];
  const styleDesc = tema || 'painterly digital art';

  if (tipo === 'aniversario') {
    return `A vibrant, joyful birthday celebration image in a ${styleDesc} style, ${comp}. Theme: celebrating a life blessed by God. Visual elements: colorful birthday flowers, a glowing birthday candle, gentle rays of divine light, soft pastel and gold tones, a subtle open Bible in the background. Feel: warm, celebratory, spiritually uplifting. No text, no words, no letters anywhere. Square 1:1 format.`;
  }

  // efeméride — tema específico por evento
  const eventVisuals = getEventualTheme(descricao || nome);
  return `A deeply meaningful Christian commemorative image in a ${styleDesc} style, ${comp}. Occasion: ${nome}. Specific visual scene: ${eventVisuals}. Style details: rich, painterly, spiritual atmosphere, high detail, divine light effects. No text, no words, no letters anywhere in the image. Square 1:1 format.`;
}

export default withAuth(
  ['Arcanjo', 'Querubim'],
  async (req: NextApiRequest, res: NextApiResponse, user: AuthUser) => {
    if (req.method !== 'POST') return res.status(405).end();

    // Aceita tanto 'nome' quanto 'descricao' para compatibilidade
    const { tipo, nome, descricao, tema } = req.body;
    if (!tipo || (!nome && !descricao && !tema)) {
      return res.status(400).json({ error: 'tipo e nome/descricao/tema sao obrigatorios' });
    }

    const prompt = buildPrompt(tipo, nome || descricao || '', descricao || nome || '', tema || '');

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
