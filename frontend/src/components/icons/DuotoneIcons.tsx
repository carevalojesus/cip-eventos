/**
 * Phosphor Icons - Duotone Style
 * CIP Eventos - Icon System
 *
 * Using Phosphor Icons library with duotone weight
 * https://phosphoricons.com/
 */

import {
  SquaresFour,
  Calendar,
  UsersThree,
  Microphone,
  Buildings,
  Ticket,
  ClipboardText,
  IdentificationCard,
  Certificate,
  TrendUp,
  CreditCard,
  Money,
  ChartBar,
  Wallet,
  UserPlus,
  Gear,
  User,
  Bell,
  Monitor,
  SignOut,
  MagnifyingGlass,
  PlusCircle,
  List,
  X,
  CaretDown,
  CaretUp,
  CaretRight,
  Storefront,
  Folder,
  Question,
  MapPin,
  Clock,
  ArrowCircleRight,
  PencilSimple,
  Trash,
  QrCode,
  Check,
  ShareNetwork,
  WarningCircle,
  CloudArrowDown,
  ArrowSquareOut,
  Info,
  type IconProps as PhosphorIconProps,
} from '@phosphor-icons/react'
import type { ComponentType } from 'react'

export interface DuotoneIconProps {
  primary?: string
  secondary?: string
  size?: number
  className?: string
}

// Helper to create duotone wrapper components
function createPhosphorIcon(PhosphorComponent: ComponentType<PhosphorIconProps>) {
  return function PhosphorIcon({
    primary = 'currentColor',
    size = 24,
    className = ''
  }: DuotoneIconProps) {
    return (
      <PhosphorComponent
        size={size}
        weight="duotone"
        color={primary}
        className={className}
      />
    )
  }
}

// Export individual icon components
export const IconDashboard = createPhosphorIcon(SquaresFour)
export const IconCalendar = createPhosphorIcon(Calendar)
export const IconUserGroup = createPhosphorIcon(UsersThree)
export const IconMicrophone = createPhosphorIcon(Microphone)
export const IconOffice = createPhosphorIcon(Buildings)
export const IconTicket = createPhosphorIcon(Ticket)
export const IconSurvey = createPhosphorIcon(ClipboardText)
export const IconIdentification = createPhosphorIcon(IdentificationCard)
export const IconCertificate = createPhosphorIcon(Certificate)
export const IconTrendingUp = createPhosphorIcon(TrendUp)
export const IconCreditCard = createPhosphorIcon(CreditCard)
export const IconMoney = createPhosphorIcon(Money)
export const IconChart = createPhosphorIcon(ChartBar)
export const IconWallet = createPhosphorIcon(Wallet)
export const IconUserAdd = createPhosphorIcon(UserPlus)
export const IconCog = createPhosphorIcon(Gear)
export const IconUser = createPhosphorIcon(User)
export const IconBell = createPhosphorIcon(Bell)
export const IconMonitor = createPhosphorIcon(Monitor)
export const IconDoorExit = createPhosphorIcon(SignOut)
export const IconSearch = createPhosphorIcon(MagnifyingGlass)
export const IconAdd = createPhosphorIcon(PlusCircle)
export const IconMenu = createPhosphorIcon(List)
export const IconClose = createPhosphorIcon(X)
export const IconChevronDown = createPhosphorIcon(CaretDown)
export const IconChevronUp = createPhosphorIcon(CaretUp)
export const IconChevronRight = createPhosphorIcon(CaretRight)
export const IconStore = createPhosphorIcon(Storefront)
export const IconFolder = createPhosphorIcon(Folder)
export const IconHelp = createPhosphorIcon(Question)
export const IconLocation = createPhosphorIcon(MapPin)
export const IconClock = createPhosphorIcon(Clock)
export const IconArrowRight = createPhosphorIcon(ArrowCircleRight)
export const IconEdit = createPhosphorIcon(PencilSimple)
export const IconTrash = createPhosphorIcon(Trash)
export const IconQrCode = createPhosphorIcon(QrCode)
export const IconCheck = createPhosphorIcon(Check)
export const IconShare = createPhosphorIcon(ShareNetwork)
export const IconAlertCircle = createPhosphorIcon(WarningCircle)
export const IconDownload = createPhosphorIcon(CloudArrowDown)
export const IconExternalLink = createPhosphorIcon(ArrowSquareOut)
export const IconInfo = createPhosphorIcon(Info)

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
  ChevronRight: IconChevronRight,
  ChevronUp: IconChevronUp,
  Store: IconStore,
  Folder: IconFolder,
  Help: IconHelp,
  Location: IconLocation,
  Clock: IconClock,
  ArrowRight: IconArrowRight,
  Edit: IconEdit,
  Trash: IconTrash,
  QrCode: IconQrCode,
  Check: IconCheck,
  Share: IconShare,
  AlertCircle: IconAlertCircle,
  Download: IconDownload,
  ExternalLink: IconExternalLink,
  Info: IconInfo,
}
