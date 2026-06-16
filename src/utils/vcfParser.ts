// Parser para arquivos VCF (vCard)
export interface ParsedContact {
  full_name: string;
  phone?: string;
  whatsapp?: string;
  email?: string;
  raw: string;
}

export const parseVCF = (vcfContent: string): ParsedContact[] => {
  const contacts: ParsedContact[] = [];

  // Dividir por VCARD
  const vcards = vcfContent.split('BEGIN:VCARD').filter(v => v.trim());

  vcards.forEach(vcard => {
    const lines = vcard.split('\n').map(l => l.trim()).filter(l => l);

    let fullName = '';
    let phones: string[] = [];
    let email = '';

    lines.forEach(line => {
      // Nome completo (FN:)
      if (line.startsWith('FN:')) {
        fullName = line.replace('FN:', '').trim();
      }

      // Telefone direto (TEL;...)
      if (line.startsWith('TEL;') || line.startsWith('TEL:')) {
        const phoneMatch = line.match(/([+\d\s\-()]+)$/);
        if (phoneMatch) {
          const phone = phoneMatch[1].trim();
          if (phone && phone !== 'TEL') {
            phones.push(phone);
          }
        }
      }

      // Telefone em item (item1.TEL:, item2.TEL:, etc)
      if (line.match(/^item\d+\.TEL/)) {
        const phoneMatch = line.match(/([+\d\s\-()]+)$/);
        if (phoneMatch) {
          const phone = phoneMatch[1].trim();
          if (phone && phone !== 'TEL') {
            phones.push(phone);
          }
        }
      }

      // Email direto (EMAIL;...)
      if (line.startsWith('EMAIL;') || line.startsWith('EMAIL:')) {
        const emailMatch = line.match(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/);
        if (emailMatch) {
          email = emailMatch[1];
        }
      }

      // Email em item (item1.EMAIL:, etc)
      if (line.match(/^item\d+\.EMAIL/)) {
        const emailMatch = line.match(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/);
        if (emailMatch) {
          email = emailMatch[1];
        }
      }
    });

    // Só adicionar se houver nome
    if (fullName.trim()) {
      const primaryPhone = phones[0] || '';

      contacts.push({
        full_name: fullName,
        phone: primaryPhone,
        whatsapp: primaryPhone, // Por padrão, usar o primeiro telefone como WhatsApp
        email: email,
        raw: vcard,
      });
    }
  });

  return contacts;
};

// Normalizar telefone (remover espaços e caracteres especiais)
export const normalizePhone = (phone: string): string => {
  return phone.replace(/[\s\-()]/g, '');
};

// Validar telefone brasileiro
export const isValidBrazilianPhone = (phone: string): boolean => {
  const normalized = normalizePhone(phone);
  // Formato: +55 ou 55 seguido de 10-11 dígitos
  return /^(\+?55)?[1-9]\d{8,10}$/.test(normalized);
};
