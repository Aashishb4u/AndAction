/**
 * Database Types
 * Type definitions for database models and operations
 */

// User Roles
export type UserRole = 'user' | 'artist'

// Gender Options
export type Gender = 'male' | 'female' | 'other' | 'prefer_not_to_say'

// User creation input (for signup)
export interface CreateUserInput {
  email: string
  password?: string
  firstName?: string
  lastName?: string
  countryCode?: string
  phoneNumber?: string
  role?: UserRole
  
  // OAuth fields
  googleId?: string
  facebookId?: string
  appleId?: string
}

// User update input
export interface UpdateUserInput {
  firstName?: string
  lastName?: string
  countryCode?: string
  phoneNumber?: string
  city?: string
  state?: string
  address?: string
  zip?: string
  avatar?: string
  gender?: string
  dob?: Date
}

// Artist creation input
export interface CreateArtistInput {
  userId: string
  stageName?: string
  artistType?: string
  subArtistType?: string
  achievements?: string
  yearsOfExperience?: number
  shortBio?: string
  performingLanguage?: string
  performingEventType?: string
  performingStates?: string
  performingDurationFrom?: string
  performingDurationTo?: string
  performingMembers?: string
  offStageMembers?: string
  contactNumber?: string
  whatsappNumber?: string
  contactEmail?: string
  soloChargesFrom?: number
  soloChargesTo?: number
  soloChargesDescription?: string
  chargesWithBacklineFrom?: number
  chargesWithBacklineTo?: number
  chargesWithBacklineDescription?: string
  youtubeChannelId?: string
  instagramId?: string
}

// Artist update input
export type UpdateArtistInput = Partial<Omit<CreateArtistInput, 'userId'>>

// Safe user object (without password)
export interface SafeUser {
  id: string
  email: string
  firstName?: string | null
  lastName?: string | null
  countryCode?: string | null
  phoneNumber?: string | null
  city?: string | null
  state?: string | null
  address?: string | null
  zip?: string | null
  avatar?: string | null
  role: string
  isAccountVerified: boolean
  isArtistVerified: boolean
  gender?: string | null
  dob?: Date | null
  createdAt: Date
  updatedAt: Date
}

