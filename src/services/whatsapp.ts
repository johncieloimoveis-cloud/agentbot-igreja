// Gerar link wa.me com mensagem pré-preenchida
export const generateWhatsAppLink = (phone: string, message: string) => {
  // Remover caracteres especiais do telefone
  const cleanPhone = phone.replace(/\D/g, '');
  // Adicionar código do Brasil se não tiver
  const fullPhone = cleanPhone.startsWith('55') ? cleanPhone : `55${cleanPhone}`;
  // Codificar a mensagem
  const encodedMessage = encodeURIComponent(message);
  return `https://wa.me/${fullPhone}?text=${encodedMessage}`;
};
// Mensagens pré-preenchidas para diferentes contextos
export const whatsappMessages = {
  visitor: (name: string) =>
    `Olá ${name}! 👋\n\nFicamos muito felizes com sua visita em nossa igreja no último culto. Gostaríamos de saber se podemos orar por você ou se gostaria de participar de nossas próximas reuniões. Fica à vontade para entrar em contato!`,
  newconvert: (name: string) =>
    `Olá ${name}! 🙏\n\nParabéns por sua decisão de aceitar Jesus! Queremos acompanhar você neste novo caminho. Você gostaria de participar de um encontro de discipulado? Estamos aqui para ajudar!`,
  birthday: (name: string) =>
    `Feliz aniversário, ${name}! 🎉\n\nQue Deus abençoe sua vida neste novo ano! Que você possa sentir sempre o amor e a graça do Senhor em cada dia. Desejamos tudo de melhor para você! 🙏❤️`,
  absent: (name: string) =>
    `Olá ${name}! 👋\n\nSentimos sua falta no nosso último encontro. Tudo bem com você? Gostaríamos de saber se há algo em que possamos ajudar. Estaremos felizes em vê-lo em breve! 🙏`,
  followup: (name: string) =>
    `Olá ${name}! 🙏\n\nGostaríamos de saber como você está. Podemos ajudar em algo? Conte conosco sempre!`,
  groupinvite: (name: string, groupName: string) =>
    `Olá ${name}! 👋\n\nGostaríamos de convidá-lo para participar do nosso grupo ${groupName}. Seria uma ótima oportunidade para crescimento espiritual e comunhão. Você teria interesse? 🙏`,
  taskreminder: (name: string, taskTitle: string) =>
    `Olá ${name}! 📋\n\nEste é um lembrete sobre a tarefa: ${taskTitle}\n\nPrecisamos de sua ajuda neste acompanhamento. Pode contar comigo! 🙏`,
  prayer: (name: string) =>
    `Olá ${name}! 🙏\n\nVi seu pedido de oração e gostaria de saber como posso ajudar. Estou orando por você! Quer conversar sobre algo específico?`,
};
// Abrir WhatsApp com mensagem pré-preenchida
export const openWhatsApp = (phone: string, messageType: string, name: string, extraData?: string) => {
  let message = '';
  switch (messageType) {
    case 'visitor':
      message = whatsappMessages.visitor(name);
      break;
    case 'newconvert':
      message = whatsappMessages.newconvert(name);
      break;
    case 'birthday':
      message = whatsappMessages.birthday(name);
      break;
    case 'absent':
      message = whatsappMessages.absent(name);
      break;
    case 'followup':
      message = whatsappMessages.followup(name);
      break;
    case 'groupinvite':
      message = whatsappMessages.groupinvite(name, extraData || 'Grupo');
      break;
    case 'taskreminder':
      message = whatsappMessages.taskreminder(name, extraData || 'uma tarefa');
      break;
    case 'prayer':
      message = whatsappMessages.prayer(name);
      break;
    default:
      message = `Olá ${name}! 👋`;
  }
  const link = generateWhatsAppLink(phone, message);
  window.open(link, '_blank');
};
