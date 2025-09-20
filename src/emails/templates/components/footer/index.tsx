/** @jsxImportSource react */

import type { Metadata } from '../../../types'

import { config } from '../../../config'
import { getThemeStyles } from '../../../styles'
import Copyright from './copyright'
import MetadataContainer from './metadata'
import SocialMediaLinks from './social-media-links'

interface Props {
  styles: any
  companyName?: string
  socialMediaLinks?: Record<string, string>
  metadata?: Metadata
}

const Footer = ({
  styles,
  companyName = config.company.name,
  socialMediaLinks = config.company.socialMediaLinks,
  metadata,
}: Props): React.ReactElement => (
  <div style={{
    display: 'flex',
    flexDirection: 'column' as const,
    justifyContent: 'center',
    alignItems: 'center',
  }}
  >
    <SocialMediaLinks styles={styles} socialMediaLinks={socialMediaLinks} />
    <Copyright styles={styles} companyName={companyName} />
    {metadata && <MetadataContainer {...metadata} />}
  </div>
)

Footer.PreviewProps = {
  styles: getThemeStyles('light'),
  companyName: 'Company Name',
  socialMediaLinks: {
    facebook: 'https://facebook.com/your-profile',
    github: 'https://github.com/your-profile',
    linkedin: 'https://linkedin.com/in/your-profile',
  },
} as Props

export default Footer
