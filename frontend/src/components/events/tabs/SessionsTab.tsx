import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
  DrawerBody,
  DrawerFooter,
} from "@/components/ui/drawer";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { FormTextarea } from "@/components/ui/form/form-textarea";
import { FormDateTimePicker } from "@/components/ui/form/form-datetime-picker";
import { FormRow } from "@/components/ui/form/form-row";
import { FormGroup } from "@/components/ui/form/form-group";
import {
  IconCalendar,
  IconAdd,
  IconEdit,
  IconTrash,
  IconClock,
  IconLocation,
  IconExternalLink,
} from "@/components/icons/DuotoneIcons";
import { useSessions } from "@/hooks/useSessions";
import { formatEventTime, formatEventDate, getLocaleFromLang, getLocalDateKey } from "@/lib/dateUtils";
import { getCurrentLocale } from "@/lib/routes";
import type { EventSession, CreateSessionDto, UpdateSessionDto } from "@/types/event";
import "./SessionsTab.css";

interface SessionsTabProps {
  eventId: string;
  eventStartAt: string;
  eventEndAt: string;
}

export const SessionsTab: React.FC<SessionsTabProps> = ({ eventId, eventStartAt, eventEndAt }) => {
  const { t } = useTranslation();
  const locale = getLocaleFromLang(getCurrentLocale());
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [editingSession, setEditingSession] = useState<EventSession | null>(null);
  const [deletingSession, setDeletingSession] = useState<EventSession | null>(null);

  const sessionSchema = z.object({
    title: z.string().min(1, t("event_management.sessions.validation.title_required")),
    description: z.string().optional(),
    startAt: z.string().min(1, t("event_management.sessions.validation.start_required")),
    endAt: z.string().min(1, t("event_management.sessions.validation.end_required")),
    room: z.string().optional(),
    meetingUrl: z.string().url(t("event_management.sessions.validation.url_invalid")).optional().or(z.literal("")),
  });

  type SessionFormValues = z.infer<typeof sessionSchema>;

  const {
    sessions,
    isLoading,
    error,
    createSession,
    updateSession,
    deleteSession,
    isCreating,
    isUpdating,
    isDeleting,
  } = useSessions(eventId);

  const form = useForm<SessionFormValues>({
    resolver: zodResolver(sessionSchema),
    defaultValues: {
      title: "",
      description: "",
      startAt: "",
      endAt: "",
      room: "",
      meetingUrl: "",
    },
  });

  const openCreateDrawer = () => {
    setEditingSession(null);
    form.reset({
      title: "",
      description: "",
      startAt: "",
      endAt: "",
      room: "",
      meetingUrl: "",
    });
    setIsDrawerOpen(true);
  };

  const openEditDrawer = (session: EventSession) => {
    setEditingSession(session);
    form.reset({
      title: session.title,
      description: session.description || "",
      startAt: session.startAt,
      endAt: session.endAt,
      room: session.room || "",
      meetingUrl: session.meetingUrl || "",
    });
    setIsDrawerOpen(true);
  };

  const openDeleteDialog = (session: EventSession) => {
    setDeletingSession(session);
    setIsDeleteDialogOpen(true);
  };

  const handleSubmit = async (values: SessionFormValues) => {
    try {
      // Convert local datetime to ISO 8601 format
      const toISOString = (dateTimeStr: string): string => {
        // If already in ISO format, return as-is
        if (dateTimeStr.includes("Z") || dateTimeStr.match(/[+-]\d{2}:\d{2}$/)) {
          return dateTimeStr;
        }
        // Convert "yyyy-MM-ddTHH:mm" to full ISO string
        const date = new Date(dateTimeStr);
        return date.toISOString();
      };

      // Build data object, only including non-empty optional fields
      const data: CreateSessionDto = {
        title: values.title,
        startAt: toISOString(values.startAt),
        endAt: toISOString(values.endAt),
      };

      // Only add optional fields if they have values
      if (values.description && values.description.trim()) {
        data.description = values.description.trim();
      }
      if (values.room && values.room.trim()) {
        data.room = values.room.trim();
      }
      if (values.meetingUrl && values.meetingUrl.trim()) {
        data.meetingUrl = values.meetingUrl.trim();
      }

      if (editingSession) {
        await updateSession({
          sessionId: editingSession.id,
          data: data as UpdateSessionDto,
        });
        toast.success(t("event_management.sessions.toast.updated"));
      } else {
        await createSession(data);
        toast.success(t("event_management.sessions.toast.created"));
      }
      setIsDrawerOpen(false);
      form.reset();
    } catch (error: unknown) {
      // Extract error message from API response if available
      const apiError = error as { response?: { data?: { message?: string | string[] } } };
      const errorMessage = apiError?.response?.data?.message;

      if (errorMessage) {
        const message = Array.isArray(errorMessage) ? errorMessage[0] : errorMessage;
        toast.error(message);
      } else {
        toast.error(t("event_management.sessions.toast.error_save"));
      }
    }
  };

  const handleDelete = async () => {
    if (!deletingSession) return;

    try {
      await deleteSession(deletingSession.id);
      toast.success(t("event_management.sessions.toast.deleted"));
      setIsDeleteDialogOpen(false);
      setDeletingSession(null);
    } catch {
      toast.error(t("event_management.sessions.toast.error_delete"));
    }
  };

  const formatSessionTime = (session: EventSession) => {
    const startTime = formatEventTime(session.startAt, locale);
    const endTime = formatEventTime(session.endAt, locale);
    return `${startTime} - ${endTime}`;
  };

  const formatSessionDate = (dateString: string) => {
    return formatEventDate(dateString, locale);
  };

  // Agrupar sesiones por fecha local (considerando timezone)
  const groupedSessions = sessions.reduce((groups, session) => {
    const dateKey = getLocalDateKey(session.startAt);
    if (!groups[dateKey]) {
      groups[dateKey] = [];
    }
    groups[dateKey].push(session);
    return groups;
  }, {} as Record<string, EventSession[]>);

  // Ordenar fechas
  const sortedDates = Object.keys(groupedSessions).sort();

  // Loading state
  if (isLoading) {
    return (
      <div className="sessions-tab__loading">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="sessions-tab__loader">
          <path d="M21 12a9 9 0 1 1-6.219-8.56" />
        </svg>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="sessions-tab__error">
        <p>{t("event_management.sessions.loading_error")}</p>
      </div>
    );
  }

  return (
    <>
      <div className="sessions-tab">
        {/* Header */}
        <div className="sessions-tab__header">
          <h3 className="sessions-tab__title">
            {t("event_management.sessions.table.title_count", { count: sessions.length })}
          </h3>
          <Button
            variant="soft"
            size="md"
            icon={<IconAdd size={16} primary="currentColor" secondary="currentColor" />}
            onClick={openCreateDrawer}
          >
            {t("event_management.sessions.actions.new")}
          </Button>
        </div>

        {/* Content */}
        {sessions.length === 0 ? (
          <div className="sessions-tab__empty">
            <EmptyState
              icon={<IconCalendar size={28} primary="var(--color-grey-400)" secondary="var(--color-grey-300)" />}
              title={t("event_management.sessions.empty.title")}
              description={t("event_management.sessions.empty.description")}
              action={
                <Button
                  variant="soft"
                  size="md"
                  icon={<IconAdd size={16} primary="currentColor" secondary="currentColor" />}
                  onClick={openCreateDrawer}
                >
                  {t("event_management.sessions.actions.new")}
                </Button>
              }
            />
          </div>
        ) : (
          <div className="sessions-tab__content">
            {sortedDates.map((date) => (
              <div key={date} className="sessions-tab__day-group">
                <div className="sessions-tab__day-header">
                  <span className="sessions-tab__day-date">
                    {formatSessionDate(groupedSessions[date][0].startAt)}
                  </span>
                  <span className="sessions-tab__day-count">
                    {t("event_management.sessions.table.session_count", { count: groupedSessions[date].length })}
                  </span>
                </div>
                <ul className="sessions-tab__list">
                  {groupedSessions[date]
                    .sort((a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime())
                    .map((session) => (
                      <li key={session.id} className="sessions-tab__item">
                        {/* Time indicator */}
                        <div className="sessions-tab__item-time">
                          <IconClock size={14} primary="var(--color-grey-500)" secondary="var(--color-grey-300)" />
                          <span>{formatSessionTime(session)}</span>
                        </div>

                        {/* Content */}
                        <div className="sessions-tab__item-content">
                          <div className="sessions-tab__item-header">
                            <span className="sessions-tab__item-title">{session.title}</span>
                            {session.speakers && session.speakers.length > 0 && (
                              <span className="sessions-tab__badge sessions-tab__badge--info">
                                {session.speakers.length} {t("event_management.sessions.table.speakers")}
                              </span>
                            )}
                          </div>

                          {session.description && (
                            <p className="sessions-tab__item-description">{session.description}</p>
                          )}

                          <div className="sessions-tab__item-meta">
                            {session.room && (
                              <span className="sessions-tab__item-room">
                                <IconLocation size={14} primary="var(--color-grey-500)" secondary="var(--color-grey-300)" />
                                {session.room}
                              </span>
                            )}
                            {session.meetingUrl && (
                              <span className="sessions-tab__item-link">
                                <IconExternalLink size={12} primary="currentColor" secondary="currentColor" />
                                {t("event_management.sessions.table.has_meeting_url")}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="sessions-tab__item-actions">
                          <button
                            type="button"
                            className="sessions-tab__action-btn sessions-tab__action-btn--edit"
                            onClick={() => openEditDrawer(session)}
                            aria-label={t("event_management.sessions.actions.edit")}
                          >
                            <IconEdit size={16} primary="currentColor" secondary="currentColor" />
                          </button>
                          <button
                            type="button"
                            className="sessions-tab__action-btn sessions-tab__action-btn--delete"
                            onClick={() => openDeleteDialog(session)}
                            aria-label={t("event_management.sessions.actions.delete")}
                          >
                            <IconTrash size={16} primary="currentColor" secondary="currentColor" />
                          </button>
                        </div>
                      </li>
                    ))}
                </ul>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Drawer para crear/editar */}
      <Drawer open={isDrawerOpen} onOpenChange={setIsDrawerOpen}>
        <DrawerContent width="lg">
          <DrawerHeader>
            <DrawerTitle>
              {editingSession ? t("event_management.sessions.dialog.edit_title") : t("event_management.sessions.dialog.create_title")}
            </DrawerTitle>
            <DrawerDescription>
              {editingSession
                ? t("event_management.sessions.dialog.edit_description")
                : t("event_management.sessions.dialog.create_description")}
            </DrawerDescription>
          </DrawerHeader>

          <DrawerBody>
            <form id="session-form" onSubmit={form.handleSubmit(handleSubmit)}>
              {/* Título */}
              <FormGroup>
                <Input
                  label={t("event_management.sessions.dialog.title_label")}
                  placeholder={t("event_management.sessions.dialog.title_placeholder")}
                  error={form.formState.errors.title?.message}
                  {...form.register("title")}
                />
              </FormGroup>

              {/* Descripción */}
              <FormGroup>
                <Controller
                  name="description"
                  control={form.control}
                  render={({ field }) => (
                    <FormTextarea
                      label={t("event_management.sessions.dialog.description_label")}
                      placeholder={t("event_management.sessions.dialog.description_placeholder")}
                      hint={t("event_management.sessions.dialog.description_hint")}
                      textareaSize="sm"
                      value={field.value || ""}
                      onChange={(e) => field.onChange(e.target.value)}
                    />
                  )}
                />
              </FormGroup>

              {/* Fecha y hora */}
              <FormGroup>
                <FormRow columns={2}>
                  <Controller
                    name="startAt"
                    control={form.control}
                    render={({ field }) => (
                      <FormDateTimePicker
                        label={t("event_management.sessions.dialog.start_time")}
                        value={field.value || ""}
                        onChange={field.onChange}
                        error={form.formState.errors.startAt?.message}
                        minDate={eventStartAt}
                        maxDate={eventEndAt}
                      />
                    )}
                  />
                  <Controller
                    name="endAt"
                    control={form.control}
                    render={({ field }) => (
                      <FormDateTimePicker
                        label={t("event_management.sessions.dialog.end_time")}
                        value={field.value || ""}
                        onChange={field.onChange}
                        error={form.formState.errors.endAt?.message}
                        minDate={eventStartAt}
                        maxDate={eventEndAt}
                      />
                    )}
                  />
                </FormRow>
              </FormGroup>

              {/* Sala/Room */}
              <FormGroup>
                <Input
                  label={t("event_management.sessions.dialog.room_label")}
                  placeholder={t("event_management.sessions.dialog.room_placeholder")}
                  hint={t("event_management.sessions.dialog.room_hint")}
                  error={form.formState.errors.room?.message}
                  {...form.register("room")}
                />
              </FormGroup>

              {/* URL de reunión */}
              <FormGroup marginBottom="0">
                <Input
                  label={t("event_management.sessions.dialog.meeting_url_label")}
                  placeholder={t("event_management.sessions.dialog.meeting_url_placeholder")}
                  hint={t("event_management.sessions.dialog.meeting_url_hint")}
                  error={form.formState.errors.meetingUrl?.message}
                  {...form.register("meetingUrl")}
                />
              </FormGroup>
            </form>
          </DrawerBody>

          <DrawerFooter>
            <Button
              type="button"
              variant="secondary"
              onClick={() => setIsDrawerOpen(false)}
            >
              {t("event_management.sessions.dialog.cancel")}
            </Button>
            <Button
              type="submit"
              form="session-form"
              variant="primary"
              isLoading={isCreating || isUpdating}
              loadingText={editingSession ? t("event_management.sessions.dialog.saving") : t("event_management.sessions.dialog.creating")}
            >
              {editingSession ? t("event_management.sessions.dialog.save") : t("event_management.sessions.dialog.create")}
            </Button>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>

      {/* Delete Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("event_management.sessions.delete.title")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("event_management.sessions.delete.description", { name: deletingSession?.title })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("event_management.sessions.delete.cancel")}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? t("event_management.sessions.delete.deleting") : t("event_management.sessions.delete.confirm")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
