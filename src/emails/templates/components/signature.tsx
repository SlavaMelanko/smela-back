/** @jsxImportSource react */

import { Text } from '@react-email/components'

import styles from '../styles'

interface SignatureProps {
  signature: {
    thanks: string
    who: string
  }
}

export const Signature = ({ signature }: SignatureProps) => {
  const { thanks, who } = signature

  return (
    <Text style={styles.component.text.body}>
      {thanks}
      <br />
      {who}
    </Text>
  )
}

export default Signature
