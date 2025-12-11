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
  IconTicket,
  IconAdd,
  IconEdit,
  IconTrash,
  IconClock,
} from "@/components/icons/DuotoneIcons";
import { EyeOff } from "lucide-react";
import { useTickets } from "@/hooks/useTickets";
import type { EventTicket, CreateTicketDto, UpdateTicketDto } from "@/types/event";
import "./TicketsTab.css";

interface TicketsTabProps {
  eventId: string;
}

// Switch toggle component
interface ToggleSwitchProps {
  id: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
  description?: string;
}

const ToggleSwitch: React.FC<ToggleSwitchProps> = ({
  id,
  checked,
  onChange,
  label,
  description,
}) => {
  return (
    <div className="tickets-tab__toggle">
      <div className="tickets-tab__toggle-info">
        <label htmlFor={id} className="tickets-tab__toggle-label">
          {label}
        </label>
        {description && (
          <span className="tickets-tab__toggle-desc">{description}</span>
        )}
      </div>
      <button
        id={id}
        type="button"
        role="switch"
        aria-checked={checked}
        className={`tickets-tab__toggle-switch ${checked ? "tickets-tab__toggle-switch--active" : ""}`}
        onClick={() => onChange(!checked)}
      >
        <span className="tickets-tab__toggle-thumb" />
      </button>
    </div>
  );
};

export const TicketsTab: React.FC<TicketsTabProps> = ({ eventId }) => {
  const { t } = useTranslation();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [editingTicket, setEditingTicket] = useState<EventTicket | null>(null);
  const [deletingTicket, setDeletingTicket] = useState<EventTicket | null>(null);
  const [isFreeTicket, setIsFreeTicket] = useState(false);

  const ticketSchema = z.object({
    name: z.string().min(1, t("event_management.tickets.validation.name_required")),
    price: z.coerce.number().min(0, t("event_management.tickets.validation.price_min")),
    stock: z.coerce.number().min(0, t("event_management.tickets.validation.stock_min")),
    description: z.string().optional(),
    requiresCipValidation: z.boolean().optional(),
    salesStartAt: z.string().optional(),
    salesEndAt: z.string().optional(),
    maxPerOrder: z.coerce.number().min(1, t("event_management.tickets.validation.max_per_order_min")).optional(),
    isVisible: z.boolean().optional(),
  });

  type TicketFormValues = z.infer<typeof ticketSchema>;

  const {
    tickets,
    isLoading,
    error,
    createTicket,
    updateTicket,
    deleteTicket,
    isCreating,
    isUpdating,
    isDeleting,
  } = useTickets(eventId);

  const form = useForm<TicketFormValues>({
    resolver: zodResolver(ticketSchema),
    defaultValues: {
      name: "",
      price: 0,
      stock: 100,
      description: "",
      requiresCipValidation: false,
      salesStartAt: "",
      salesEndAt: "",
      maxPerOrder: 10,
      isVisible: true,
    },
  });

  const openCreateDrawer = () => {
    setEditingTicket(null);
    setIsFreeTicket(true);
    form.reset({
      name: "",
      price: 0,
      stock: 100,
      description: "",
      requiresCipValidation: false,
      salesStartAt: "",
      salesEndAt: "",
      maxPerOrder: 10,
      isVisible: true,
    });
    setIsDrawerOpen(true);
  };

  const openEditDrawer = (ticket: EventTicket) => {
    setEditingTicket(ticket);
    const price = typeof ticket.price === "string" ? parseFloat(ticket.price) : ticket.price;
    const stock = typeof ticket.stock === "string" ? parseInt(ticket.stock) : ticket.stock;
    const maxPerOrder = typeof ticket.maxPerOrder === "string" ? parseInt(ticket.maxPerOrder) : ticket.maxPerOrder;
    setIsFreeTicket(price === 0);

    form.reset({
      name: ticket.name,
      price: price,
      stock: stock,
      description: ticket.description || "",
      requiresCipValidation: ticket.requiresCipValidation,
      salesStartAt: ticket.salesStartAt || "",
      salesEndAt: ticket.salesEndAt || "",
      maxPerOrder: maxPerOrder || 10,
      isVisible: ticket.isVisible ?? true,
    });
    setIsDrawerOpen(true);
  };

  const openDeleteDialog = (ticket: EventTicket) => {
    setDeletingTicket(ticket);
    setIsDeleteDialogOpen(true);
  };

  const handleSubmit = async (values: TicketFormValues) => {
    try {
      const data: CreateTicketDto = {
        name: values.name,
        price: values.price,
        stock: values.stock,
        description: values.description || undefined,
        requiresCipValidation: values.requiresCipValidation,
        salesStartAt: values.salesStartAt || undefined,
        salesEndAt: values.salesEndAt || undefined,
        maxPerOrder: values.maxPerOrder,
        isVisible: values.isVisible,
      };

      if (editingTicket) {
        await updateTicket({
          ticketId: editingTicket.id,
          data: data as UpdateTicketDto,
        });
        toast.success(t("event_management.tickets.toast.updated"));
      } else {
        await createTicket(data);
        toast.success(t("event_management.tickets.toast.created"));
      }
      setIsDrawerOpen(false);
      form.reset();
    } catch {
      toast.error(t("event_management.tickets.toast.error_save"));
    }
  };

  const handleDelete = async () => {
    if (!deletingTicket) return;

    try {
      await deleteTicket(deletingTicket.id);
      toast.success(t("event_management.tickets.toast.deleted"));
      setIsDeleteDialogOpen(false);
      setDeletingTicket(null);
    } catch {
      toast.error(t("event_management.tickets.toast.error_delete"));
    }
  };

  const formatPrice = (price: number | string) => {
    const numPrice = typeof price === "string" ? parseFloat(price) : price;
    if (numPrice === 0 || isNaN(numPrice)) return t("event_management.tickets.table.free");
    return `S/ ${numPrice.toFixed(0)}`;
  };

  const formatSalesDates = (ticket: EventTicket) => {
    if (!ticket.salesStartAt && !ticket.salesEndAt) return null;

    const formatDate = (dateStr: string) => {
      const date = new Date(dateStr);
      return date.toLocaleDateString("es-PE", { day: "2-digit", month: "short" });
    };

    if (ticket.salesStartAt && ticket.salesEndAt) {
      return `${formatDate(ticket.salesStartAt)} - ${formatDate(ticket.salesEndAt)}`;
    }
    if (ticket.salesStartAt) {
      return t("event_management.tickets.table.from_date", { date: formatDate(ticket.salesStartAt) });
    }
    return t("event_management.tickets.table.until_date", { date: formatDate(ticket.salesEndAt!) });
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="tickets-tab__loading">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="tickets-tab__loader">
          <path d="M21 12a9 9 0 1 1-6.219-8.56" />
        </svg>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="tickets-tab__error">
        <p>{t("event_management.tickets.loading_error")}</p>
      </div>
    );
  }

  return (
    <>
      <div className="tickets-tab">
        {/* Header */}
        <div className="tickets-tab__header">
          <h3 className="tickets-tab__title">
            {t("event_management.tickets.table.title_count", { count: tickets.length })}
          </h3>
          <Button
            variant="soft"
            size="md"
            icon={<IconAdd size={16} primary="currentColor" secondary="currentColor" />}
            onClick={openCreateDrawer}
          >
            {t("event_management.tickets.actions.new")}
          </Button>
        </div>

        {/* Content */}
        {tickets.length === 0 ? (
          <div className="tickets-tab__empty">
            <EmptyState
              icon={<IconTicket size={28} primary="var(--color-grey-400)" secondary="var(--color-grey-300)" />}
              title={t("event_management.tickets.empty.title")}
              description={t("event_management.tickets.empty.description")}
              action={
                <Button
                  variant="soft"
                  size="md"
                  icon={<IconAdd size={16} primary="currentColor" secondary="currentColor" />}
                  onClick={openCreateDrawer}
                >
                  {t("event_management.tickets.actions.new")}
                </Button>
              }
            />
          </div>
        ) : (
          <ul className="tickets-tab__list">
            {tickets.map((ticket) => {
              const stock = typeof ticket.stock === "string" ? parseInt(ticket.stock) : ticket.stock;
              const maxPerOrder = typeof ticket.maxPerOrder === "string" ? parseInt(ticket.maxPerOrder) : ticket.maxPerOrder;
              const salesDates = formatSalesDates(ticket);

              return (
                <li key={ticket.id} className="tickets-tab__item">
                  {/* Icon */}
                  <div className="tickets-tab__item-icon">
                    <IconTicket size={20} primary="var(--color-yellow-700)" secondary="var(--color-yellow-400)" />
                  </div>

                  {/* Info */}
                  <div className="tickets-tab__item-info">
                    <div className="tickets-tab__item-header">
                      <span className="tickets-tab__item-name">{ticket.name}</span>
                      {!ticket.isVisible && (
                        <span className="tickets-tab__badge tickets-tab__badge--gray">
                          <EyeOff size={10} />
                          {t("event_management.tickets.table.hidden")}
                        </span>
                      )}
                      {ticket.requiresCipValidation && (
                        <span className="tickets-tab__badge tickets-tab__badge--info">{t("event_management.tickets.table.cip_badge")}</span>
                      )}
                    </div>
                    <div className="tickets-tab__item-meta">
                      <span>{t("event_management.tickets.table.sold", { sold: 0, total: stock })}</span>
                      {maxPerOrder && (
                        <span>{t("event_management.tickets.table.max_per_order", { count: maxPerOrder })}</span>
                      )}
                      {salesDates && (
                        <span className="tickets-tab__item-dates">
                          <IconClock size={12} primary="currentColor" />
                          {salesDates}
                        </span>
                      )}
                    </div>
                    {ticket.description && (
                      <p className="tickets-tab__item-description">{ticket.description}</p>
                    )}
                  </div>

                  {/* Price */}
                  <span className="tickets-tab__item-price">
                    {formatPrice(ticket.price)}
                  </span>

                  {/* Actions */}
                  <div className="tickets-tab__item-actions">
                    <button
                      type="button"
                      className="tickets-tab__action-btn tickets-tab__action-btn--edit"
                      onClick={() => openEditDrawer(ticket)}
                      aria-label="Editar ticket"
                    >
                      <IconEdit size={16} primary="currentColor" secondary="currentColor" />
                    </button>
                    <button
                      type="button"
                      className="tickets-tab__action-btn tickets-tab__action-btn--delete"
                      onClick={() => openDeleteDialog(ticket)}
                      aria-label="Eliminar ticket"
                    >
                      <IconTrash size={16} primary="currentColor" secondary="currentColor" />
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {/* Drawer para crear/editar */}
      <Drawer open={isDrawerOpen} onOpenChange={setIsDrawerOpen}>
        <DrawerContent width="lg">
          <DrawerHeader>
            <DrawerTitle>
              {editingTicket ? t("event_management.tickets.dialog.edit_title") : t("event_management.tickets.dialog.create_title")}
            </DrawerTitle>
            <DrawerDescription>
              {editingTicket
                ? t("event_management.tickets.dialog.edit_description")
                : t("event_management.tickets.dialog.create_description")}
            </DrawerDescription>
          </DrawerHeader>

          <DrawerBody>
            <form id="ticket-form" onSubmit={form.handleSubmit(handleSubmit)}>
              {/* Nombre */}
              <FormGroup>
                <Input
                  label={t("event_management.tickets.dialog.name_label")}
                  placeholder={t("event_management.tickets.dialog.name_placeholder")}
                  error={form.formState.errors.name?.message}
                  {...form.register("name")}
                />
              </FormGroup>

              {/* Descripción */}
              <FormGroup>
                <Controller
                  name="description"
                  control={form.control}
                  render={({ field }) => (
                    <FormTextarea
                      label={t("event_management.tickets.dialog.description_label")}
                      placeholder={t("event_management.tickets.dialog.description_placeholder")}
                      hint={t("event_management.tickets.dialog.description_hint")}
                      textareaSize="sm"
                      value={field.value || ""}
                      onChange={(e) => field.onChange(e.target.value)}
                    />
                  )}
                />
              </FormGroup>

              {/* Ticket gratuito */}
              <FormGroup>
                <ToggleSwitch
                  id="free-ticket"
                  checked={isFreeTicket}
                  onChange={(checked) => {
                    setIsFreeTicket(checked);
                    if (checked) {
                      form.setValue("price", 0);
                    }
                  }}
                  label={t("event_management.tickets.dialog.free_ticket")}
                  description={t("event_management.tickets.dialog.free_ticket_description")}
                />
              </FormGroup>

              {/* Precio y Stock */}
              <FormGroup>
                <FormRow columns={2}>
                  <Input
                    label={t("event_management.tickets.dialog.price_label")}
                    type="number"
                    placeholder={t("event_management.tickets.dialog.price_placeholder", "0.00")}
                    disabled={isFreeTicket}
                    leftIcon={<span style={{ fontSize: "var(--font-size-sm)", color: "var(--color-grey-500)" }}>S/</span>}
                    error={form.formState.errors.price?.message}
                    {...form.register("price")}
                  />
                  <Input
                    label={t("event_management.tickets.dialog.stock_label")}
                    type="number"
                    placeholder={t("event_management.tickets.dialog.stock_placeholder", "100")}
                    error={form.formState.errors.stock?.message}
                    {...form.register("stock")}
                  />
                </FormRow>
              </FormGroup>

              {/* Máximo por orden */}
              <FormGroup>
                <Input
                  label={t("event_management.tickets.dialog.max_per_order_label")}
                  type="number"
                  placeholder={t("event_management.tickets.dialog.max_per_order_placeholder", "10")}
                  hint={t("event_management.tickets.dialog.max_per_order_hint")}
                  error={form.formState.errors.maxPerOrder?.message}
                  {...form.register("maxPerOrder")}
                />
              </FormGroup>

              {/* Periodo de venta */}
              <FormGroup>
                <FormRow columns={2}>
                  <Controller
                    name="salesStartAt"
                    control={form.control}
                    render={({ field }) => (
                      <FormDateTimePicker
                        label={t("event_management.tickets.dialog.sales_start")}
                        value={field.value || ""}
                        onChange={field.onChange}
                      />
                    )}
                  />
                  <Controller
                    name="salesEndAt"
                    control={form.control}
                    render={({ field }) => (
                      <FormDateTimePicker
                        label={t("event_management.tickets.dialog.sales_end")}
                        value={field.value || ""}
                        onChange={field.onChange}
                      />
                    )}
                  />
                </FormRow>
              </FormGroup>

              {/* Validación CIP */}
              <FormGroup>
                <Controller
                  name="requiresCipValidation"
                  control={form.control}
                  render={({ field }) => (
                    <ToggleSwitch
                      id="cip-validation"
                      checked={field.value || false}
                      onChange={field.onChange}
                      label={t("event_management.tickets.dialog.cip_validation_label")}
                      description={t("event_management.tickets.dialog.cip_validation_description")}
                    />
                  )}
                />
              </FormGroup>

              {/* Visibilidad */}
              <FormGroup marginBottom="0">
                <Controller
                  name="isVisible"
                  control={form.control}
                  render={({ field }) => (
                    <ToggleSwitch
                      id="is-visible"
                      checked={field.value ?? true}
                      onChange={field.onChange}
                      label={t("event_management.tickets.dialog.visibility_label")}
                      description={t("event_management.tickets.dialog.visibility_description")}
                    />
                  )}
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
              {t("event_management.tickets.dialog.cancel")}
            </Button>
            <Button
              type="submit"
              form="ticket-form"
              variant="primary"
              isLoading={isCreating || isUpdating}
              loadingText={editingTicket ? t("event_management.tickets.dialog.saving") : t("event_management.tickets.dialog.creating")}
            >
              {editingTicket ? t("event_management.tickets.dialog.save") : t("event_management.tickets.dialog.create")}
            </Button>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>

      {/* Delete Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("event_management.tickets.delete.title")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("event_management.tickets.delete.description", { name: deletingTicket?.name })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("event_management.tickets.delete.cancel")}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? t("event_management.tickets.delete.deleting") : t("event_management.tickets.delete.confirm")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
