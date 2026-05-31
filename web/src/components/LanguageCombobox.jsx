'use client'

import { Autocomplete, AutocompleteItem } from '@nextui-org/react'
import { TARGET_LANGUAGE_PRESETS } from '@/lib/constants'

/**
 * @param {{
 *   label: string,
 *   value: string,
 *   onValueChange: (value: string) => void,
 *   isDisabled?: boolean,
 * }} props
 */
export function LanguageCombobox({ label, value, onValueChange, isDisabled = false }) {
  return (
    <Autocomplete
      className="w-full"
      size="sm"
      label={label}
      allowsCustomValue
      inputValue={value}
      onInputChange={onValueChange}
      selectedKey={
        TARGET_LANGUAGE_PRESETS.find((p) => p.value === value)?.key ?? null
      }
      onSelectionChange={(key) => {
        if (!key) return
        const preset = TARGET_LANGUAGE_PRESETS.find((p) => p.key === key)
        if (preset) {
          onValueChange(preset.value)
        }
      }}
      isDisabled={isDisabled}
      description="Choose a preset or type any language name"
    >
      {TARGET_LANGUAGE_PRESETS.map((preset) => (
        <AutocompleteItem key={preset.key} value={preset.value}>
          {preset.label}
        </AutocompleteItem>
      ))}
    </Autocomplete>
  )
}
