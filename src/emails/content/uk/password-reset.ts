import type PasswordResetEmailContent from '../password-reset'

import { config } from '../../config'

export const content: PasswordResetEmailContent = {
  subject: 'Скинути пароль',
  previewText: `Скинути пароль для облікового запису ${config.company.name}`,
  greeting: (firstName?: string) => `Вітаю ${firstName || 'дорогий користувач'},`,
  body:
    'Ми отримали запит на скидання вашого пароля. Перейдіть за посиланням нижче, щоб встановити новий пароль:',
  ctaText: 'Скинути пароль',
  expiryNotice: 'З міркувань безпеки це посилання дійсне протягом 1 години.',
  disclaimer:
    'Якщо ви не запитували скидання пароля, ви можете безпечно ігнорувати цей лист.',
  signature: {
    thanks: 'Дякуємо,',
    who: `Команда ${config.company.name}`,
  },
}

export default content
