// types/donor.ts
export interface Donor {
  id: string
  name: string
  email: string
  phone: string
  bloodType: string
  location: string
  status: 'active' | 'inactive' | 'pending'
  lastDonation: string
  totalDonations: number
  registered: string
  nextEligible: string
  emergencyContact: string
  digitalId: string
  // Additional fields for details view
  firstName?: string
  middleName?: string
  lastName?: string
  gender?: string
  dateOfBirth?: string
  age?: number
  address?: string
  barangay?: string
  municipality?: string
  province?: string
  weight?: number
  bloodPressure?: string
  temperature?: number
  pulseRate?: number
  hemoglobin?: number
  medicalConditions?: string
  currentMedications?: string
  emergencyName?: string
  emergencyRelationship?: string
  isEligible?: boolean
  // Additional fields
  civilStatus?: string
  nationality?: string
  occupation?: string
  _id?: string
}

export interface DonorResponse {
  donors: Donor[]
  pagination: {
    total: number
    page: number
    limit: number
    totalPages: number
  }
}