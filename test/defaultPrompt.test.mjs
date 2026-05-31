import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { buildDefaultSystemInstruction } from '../web/src/lib/defaultPrompt.js'

describe('buildDefaultSystemInstruction', () => {
  it('includes target language and learning audience', () => {
    const prompt = buildDefaultSystemInstruction({ from: 'Turkish', to: 'Persian' })
    assert.match(prompt, /Turkish/)
    assert.match(prompt, /Persian/)
    assert.match(prompt, /one translated line per input line/i)
  })

  it('supports auto-detect when from is empty', () => {
    const prompt = buildDefaultSystemInstruction({ from: '', to: 'English' })
    assert.match(prompt, /Detect the source language/i)
  })
})
