import type UserInvitationContent from '../user-invitation'

import { config } from '../../config'

const DEFAULT_TEAM = 'команди'

export const content: UserInvitationContent = {
  subject: (teamName?: string) => `Вас запрошено до ${teamName || DEFAULT_TEAM}`,
  previewText: (teamName?: string) => `Вас запрошено до ${teamName || DEFAULT_TEAM}`,
  greeting: (firstName?: string) => `Вітаю ${firstName || 'друже'},`,
  body: (inviterName?: string, teamName?: string) =>
    `${inviterName || 'Адмін'} запросив вас приєднатися до команди ${teamName || DEFAULT_TEAM}.`,
  ctaInstruction: 'Натисніть посилання нижче, щоб прийняти запрошення та завершити налаштування облікового запису:',
  ctaText: 'Прийняти запрошення',
  expiryNotice: 'З міркувань безпеки це посилання дійсне протягом 24 годин.',
  signature: {
    thanks: 'Дякуємо,',
    who: `Команда ${config.company.name}`,
  },
}

export default content
