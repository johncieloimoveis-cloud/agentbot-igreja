import type { AppProps } from 'next/app';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { AuthProvider } from '@/context/AuthContext';
import { Layout } from '@/components/Layout';
import '@/styles/globals.css';

export default function App({ Component, pageProps }: AppProps) {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // Aplicar tema escuro por padrão
    document.documentElement.classList.add('dark');
    setMounted(true);
  }, []);

  if (!mounted) return null;

  // Páginas que não devem ter Layout (login, etc)
  const noLayoutPages = ['/login'];

  const shouldShowLayout = !noLayoutPages.includes(router.pathname);

  return (
    <AuthProvider>
      {shouldShowLayout ? (
        <Layout>
          <Component {...pageProps} />
        </Layout>
      ) : (
        <Component {...pageProps} />
      )}
    </AuthProvider>
  );
}
