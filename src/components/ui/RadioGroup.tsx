import { useId } from 'react'
import * as RadioGroupPrimitive from '@radix-ui/react-radio-group'
import { cn } from '@/lib/cn'
import { FieldMessage } from './FieldMessage'

export interface RadioOption {
  value: string
  label: string
  description?: string
  disabled?: boolean
}

export interface RadioGroupProps {
  options: RadioOption[]
  value?: string
  defaultValue?: string
  onValueChange?: (value: string) => void
  name?: string
  errorText?: string
  orientation?: 'vertical' | 'horizontal'
  className?: string
}

export function RadioGroup({
  options,
  value,
  defaultValue,
  onValueChange,
  name,
  errorText,
  orientation = 'vertical',
  className,
}: RadioGroupProps) {
  const groupId = useId()

  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      <RadioGroupPrimitive.Root
        value={value}
        defaultValue={defaultValue}
        onValueChange={onValueChange}
        name={name}
        className={cn('flex gap-3', orientation === 'vertical' ? 'flex-col' : 'flex-row flex-wrap')}
      >
        {options.map((option) => {
          const itemId = `${groupId}-${option.value}`
          return (
            <div key={option.value} className="flex items-start gap-2.5">
              <RadioGroupPrimitive.Item
                id={itemId}
                value={option.value}
                disabled={option.disabled}
                className={cn(
                  'mt-0.5 flex size-4.5 shrink-0 items-center justify-center rounded-full border border-neutral-300 bg-neutral-0 transition-colors',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600/40',
                  'data-[state=checked]:border-brand-600',
                  'disabled:cursor-not-allowed disabled:opacity-50',
                )}
              >
                <RadioGroupPrimitive.Indicator className="flex items-center justify-center after:size-2.5 after:rounded-full after:bg-brand-600" />
              </RadioGroupPrimitive.Item>

              <label htmlFor={itemId} className={cn('flex flex-col gap-0.5', option.disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer')}>
                <span className="text-body-sm font-medium text-neutral-900">{option.label}</span>
                {option.description && <span className="text-caption text-neutral-500">{option.description}</span>}
              </label>
            </div>
          )
        })}
      </RadioGroupPrimitive.Root>

      <FieldMessage errorText={errorText} />
    </div>
  )
}
