enum Status {
  New = 'new',
  Verified = 'verified',
  Trial = 'trial',
  Active = 'active',
  Suspended = 'suspended',
  Archived = 'archived',
  Pending = 'pending',
}

const isActive = (status: Status) => status === Status.Verified
  || status === Status.Trial
  || status === Status.Active

const isNewOrActive = (status: Status) => status === Status.New || isActive(status)

const isActiveOnly = (status: Status) => status === Status.Active

export { Status as default, isActive, isActiveOnly, isNewOrActive }
