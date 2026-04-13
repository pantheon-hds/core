/**
 * Structured JSON logger for Supabase Edge Functions.
 *
 * Outputs newline-delimited JSON so Supabase's log aggregator
 * (and any downstream tool like Datadog / Loki) can parse fields.
 *
 * Usage:
 *   const log = makeLogger('my-function', requestId)
 *   log.info('request received', { ip, method })
 *   log.warn('rate limited', { ip, endpoint })
 *   log.error('db query failed', { error: err.message })
 */

export type LogLevel = 'info' | 'warn' | 'error'

export interface Logger {
  info(msg: string, extra?: Record<string, unknown>): void
  warn(msg: string, extra?: Record<string, unknown>): void
  error(msg: string, extra?: Record<string, unknown>): void
}

/**
 * Create a logger scoped to a function + request.
 * @param fn   Edge Function name (e.g. 'assign-judges')
 * @param reqId  Unique request ID — use crypto.randomUUID() at handler entry
 */
export function makeLogger(fn: string, reqId: string): Logger {
  const write = (level: LogLevel, msg: string, extra?: Record<string, unknown>) => {
    const entry: Record<string, unknown> = {
      ts: new Date().toISOString(),
      level,
      fn,
      reqId,
      msg,
      ...extra,
    }
    // Deno / V8 isolate — console.log is the only output channel
    if (level === 'error') {
      console.error(JSON.stringify(entry))
    } else if (level === 'warn') {
      console.warn(JSON.stringify(entry))
    } else {
      console.log(JSON.stringify(entry))
    }
  }

  return {
    info:  (msg, extra) => write('info',  msg, extra),
    warn:  (msg, extra) => write('warn',  msg, extra),
    error: (msg, extra) => write('error', msg, extra),
  }
}
