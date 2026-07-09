import { useState } from 'react';
import { MessageCircle, Copy, Check, ChevronDown } from 'lucide-react';

interface WhatsAppShareProps {
  phone?: string;
  message: string;
  onCopy?: () => void;
  size?: 'sm' | 'md';
}

function buildUrl(phone: string, message: string, business = false) {
  const cleaned = phone.replace(/\D/g, '');
  const encoded = encodeURIComponent(message);
  const num = cleaned ? `55${cleaned}` : '';

  if (business) {
    // Android: intent URI targeting com.whatsapp.w4b (WhatsApp Business)
    if (typeof navigator !== 'undefined' && /android/i.test(navigator.userAgent)) {
      return num
        ? `intent://send?phone=${num}&text=${encoded}#Intent;package=com.whatsapp.w4b;scheme=whatsapp;end`
        : `intent://send?text=${encoded}#Intent;package=com.whatsapp.w4b;scheme=whatsapp;end`;
    }
    // iOS: whatsapp-business scheme (funciona se WA Business estiver instalado)
    if (typeof navigator !== 'undefined' && /iphone|ipad|ipod/i.test(navigator.userAgent)) {
      return num
        ? `whatsapp-business://send?phone=${num}&text=${encoded}`
        : `whatsapp-business://send?text=${encoded}`;
    }
    // Desktop: mesmo link wa.me (o navegador/OS decide)
    return num ? `https://wa.me/${num}?text=${encoded}` : `https://wa.me/?text=${encoded}`;
  }

  return num ? `https://wa.me/${num}?text=${encoded}` : `https://wa.me/?text=${encoded}`;
}

export function WhatsAppShare({ phone = '', message, onCopy, size = 'sm' }: WhatsAppShareProps) {
  const [copied, setCopied] = useState(false);
  const [open, setOpen] = useState(false);

  const px = size === 'sm' ? 'px-3 py-1.5 text-xs' : 'px-4 py-2 text-sm';
  const icon = size === 'sm' ? 'w-3 h-3' : 'w-4 h-4';

  const handleCopy = () => {
    navigator.clipboard.writeText(message);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    onCopy?.();
  };

  return (
    <div className="flex items-center gap-2 flex-wrap">
      {/* Botão principal WhatsApp com dropdown */}
      <div className="relative">
        <div className="flex items-center">
          <a
            href={buildUrl(phone, message, false)}
            target="_blank"
            rel="noopener noreferrer"
            className={`flex items-center gap-1.5 ${px} bg-green-600 hover:bg-green-700 text-white font-semibold rounded-l-lg transition-colors`}
          >
            <MessageCircle className={icon} />
            WhatsApp
          </a>
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            className={`${size === 'sm' ? 'px-1.5 py-1.5' : 'px-2 py-2'} bg-green-700 hover:bg-green-800 text-white rounded-r-lg border-l border-green-500 transition-colors`}
            title="Mais opções"
          >
            <ChevronDown className={icon} />
          </button>
        </div>

        {open && (
          <div className="absolute left-0 top-full mt-1 z-20 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg shadow-lg min-w-[160px]">
            <a
              href={buildUrl(phone, message, false)}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-slate-700 rounded-t-lg"
            >
              <MessageCircle className="w-4 h-4 text-green-600" />
              WhatsApp Pessoal
            </a>
            <a
              href={buildUrl(phone, message, true)}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-slate-700 rounded-b-lg border-t border-gray-100 dark:border-slate-700"
            >
              <MessageCircle className="w-4 h-4 text-teal-600" />
              WhatsApp Business
            </a>
          </div>
        )}
      </div>

      {/* Copiar */}
      <button
        type="button"
        onClick={handleCopy}
        className={`flex items-center gap-1.5 ${px} bg-gray-200 hover:bg-gray-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-gray-700 dark:text-gray-200 font-semibold rounded-lg transition-colors`}
      >
        {copied ? <Check className={`${icon} text-green-600`} /> : <Copy className={icon} />}
        {copied ? 'Copiado!' : 'Copiar'}
      </button>
    </div>
  );
}
