import { openWhatsApp } from '@/services/whatsapp';
import { MessageCircle } from 'lucide-react';

interface WhatsAppButtonProps {
  phone: string;
  name: string;
  messageType?: string;
  extraData?: string;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'button' | 'icon';
  className?: string;
}

export function WhatsAppButton({
  phone,
  name,
  messageType = 'followup',
  extraData,
  size = 'md',
  variant = 'button',
  className = '',
}: WhatsAppButtonProps) {
  if (!phone) return null;

  const handleClick = () => {
    openWhatsApp(phone, messageType, name, extraData);
  };

  if (variant === 'icon') {
    const sizes = {
      sm: 'w-4 h-4',
      md: 'w-5 h-5',
      lg: 'w-6 h-6',
    };

    return (
      <button
        onClick={handleClick}
        className={`text-green-600 dark:text-green-400 hover:text-green-700 dark:hover:text-green-300 ${className}`}
        title={`Enviar WhatsApp para ${name}`}
      >
        <MessageCircle className={sizes[size]} />
      </button>
    );
  }

  const sizes = {
    sm: 'px-2 py-1 text-xs',
    md: 'px-3 py-2 text-sm',
    lg: 'px-4 py-2 text-base',
  };

  return (
    <button
      onClick={handleClick}
      className={`flex items-center gap-2 bg-green-600 hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-600 text-white font-semibold rounded-lg transition-colors ${sizes[size]} ${className}`}
    >
      <MessageCircle className="w-4 h-4" />
      WhatsApp
    </button>
  );
}
