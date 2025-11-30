/** @jsxImportSource react */

import type { Metadata } from '../../../metadata'

interface Props extends Metadata {}

const MetadataContainer = ({ emailId, sentAt }: Props): React.ReactElement => (
  <div>
    {/* Hidden email tracking information. */}
    {emailId && (
      <div style={{ display: 'none' }}>
        {`Email-ID: ${emailId}`}
      </div>
    )}
    {sentAt && (
      <div style={{ display: 'none' }}>
        {`Sent-At: ${sentAt}`}
      </div>
    )}
  </div>
)

MetadataContainer.PreviewProps = {
  emailId: 'email-12345',
  sentAt: new Date().toISOString(),
} as Props

export default MetadataContainer
