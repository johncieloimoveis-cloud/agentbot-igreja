import { GetServerSideProps } from 'next';

export const getServerSideProps: GetServerSideProps = async (ctx) => {
  const slug = ctx.query.slug as string | undefined;
  return {
    redirect: {
      destination: slug ? `/cadastro/${slug}` : '/cadastro/imw-ibaiti',
      permanent: false,
    },
  };
};

export default function CadastroRedirect() {
  return null;
}
