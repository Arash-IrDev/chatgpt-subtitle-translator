'use client'

import { Select, SelectItem, Button } from '@nextui-org/react'

/**
 * @param {{
 *   models: string[],
 *   model: string,
 *   onModelChange: (name: string) => void,
 *   onRefresh: () => void,
 *   isLoading?: boolean,
 *   isDisabled?: boolean,
 * }} props
 */
export function ModelSelect({
  models,
  model,
  onModelChange,
  onRefresh,
  isLoading = false,
  isDisabled = false,
}) {
  return (
    <div className="flex w-full gap-2 items-end">
      <Select
        className="flex-1 min-w-0"
        size="sm"
        label="Ollama model"
        placeholder={isLoading ? 'Loading models…' : 'No models installed'}
        selectedKeys={model && models.includes(model) ? [model] : []}
        onSelectionChange={(keys) => {
          const value = Array.from(keys)[0]
          if (typeof value === 'string' && value) {
            onModelChange(value)
          }
        }}
        isDisabled={isDisabled || isLoading || models.length === 0}
        isLoading={isLoading}
        description="Installed models from your local Ollama"
      >
        {models.map((name) => (
          <SelectItem key={name} value={name}>
            {name}
          </SelectItem>
        ))}
      </Select>
      <Button
        size="sm"
        variant="flat"
        type="button"
        className="h-10 shrink-0 min-w-[5.5rem]"
        onPress={onRefresh}
        isLoading={isLoading}
        isDisabled={isDisabled}
      >
        Refresh
      </Button>
    </div>
  )
}
