// Navigation Types
export interface NavItem {
  label: string;
  href: string;
  isActive?: boolean;
}

// Sidebar Types
export interface SidebarItem {
  label: string;
  href?: string;
  onClick?: () => void;
  variant?: 'default' | 'highlight';
}

// Component Props Types
export interface NavbarProps {
  className?: string;
}

export interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  onSignInClick?: () => void;
  onSignUpClick?: () => void;
}

export interface HeroProps {
  className?: string;
}

// Button Types
export interface ButtonProps {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'xs' | 'sm' | 'md' | 'lg';
  className?: string;
  onClick?: () => void;
  disabled?: boolean;
  type?: 'button' | 'submit' | 'reset';
}

// Modal Types
export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  className?: string;
  showCloseButton?: boolean;
  closeOnBackdropClick?: boolean;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
}

// Form Component Types
export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  variant?: 'default' | 'filled';
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export interface SelectProps {
  label?: string;
  placeholder?: string;
  options: SelectOption[];
  value?: string;
  onChange: (value: string) => void;
  error?: string;
  helperText?: string;
  disabled?: boolean;
  required?: boolean;
  className?: string;
}

export interface DateInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string;
  error?: string;
  helperText?: string;
  variant?: 'default' | 'filled';
}

// Artist Profile Types (for profile management)
export interface ArtistProfile {
  id: number;
  name: string;
  stageName: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  gender: string;
  address: string;
  pinCode: string;
  state: string;
  city: string;
  subArtistType: string;
  achievements: string;
  yearsOfExperience: string;
  shortBio: string;
  image: string;
  tags: string[];
}

// Artist Types (for listings and search)
/*export interface Artist {
  id: string;
  name: string;
  category: string;
  location: string;
  duration: string;
  startingPrice: number;
  languages: string[];
  image: string;
  isBookmarked: boolean;
  gender?: string;
  subCategory?: string;
  // Additional fields for artist detail page
  bio?: string;
  yearsOfExperience?: number;
  subArtistTypes?: string[];
  achievements?: string[];
  phone?: string;
  whatsapp?: string;
  videos?: ArtistVideo[];
  shorts?: ArtistShort[];
  performances?: ArtistPerformance[];
}*/
export interface Artist {
  id: string;
  name: string;
  category: string;
  location: string;
  duration: string;
  startingPrice: number;
  languages: string[];
  image: string;
  isBookmarked: boolean;

  // ABOUT TAB
  gender?: string;
  bio?: string;
  yearsOfExperience?: number;
  achievements?: string[];
  stageName?: string;
  firstName?: string;
  lastName?: string;
  dateOfBirth?: string;
  address?: string;
  pinCode?: string;
  state?: string;
  city?: string;

  // PERFORMANCE TAB — ADD THESE
  performingLanguage?: string;
  performingEventType?: string;
  performingStates?: string;
  performingDurationFrom?: string;
  performingDurationTo?: string;
  performingMembers?: string;
  offStageMembers?: string;
}


// Artist Video Type
export interface ArtistVideo {
  id: string;
  title: string;
  thumbnail: string;
  videoUrl: string;
  duration?: string;
  views?: number;
}

// Artist Short Type
export interface ArtistShort {
  id: string;
  title: string;
  thumbnail: string;
  videoUrl: string;
  views?: number;
  likes?: number;
}

// Artist Performance Type
export interface ArtistPerformance {
  id: string;
  title: string;
  venue: string;
  date: string;
  description?: string;
  images?: string[];
}

export interface Filters {
  category: string;
  subCategory: string;
  gender: string;
  budget: string;
  eventState: string;
  eventType: string;
  language: string;
}

// Artist Profile Setup Types
export interface ArtistProfileSetupData {
  // Artist Profile Details
  profilePhoto: File | null;
  stageName: string;
  artistType: string;
  subArtistType: string;
  achievements: string;
  yearsOfExperience: string;
  shortBio: string;

  // Performance Details
  performingLanguages: string[];
  performingEventTypes: string[];
  performingStates: string[];
  performingDurationFrom: string;
  performingDurationTo: string;
  performingMembers: string;
  offStageMembers: string;

  // Contact & Pricing Details
  contactNumber: string;
  whatsappNumber: string;
  sameAsContact: boolean;
  email: string;
  soloChargesFrom: string;
  soloChargesTo: string;
  soloDescription: string;
  backingChargesFrom: string;
  backingChargesTo: string;
  backingDescription: string;

  // Videos & Social Media
  youtubeConnected: boolean;
  instagramConnected: boolean;
  youtubeChannelId: string;
  instagramAccountId: string;
}
