import { Check } from 'lucide-react'
import { cn } from '@/lib/cn'
import { Progress } from './Progress'

export interface StepperStep {
  id: string
  label: string
}

export interface StepperProps {
  steps: StepperStep[]
  currentStepId: string
  completedStepIds: string[]
  className?: string
}

type StepState = 'completed' | 'current' | 'upcoming'

function getStepState(stepId: string, currentStepId: string, completedStepIds: string[]): StepState {
  if (completedStepIds.includes(stepId)) return 'completed'
  if (stepId === currentStepId) return 'current'
  return 'upcoming'
}

/**
 * Horizontal step indicator for multi-step flows (onboarding, custom
 * configuration). Collapses to a compact "Step X of Y" readout on narrow
 * screens where a full horizontal stepper wouldn't fit.
 */
export function Stepper({ steps, currentStepId, completedStepIds, className }: StepperProps) {
  const currentIndex = Math.max(
    0,
    steps.findIndex((s) => s.id === currentStepId),
  )

  return (
    <nav className={cn('w-full', className)} aria-label="Progress">
      {/* Compact mobile readout */}
      <div className="sm:hidden">
        <p className="text-caption text-neutral-500">
          Step {currentIndex + 1} of {steps.length}
        </p>
        <p className="text-body-sm font-medium text-neutral-900">{steps[currentIndex]?.label}</p>
        <Progress value={currentIndex + 1} max={steps.length} />
      </div>

      {/* Full stepper */}
      <ol className="hidden items-start sm:flex">
        {steps.map((step, index) => {
          const state = getStepState(step.id, currentStepId, completedStepIds)
          const isLast = index === steps.length - 1

          return (
            <li key={step.id} className={cn('flex items-center', !isLast && 'flex-1')}>
              <div className="flex flex-col items-center gap-2">
                <div
                  className={cn(
                    'flex size-8 shrink-0 items-center justify-center rounded-full border text-caption font-semibold transition-colors',
                    state === 'completed' && 'border-brand-600 bg-brand-600 text-white',
                    state === 'current' && 'border-brand-600 bg-neutral-0 text-brand-700',
                    state === 'upcoming' && 'border-neutral-300 bg-neutral-0 text-neutral-400',
                  )}
                  aria-current={state === 'current' ? 'step' : undefined}
                >
                  {state === 'completed' ? <Check className="size-4" aria-hidden="true" /> : index + 1}
                </div>
                <span
                  className={cn(
                    'max-w-24 text-center text-caption font-medium',
                    state === 'upcoming' ? 'text-neutral-400' : 'text-neutral-800',
                  )}
                >
                  {step.label}
                </span>
              </div>

              {!isLast && (
                <div
                  className={cn(
                    'mx-2 mb-6 h-px flex-1 self-start',
                    state === 'completed' ? 'bg-brand-600' : 'bg-neutral-200',
                  )}
                  style={{ marginTop: '1rem' }}
                />
              )}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
