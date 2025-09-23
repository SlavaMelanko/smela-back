import pino from 'pino'
import pretty from 'pino-pretty'

let _logger: pino.Logger | null = null

const getLogger = (): pino.Logger => {
  if (!_logger) {
    try {
      import('@/lib/env').then(({ default: env, isDevOrTestEnv }) => {
        _logger = pino({
          level: env.LOG_LEVEL,
        }, isDevOrTestEnv() ? pretty() : undefined)
      })
    } catch {
      // Fallback logger for test environment
      _logger = pino({ level: 'info' })
    }

    // Return fallback if async import hasn't completed
    if (!_logger) {
      _logger = pino({ level: 'info' })
    }
  }

  return _logger
}

// Create a proxy object that behaves like a logger but uses lazy initialization
const logger = new Proxy({} as pino.Logger, {
  get(_target, prop) {
    const actualLogger = getLogger()
    const value = actualLogger[prop as keyof pino.Logger]
    if (typeof value === 'function') {
      return value.bind(actualLogger)
    }

    return value
  },
})

export default logger
