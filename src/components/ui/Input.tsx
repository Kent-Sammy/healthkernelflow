import { forwardRef, useId, type InputHTMLAttributes, type ReactNode } from 'react'
import { cn } from '@/lib/cn'
import { Label } from './Label'
import { FieldMessage } from './FieldMessage'

export interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size'> {
  label?: string
  helperText?: string
  errorText?: string
  leftIcon?: ReactNode
  rightIcon?: ReactNode
  containerClassName?: string
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { label, helperText, errorText, leftIcon, rightIcon, className, containerClassName, id, ...props },
  ref,
) {
  const generatedId = useId()
  const inputId = id ?? generatedId
  const messageId = `${inputId}-message`
  const hasError = Boolean(errorText)

  return (
    <div className={cn('flex flex-col gap-1.5', containerClassName)}>
      {label && <Label htmlFor={inputId}>{label}</Label>}

      <div className="relative flex items-center">
        {leftIcon && <span className="pointer-events-none absolute left-3 flex text-neutral-400">{leftIcon}</span>}

        <input
          ref={ref}
          id={inputId}
          className={cn(
            'h-10 w-full rounded-md border bg-neutral-0 px-3 text-body-sm text-neutral-900 placeholder:text-neutral-400 transition-colors',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600/40 focus-visible:border-brand-600',
            'disabled:cursor-not-allowed disabled:bg-neutral-100 disabled:text-neutral-400',
            hasError ? 'border-danger-400 focus-visible:border-danger-600 focus-visible:ring-danger-600/30' : 'border-neutral-300',
            leftIcon && 'pl-9',
            rightIcon && 'pr-9',
            className,
          )}
          aria-invalid={hasError || undefined}
          aria-describedby={helperText || errorText ? messageId : undefined}
          {...props}
        />

        {rightIcon && <span className="pointer-events-none absolute right-3 flex text-neutral-400">{rightIcon}</span>}
      </div>

      <FieldMessage id={messageId} helperText={helperText} errorText={errorText} />
    </div>
  )
})
