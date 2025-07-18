import type { PasswordResetEmailContent } from '../types'

import { config } from '../../config'

export const content: PasswordResetEmailContent = {
  subject: 'Скинути пароль',
  previewText: `Скинути пароль для облікового запису ${config.company.name}`,
  greeting: (firstName?: string) => `Привіт, ${firstName || 'дорогий користувач'} 👋`,
  body: 'Ми отримали запит на скидання вашого пароля. Натисніть кнопку нижче, щоб обрати новий пароль:',
  ctaText: 'Скинути пароль',
  disclaimer: 'Якщо ви не запитували скидання пароля, ви можете безпечно ігнорувати цей лист.',
  expiryNotice: 'Це посилання діє протягом 1 години з міркувань безпеки.',
  signature: {
    thanks: 'Дякуємо,',
    who: `${config.company.name} Команда ❤️`,
  },
}

export default content
