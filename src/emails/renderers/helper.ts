import type { ReactElement } from 'react'

import { render } from '@react-email/components'

import type { Metadata } from '../types'

const renderEmail = async <T>(
  template: (props: { data: T, content: any, metadata?: Metadata }) => ReactElement,
  data: T,
  content: any,
  metadata?: Metadata,
): Promise<{ html: string, text: string }> => {
  const props = { data, content, metadata }

  const [html, text] = await Promise.all([
    render(template(props)),
    render(template(props), { plainText: true }),
  ])

  return { html, text }
}

export { renderEmail }
