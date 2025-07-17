/** @jsxImportSource react */

import {
  Column,
  Img,
  Row,
  Section,
} from '@react-email/components'

import styles from '../styles'

interface HeaderProps {
  logoSrc?: string
  logoAlt?: string
  logoWidth?: string
}

const baseUrl = 'http://localhost:3000'

const headerStyles = {
  logo: {
    margin: '0 auto',
  },
  sectionsBorders: {
    width: '100%',
  },
  sectionBorder: {
    borderBottom: `1px solid ${styles.color.border.light}`,
    width: '254px',
  },
  sectionCenter: {
    borderBottom: `1px solid ${styles.color.primary}`,
    width: '124px',
  },
}

const Header = ({
  logoSrc = `${baseUrl}/static/logo.png`,
  logoAlt = 'The Company',
  logoWidth = '100',
}: HeaderProps) => {
  return (
    <>
      <Section>
        <Img
          src={logoSrc}
          width={logoWidth}
          alt={logoAlt}
          style={headerStyles.logo}
        />
      </Section>
      <Section style={headerStyles.sectionsBorders}>
        <Row>
          <Column style={headerStyles.sectionBorder} />
          <Column style={headerStyles.sectionCenter} />
          <Column style={headerStyles.sectionBorder} />
        </Row>
      </Section>
    </>
  )
}

export default Header
