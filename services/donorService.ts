// services/donorService.ts
import { Donor, DonorResponse } from '@/types/donor'

const API_BASE_URL = '/api'

// Helper function to safely extract ID from various formats
function extractDonorId(id: any): string {
  if (!id) return '';
  
  // If it's a string, clean it
  if (typeof id === 'string') {
    const cleaned = id.trim();
    return (cleaned && cleaned !== 'undefined' && cleaned !== 'null') ? cleaned : '';
  }
  
  // If it's an object with toString (like MongoDB ObjectId)
  if (typeof id === 'object' && id !== null && id.toString) {
    const strId = id.toString().trim();
    return (strId && strId !== 'undefined' && strId !== 'null') ? strId : '';
  }
  
  // If it's a number or other primitive
  if (id !== null && id !== undefined) {
    const strId = String(id).trim();
    return (strId && strId !== 'undefined' && strId !== 'null') ? strId : '';
  }
  
  return '';
}

// Helper to validate ObjectId format
function isValidObjectId(id: string): boolean {
  return /^[0-9a-fA-F]{24}$/.test(id);
}

export const donorService = {
  async getDonors(params?: {
    search?: string
    status?: string
    bloodType?: string
    page?: number
    limit?: number
  }): Promise<DonorResponse> {
    const queryParams = new URLSearchParams()
    if (params?.search) queryParams.append('search', params.search)
    if (params?.status) queryParams.append('status', params.status)
    if (params?.bloodType) queryParams.append('bloodType', params.bloodType)
    if (params?.page) queryParams.append('page', params.page.toString())
    if (params?.limit) queryParams.append('limit', params.limit.toString())

    const url = `${API_BASE_URL}/donors${queryParams.toString() ? `?${queryParams.toString()}` : ''}`
    const response = await fetch(url)
    
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to fetch donors')
    }
    
    return response.json()
  },

  async getDonor(id: string): Promise<Donor> {
    const cleanId = extractDonorId(id)
    
    if (!cleanId) {
      throw new Error('Donor ID is required')
    }
    
    if (!isValidObjectId(cleanId)) {
      throw new Error(`Invalid donor ID format: "${cleanId}"`)
    }
    
    const response = await fetch(`${API_BASE_URL}/donors/${cleanId}`)
    
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to fetch donor')
    }
    
    return response.json()
  },

  async createDonor(donorData: any): Promise<Donor> {
    const response = await fetch(`${API_BASE_URL}/donors`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(donorData),
    })
    
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to create donor')
    }
    
    return response.json()
  },

  async updateDonor(id: any, donorData: any): Promise<Donor> {
    console.log('🔄 updateDonor called with:', { id, idType: typeof id, donorData })
    
    // Extract and clean the ID
    const cleanId = extractDonorId(id)
    
    if (!cleanId) {
      console.error('❌ updateDonor - No valid ID extracted. Input:', id)
      throw new Error('Donor ID is required')
    }
    
    console.log('🔄 updateDonor - Clean ID:', cleanId)
    
    // Validate ObjectId format (24 hex characters)
    if (!isValidObjectId(cleanId)) {
      console.error('❌ updateDonor - Invalid ObjectId format:', cleanId)
      console.error('❌ ID should be 24 hex characters, got length:', cleanId.length)
      throw new Error(`Invalid donor ID format: "${cleanId}". Expected 24 hex characters.`)
    }
    
    console.log('🔄 updateDonor - Valid ID, making API call...')
    console.log('🔄 updateDonor - Data:', donorData)
    
    const url = `${API_BASE_URL}/donors/${encodeURIComponent(cleanId)}`
    console.log('🔄 updateDonor - URL:', url)
    
    try {
      const response = await fetch(url, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(donorData),
      })
      
      console.log('🔄 updateDonor - Response status:', response.status)
      
      // Get response text first
      const responseText = await response.text()
      console.log('🔄 updateDonor - Response text:', responseText)
      
      let result
      try {
        result = JSON.parse(responseText)
      } catch (e) {
        console.error('❌ updateDonor - Failed to parse JSON:', responseText)
        throw new Error(`Server returned invalid response: ${responseText}`)
      }
      
      if (!response.ok) {
        console.error('❌ updateDonor - Error response:', result)
        throw new Error(result.error || `Failed to update donor (Status: ${response.status})`)
      }
      
      console.log('✅ updateDonor - Success:', result)
      return result
    } catch (error: any) {
      console.error('❌ updateDonor - Error:', error)
      throw new Error(error.message || 'Failed to update donor')
    }
  },

  async deleteDonor(id: string): Promise<{ message: string; id: string }> {
    const cleanId = extractDonorId(id)
    
    if (!cleanId) {
      throw new Error('Donor ID is required')
    }
    
    if (!isValidObjectId(cleanId)) {
      throw new Error(`Invalid donor ID format: "${cleanId}"`)
    }
    
    const response = await fetch(`${API_BASE_URL}/donors/${cleanId}`, {
      method: 'DELETE',
    })
    
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to delete donor')
    }
    
    return response.json()
  },
}