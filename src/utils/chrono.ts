const ms = (n: number) => n
const secondsToMs = (n: number) => n * 1000
const minutesToMs = (n: number) => n * 60_000
const hoursToMs = (n: number) => n * 3_600_000
const daysToMs = (n: number) => n * 86_400_000
const weeksToMs = (n: number) => n * 604_800_000

const secondToMs = (n: number = 1) => secondsToMs(n)
const minuteToMs = (n: number = 1) => minutesToMs(n)
const hourToMs = (n: number = 1) => hoursToMs(n)
const dayToMs = (n: number = 1) => daysToMs(n)
const weekToMs = (n: number = 1) => weeksToMs(n)

export const nowPlus = (ms: number) => new Date(Date.now() + ms)
export const nowMinus = (ms: number) => new Date(Date.now() - ms)

export const nowInSeconds = () => Math.floor(Date.now() / 1000)

export { ms }
export { secondToMs as second, secondsToMs as seconds }
export { minuteToMs as minute, minutesToMs as minutes }
export { hourToMs as hour, hoursToMs as hours }
export { dayToMs as day, daysToMs as days }
export { weekToMs as week, weeksToMs as weeks }
