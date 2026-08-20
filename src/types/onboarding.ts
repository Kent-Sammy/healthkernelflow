export type OnboardingFlow = 'fixed_plan' | 'help_me_choose' | 'custom'

export type OnboardingStepId =
  | 'account'
  | 'organization_type' // custom / help-me-choose only
  | 'organization'
  | 'location'
  | 'care_model' // custom only
  | 'services' // custom only
  | 'capacity' // custom only
  | 'facilities'
  | 'team_size'
  | 'capabilities' // custom only
  | 'branding' // custom only
  | 'integrations' // custom only
  | 'workspace'
  | 'trial_review'

export interface OnboardingProgress {
  flow: OnboardingFlow
  currentStepId: OnboardingStepId | null
  completedStepIds: OnboardingStepId[]
  startedAt: string
  updatedAt: string
}
