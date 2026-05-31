import {
  pickOllamaModel,
  ensureOllamaModel,
  PREFERRED_OLLAMA_MODEL,
} from '../../../src/ollamaPick.mjs'

export {
  pickOllamaModel,
  ensureOllamaModel,
  PREFERRED_OLLAMA_MODEL,
}

/** Local Ollama defaults (OpenAI-compatible API). */
export const OLLAMA_ORIGIN = 'http://localhost:11434'
export const OLLAMA_OPENAI_BASE_URL = `${OLLAMA_ORIGIN}/v1`
export const OLLAMA_API_KEY_PLACEHOLDER = 'ollama'

const TAGS_PATH = '/api/tags'
const FETCH_TIMEOUT_MS = 8000

/**
 * @param {string} url
 * @returns {Promise<Response>}
 */
async function fetchWithTimeout(url) {
  return fetch(url, { signal: AbortSignal.timeout(FETCH_TIMEOUT_MS) })
}

/**
 * Candidate URLs for listing models: Next.js dev proxy first, then direct Ollama.
 * @returns {string[]}
 */
function ollamaTagsUrls() {
  const direct = `${OLLAMA_ORIGIN}${TAGS_PATH}`
  if (typeof window === 'undefined') {
    return [direct]
  }
  return ['/ollama/api/tags', direct]
}

/**
 * @param {Response} response
 * @returns {Promise<string[]>}
 */
async function parseTagsResponse(response) {
  if (!response.ok) {
    throw new Error(`Ollama returned HTTP ${response.status}`)
  }
  const body = await response.json()
  const models = body?.models ?? []
  return models
    .map((entry) => entry?.name)
    .filter(Boolean)
    .sort((a, b) => a.localeCompare(b))
}

/**
 * List model names installed in the local Ollama instance.
 * @returns {Promise<string[]>}
 */
export async function listOllamaModels() {
  let lastError = /** @type {Error | undefined} */ (undefined)
  for (const url of ollamaTagsUrls()) {
    try {
      const response = await fetchWithTimeout(url)
      return await parseTagsResponse(response)
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error))
    }
  }
  throw lastError ?? new Error('Could not reach Ollama at http://localhost:11434')
}
