"use client"
import React, { useCallback, useEffect, useRef, useState } from 'react'
import { Button, Input, Card, Textarea, Slider, Switch, CardHeader, CardBody, Divider } from "@nextui-org/react";

import { EyeSlashFilledIcon } from './EyeSlashFilledIcon';
import { EyeFilledIcon } from './EyeFilledIcon';
import { ModelSelect } from './ModelSelect';
import { LanguageCombobox } from './LanguageCombobox';

import { FileUploadButton } from '@/components/FileUploadButton';
import { SubtitleCard } from '@/components/SubtitleCard';
import { downloadString } from '@/utils/download';
import { sampleSrt } from '@/data/sample';
import {
  CLOUD_RATE_LIMIT_RPM,
  LOCAL_RATE_LIMIT_RPM,
  DEFAULT_TARGET_LANGUAGE,
} from '@/lib/constants';
import {
  listOllamaModels,
  pickOllamaModel,
  ensureOllamaModel,
  OLLAMA_OPENAI_BASE_URL,
  OLLAMA_API_KEY_PLACEHOLDER,
  PREFERRED_OLLAMA_MODEL,
} from '@/lib/ollama';

import { Translator, TranslatorStructuredArray, subtitleParser, createOpenAIClient, CooldownContext } from "chatgpt-subtitle-translator"

const OPENAI_API_KEY = "OPENAI_API_KEY"
const OPENAI_BASE_URL = "OPENAI_BASE_URL"
const RATE_LIMIT = "RATE_LIMIT"
const MODEL = "MODEL"
const USE_CLOUD_API = "USE_CLOUD_API"
const TO_LANGUAGE = "TO_LANGUAGE"

const CloudDefaultModel = "gpt-4o-mini"
const DefaultTemperature = 0

/** @typedef {'idle' | 'loading' | 'ready' | 'empty' | 'offline'} OllamaStatus */

export function TranslatorApplication() {
  const [useCloudApi, setUseCloudApiState] = useState(false)
  const [APIvalue, setAPIValue] = useState("")
  const [baseUrlValue, setBaseUrlValue] = useState(OLLAMA_OPENAI_BASE_URL)
  const [fromLanguage, setFromLanguage] = useState("")
  const [toLanguage, setToLanguage] = useState(DEFAULT_TARGET_LANGUAGE)
  const [systemInstruction, setSystemInstruction] = useState("")
  const [model, setModel] = useState('')
  const [temperature, setTemperature] = useState(DefaultTemperature)
  const [batchSizes, setBatchSizes] = useState([10, 50])
  const [useStructuredMode, setUseStructuredMode] = useState(true)
  const [rateLimit, setRateLimit] = useState(CLOUD_RATE_LIMIT_RPM)

  const [ollamaModels, setOllamaModels] = useState(/** @type {string[]} */ ([]))
  const [ollamaStatus, setOllamaStatus] = useState(/** @type {OllamaStatus} */ ('idle'))
  const [ollamaError, setOllamaError] = useState(/** @type {string | null} */ (null))

  const [isAPIInputVisible, setIsAPIInputVisible] = useState(false)
  const toggleAPIInputVisibility = () => setIsAPIInputVisible(!isAPIInputVisible)

  const [srtInputText, setSrtInputText] = useState(sampleSrt)
  const [srtOutputText, setSrtOutputText] = useState('')
  const [inputs, setInputs] = useState(subtitleParser.fromSrt(sampleSrt).map(x => x.text))
  const [outputs, setOutput] = useState([])
  const [streamOutput, setStreamOutput] = useState("")
  const [translatorRunningState, setTranslatorRunningState] = useState(false)
  /** @type {React.RefObject<Translator>} */
  const translatorRef = useRef(null)
  const translatorRunningRef = useRef(false)

  const [usageInformation, setUsageInformation] = useState(/** @type {typeof Translator.prototype.usage}*/(null))
  const [RPMInfomation, setRPMInformation] = useState(0)

  const initDoneRef = useRef(false)

  function setAPIKey(value) {
    localStorage.setItem(OPENAI_API_KEY, value)
    setAPIValue(value)
  }

  function setBaseUrl(value) {
    if (!value) {
      localStorage.removeItem(OPENAI_BASE_URL)
      setBaseUrlValue(undefined)
      return
    }
    localStorage.setItem(OPENAI_BASE_URL, value)
    setBaseUrlValue(value)
  }

  /**
   * @param {string | undefined} value
   */
  function setModelValue(value) {
    if (!value) {
      localStorage.removeItem(MODEL)
      setModel('')
      return
    }
    localStorage.setItem(MODEL, value)
    setModel(value)
  }

  /**
   * @param {string} value
   */
  function setRateLimitValue(value) {
    localStorage.setItem(RATE_LIMIT, value)
    setRateLimit(Number(value))
  }

  function setToLanguageValue(value) {
    localStorage.setItem(TO_LANGUAGE, value)
    setToLanguage(value)
  }

  const refreshOllamaModels = useCallback(async () => {
    setOllamaStatus('loading')
    setOllamaError(null)
    try {
      const names = await listOllamaModels()
      setOllamaModels(names)
      if (names.length === 0) {
        setOllamaStatus('empty')
        setModelValue('')
        return
      }
      setOllamaStatus('ready')
      const saved = localStorage.getItem(MODEL)
      const picked = pickOllamaModel(names, PREFERRED_OLLAMA_MODEL, saved ?? model)
      if (picked) {
        setModelValue(picked)
      }
    } catch (error) {
      setOllamaModels([])
      setOllamaStatus('offline')
      setOllamaError(error instanceof Error ? error.message : String(error))
    }
  }, [])

  const applyLocalDefaults = useCallback(() => {
    setAPIKey(OLLAMA_API_KEY_PLACEHOLDER)
    setBaseUrl(OLLAMA_OPENAI_BASE_URL)
    setUseStructuredMode(true)
  }, [])

  const setUseCloudApi = useCallback((value) => {
    localStorage.setItem(USE_CLOUD_API, value ? 'true' : 'false')
    setUseCloudApiState(value)
    if (value) {
      setAPIValue(localStorage.getItem(OPENAI_API_KEY) ?? '')
      const savedBase = localStorage.getItem(OPENAI_BASE_URL)
      setBaseUrlValue(savedBase || undefined)
      setModelValue(localStorage.getItem(MODEL) ?? CloudDefaultModel)
      setUseStructuredMode(true)
    } else {
      applyLocalDefaults()
      refreshOllamaModels()
    }
  }, [applyLocalDefaults, refreshOllamaModels])

  useEffect(() => {
    if (initDoneRef.current) {
      return
    }
    initDoneRef.current = true

    const cloud = localStorage.getItem(USE_CLOUD_API) === 'true'
    setRateLimit(Number(localStorage.getItem(RATE_LIMIT) ?? CLOUD_RATE_LIMIT_RPM))
    setToLanguage(localStorage.getItem(TO_LANGUAGE) ?? DEFAULT_TARGET_LANGUAGE)
    setUseCloudApiState(cloud)

    if (cloud) {
      setAPIValue(localStorage.getItem(OPENAI_API_KEY) ?? '')
      const savedBase = localStorage.getItem(OPENAI_BASE_URL)
      setBaseUrlValue(savedBase || undefined)
      setModelValue(localStorage.getItem(MODEL) ?? CloudDefaultModel)
      setUseStructuredMode(true)
    } else {
      applyLocalDefaults()
      refreshOllamaModels()
    }
  }, [applyLocalDefaults, refreshOllamaModels])

  const canStart = useCloudApi
    ? Boolean(APIvalue?.trim())
    : ollamaStatus === 'ready' && Boolean(model) && ollamaModels.includes(model)

  async function generate(e) {
    e.preventDefault()

    let effectiveModel = model
    if (!useCloudApi) {
      const resolved = ensureOllamaModel(ollamaModels, model, PREFERRED_OLLAMA_MODEL)
      if (!resolved) {
        alert('No Ollama models are installed. Run `ollama pull gemma4` or choose another model.')
        return
      }
      if (resolved !== model) {
        setModelValue(resolved)
      }
      effectiveModel = resolved
    }

    setTranslatorRunningState(true)
    translatorRunningRef.current = true
    setOutput([])
    setUsageInformation(null)
    let currentStream = ""
    const outputWorkingProgress = subtitleParser.fromSrt(srtInputText)
    const currentOutputs = []

    const apiKey = useCloudApi ? APIvalue : OLLAMA_API_KEY_PLACEHOLDER
    const baseUrl = useCloudApi ? baseUrlValue : OLLAMA_OPENAI_BASE_URL
    const openai = createOpenAIClient(apiKey, true, baseUrl)

    const effectiveRateLimit = useCloudApi ? rateLimit : LOCAL_RATE_LIMIT_RPM
    const coolerChatGPTAPI = new CooldownContext(effectiveRateLimit, 60000, "ChatGPTAPI")
    const TranslatorImplementation = useStructuredMode ? TranslatorStructuredArray : Translator

    translatorRef.current = new TranslatorImplementation({ from: fromLanguage, to: toLanguage }, {
      openai,
      cooler: coolerChatGPTAPI,
      onStreamChunk: (data) => {
        if (currentStream === '' && data === "\n") {
          return
        }
        currentStream += data
        setStreamOutput(currentStream)
      },
      onStreamEnd: () => {
        currentStream = ""
        if (translatorRef.current?.aborted) {
          return
        }
        setStreamOutput("")
      },
      onClearLine: () => {
        const progressLines = currentStream.split("\n")
        if (progressLines[0] === "") {
          progressLines.shift()
        }
        progressLines.pop()
        currentStream = progressLines.join("\n") + "\n"
        if (currentStream === "\n") {
          currentStream = ""
        }
        setStreamOutput(currentStream)
      }
    }, {
      useModerator: false,
      batchSizes: batchSizes,
      createChatCompletionRequest: {
        model: effectiveModel,
        temperature: temperature,
        stream: true
      },
    })

    if (systemInstruction.trim()) {
      translatorRef.current.systemInstruction = systemInstruction.trim()
    }

    try {
      setStreamOutput("")
      for await (const output of translatorRef.current.translateLines(inputs)) {
        if (!translatorRunningRef.current) {
          break
        }
        currentOutputs.push(output.finalTransform)
        const srtEntry = outputWorkingProgress[output.index - 1]
        srtEntry.text = output.finalTransform
        setOutput([...currentOutputs])
        setUsageInformation(translatorRef.current.usage)
        setRPMInformation(translatorRef.current.services.cooler?.rate)
      }
      setSrtOutputText(subtitleParser.toSrt(outputWorkingProgress))
    } catch (error) {
      console.error(error)
      alert(error?.message ?? error)
    }
    translatorRunningRef.current = false
    translatorRef.current = null
    setTranslatorRunningState(false)
  }

  async function stopGeneration() {
    if (translatorRef.current) {
      translatorRunningRef.current = false
      translatorRef.current.abort()
    }
  }

  return (
    <>
      <div className='w-full'>
        <form id="translator-config-form" onSubmit={(e) => generate(e)}>
          <div className='px-4 pt-4 flex flex-wrap justify-between w-full gap-4'>
            <Card className="z-10 w-full shadow-md border" shadow="none">
              <CardHeader className="flex gap-3 pb-0">
                <div className="flex flex-col flex-1">
                  <p className="text-md">Configuration</p>
                  <p className="text-tiny text-default-500">
                    Local-first: Ollama on {OLLAMA_OPENAI_BASE_URL} (default model {PREFERRED_OLLAMA_MODEL})
                  </p>
                </div>
                <Switch
                  size="sm"
                  isSelected={useCloudApi}
                  onValueChange={setUseCloudApi}
                >
                  Cloud API (OpenAI)
                </Switch>
              </CardHeader>
              <CardBody>
                <div className='flex flex-wrap justify-between w-full gap-4'>
                  {!useCloudApi && (
                    <div className="w-full">
                      {ollamaStatus === 'offline' && (
                        <p className="text-small text-warning mb-2">
                          Ollama is not reachable. Start Ollama (`ollama serve`) and pull a model, then click Refresh.
                          {ollamaError ? ` (${ollamaError})` : ''}
                        </p>
                      )}
                      {ollamaStatus === 'empty' && (
                        <p className="text-small text-warning mb-2">
                          No models found. Install one, e.g. `ollama pull gemma4`, then Refresh.
                        </p>
                      )}
                      <ModelSelect
                        models={ollamaModels}
                        model={model}
                        onModelChange={setModelValue}
                        onRefresh={refreshOllamaModels}
                        isLoading={ollamaStatus === 'loading'}
                        isDisabled={translatorRunningState}
                      />
                    </div>
                  )}

                  {useCloudApi && (
                    <div className='flex flex-wrap md:flex-nowrap w-full gap-4'>
                      <Input
                        className="w-full md:w-6/12"
                        size='sm'
                        value={APIvalue}
                        onValueChange={(value) => setAPIKey(value)}
                        isRequired
                        autoComplete='off'
                        label="OpenAI API Key"
                        variant="flat"
                        description="Stored locally in your browser"
                        endContent={
                          <button className="focus:outline-none" type="button" onClick={toggleAPIInputVisibility}>
                            {isAPIInputVisible ? (
                              <EyeSlashFilledIcon className="text-2xl text-default-400 pointer-events-none" />
                            ) : (
                              <EyeFilledIcon className="text-2xl text-default-400 pointer-events-none" />
                            )}
                          </button>
                        }
                        type={isAPIInputVisible ? "text" : "password"}
                      />
                      <Input
                        className='w-full md:w-6/12'
                        size='sm'
                        type="text"
                        label="API base URL (optional)"
                        placeholder="https://api.openai.com/v1"
                        autoComplete='on'
                        value={baseUrlValue ?? ""}
                        onValueChange={(value) => setBaseUrl(value || undefined)}
                      />
                    </div>
                  )}

                  <Divider className="w-full" />

                  <div className='flex w-full gap-4'>
                    <Input
                      className='w-full md:w-6/12'
                      size='sm'
                      type="text"
                      label="From Language"
                      placeholder="Auto-detect"
                      autoComplete='on'
                      value={fromLanguage}
                      onValueChange={setFromLanguage}
                      description="Optional; leave empty to detect from subtitles"
                    />
                    <div className='w-full md:w-6/12'>
                      <LanguageCombobox
                        label="To Language"
                        value={toLanguage}
                        onValueChange={setToLanguageValue}
                        isDisabled={translatorRunningState}
                      />
                    </div>
                  </div>

                  <div className='w-full'>
                    <Textarea
                      label="System Instruction"
                      minRows={2}
                      description="Override preset system instruction"
                      placeholder={`Translate ${fromLanguage ? fromLanguage + " " : ""}to ${toLanguage}`}
                      value={systemInstruction}
                      onValueChange={setSystemInstruction}
                    />
                  </div>

                  <Divider className="w-full" />

                  <div className='flex flex-wrap md:flex-nowrap w-full gap-4'>
                    {useCloudApi && (
                      <div className='w-full md:w-1/5'>
                        <Input
                          size='sm'
                          type="text"
                          label="Model"
                          placeholder={CloudDefaultModel}
                          autoComplete='on'
                          value={model}
                          onValueChange={setModelValue}
                        />
                      </div>
                    )}

                    <div className='w-full md:w-2/5 flex gap-2'>
                      <Switch
                        size='sm'
                        isSelected={useStructuredMode}
                        onValueChange={setUseStructuredMode}
                      >
                      </Switch>
                      <div className="flex flex-col place-content-center gap-1">
                        <p className="text-small">Structured mode</p>
                        <p className="text-tiny text-default-400">
                          One JSON line per subtitle — best SRT alignment. Turn off if your model rejects JSON schema.
                        </p>
                      </div>
                    </div>

                    <div className='w-full md:w-1/5'>
                      <Slider
                        label="Temperature"
                        size="md"
                        hideThumb={true}
                        step={0.05}
                        maxValue={2}
                        minValue={0}
                        value={temperature}
                        onChange={(e) => setTemperature(Number(e))}
                      />
                    </div>

                    <div className='w-full md:w-1/5'>
                      <Slider
                        label="Batch Sizes"
                        size="md"
                        step={10}
                        maxValue={200}
                        minValue={10}
                        value={batchSizes}
                        onChange={(e) => typeof e === "number" ? setBatchSizes([e]) : setBatchSizes(e)}
                      />
                    </div>

                    {useCloudApi && (
                      <div className='w-full md:w-1/5'>
                        <Input
                          size='sm'
                          type="number"
                          min="1"
                          label="Rate limit"
                          value={rateLimit.toString()}
                          onValueChange={(value) => setRateLimitValue(value)}
                          autoComplete='on'
                          description="Max API requests per minute (RPM)"
                          endContent={
                            <div className="pointer-events-none flex items-center">
                              <span className="text-default-400 text-small">RPM</span>
                            </div>
                          }
                        />
                      </div>
                    )}
                  </div>

                  {!useCloudApi && (
                    <p className="text-tiny text-default-400 w-full">
                      Local Ollama: no rate limit control needed ({LOCAL_RATE_LIMIT_RPM} RPM cap applied internally so batches are not delayed).
                    </p>
                  )}
                </div>
              </CardBody>
            </Card>
          </div>
        </form>

        <div className='w-full justify-between md:justify-center flex flex-wrap gap-1 sm:gap-4 mt-auto sticky top-0 backdrop-blur px-4 pt-4'>
          <FileUploadButton label={"Import SRT"} onFileSelect={async (file) => {
            try {
              const text = await file.text()
              const parsed = subtitleParser.fromSrt(text)
              setSrtInputText(text)
              setInputs(parsed.map(x => x.text))
            } catch (error) {
              alert(error.message ?? error)
            }
          }} />
          {!translatorRunningState && (
            <Button type='submit' form="translator-config-form" color="primary" isDisabled={!canStart || translatorRunningState}>
              Start
            </Button>
          )}

          {translatorRunningState && (
            <Button color="danger" onClick={() => stopGeneration()} isLoading={!streamOutput}>
              Stop
            </Button>
          )}

          <Button color="primary" onClick={() => {
            downloadString(srtOutputText, "text/plain", "export.srt")
          }}>
            Export SRT
          </Button>
          <Divider className='mt-3 sm:mt-0' />
        </div>

        <div className="lg:flex lg:gap-4 px-4 mt-4">
          <div className="lg:w-1/2">
            <SubtitleCard label={"Input"}>
              <ol className="py-2 list-decimal line-marker ">
                {inputs.map((line, i) => {
                  return (
                    <li key={i} className=''>
                      <div className='ml-4 truncate'>
                        {line}
                      </div>
                    </li>
                  )
                })}
              </ol>
            </SubtitleCard>
          </div>

          <div className="lg:w-1/2">
            <SubtitleCard label={"Output"}>
              <ol className="py-2 list-decimal line-marker ">
                {outputs.map((line, i) => {
                  return (
                    <li key={i} className=''>
                      <div className='ml-4 truncate'>
                        {line}
                      </div>
                    </li>
                  )
                })}
                <pre className='px-2 text-wrap'>
                  {streamOutput}
                </pre>
              </ol>
            </SubtitleCard>

            {usageInformation && (
              <Card shadow="sm" className='mt-4 p-4'>
                <span><b>Estimated Usage</b></span>
                <span>Tokens: {usageInformation?.promptTokensUsed} + {usageInformation?.completionTokensUsed} = {usageInformation?.usedTokens}</span>
                {usageInformation?.wastedTokens > 0 && (
                  <span className={'text-danger'}>Wasted: {usageInformation?.promptTokensWasted} + {usageInformation?.completionTokensWasted} = {usageInformation?.wastedTokens} {usageInformation?.wastedPercent}</span>
                )}
                {usageInformation?.cachedTokens > 0 && (
                  <span className={'text-success'}>Cached: {usageInformation?.cachedTokens}</span>
                )}
                {usageInformation?.contextTokens > 0 && (
                  <span>Context: {usageInformation?.contextPromptTokens} + {usageInformation?.contextCompletionTokens} = {usageInformation?.contextTokens}</span>
                )}
                <span>{usageInformation?.promptRate} + {usageInformation?.completionRate} = {usageInformation?.rate} TPM {RPMInfomation} RPM</span>
              </Card>
            )}

          </div>
        </div>
      </div>
    </>
  )
}
