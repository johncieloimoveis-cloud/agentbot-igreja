import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/router';
import { Mic, MicOff, Send, Loader2, CheckCircle, Volume2, VolumeX, RefreshCw } from 'lucide-react';
import { PublicLayout } from '@/components/PublicLayout';

interface Message {
  role: 'assistant' | 'user';
  content: string;
}

interface AIResponse {
  message: string;
  collected: Record<string, string>;
  done: boolean;
  confirmed: boolean;
  saved: boolean;
}

export default function CadastroIa() {
  const router = useRouter();
  const slug = router.query.slug as string;

  const [churchName, setChurchName] = useState('');
  const [activeFields, setActiveFields] = useState<{ key: string; label: string }[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [collected, setCollected] = useState<Record<string, string>>({});
  const [input, setInput] = useState('');
  const [listening, setListening] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [muted, setMuted] = useState(false);
  const [done, setDone] = useState(false);
  const [saved, setSaved] = useState(false);
  const [started, setStarted] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(false);
  const [erro, setErro] = useState('');

  const recognitionRef = useRef<any>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const synthRef = useRef<SpeechSynthesisUtterance | null>(null);

  // Detecta suporte a SpeechRecognition
  useEffect(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    setSpeechSupported(!!SpeechRecognition);
  }, []);

  // Carrega config da igreja
  useEffect(() => {
    if (!slug) return;
    fetch(`/api/public/cadastro-ia-chat?slug=${slug}`)
      .then(r => r.json())
      .then(data => {
        setChurchName(data.churchName ?? '');
        setActiveFields(data.fields ?? []);
      })
      .catch(() => setErro('Erro ao carregar configuração'));
  }, [slug]);

  // Scroll para o fim
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, processing]);

  const speak = useCallback((text: string) => {
    if (muted || !('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'pt-BR';
    utterance.rate = 0.88;
    utterance.pitch = 1;
    synthRef.current = utterance;
    window.speechSynthesis.speak(utterance);
  }, [muted]);

  const sendMessage = useCallback(async (userText: string) => {
    if (!userText.trim() || processing) return;

    const userMsg: Message = { role: 'user', content: userText.trim() };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput('');
    setProcessing(true);
    setErro('');

    try {
      const r = await fetch('/api/public/cadastro-ia-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug, messages: newMessages, collected }),
      });
      if (!r.ok) {
        const errData = await r.json().catch(() => ({}));
        throw new Error(errData.error || `Erro ${r.status}`);
      }
      const data: AIResponse = await r.json();

      const aiMsg: Message = { role: 'assistant', content: data.message };
      setMessages(prev => [...prev, aiMsg]);
      // Merge: nunca perde campos anteriores caso a IA retorne collected incompleto
      setCollected(prev => ({ ...prev, ...(data.collected ?? {}) }));

      if (data.done) setDone(true);
      if (data.saved) setSaved(true);

      speak(data.message);
    } catch {
      setErro('Erro de conexão. Tente novamente.');
    } finally {
      setProcessing(false);
    }
  }, [messages, collected, slug, processing, speak]);

  const startConversation = async () => {
    setStarted(true);
    setProcessing(true);
    setErro('');
    try {
      // Mensagem inicial vazia para o AI abrir a conversa
      const r = await fetch('/api/public/cadastro-ia-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          slug,
          messages: [{ role: 'user', content: 'Olá, quero fazer meu cadastro.' }],
          collected: {},
        }),
      });
      if (!r.ok) {
        const errData = await r.json().catch(() => ({}));
        throw new Error(errData.error || `Erro ${r.status}`);
      }
      const data: AIResponse = await r.json();
      setMessages([
        { role: 'user', content: 'Olá, quero fazer meu cadastro.' },
        { role: 'assistant', content: data.message },
      ]);
      setCollected(data.collected ?? {});
      speak(data.message);
    } catch {
      setErro('Erro ao iniciar conversa. Tente novamente.');
      setStarted(false);
    } finally {
      setProcessing(false);
    }
  };

  const startListening = () => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    window.speechSynthesis.cancel(); // para de falar para ouvir

    const recognition = new SpeechRecognition();
    recognition.lang = 'pt-BR';
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setListening(false);
      sendMessage(transcript);
    };

    recognition.onerror = () => {
      setListening(false);
      setErro('Não foi possível capturar o áudio. Tente digitar.');
    };

    recognition.onend = () => setListening(false);

    recognitionRef.current = recognition;
    recognition.start();
    setListening(true);
  };

  const stopListening = () => {
    recognitionRef.current?.stop();
    setListening(false);
  };

  const restart = () => {
    window.speechSynthesis.cancel();
    setMessages([]);
    setCollected({});
    setDone(false);
    setSaved(false);
    setStarted(false);
    setErro('');
  };

  if (!slug) return null;

  // Tela de sucesso
  if (saved) return (
    <PublicLayout slug={slug}>
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-6 px-4">
        <div className="w-20 h-20 bg-green-100 dark:bg-green-900/40 rounded-full flex items-center justify-center">
          <CheckCircle className="w-10 h-10 text-green-500" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Cadastro salvo!</h2>
          <p className="text-gray-500 dark:text-gray-400">
            Suas informações foram registradas com sucesso.{' '}
            {churchName && <><br />Bem-vindo(a) à {churchName}!</>}
          </p>
        </div>
        <button
          onClick={() => router.push(`/i/${slug}`)}
          className="px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white rounded-xl font-semibold transition-colors"
        >
          Voltar ao portal
        </button>
      </div>
    </PublicLayout>
  );

  // Tela inicial (antes de começar)
  if (!started) return (
    <PublicLayout slug={slug}>
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-6 px-4">
        <div className="w-20 h-20 bg-primary-100 dark:bg-primary-900/40 rounded-full flex items-center justify-center">
          <Mic className="w-10 h-10 text-primary-600 dark:text-primary-400" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Cadastro por voz
          </h2>
          <p className="text-gray-500 dark:text-gray-400 max-w-sm">
            Uma assistente vai conversar com você e fazer algumas perguntas para completar
            seu cadastro {churchName ? `na ${churchName}` : 'na igreja'}.
          </p>
          {speechSupported && (
            <p className="mt-3 text-sm text-green-600 dark:text-green-400 flex items-center justify-center gap-1">
              <Volume2 className="w-4 h-4" /> Você pode responder com a voz ou digitando
            </p>
          )}
          {!speechSupported && (
            <p className="mt-3 text-sm text-amber-600 dark:text-amber-400">
              Seu navegador não suporta voz — você pode digitar as respostas.
            </p>
          )}
        </div>

        {activeFields.length > 0 && (
          <div className="text-left bg-gray-50 dark:bg-slate-800 rounded-xl p-4 w-full max-w-sm">
            <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">
              Informações que serão coletadas
            </p>
            <div className="flex flex-wrap gap-1.5">
              {activeFields.map(f => (
                <span key={f.key} className="px-2 py-0.5 bg-white dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-full text-xs text-gray-600 dark:text-gray-300">
                  {f.label}
                </span>
              ))}
            </div>
          </div>
        )}

        {erro && (
          <p className="text-red-600 dark:text-red-400 text-sm">{erro}</p>
        )}

        <button
          onClick={startConversation}
          disabled={processing}
          className="flex items-center gap-2 px-8 py-4 bg-primary-600 hover:bg-primary-700 disabled:opacity-60 text-white rounded-2xl font-bold text-lg transition-colors shadow-lg"
        >
          {processing ? <Loader2 className="w-5 h-5 animate-spin" /> : <Mic className="w-5 h-5" />}
          {processing ? 'Iniciando...' : 'Começar'}
        </button>
      </div>
    </PublicLayout>
  );

  // Chat
  return (
    <PublicLayout slug={slug}>
      <div className="flex flex-col h-[calc(100vh-8rem)]">
        {/* Header do chat */}
        <div className="flex items-center justify-between pb-3 border-b border-gray-200 dark:border-slate-700">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 bg-primary-600 rounded-full flex items-center justify-center">
              <Mic className="w-4 h-4 text-white" />
            </div>
            <div>
              <p className="font-semibold text-gray-900 dark:text-white text-sm">Assistente de Cadastro</p>
              <p className="text-xs text-gray-400 dark:text-gray-500">{churchName}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => { setMuted(m => !m); window.speechSynthesis.cancel(); }}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors"
              title={muted ? 'Ativar áudio' : 'Silenciar'}
            >
              {muted
                ? <VolumeX className="w-4 h-4 text-gray-400" />
                : <Volume2 className="w-4 h-4 text-gray-500" />}
            </button>
            <button
              onClick={restart}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors"
              title="Recomeçar"
            >
              <RefreshCw className="w-4 h-4 text-gray-500" />
            </button>
          </div>
        </div>

        {/* Mensagens */}
        <div className="flex-1 overflow-y-auto py-4 space-y-3">
          {messages.map((msg, i) => (
            <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[82%] px-4 py-3 rounded-2xl text-sm leading-relaxed ${
                msg.role === 'user'
                  ? 'bg-primary-600 text-white rounded-br-md'
                  : 'bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-gray-900 dark:text-white rounded-bl-md shadow-sm'
              }`}>
                {msg.content}
              </div>
            </div>
          ))}

          {processing && (
            <div className="flex justify-start">
              <div className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-2xl rounded-bl-md px-4 py-3 shadow-sm">
                <div className="flex gap-1 items-center h-4">
                  <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            </div>
          )}

          {erro && (
            <div className="flex justify-center">
              <p className="text-red-500 text-sm bg-red-50 dark:bg-red-900/20 px-3 py-1.5 rounded-full">{erro}</p>
            </div>
          )}

          <div ref={bottomRef} />
        </div>

        {/* Input */}
        {!done && (
          <div className="pt-3 border-t border-gray-200 dark:border-slate-700">
            <div className="flex items-end gap-2">
              <input
                type="text"
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMessage(input)}
                placeholder="Digite sua resposta..."
                disabled={processing || listening}
                className="flex-1 px-4 py-3 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:opacity-50"
              />

              {/* Botão enviar texto */}
              <button
                onClick={() => sendMessage(input)}
                disabled={!input.trim() || processing || listening}
                className="p-3 bg-primary-600 hover:bg-primary-700 disabled:opacity-40 text-white rounded-xl transition-colors"
              >
                <Send className="w-4 h-4" />
              </button>

              {/* Botão de voz */}
              {speechSupported && (
                <button
                  onPointerDown={startListening}
                  onPointerUp={stopListening}
                  onPointerLeave={stopListening}
                  disabled={processing}
                  className={`p-3 rounded-xl transition-all ${
                    listening
                      ? 'bg-red-500 text-white scale-110 shadow-lg shadow-red-200'
                      : 'bg-gray-100 dark:bg-slate-700 hover:bg-primary-100 dark:hover:bg-primary-900/40 text-gray-600 dark:text-gray-300 disabled:opacity-40'
                  }`}
                  title={listening ? 'Solte para enviar' : 'Segure para falar'}
                >
                  {listening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                </button>
              )}
            </div>
            {speechSupported && (
              <p className="text-center text-xs text-gray-400 mt-2">
                {listening ? '🔴 Ouvindo... solte o botão quando terminar' : 'Segure 🎤 para falar ou use o teclado'}
              </p>
            )}
          </div>
        )}
      </div>
    </PublicLayout>
  );
}
