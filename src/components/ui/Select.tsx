import { useId } from 'react'
import * as SelectPrimitive from '@radix-ui/react-select'
import { Check, ChevronDown } from 'lucide-react'
import { cn } from '@/lib/cn'
import { Label } from './Label'
import { FieldMessage } from './FieldMessage'

export interface SelectOption {
  value: string
  label: string
  disabled?: boolean
}

export interface SelectProps {
  options: SelectOption[]
  value?: string
  defaultValue?: string
  onValueChange?: (value: string) => void
  placeholder?: string
  label?: string
  helperText?: string
  errorText?: string
  disabled?: boolean
  name?: string
  className?: string
}

/** Styled wrapper around Radix Select — accessible listbox behavior with the design system's visual language. */
export function Select({
  options,
  value,
  defaultValue,
  onValueChange,
  placeholder = 'Select an option',
  label,
  helperText,
  errorText,
  disabled,
  name,
  className,
}: SelectProps) {
  const generatedId = useId()
  const triggerId = `${generatedId}-trigger`
  const messageId = `${generatedId}-message`
  const hasError = Boolean(errorText)

  return (
    <div className="flex flex-col gap-1.5">
      {label && <Label htmlFor={triggerId}>{label}</Label>}

      <SelectPrimitive.Root value={value} defaultValue={defaultValue} onValueChange={onValueChange} disabled={disabled} name={name}>
        <SelectPrimitive.Trigger
          id={triggerId}
          className={cn(
            'flex h-10 w-full items-center justify-between rounded-md border bg-neutral-0 px-3 text-body-sm text-neutral-900 transition-colors',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600/40 focus-visible:border-brand-600',
            'disabled:cursor-not-allowed disabled:bg-neutral-100 disabled:text-neutral-400',
            'data-[placeholder]:text-neutral-400',
            hasError ? 'border-danger-400' : 'border-neutral-300',
            className,
          )}
          aria-invalid={hasError || undefined}
          aria-describedby={helperText || errorText ? messageId : undefined}
        >
          <SelectPrimitive.Value placeholder={placeholder} />
          <SelectPrimitive.Icon>
            <ChevronDown className="size-4 text-neutral-500" aria-hidden="true" />
          </SelectPrimitive.Icon>
        </SelectPrimitive.Trigger>

        <SelectPrimitive.Portal>
          <SelectPrimitive.Content
            className="z-50 max-h-72 min-w-(--radix-select-trigger-width) overflow-hidden rounded-md border border-neutral-200 bg-neutral-0 shadow-lg"
            position="popper"
            sideOffset={4}
          >
            <SelectPrimitive.Viewport className="p-1">
              {options.map((option) => (
                <SelectPrimitive.Item
                  key={option.value}
                  value={option.value}
                  disabled={option.disabled}
                  className={cn(
                    'relative flex h-9 cursor-pointer select-none items-center rounded-sm px-8 text-body-sm text-neutral-900 outline-none',
                    'data-[highlighted]:bg-brand-50 data-[highlighted]:text-brand-900',
                    'data-[disabled]:cursor-not-allowed data-[disabled]:text-neutral-400',
                  )}
                >
                  <SelectPrimitive.ItemIndicator className="absolute left-2.5 flex items-center">
                    <Check className="size-4" aria-hidden="true" />
                  </SelectPrimitive.ItemIndicator>
                  <SelectPrimitive.ItemText>{option.label}</SelectPrimitive.ItemText>
                </SelectPrimitive.Item>
              ))}
            </SelectPrimitive.Viewport>
          </SelectPrimitive.Content>
        </SelectPrimitive.Portal>
      </SelectPrimitive.Root>

      <FieldMessage id={messageId} helperText={helperText} errorText={errorText} />
    </div>
  )
}
