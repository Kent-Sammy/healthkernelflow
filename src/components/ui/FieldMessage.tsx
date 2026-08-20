import { AlertCircle } from 'lucide-react'

export interface FieldMessageProps {
  helperText?: string
  errorText?: string
  id?: string
}

/** Shared helper/error line used beneath Input, Select and other form fields — one place to keep that pattern consistent. */
export function FieldMessage({ helperText, errorText, id }: FieldMessageProps) {
  if (errorText) {
    return (
      <p id={id} className="flex items-center gap-1 text-caption text-danger-600">
        <AlertCircle className="size-3.5 shrink-0" aria-hidden="true" />
        {errorText}
      </p>
    )
  }
  if (helperText) {
    return (
      <p id={id} className="text-caption text-neutral-500">
        {helperText}
      </p>
    )
  }
  return null
}
