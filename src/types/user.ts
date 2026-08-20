export type UserRole =
  | 'owner'
  | 'admin'
  | 'doctor'
  | 'nurse'
  | 'dentist'
  | 'pharmacist'
  | 'lab_technician'
  | 'billing_staff'
  | 'front_desk'
  | 'staff'

export interface User {
  id: string
  organizationId: string
  fullName: string
  email: string
  role: UserRole
  /** Owner = the account creator; drives billing/subscription permissions. */
  isOwner: boolean
  createdAt: string
}
