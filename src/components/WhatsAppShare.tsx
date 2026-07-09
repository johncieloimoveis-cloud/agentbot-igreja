import { useState } from 'react';
import { MessageCircle, Copy, Check } from 'lucide-react';

interface WhatsAppShareProps {
  phone?: string;
  message: string;
  onCopy?: () => void;
  size?: 'sm' | 'md';
}

// Referências persistentes entre renders — reutiliza a mesma aba
let waWindow: Window | null = null;
let waBizWindow: Window | null = null;

function buildUrl(phone: string, message: string, business = false) {
  const cleaned = phone.replace(/\D/g, '');
  const encoded = encodeURIComponent(message);
  const num = cleaned ? `55${cleaned}` : '';

  if (business) {
    if (typeof navigator !== 'undefined' && /android/i.test(navigator.userAgent)) {
      return num
        ? `intent://send?phone=${num}&text=${encoded}#Intent;package=com.whatsapp.w4b;scheme=whatsapp;end`
        : `intent://send?text=${encoded}#Intent;package=com.whatsapp.w4b;scheme=whatsapp;end`;
    }
    if (typeof navigator !== 'undefined' && /iphone|ipad|ipod/i.test(navigator.userAgent)) {
      return num
        ? `whatsapp-business://send?phone=${num}&text=${encoded}`
        : `whatsapp-business://send?text=${encoded}`;
    }
    return num ? `https://wa.me/${num}?text=${encoded}` : `https://wa.me/?text=${encoded}`;
  }

  return num ? `https://wa.me/${num}?text=${encoded}` : `https://wa.me/?text=${encoded}`;
}

function openWA(url: string, business: boolean) {
  if (business) {
    if (!waBizWindow || waBizWindow.closed) {
      waBizWindow = window.open(url, 'whatsapp-business');
    } else {
      waBizWindow.location.href = url;
      waBizWindow.focus();
    }
  } else {
    if (!waWindow || waWindow.closed) {
      waWindow = window.open(url, 'whatsapp-personal');
    } else {
      waWindow.location.href = url;
      waWindow.focus();
    }
  }
}

export function WhatsAppShare({ phone = '', message, onCopy, size = 'sm' }: WhatsAppShareProps) {
  const [copied, setCopied] = useState(false);

  const px = size === 'sm' ? 'px-2.5 py-1.5 text-xs' : 'px-4 py-2 text-sm';
  const icon = size === 'sm' ? 'w-3 h-3' : 'w-4 h-4';

  const handleCopy = () => {
    navigator.clipboard.writeText(message);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    onCopy?.();
  };

  // Em mobile usa <a> direto (intent/scheme); em desktop usa window.open com reutilização
  const isMobile = typeof navigator !== 'undefined' && /android|iphone|ipad|ipod/i.test(navigator.userAgent);

  return (
    <div className="flex items-center gap-1.5 flex-wrap">
      {isMobile ? (
        <a
          href={buildUrl(phone, message, false)}
          className={`flex items-center gap-1 ${px} bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg transition-colors`}
          title="WhatsApp Pessoal"
        >
          <MessageCircle className={icon} />WA
        </a>
      ) : (
        <button
          type="button"
          onClick={() => openWA(buildUrl(phone, message, false), false)}
          className={`flex items-center gap-1 ${px} bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg transition-colors`}
          title="WhatsApp Pessoal"
        >
          <MessageCircle className={icon} />WA
        </button>
      )}

      {isMobile ? (
        <a
          href={buildUrl(phone, message, true)}
          className={`flex items-center gap-1 ${px} bg-teal-600 hover:bg-teal-700 text-white font-semibold rounded-lg transition-colors`}
          title="WhatsApp Business"
        >
          <MessageCircle className={icon} />WA Biz
        </a>
      ) : (
        <button
          type="button"
          onClick={() => openWA(buildUrl(phone, message, true), true)}
          className={`flex items-center gap-1 ${px} bg-teal-600 hover:bg-teal-700 text-white font-semibold rounded-lg transition-colors`}
          title="WhatsApp Business"
        >
          <MessageCircle className={icon} />WA Biz
        </button>
      )}

      <button
        type="button"
        onClick={handleCopy}
        className={`flex items-center gap-1 ${px} bg-gray-200 hover:bg-gray-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-gray-700 dark:text-gray-200 font-semibold rounded-lg transition-colors`}
      >
        {copied ? <Check className={`${icon} text-green-600`} /> : <Copy className={icon} />}
        {copied ? 'Copiado!' : 'Copiar'}
      </button>
    </div>
  );
}
