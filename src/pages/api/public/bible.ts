import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') return res.status(405).end();

  const { book, chapter } = req.query;
  if (!book || !chapter) return res.status(400).json({ error: 'book e chapter obrigatorios' });

  const b = book as string;
  const c = chapter as string;

  // 1a tentativa: Almeida (tradução PT-BR)
  try {
    const r1 = await fetch(
      `https://bible-api.com/${encodeURIComponent(b)}+${encodeURIComponent(c)}?translation=almeida`,
      { headers: { 'User-Agent': 'AgentBot-Igreja/1.0' } }
    );
    if (r1.ok) {
      const d = await r1.json();
      if (d.verses && d.verses.length > 0) {
        return res.status(200).json({ verses: d.verses, lang: 'pt' });
      }
    }
  } catch (_) { /* ignora e tenta fallback */ }

  // 2a tentativa: KJV (inglês) — quando o livro não está na tradução Almeida
  try {
    const r2 = await fetch(
      `https://bible-api.com/${encodeURIComponent(b)}+${encodeURIComponent(c)}`,
      { headers: { 'User-Agent': 'AgentBot-Igreja/1.0' } }
    );
    if (r2.ok) {
      const d = await r2.json();
      if (d.verses && d.verses.length > 0) {
        return res.status(200).json({ verses: d.verses, lang: 'en' });
      }
    }
  } catch (_) { /* ignora */ }

  return res.status(404).json({ error: 'Passagem não encontrada' });
}
