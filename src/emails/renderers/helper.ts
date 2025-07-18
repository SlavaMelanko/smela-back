import type { ReactElement } from 'react'

import { render } from '@react-email/components'

const renderEmail = async <T>(
  template: (props: { data: T, content: any }) => ReactElement,
  data: T,
  content: any,
): Promise<{ html: string, text: string }> => {
  const html = await render(template({ data, content }))
  const text = await render(template({ data, content }), {
    plainText: true,
  })

  return { html, text }
}

export { renderEmail }
