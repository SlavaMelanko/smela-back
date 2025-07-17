import type { PasswordResetEmailContent } from '../types'

export const content: PasswordResetEmailContent = {
  subject: 'Скинути пароль',
  previewText: 'Скинути пароль для облікового запису The Company',
  greeting: (firstName?: string) => `Привіт, ${firstName || 'дорогий користувач'} 👋`,
  body: 'Ми отримали запит на скидання вашого пароля. Натисніть кнопку нижче, щоб обрати новий пароль:',
  ctaText: 'Скинути пароль',
  disclaimer: 'Якщо ви не запитували скидання пароля, ви можете безпечно ігнорувати цей лист.',
  expiryNotice: 'Це посилання діє протягом 1 години з міркувань безпеки.',
  signature: {
    thanks: 'Дякуємо,',
    who: 'Команда The Company ❤️',
  },
}

export default content
