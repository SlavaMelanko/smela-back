/** @jsxImportSource react */

import { Text } from '@react-email/components'

import styles from '../styles'

interface SignatureProps {
  thanks: string
  teamName: string
}

export const Signature = ({ thanks, teamName }: SignatureProps) => {
  return (
    <Text style={styles.component.text.body}>
      {thanks}
      <br />
      {teamName}
    </Text>
  )
}

export default Signature
