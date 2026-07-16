import type { AppProps } from 'next/app';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { AuthProvider } from '@/context/AuthContext';
import { Layout } from '@/components/Layout';
import { supabase } from '@/services/supabase';
import '@/styles/globals.css';

// Páginas que não usam Layout
const NO_LAYOUT = ['/login', '/change-password', '/cadastro', '/anuncio'];
// Páginas que não precisam de autenticação
const PUBLIC_PAGES = ['/login', '/change-password', '/cadastro', '/anuncio'];

export default function App({ Component, pageProps }: AppProps) {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    document.documentElement.classList.add('dark');
    setMounted(true);
  }, []);

  // Redireciona para /change-password se for primeiro acesso
  useEffect(() => {
    const checkFirstAccess = async () => {
      if (PUBLIC_PAGES.includes(router.pathname)) return;
      const { data: { user } } = await supabase.auth.getUser();
      if (user?.user_metadata?.must_change_password === true) {
        router.replace('/change-password');
      }
    };
    checkFirstAccess();
  }, [router.pathname]);

  if (!mounted) return null;

  // Rotas públicas /i/[slug]/* não usam o Layout interno
  const isPublicPortal = router.pathname.startsWith('/i/');
  const shouldShowLayout = !NO_LAYOUT.includes(router.pathname) && !isPublicPortal;

  return (
    <AuthProvider>
      {shouldShowLayout ? (
        <Layout>
         