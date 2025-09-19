/** @jsxImportSource react */

import type { Metadata } from '../../../types'

const MetadataContainer = ({ emailId, sentAt }: Metadata): React.ReactElement => (
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

export default MetadataContainer
