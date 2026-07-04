import { supabase } from '@/services/supabase';

/**
 * Wrapper sobre fetch que adiciona automaticamente o token JWT
 * do usuário logado no header Authorization.
 *
 * Uso idêntico ao fetch nativo:
 *   const res = await fetchWithAuth('/api/admin/anuncios');
 *   const res = await fetchWithAuth('/api/admin/anuncios', { method: 'POST', body: JSON.stringify(data) });
 */
export async function fetchWithAuth(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  const token = session?.access_token;

  const { headers: userHeaders, ...restOptions } = options;

  return fetch(url, {
    ...restOptions,
    headers: {
      'Content-Type': 'application/json',
      ...(userHeaders as Record<string, string> | undefined),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });
}
