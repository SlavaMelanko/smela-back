import type EmailVerificationContent from '../email-verification'

import { config } from '../../config'

export const content: EmailVerificationContent = {
  subject: `Підтвердіть свою електронну пошту для ${config.company.name}`,
  previewText:
    `Будь ласка, підтвердіть свою електронну пошту для завершення реєстрації в ${config.company.name}`,
  greeting: (firstName?: string) => `Привіт, ${firstName || 'дорогий користувач'} 👋`,
  body: 'Будь ласка, підтвердьте свою електронну пошту, щоб розпочати:',
  ctaText: 'Підтвердити електронну пошту',
  disclaimer:
    'Якщо ви не створювали обліковий запис, ви можете безпечно ігнорувати цей лист.',
  signature: {
    thanks: 'Дякуємо,',
    who: `Команда ${config.company.name}`,
  },
}

export default content
