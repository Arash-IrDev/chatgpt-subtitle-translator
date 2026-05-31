export const PREFERRED_OLLAMA_MODEL = 'gemma4:latest'

/**
 * @param {string[]} installedNames
 * @param {string} [preferred]
 * @param {string | null | undefined} [savedChoice]
 * @returns {string | null}
 */
export function pickOllamaModel(
  installedNames,
  preferred = PREFERRED_OLLAMA_MODEL,
  savedChoice = undefined,
) {
  if (savedChoice && installedNames.includes(savedChoice)) {
    return savedChoice
  }
  if (installedNames.includes(preferred)) {
    return preferred
  }
  return installedNames[0] ?? null
}

/**
 * @param {string[]} installedNames
 * @param {string} model
 * @param {string} [preferred]
 * @returns {string | null}
 */
export function ensureOllamaModel(installedNames, model, preferred = PREFERRED_OLLAMA_MODEL) {
  if (installedNames.includes(model)) {
    return model
  }
  return pickOllamaModel(installedNames, preferred, model)
}
