/** @jsxImportSource react */

import { Text } from '@react-email/components'

import styles from '../styles'

interface Props {
  thanks: string
  who: string
}

const Signature = ({ thanks, who }: Props): React.ReactElement => (
  <Text style={styles.component.text.body}>
    {thanks}
    <br />
    {who}
  </Text>
)

Signature.PreviewProps = {
  thanks: 'Best regards,',
  who: 'The Team',
} as Props

export default Signature
