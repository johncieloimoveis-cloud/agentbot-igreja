import { useRouter } from 'next/router';
import Link from 'next/link';
import { BookOpen, Flame, UserPlus, MapPin, Heart, Music, Sparkles, Mic } from 'lucide-react';
import { PublicLayout } from '@/components/PublicLayout';

// Versículos rotativos por dia do ano (sem custo de IA)
const VERSICULOS = [
  { texto: 'Porque Deus amou o mundo de tal maneira que deu o seu Filho unigênito, para que todo aquele que nele crê não pereça, mas tenha a vida eterna.', ref: 'João 3:16' },
  { texto: 'O Senhor é o meu pastor e nada me faltará.', ref: 'Salmos 23:1' },
  { texto: 'Tudo posso naquele que me fortalece.', ref: 'Filipenses 4:13' },
  { texto: 'Porque sou eu que conheço os planos que tenho para vocês, diz o Senhor, planos de fazê-los prosperar e não de causar dano, planos de dar a vocês esperança e um futuro.', ref: 'Jeremias 29:11' },
  { texto: 'Confie no Senhor de todo o seu coração e não se apoie em seu próprio entendimento.', ref: 'Provérbios 3:5' },
  { texto: 'Buscai primeiro o reino de Deus e a sua justiça, e todas essas coisas vos serão acrescentadas.', ref: 'Mateus 6:33' },
  { texto: 'O amor é paciente, o amor é bondoso. Não inveja, não se vangloria, não se orgulha.', ref: '1 Coríntios 13:4' },
  { texto: 'Não andeis ansiosos por coisa alguma; antes, em tudo, pela oração e pela súplica, com ações de graças, apresentai as vossas petições a Deus.', ref: 'Filipenses 4:6' },
  { texto: 'O Senhor é a minha luz e a minha salvação; a quem temerei?', ref: 'Salmos 27:1' },
  { texto: 'Sede fortes e corajosos. Não temais, nem vos assusteis diante deles; porque o Senhor, vosso Deus, é quem vai convosco.', ref: 'Deuteronômio 31:6' },
  { texto: 'Vinde a mim, todos os que estais cansados e sobrecarregados, e eu vos aliviarei.', ref: 'Mateus 11:28' },
  { texto: 'O coração do homem planeja o seu caminho, mas o Senhor lhe dirige os passos.', ref: 'Provérbios 16:9' },
  { texto: 'Aquele que habita no esconderijo do Altíssimo e descansa à sombra do Onipotente dirá ao Senhor: "Tu és o meu refúgio e o meu castelo, o meu Deus em quem confio."', ref: 'Salmos 91:1-2' },
  { texto: 'Porque pela graça sois salvos, mediante a fé; e isso não vem de vós; é dom de Deus.', ref: 'Efésios 2:8' },
  { texto: 'Se algum de vós tem falta de sabedoria, peça-a a Deus, que a todos dá liberalmente e não faz reprovação.', ref: 'Tiago 1:5' },
  { texto: 'Alegrai-vos sempre no Senhor; outra vez digo: Alegrai-vos.', ref: 'Filipenses 4:4' },
  { texto: 'Porque os seus olhos estão sobre os caminhos do homem, e ele vê todos os seus passos.', ref: 'Jó 34:21' },
  { texto: 'E conhecereis a verdade, e a verdade vos libertará.', ref: 'João 8:32' },
  { texto: 'Não vos conformeis com este século, mas transformai-vos pela renovação do vosso entendimento.', ref: 'Romanos 12:2' },
  { texto: 'Porque eu sei os pensamentos que tenho a vosso respeito, diz o Senhor; pensamentos de paz e não de mal.', ref: 'Jeremias 29:11' },
  { texto: 'Deleita-te também no Senhor, e ele te concederá os desejos do teu coração.', ref: 'Salmos 37:4' },
  { texto: 'E tudo o que fizerdes, fazei-o de todo o coração, como ao Senhor e não aos homens.', ref: 'Colossenses 3:23' },
  { texto: 'O nome do Senhor é uma torre forte; para ela corre o justo e está seguro.', ref: 'Provérbios 18:10' },
  { texto: 'Lâmpada para os meus pés é a tua palavra e luz para o meu caminho.', ref: 'Salmos 119:105' },
  { texto: 'Porque nenhum outro nome há debaixo do céu, dado entre os homens, pelo qual devamos ser salvos.', ref: 'Atos 4:12' },
  { texto: 'Mas os que esperam no Senhor renovarão as suas forças; subirão com asas como águias.', ref: 'Isaías 40:31' },
  { texto: 'Porque onde estiverem dois ou três reunidos em meu nome, ali estou eu no meio deles.', ref: 'Mateus 18:20' },
  { texto: 'O Senhor te guardará de todo mal; guardará a tua alma.', ref: 'Salmos 121:7' },
];

function getVersiculoDoDia() {
  const inicio = new Date(new Date().getFullYear(), 0, 0);
  const hoje = new Date();
  const diff = hoje.getTime() - inicio.getTime();
  const dia = Math.floor(diff / (1000 * 60 * 60 * 24));
  return VERSICULOS[dia % VERSICULOS.length];
}

export default function PortalPublico() {
  const router = useRouter();
  const slug = router.query.slug as string;
  const versiculo = getVersiculoDoDia();

  if (!slug) return null;

  const base = '/i/' + slug;

  return (
    <PublicLayout slug={slug}>
      <div className="space-y-6">

        {/* Versículo do dia */}
        <div className="bg-gradient-to-br from-primary-600 to-primary-800 rounded-2xl p-6 text-white shadow-lg">
          <p className="text-[10px] font-bold uppercase tracking-widest text-primary-200 mb-3">Versículo do Dia</p>
          <blockquote className="text-base leading-relaxed font-medium italic mb-3">
            &ldquo;{versiculo.texto}&rdquo;
          </blockquote>
          <p className="text-primary-200 text-sm font-semibold">{versiculo.ref}</p>
        </div>

        {/* Estudos */}
        <div>
          <h2 className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-3">Estudos</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Link
              href={base + '/biblia'}
              className="flex items-center gap-4 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-2xl p-5 hover:border-primary-300 dark:hover:border-primary-700 hover:shadow-md transition-all group"
            >
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/40 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:bg-blue-200 dark:group-hover:bg-blue-900/60 transition-colors">
                <BookOpen className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="font-semibold text-gray-900 dark:text-white">Bíblia Sagrada</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Almeida · Domínio Público</p>
              </div>
            </Link>

            <Link
              href={base + '/devocionais'}
              className="flex items-center gap-4 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-2xl p-5 hover:border-primary-300 dark:hover:border-primary-700 hover:shadow-md transition-all group"
            >
              <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900/40 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:bg-orange-200 dark:group-hover:bg-orange-900/60 transition-colors">
                <Flame className="w-6 h-6 text-orange-500" />
              </div>
              <div>
                <p className="font-semibold text-gray-900 dark:text-white">Devocionais</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Reflexões da sua igreja</p>
              </div>
            </Link>

            <Link
              href={base + '/analise-letra'}
              className="flex items-center gap-4 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-2xl p-5 hover:border-primary-300 dark:hover:border-primary-700 hover:shadow-md transition-all group"
            >
              <div className="w-12 h-12 bg-violet-100 dark:bg-violet-900/40 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:bg-violet-200 dark:group-hover:bg-violet-900/60 transition-colors">
                <Music className="w-6 h-6 text-violet-600 dark:text-violet-400" />
              </div>
              <div>
                <p className="font-semibold text-gray-900 dark:text-white">Análise de Letra</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">IA avalia teocentricidade</p>
              </div>
            </Link>

            <Link
              href={base + '/quiz-biblico'}
              className="flex items-center gap-4 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-2xl p-5 hover:border-primary-300 dark:hover:border-primary-700 hover:shadow-md transition-all group"
            >
              <div className="w-12 h-12 bg-amber-100 dark:bg-amber-900/40 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:bg-amber-200 dark:group-hover:bg-amber-900/60 transition-colors">
                <Sparkles className="w-6 h-6 text-amber-600 dark:text-amber-400" />
              </div>
              <div>
                <p className="font-semibold text-gray-900 dark:text-white">Quiz Bíblico</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">10 perguntas geradas por IA</p>
              </div>
            </Link>

            <Link
              href={base + '/cadastro-ia'}
              className="flex items-center gap-4 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-2xl p-5 hover:border-primary-300 dark:hover:border-primary-700 hover:shadow-md transition-all group"
            >
              <div className="w-12 h-12 bg-green-100 dark:bg-green-900/40 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:bg-green-200 dark:group-hover:bg-green-900/60 transition-colors">
                <Mic className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="font-semibold text-gray-900 dark:text-white">Atualizar Cadastro</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Converse com a IA por voz</p>
              </div>
            </Link>
          </div>
        </div>

        {/* CTA cadastro */}
        <div className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-2xl p-6 flex flex-col sm:flex-row items-center gap-4">
          <div className="flex-1 text-center sm:text-left">
            <div className="flex items-center justify-center sm:justify-start gap-2 mb-1">
              <Heart className="w-4 h-4 text-red-500" />
              <p className="font-semibold text-gray-900 dark:text-white">Faça parte dessa comunidade</p>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400">Cadastre-se e acompanhe os grupos e atividades da igreja.</p>
          </div>
          <Link
            href={'/cadastro?slug=' + slug}
            className="flex-shrink-0 flex items-center gap-2 px-5 py-2.5 bg-primary-600 hover:bg-primary-700 text-white rounded-xl font-semibold text-sm transition-colors"
          >
            <UserPlus className="w-4 h-4" />
            Quero me cadastrar
          </Link>
        </div>

      </div>
    </PublicLayout>
  );
}
