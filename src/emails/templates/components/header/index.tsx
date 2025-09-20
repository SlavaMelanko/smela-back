/** @jsxImportSource react */

import {
  Column,
  Row,
  Section,
} from '@react-email/components'

import { getThemeStyles } from '../../../styles'
import Logo from './logo'

interface Props {
  styles: any
  logoWidth?: number | string
  showBorder?: boolean
}

const Header = ({
  styles,
  logoWidth = 200,
  showBorder = true,
}: Props): React.ReactElement => (
  <>
    <Logo styles={styles} width={logoWidth} />
    {showBorder && (
      <Section style={{ width: '100%', marginTop: styles.spacing.md }}>
        <Row>
          <Column style={{ borderBottom: `1px solid ${styles.color.border}` }} />
          <Column style={{ borderBottom: `1px solid ${styles.color.orange}`, width: '220px' }} />
          <Column style={{ borderBottom: `1px solid ${styles.color.border}` }} />
        </Row>
      </Section>
    )}
  </>
)

Header.PreviewProps = {
  styles: getThemeStyles('light'),
  logoWidth: 200,
  showBorder: true,
} as Props

export default Header
