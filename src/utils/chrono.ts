const toMs = (n: number) => n
const toSeconds = (n: number) => n * 1000
const toMinutes = (n: number) => n * 60 * 1000
const toHours = (n: number) => n * 60 * 60 * 1000
const toDays = (n: number) => n * 24 * 60 * 60 * 1000
const toWeeks = (n: number) => n * 7 * 24 * 60 * 60 * 1000

const toSecond = (n: number = 1) => toSeconds(n)
const toMinute = (n: number = 1) => toMinutes(n)
const toHour = (n: number = 1) => toHours(n)
const toDay = (n: number = 1) => toDays(n)
const toWeek = (n: number = 1) => toWeeks(n)

export const nowPlus = (ms: number) => new Date(Date.now() + ms)

export const nowMinus = (ms: number) => new Date(Date.now() - ms)

export { toMs as ms }
export { toSecond as second, toSeconds as seconds }
export { toMinute as minute, toMinutes as minutes }
export { toHour as hour, toHours as hours }
export { toDay as day, toDays as days }
export { toWeek as week, toWeeks as weeks }
