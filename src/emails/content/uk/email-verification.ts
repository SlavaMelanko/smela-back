import type EmailVerificationContent from '../email-verification'

import { config } from '../../config'

export const content: EmailVerificationContent = {
  subject: 'Підтвердіть вашу електронну адресу',
  previewText: `Підтвердіть електронну адресу для ${config.company.name}`,
  greeting: (firstName?: string) => `Вітаю ${firstName || 'друже'},`,
  body: 'Натисніть посилання нижче, щоб підтвердити вашу електронну адресу:',
  ctaText: 'Підтвердити електронну адресу',
  expiryNotice: 'З міркувань безпеки це посилання дійсне протягом 24 годин.',
  disclaimer: 'Якщо ви не створювали обліковий запис, просто проігноруйте цей лист.',
  signature: {
    thanks: 'Дякуємо,',
    who: `Команда ${config.company.name}`,
  },
}

export default content
