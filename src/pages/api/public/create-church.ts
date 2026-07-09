import type { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end();

  const { church_name, slug: rawSlug, admin_email, admin_password } = req.body;

  if (!church_name?.trim()) return res.status(400).json({ error: 'Nome da igreja obrigatorio' });
  if (!admin_email?.trim()) return res.status(400).json({ error: 'E-mail do admin obrigatorio' });
  if (!admin_password || admin_password.length < 6) {
    return res.status(400).json({ error: 'Senha deve ter no minimo 6 caracteres' });
  }

  const slug = rawSlug?.trim() ? slugify(rawSlug.trim()) : slugify(church_name.trim());

  // Verifica se slug ja existe
  const { data: existing } = await supabaseAdmin
    .from('churches')
    .select('id')
    .eq('slug', slug)
    .maybeSingle();

  if (existing) {
    return res.status(409).json({ error: 'Esse slug ja esta em uso. Escolha outro nome.' });
  }

  // Cria a igreja
  const { data: church, error: churchError } = await supabaseAdmin
    .from('churches')
    .insert({ name: church_name.trim(), slug, plano: 'gratuito' })
    .select('id, name, slug')
    .single();

  if (churchError || !church) {
    return res.status(500).json({ error: churchError?.message || 'Erro ao criar igreja' });
  }

  // Busca o role_id do Arcanjo
  const { data: roleData } = await supabaseAdmin
    .from('roles')
    .select('id')
    .eq('name', 'Arcanjo')
    .single();

  if (!roleData) {
    // Desfaz a criação da igreja
    await supabaseAdmin.from('churches').delete().eq('id', church.id);
    return res.status(500).json({ error: 'Role Arcanjo nao encontrado no banco' });
  }

  // Cria o usuário admin no Supabase Auth
  const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
    email: admin_email.trim().toLowerCase(),
    password: admin_password,
    email_confirm: true,
  });

  if (authError || !authUser.user) {
    await supabaseAdmin.from('churches').delete().eq('id', church.id);
    return res.status(500).json({ error: authError?.message || 'Erro ao criar usuario' });
  }

  // Insere na tabela users
  const { error: userError } = await supabaseAdmin.from('users').insert({
    id: authUser.user.id,
    email: admin_email.trim().toLowerCase(),
    church_id: church.id,
    role_id: roleData.id,
    must_change_password: true,
  });

  if (userError) {
    await supabaseAdmin.auth.admin.deleteUser(authUser.user.id);
    await supabaseAdmin.from('churches').delete().eq('id', church.id);
    return res.status(500).json({ error: userError.message });
  }

  return res.status(200).json({
    success: true,
    church: { id: church.id, name: church.name, slug: church.slug },
    login_url: `/cadastro/${church.slug}`,
  });
}
