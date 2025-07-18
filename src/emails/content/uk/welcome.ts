import type { WelcomeEmailContent } from '../types'

import { config } from '../../config'

export const content: WelcomeEmailContent = {
  subject: `Ласкаво просимо до ${config.company.name}`,
  previewText: `Ласкаво просимо до ${config.company.name} — будь ласка, підтвердіть свою електронну пошту`,
  greeting: (firstName?: string) => `Привіт, ${firstName || 'дорогий користувач'} 👋`,
  body: 'Ласкаво просимо! Будь ласка, підтвердьте свою електронну пошту, щоб розпочати:',
  ctaText: 'Підтвердити електронну пошту',
  disclaimer: 'Якщо ви не створювали обліковий запис, ви можете безпечно ігнорувати цей лист.',
  signature: {
    thanks: 'Дякуємо,',
    who: `${config.company.name} Команда ❤️`,
  },
}

export default content
