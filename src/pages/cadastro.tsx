import { GetServerSideProps } from 'next';

export const getServerSideProps: GetServerSideProps = async () => {
  return {
    redirect: {
      destination: '/cadastro/imw-ibaiti',
      permanent: false,
    },
  };
};

export default function CadastroRedirect() {
  return null;
}
