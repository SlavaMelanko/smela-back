/** @jsxImportSource react */

import type { Metadata } from '../../../types'

import { config } from '../../../config'
import Copyright from './copyright'
import MetadataContainer from './metadata'
import SocialMediaLinks from './social-media-links'

interface Props {
  companyName?: string
  socialMediaLinks?: Record<string, string>
  metadata?: Metadata
}

const Footer = ({
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
    <SocialMediaLinks socialMediaLinks={socialMediaLinks} />
    <Copyright companyName={companyName} />
    {metadata && <MetadataContainer {...metadata} />}
  </div>
)

export default Footer
