import { useId } from 'react'
import * as CheckboxPrimitive from '@radix-ui/react-checkbox'
import { Check } from 'lucide-react'
import { cn } from '@/lib/cn'
import { FieldMessage } from './FieldMessage'

export interface CheckboxProps {
  checked?: boolean | 'indeterminate'
  defaultChecked?: boolean
  onCheckedChange?: (checked: boolean | 'indeterminate') => void
  label?: string
  description?: string
  errorText?: string
  disabled?: boolean
  name?: string
  id?: string
  className?: string
}

export function Checkbox({
  checked,
  defaultChecked,
  onCheckedChange,
  label,
  description,
  errorText,
  disabled,
  name,
  id,
  className,
}: CheckboxProps) {
  const generatedId = useId()
  const checkboxId = id ?? generatedId
  const messageId = `${checkboxId}-message`
  const hasError = Boolean(errorText)

  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      <div className="flex items-start gap-2.5">
        <CheckboxPrimitive.Root
          id={checkboxId}
          checked={checked}
          defaultChecked={defaultChecked}
          onCheckedChange={onCheckedChange}
          disabled={disabled}
          name={name}
          aria-describedby={description || errorText ? messageId : undefined}
          className={cn(
            'mt-0.5 flex size-4.5 shrink-0 items-center justify-center rounded-sm border transition-colors',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600/40',
            'data-[state=checked]:bg-brand-600 data-[state=checked]:border-brand-600',
            'disabled:cursor-not-allowed disabled:opacity-50',
            hasError ? 'border-danger-400' : 'border-neutral-300 bg-neutral-0',
          )}
        >
          <CheckboxPrimitive.Indicator className="text-white">
            <Check className="size-3.5" strokeWidth={3} aria-hidden="true" />
          </CheckboxPrimitive.Indicator>
        </CheckboxPrimitive.Root>

        {(label || description) && (
          <label htmlFor={checkboxId} className={cn('flex flex-col gap-0.5', disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer')}>
            {label && <span className="text-body-sm font-medium text-neutral-900">{label}</span>}
            {description && <span className="text-caption text-neutral-500">{description}</span>}
          </label>
        )}
      </div>

      <FieldMessage id={messageId} errorText={errorText} />
    </div>
  )
}
