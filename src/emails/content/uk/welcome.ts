import type { WelcomeEmailContent } from '../types'

export const content: WelcomeEmailContent = {
  subject: 'Ласкаво просимо до The Company',
  previewText: 'Ласкаво просимо до The Company — будь ласка, підтвердіть свою електронну пошту',
  greeting: (firstName?: string) => `Привіт, ${firstName || 'дорогий користувач'} 👋`,
  body: 'Ласкаво просимо! Будь ласка, підтвердьте свою електронну пошту, щоб розпочати:',
  ctaText: 'Підтвердити електронну пошту',
  disclaimer: 'Якщо ви не створювали обліковий запис, ви можете безпечно ігнорувати цей лист.',
  signature: {
    thanks: 'Дякуємо,',
    who: 'The Company Команда ❤️',
  },
}

export default content
