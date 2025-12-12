/**
 * Events Admin Module
 *
 * Complete event management interface for SuperAdmin role.
 * Includes list view, detail view with tabs, and all supporting components.
 */

// Main Views
export { EventsAdminView } from "./EventsAdminView";
export { EventDetailAdminView } from "./EventDetailAdminView";
export { EditEventAdminView } from "./EditEventAdminView";

// Components
export {
  EventAdminStatusBadge,
  EventAdminModalityBadge,
  EventAdminSkeleton,
  EventAdminEmptyState,
  EventAdminPageHeader,
  EventAdminFilters,
  EventAdminTable,
} from "./components";

// Tabs
export {
  EventInfoTab,
  EventSessionsTab,
  EventTicketsTab,
  EventRegistrationsTab,
  EventOrganizersTab,
  EventCouponsTab,
  EventCourtesiesTab,
} from "./tabs";
