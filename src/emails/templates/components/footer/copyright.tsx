/** @jsxImportSource react */

import {
  Text,
} from '@react-email/components'

import styles from '../../styles'

interface Props {
  companyName?: string
}

const Copyright = ({ companyName }: Props): React.ReactElement => {
  const year = new Date().getFullYear()

  return (
    <Text style={styles.component.text.legal}>
      {`© ${year} ${companyName}`}
    </Text>
  )
}

Copyright.PreviewProps = {
  companyName: 'Company Name',
} as Props

export default Copyright
