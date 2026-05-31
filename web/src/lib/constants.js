/** OpenAI-style rate limit for cloud API (requests per minute). */
export const CLOUD_RATE_LIMIT_RPM = 60

/**
 * Local Ollama: high ceiling so batches are not artificially delayed.
 * Still serializes bursts slightly; raise only if you hit real Ollama queue limits.
 */
export const LOCAL_RATE_LIMIT_RPM = 500

export const DEFAULT_TARGET_LANGUAGE = 'Persian'

/** @type {{ key: string, label: string, value: string }[]} */
export const TARGET_LANGUAGE_PRESETS = [
  { key: 'fa', label: 'Persian (فارسی)', value: 'Persian' },
  { key: 'en', label: 'English', value: 'English' },
  { key: 'tr', label: 'Turkish (Türkçe)', value: 'Turkish' },
]
