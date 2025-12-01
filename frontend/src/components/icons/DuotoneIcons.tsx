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
      <rect x="3" y="4" width="18" height="17" rx="2" fill={secondary} opacity="0.3"/>
      <rect x="3" y="4" width="18" height="5" rx="2" fill={primary}/>
      <rect x="7" y="2" width="2" height="4" rx="1" fill={primary}/>
      <rect x="15" y="2" width="2" height="4" rx="1" fill={primary}/>
      <rect x="7" y="12" width="3" height="3" rx="0.5" fill={primary}/>
    </svg>
  )
}

// 3. User Group Icon - 3 people
export function IconUserGroup({
  primary = 'currentColor',
  secondary = 'currentColor',
  size = 24,
  className = ''
}: DuotoneIconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <circle cx="9" cy="7" r="3" fill={primary}/>
      <path d="M2 18C2 15.2386 5.13401 13 9 13C12.866 13 16 15.2386 16 18V19H2V18Z" fill={secondary} opacity="0.3"/>
      <circle cx="17" cy="8" r="2.5" fill={secondary} opacity="0.5"/>
      <path d="M17 13C19.7614 13 22 14.7909 22 17V19H18V18C18 16.1115 16.8628 14.4109 15 13.4722C15.6047 13.1659 16.2782 13 17 13Z" fill={secondary} opacity="0.3"/>
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

// 5. Ticket Icon - Ticket with cut line
export function IconTicket({
  primary = 'currentColor',
  secondary = 'currentColor',
  size = 24,
  className = ''
}: DuotoneIconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <rect x="2" y="6" width="20" height="12" rx="2" fill={secondary} opacity="0.3"/>
      <line x1="9" y1="6" x2="9" y2="18" stroke={primary} strokeWidth="2" strokeDasharray="2 2"/>
      <rect x="12" y="10" width="6" height="1.5" rx="0.5" fill={primary}/>
      <rect x="12" y="13" width="4" height="1.5" rx="0.5" fill={primary}/>
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
      <rect x="2" y="5" width="20" height="14" rx="2" fill={secondary} opacity="0.3"/>
      <circle cx="7.5" cy="11" r="2.5" fill={primary}/>
      <path d="M4 17c0-1.4 1.1-2.5 2.5-2.5h2c1.4 0 2.5 1.1 2.5 2.5" fill={primary}/>
      <rect x="13" y="9" width="6" height="1.5" rx="0.5" fill={primary}/>
      <rect x="13" y="12" width="5" height="1.5" rx="0.5" fill={primary}/>
      <rect x="13" y="15" width="4" height="1.5" rx="0.5" fill={primary}/>
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
      <rect x="3" y="4" width="18" height="13" rx="2" fill={secondary} opacity="0.3"/>
      <rect x="7" y="8" width="10" height="1.5" rx="0.5" fill={primary}/>
      <rect x="7" y="11" width="7" height="1.5" rx="0.5" fill={primary}/>
      <circle cx="17" cy="14" r="3" fill={primary}/>
      <path d="M15 17v5l2-1.5 2 1.5v-5" stroke={primary} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
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
      <rect x="3" y="6" width="18" height="13" rx="2" fill={secondary} opacity="0.3"/>
      <rect x="3" y="3" width="15" height="5" rx="1" fill={primary}/>
      <rect x="15" y="11" width="5" height="4" rx="1" fill={primary}/>
      <circle cx="16.5" cy="13" r="1" fill={secondary}/>
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
      <circle cx="12" cy="12" r="3" fill={primary}/>
      <path d="M12 1L13.5 3.5L16.5 3L17 6L20 7.5L19 10L21 12L19 14L20 16.5L17 18L16.5 21L13.5 20.5L12 23L10.5 20.5L7.5 21L7 18L4 16.5L5 14L3 12L5 10L4 7.5L7 6L7.5 3L10.5 3.5L12 1Z" fill={secondary} opacity="0.3"/>
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
      <circle cx="12" cy="8" r="4" fill={primary}/>
      <path d="M4 20c0-3.3 2.7-6 6-6h4c3.3 0 6 2.7 6 6v1H4v-1z" fill={secondary} opacity="0.3"/>
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
      <rect x="3" y="3" width="10" height="18" rx="2" fill={secondary} opacity="0.3"/>
      <circle cx="9" cy="12" r="1" fill={primary}/>
      <path d="M14 12h7m0 0l-3-3m3 3l-3 3" stroke={primary} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
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
      <path d="M3 6c0-1.1.9-2 2-2h4l2 2h8c1.1 0 2 .9 2 2" fill={secondary} opacity="0.3"/>
      <rect x="3" y="8" width="18" height="11" rx="2" fill={primary}/>
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

// Export all icons as a collection for easy access
export const DuotoneIcons = {
  Dashboard: IconDashboard,
  Calendar: IconCalendar,
  UserGroup: IconUserGroup,
  Office: IconOffice,
  Ticket: IconTicket,
  Identification: IconIdentification,
  Certificate: IconCertificate,
  TrendingUp: IconTrendingUp,
  CreditCard: IconCreditCard,
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
