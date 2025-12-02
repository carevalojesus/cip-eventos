/**
 * Duotone Icons Component Collection
 * CIP Eventos - Icon System
 *
 * Clean, simple SVG icons with duotone support
 * Each icon supports customizable primary/secondary colors and size
 */

export interface DuotoneIconProps {
  primary?: string
  secondary?: string
  size?: number
  className?: string
}

// 1. Dashboard Icon - 4 squares in 2x2 grid
export function IconDashboard({
  primary = 'currentColor',
  secondary = 'currentColor',
  size = 24,
  className = ''
}: DuotoneIconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <rect x="3" y="3" width="8" height="8" rx="2" fill={secondary} opacity="0.3"/>
      <rect x="13" y="3" width="8" height="8" rx="2" fill={primary}/>
      <rect x="3" y="13" width="8" height="8" rx="2" fill={primary}/>
      <rect x="13" y="13" width="8" height="8" rx="2" fill={secondary} opacity="0.3"/>
    </svg>
  )
}

// 2. Calendar Icon - Calendar with header and date
export function IconCalendar({
  primary = 'currentColor',
  secondary = 'currentColor',
  size = 24,
  className = ''
}: DuotoneIconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <path d="M5 4h14a2 2 0 0 1 2 2v13a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6c0-1.1.9-2 2-2zm0 5v10h14V9H5z" fill={primary}/>
      <path d="M13 13h3v3h-3v-3zM7 2a1 1 0 0 1 1 1v3a1 1 0 1 1-2 0V3a1 1 0 0 1 1-1zm10 0a1 1 0 0 1 1 1v3a1 1 0 0 1-2 0V3a1 1 0 0 1 1-1z" fill={secondary}/>
    </svg>
  )
}

// 3. User Group Icon - 2 people
export function IconUserGroup({
  primary = 'currentColor',
  secondary = 'currentColor',
  size = 24,
  className = ''
}: DuotoneIconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <path d="M15 11a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm7 8a2 2 0 0 1-2 2H10a2 2 0 0 1-2-2v-1a5 5 0 0 1 5-5h4a5 5 0 0 1 5 5v1z" fill={primary}/>
      <path d="M9 11a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm7 8a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2v-1a5 5 0 0 1 5-5h4a5 5 0 0 1 5 5v1z" fill={secondary}/>
    </svg>
  )
}

// 3b. Microphone Icon - Speaker/Ponente
export function IconMicrophone({
  primary = 'currentColor',
  secondary = 'currentColor',
  size = 24,
  className = ''
}: DuotoneIconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <path d="M12 1a4 4 0 0 1 4 4v6a4 4 0 1 1-8 0V5a4 4 0 0 1 4-4z" fill={secondary}/>
      <path d="M13 18.94V21h3a1 1 0 0 1 0 2H8a1 1 0 0 1 0-2h3v-2.06A8 8 0 0 1 4 11a1 1 0 0 1 2 0 6 6 0 1 0 12 0 1 1 0 0 1 2 0 8 8 0 0 1-7 7.94z" fill={primary}/>
    </svg>
  )
}

// 4. Office Icon - Building with windows
export function IconOffice({
  primary = 'currentColor',
  secondary = 'currentColor',
  size = 24,
  className = ''
}: DuotoneIconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <rect x="4" y="3" width="16" height="18" rx="2" fill={secondary} opacity="0.3"/>
      <rect x="7" y="6" width="3" height="3" rx="0.5" fill={primary}/>
      <rect x="14" y="6" width="3" height="3" rx="0.5" fill={primary}/>
      <rect x="7" y="11" width="3" height="3" rx="0.5" fill={primary}/>
      <rect x="14" y="11" width="3" height="3" rx="0.5" fill={primary}/>
      <rect x="10" y="16" width="4" height="5" fill={primary}/>
    </svg>
  )
}

// 5. Ticket Icon - Ticket with notch
export function IconTicket({
  primary = 'currentColor',
  secondary = 'currentColor',
  size = 24,
  className = ''
}: DuotoneIconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <path d="M22 15v4a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1v-4a3 3 0 0 0 0-6V5a1 1 0 0 1 1-1h18a1 1 0 0 1 1 1v4a3 3 0 0 0 0 6z" fill={primary}/>
      <path d="M9 20H3a1 1 0 0 1-1-1v-4a3 3 0 0 0 0-6V5a1 1 0 0 1 1-1h6v16z" fill={secondary}/>
    </svg>
  )
}

// 5b. Survey Icon - Clipboard for registrations
export function IconSurvey({
  primary = 'currentColor',
  secondary = 'currentColor',
  size = 24,
  className = ''
}: DuotoneIconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <path d="M5 5h14a2 2 0 0 1 2 2v13a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7c0-1.1.9-2 2-2zm3 7a1 1 0 0 0 0 2h8a1 1 0 0 0 0-2H8zm0 4a1 1 0 0 0 0 2h4a1 1 0 0 0 0-2H8z" fill={primary}/>
      <path d="M15 4a2 2 0 0 1 2 2v1a1 1 0 0 1-1 1H8a1 1 0 0 1-1-1V6c0-1.1.9-2 2-2 0-1.1.9-2 2-2h2a2 2 0 0 1 2 2z" fill={secondary}/>
    </svg>
  )
}

// 6. Identification Icon - ID card with photo and lines
export function IconIdentification({
  primary = 'currentColor',
  secondary = 'currentColor',
  size = 24,
  className = ''
}: DuotoneIconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <path d="M4 4h16a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6c0-1.1.9-2 2-2zm13 3a1 1 0 0 0 0 2h2a1 1 0 0 0 0-2h-2zm-2 4a1 1 0 0 0 0 2h4a1 1 0 0 0 0-2h-4zm1 4a1 1 0 0 0 0 2h3a1 1 0 0 0 0-2h-3z" fill={primary}/>
      <path d="M8 12a3 3 0 1 1 0-6 3 3 0 0 1 0 6zm-2 2h4a2 2 0 0 1 2 2v1a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1v-1c0-1.1.9-2 2-2z" fill={secondary}/>
    </svg>
  )
}

// 7. Certificate Icon - Diploma with ribbon
export function IconCertificate({
  primary = 'currentColor',
  secondary = 'currentColor',
  size = 24,
  className = ''
}: DuotoneIconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <path d="M4 3h16a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5c0-1.1.9-2 2-2zm16 12V7a2 2 0 0 1-2-2H6a2 2 0 0 1-2 2v8a2 2 0 0 1 2 2h12c0-1.1.9-2 2-2zM8 7h8a1 1 0 0 1 0 2H8a1 1 0 1 1 0-2z" fill={primary}/>
      <path d="M11.65 18.23a4 4 0 1 1 4.7 0l2.5 3.44-2.23-.18-1.48 1.68-.59-4.2a4.04 4.04 0 0 1-1.1 0l-.6 4.2-1.47-1.68-2.23.18 2.5-3.44zM14 17a2 2 0 1 0 0-4 2 2 0 0 0 0 4z" fill={secondary}/>
    </svg>
  )
}

// 8. Trending Up Icon - Arrow going up
export function IconTrendingUp({
  primary = 'currentColor',
  secondary = 'currentColor',
  size = 24,
  className = ''
}: DuotoneIconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <path d="M3 17l5-5 4 4 8-8" stroke={secondary} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" opacity="0.3"/>
      <path d="M3 17l5-5 4 4 8-8" stroke={primary} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M16 6h5v5" stroke={primary} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
}

// 9. Credit Card Icon - Card with chip and stripe
export function IconCreditCard({
  primary = 'currentColor',
  secondary = 'currentColor',
  size = 24,
  className = ''
}: DuotoneIconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <rect x="2" y="5" width="20" height="14" rx="2" fill={secondary} opacity="0.3"/>
      <rect x="2" y="8" width="20" height="3" fill={primary}/>
      <rect x="5" y="14" width="4" height="2.5" rx="0.5" fill={primary}/>
      <rect x="11" y="14" width="3" height="2.5" rx="0.5" fill={primary}/>
    </svg>
  )
}

// 9b. Money Icon - Cash/Bills for payments
export function IconMoney({
  primary = 'currentColor',
  secondary = 'currentColor',
  size = 24,
  className = ''
}: DuotoneIconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <path d="M18 14.74a4 4 0 0 0-8 .26H3a2 2 0 0 1-2-2V5c0-1.1.9-2 2-2h14a2 2 0 0 1 2 2v8a2 2 0 0 1-1 1.74zM10 12a3 3 0 1 0 0-6 3 3 0 0 0 0 6z" fill={secondary}/>
      <path d="M7 9h14a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-8c0-1.1.9-2 2-2zm7 9a3 3 0 1 0 0-6 3 3 0 0 0 0 6z" fill={primary}/>
    </svg>
  )
}

// 10. Chart Icon - Bar chart
export function IconChart({
  primary = 'currentColor',
  secondary = 'currentColor',
  size = 24,
  className = ''
}: DuotoneIconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <rect x="4" y="12" width="4" height="8" rx="1" fill={secondary} opacity="0.3"/>
      <rect x="10" y="8" width="4" height="12" rx="1" fill={primary}/>
      <rect x="16" y="4" width="4" height="16" rx="1" fill={primary}/>
    </svg>
  )
}

// 11. Wallet Icon - Wallet
export function IconWallet({
  primary = 'currentColor',
  secondary = 'currentColor',
  size = 24,
  className = ''
}: DuotoneIconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <path d="M2 5c0 1.1.9 2 2 2h16a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5zm16 11a2 2 0 1 0 0-4 2 2 0 0 0 0 4z" fill={primary}/>
      <path d="M4 3h11a2 2 0 0 1 2 2v2H4a2 2 0 1 1 0-4z" fill={secondary}/>
    </svg>
  )
}

// 12. User Add Icon - Person with plus sign
export function IconUserAdd({
  primary = 'currentColor',
  secondary = 'currentColor',
  size = 24,
  className = ''
}: DuotoneIconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <circle cx="9" cy="8" r="4" fill={secondary} opacity="0.3"/>
      <path d="M2 20c0-2.8 2.2-5 5-5h4c2.8 0 5 2.2 5 5v1H2v-1z" fill={secondary} opacity="0.3"/>
      <path d="M19 8v3m0 3v-3m0 0h-3m3 0h3" stroke={primary} strokeWidth="2" strokeLinecap="round"/>
    </svg>
  )
}

// 13. Cog Icon - Gear/Settings
export function IconCog({
  primary = 'currentColor',
  secondary = 'currentColor',
  size = 24,
  className = ''
}: DuotoneIconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <path d="M6.8 3.45c.87-.52 1.82-.92 2.83-1.17a2.5 2.5 0 0 0 4.74 0c1.01.25 1.96.65 2.82 1.17a2.5 2.5 0 0 0 3.36 3.36c.52.86.92 1.8 1.17 2.82a2.5 2.5 0 0 0 0 4.74c-.25 1.01-.65 1.96-1.17 2.82a2.5 2.5 0 0 0-3.36 3.36c-.86.52-1.8.92-2.82 1.17a2.5 2.5 0 0 0-4.74 0c-1.01-.25-1.96-.65-2.82-1.17a2.5 2.5 0 0 0-3.36-3.36 9.94 9.94 0 0 1-1.17-2.82 2.5 2.5 0 0 0 0-4.74c.25-1.01.65-1.96 1.17-2.82a2.5 2.5 0 0 0 3.36-3.36zM12 16a4 4 0 1 0 0-8 4 4 0 0 0 0 8z" fill={primary}/>
      <circle cx="12" cy="12" r="2" fill={secondary}/>
    </svg>
  )
}

// 14. User Icon - Single person
export function IconUser({
  primary = 'currentColor',
  secondary = 'currentColor',
  size = 24,
  className = ''
}: DuotoneIconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <path d="M12 12a5 5 0 1 1 0-10 5 5 0 0 1 0 10z" fill={primary}/>
      <path d="M21 20v-1a5 5 0 0 0-5-5H8a5 5 0 0 0-5 5v1c0 1.1.9 2 2 2h14a2 2 0 0 0 2-2z" fill={secondary}/>
    </svg>
  )
}

// 15. Bell Icon - Notification bell
export function IconBell({
  primary = 'currentColor',
  secondary = 'currentColor',
  size = 24,
  className = ''
}: DuotoneIconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <path d="M6 10c0-3.3 2.7-6 6-6s6 2.7 6 6v5c0 1.1.9 2 2 2H4c1.1 0 2-.9 2-2v-5z" fill={secondary} opacity="0.3"/>
      <rect x="11" y="2" width="2" height="3" rx="1" fill={primary}/>
      <path d="M10 19c0 1.1.9 2 2 2s2-.9 2-2" stroke={primary} strokeWidth="2" strokeLinecap="round"/>
    </svg>
  )
}

// 16. Monitor Icon - Computer screen
export function IconMonitor({
  primary = 'currentColor',
  secondary = 'currentColor',
  size = 24,
  className = ''
}: DuotoneIconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <rect x="2" y="4" width="20" height="12" rx="2" fill={secondary} opacity="0.3"/>
      <rect x="5" y="7" width="14" height="6" rx="1" fill={primary}/>
      <rect x="8" y="18" width="8" height="2" rx="1" fill={primary}/>
      <rect x="11" y="16" width="2" height="2" fill={primary}/>
    </svg>
  )
}

// 17. Door Exit Icon - Exit door with arrow
export function IconDoorExit({
  primary = 'currentColor',
  secondary = 'currentColor',
  size = 24,
  className = ''
}: DuotoneIconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <path d="M11 4h3a1 1 0 0 1 1 1v3a1 1 0 0 1-2 0V6h-2v12h2v-2a1 1 0 0 1 2 0v3a1 1 0 0 1-1 1h-3v1a1 1 0 0 1-1.27.96l-6.98-2A1 1 0 0 1 2 19V5a1 1 0 0 1 .75-.97l6.98-2A1 1 0 0 1 11 3v1z" fill={primary}/>
      <path d="M18.59 11l-1.3-1.3c-.94-.94.47-2.35 1.42-1.4l3 3a1 1 0 0 1 0 1.4l-3 3c-.95.95-2.36-.46-1.42-1.4l1.3-1.3H14a1 1 0 0 1 0-2h4.59z" fill={secondary}/>
    </svg>
  )
}

// 18. Search Icon - Magnifying glass
export function IconSearch({
  primary = 'currentColor',
  secondary = 'currentColor',
  size = 24,
  className = ''
}: DuotoneIconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <circle cx="10" cy="10" r="6" fill={secondary} opacity="0.3"/>
      <circle cx="10" cy="10" r="6" stroke={primary} strokeWidth="2"/>
      <line x1="15" y1="15" x2="21" y2="21" stroke={primary} strokeWidth="2" strokeLinecap="round"/>
    </svg>
  )
}

// 19. Add Icon - Plus sign in circle
export function IconAdd({
  primary = 'currentColor',
  secondary = 'currentColor',
  size = 24,
  className = ''
}: DuotoneIconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <circle cx="12" cy="12" r="9" fill={secondary} opacity="0.3"/>
      <path d="M12 8v8m-4-4h8" stroke={primary} strokeWidth="2" strokeLinecap="round"/>
    </svg>
  )
}

// 20. Menu Icon - Hamburger menu
export function IconMenu({
  primary = 'currentColor',
  secondary = 'currentColor',
  size = 24,
  className = ''
}: DuotoneIconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <rect x="4" y="6" width="16" height="2" rx="1" fill={primary}/>
      <rect x="4" y="11" width="16" height="2" rx="1" fill={secondary} opacity="0.3"/>
      <rect x="4" y="16" width="16" height="2" rx="1" fill={primary}/>
    </svg>
  )
}

// 21. Close Icon - X
export function IconClose({
  primary = 'currentColor',
  secondary = 'currentColor',
  size = 24,
  className = ''
}: DuotoneIconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <path d="M6 6l12 12m0-12L6 18" stroke={primary} strokeWidth="2" strokeLinecap="round"/>
    </svg>
  )
}

// 22. Chevron Down Icon - Down arrow
export function IconChevronDown({
  primary = 'currentColor',
  secondary = 'currentColor',
  size = 24,
  className = ''
}: DuotoneIconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <path d="M6 9l6 6 6-6" stroke={primary} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
}

// 23. Store Icon - Shop with awning
export function IconStore({
  primary = 'currentColor',
  secondary = 'currentColor',
  size = 24,
  className = ''
}: DuotoneIconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <path d="M3 8l2-4h14l2 4v2c0 1.7-1.3 3-3 3s-3-1.3-3-3c0 1.7-1.3 3-3 3s-3-1.3-3-3c0 1.7-1.3 3-3 3s-3-1.3-3-3V8z" fill={secondary} opacity="0.3"/>
      <rect x="5" y="11" width="14" height="9" rx="1" fill={primary}/>
      <rect x="10" y="14" width="4" height="6" fill={secondary} opacity="0.3"/>
    </svg>
  )
}

// 24. Folder Icon - File folder
export function IconFolder({
  primary = 'currentColor',
  secondary = 'currentColor',
  size = 24,
  className = ''
}: DuotoneIconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <path d="M4 4h7l2 2h7a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6c0-1.1.9-2 2-2z" fill={secondary}/>
      <rect x="2" y="8" width="20" height="12" rx="2" fill={primary}/>
    </svg>
  )
}

// 25. Help Icon - Question mark in circle
export function IconHelp({
  primary = 'currentColor',
  secondary = 'currentColor',
  size = 24,
  className = ''
}: DuotoneIconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <circle cx="12" cy="12" r="9" fill={secondary} opacity="0.3"/>
      <path d="M9 9c0-1.7 1.3-3 3-3s3 1.3 3 3c0 1.2-.7 2.2-1.8 2.7-.7.3-1.2 1-1.2 1.8v.5" stroke={primary} strokeWidth="2" strokeLinecap="round"/>
      <circle cx="12" cy="17" r="1" fill={primary}/>
    </svg>
  )
}

// 26. Location Pin Icon - Map marker
export function IconLocation({
  primary = 'currentColor',
  secondary = 'currentColor',
  size = 24,
  className = ''
}: DuotoneIconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <path d="M12 22s-8-4.5-8-11.8A8 8 0 0 1 12 2a8 8 0 0 1 8 8.2c0 7.3-8 11.8-8 11.8z" fill={secondary} opacity="0.3"/>
      <circle cx="12" cy="10" r="3" fill={primary}/>
    </svg>
  )
}

// 27. Clock Icon - Time
export function IconClock({
  primary = 'currentColor',
  secondary = 'currentColor',
  size = 24,
  className = ''
}: DuotoneIconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <circle cx="12" cy="12" r="9" fill={secondary} opacity="0.3"/>
      <path d="M12 6v6l4 2" stroke={primary} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
}

// 28. Arrow Right Icon (para botones de acción)
export function IconArrowRight({
  primary = 'currentColor',
  secondary = 'currentColor',
  size = 24,
  className = ''
}: DuotoneIconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <path d="M5 12h14" stroke={primary} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M12 5l7 7-7 7" stroke={primary} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
}

// Export all icons as a collection for easy access
export const DuotoneIcons = {
  Dashboard: IconDashboard,
  Calendar: IconCalendar,
  UserGroup: IconUserGroup,
  Microphone: IconMicrophone,
  Office: IconOffice,
  Ticket: IconTicket,
  Survey: IconSurvey,
  Identification: IconIdentification,
  Certificate: IconCertificate,
  TrendingUp: IconTrendingUp,
  CreditCard: IconCreditCard,
  Money: IconMoney,
  Chart: IconChart,
  Wallet: IconWallet,
  UserAdd: IconUserAdd,
  Cog: IconCog,
  User: IconUser,
  Bell: IconBell,
  Monitor: IconMonitor,
  DoorExit: IconDoorExit,
  Search: IconSearch,
  Add: IconAdd,
  Menu: IconMenu,
  Close: IconClose,
  ChevronDown: IconChevronDown,
  Store: IconStore,
  Folder: IconFolder,
  Help: IconHelp,
}
