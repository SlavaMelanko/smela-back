enum Status {
  New = 'new',
  Verified = 'verified',
  Trial = 'trial',
  Active = 'active',
  Suspended = 'suspended',
  Archived = 'archived',
  Pending = 'pending',
}

export const isActive = (status: Status) => status === Status.Verified
  || status === Status.Trial
  || status === Status.Active

export const isNewOrActive = (status: Status) => status === Status.New || isActive(status)

export const isActiveOnly = (status: Status) => status === Status.Active

export default Status
