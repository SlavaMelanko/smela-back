/** @jsxImportSource react */

import { Text } from '@react-email/components'

import { getThemeStyles } from '../styles'

interface Props {
  styles: any
  signature: {
    thanks: string
  who: string
  }
}

const Signature = ({ styles, signature: { thanks, who } }: Props): React.ReactElement => (
  <Text style={styles.text.body}>
    {thanks}
    <br />
    {who}
  </Text>
)

Signature.PreviewProps = {
  styles: getThemeStyles('dark'),
  signature: {
    thanks: 'Best regards,',
    who: 'The Team'
  },
} as Props

export default Signature
