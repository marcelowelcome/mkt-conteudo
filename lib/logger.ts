// Logging estruturado — JSON em produção, formatado em desenvolvimento

type LogLevel = 'info' | 'warn' | 'error' | 'debug'

interface LogEntry {
  level: LogLevel
  message: string
  timestamp: string
  [key: string]: unknown
}

function createLogEntry(level: LogLevel, message: string, meta?: Record<string, unknown>): LogEntry {
  return {
    level,
    message,
    timestamp: new Date().toISOString(),
    ...meta,
  }
}

function output(entry: LogEntry) {
  const isDev = process.env.NODE_ENV === 'development'

  if (isDev) {
    const color = { info: '\x1b[36m', warn: '\x1b[33m', error: '\x1b[31m', debug: '\x1b[90m' }
    const reset = '\x1b[0m'
    const { level, message, timestamp, ...rest } = entry
    const meta = Object.keys(rest).length > 0 ? ` ${JSON.stringify(rest)}` : ''
    console.log(`${color[level]}[${level.toUpperCase()}]${reset} ${timestamp} ${message}${meta}`)
  } else {
    console.log(JSON.stringify(entry))
  }
}

export const logger = {
  info: (message: string, meta?: Record<string, unknown>) =>
    output(createLogEntry('info', message, meta)),
  warn: (message: string, meta?: Record<string, unknown>) =>
    output(createLogEntry('warn', message, meta)),
  error: (message: string, meta?: Record<string, unknown>) =>
    output(createLogEntry('error', message, meta)),
  debug: (message: string, meta?: Record<string, unknown>) =>
    output(createLogEntry('debug', message, meta)),
}
