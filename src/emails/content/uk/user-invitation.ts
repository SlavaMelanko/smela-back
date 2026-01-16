import type UserInvitationContent from '../user-invitation'

import { config } from '../../config'

const DEFAULT_TEAM = 'команди'

export const content: UserInvitationContent = {
  subject: (companyName?: string) => `Вас запрошено до ${companyName || DEFAULT_TEAM}`,
  previewText: (companyName?: string) => `Прийміть запрошення приєднатися до ${companyName || DEFAULT_TEAM}`,
  greeting: (firstName?: string) => `Вітаю ${firstName || 'друже'},`,
  body: (companyName?: string) => `Вас запрошено приєднатися до ${companyName || DEFAULT_TEAM}.`,
  ctaInstruction: 'Натисніть посилання нижче, щоб прийняти запрошення та завершити налаштування облікового запису:',
  ctaText: 'Прийняти запрошення',
  expiryNotice: 'З міркувань безпеки це посилання дійсне протягом 24 годин.',
  signature: {
    thanks: 'Дякуємо,',
    who: `Команда ${config.company.name}`,
  },
}

export default content
