/** @jsxImportSource react */

import {
  Column,
  Row,
  Section,
} from '@react-email/components'

import styles from '../../styles'
import Logo from './logo'

interface Props {
  logoWidth?: number | string
  showBorder?: boolean
}

const Header = ({
  logoWidth = 200,
  showBorder = true,
}: Props): React.ReactElement => (
  <>
    <Logo width={logoWidth} />
    {showBorder && (
      <Section style={{ width: '100%' }}>
        <Row>
          <Column style={{ borderBottom: `1px solid ${styles.color.border}` }} />
          <Column style={{ borderBottom: '1px solid #e66e5a', width: '220px' }} />
          <Column style={{ borderBottom: `1px solid ${styles.color.border}` }} />
        </Row>
      </Section>
    )}
  </>
)

Header.PreviewProps = {
  logoWidth: 200,
  showBorder: true,
} as Props

export default Header
