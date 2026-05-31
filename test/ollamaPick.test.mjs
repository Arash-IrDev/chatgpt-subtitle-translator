import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { pickOllamaModel, ensureOllamaModel } from '../src/ollamaPick.mjs'

describe('pickOllamaModel', () => {
  it('prefers saved choice when installed', () => {
    const names = ['gpt-oss:latest', 'gemma4:latest']
    assert.equal(pickOllamaModel(names, 'gemma4:latest', 'gpt-oss:latest'), 'gpt-oss:latest')
  })

  it('uses preferred default when saved is missing', () => {
    const names = ['gpt-oss:latest', 'gemma4:latest']
    assert.equal(pickOllamaModel(names, 'gemma4:latest', 'missing:latest'), 'gemma4:latest')
  })

  it('falls back to first installed model', () => {
    const names = ['gpt-oss:latest', 'llama3.2:latest']
    assert.equal(pickOllamaModel(names, 'gemma4:latest', undefined), 'gpt-oss:latest')
  })

  it('ensureOllamaModel keeps valid model', () => {
    const names = ['gemma4:latest']
    assert.equal(ensureOllamaModel(names, 'gemma4:latest'), 'gemma4:latest')
  })

  it('ensureOllamaModel replaces missing model', () => {
    const names = ['gpt-oss:latest']
    assert.equal(ensureOllamaModel(names, 'gemma4:latest'), 'gpt-oss:latest')
  })
})
