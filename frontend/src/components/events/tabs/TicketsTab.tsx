import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import {
  Plus,
  Pencil,
  Trash2,
  Ticket,
  Users,
  BadgeCheck,
  Loader2,
  MoreHorizontal,
  AlertCircle,
} from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useTickets } from "@/hooks/useTickets";
import type { EventTicket, CreateTicketDto, UpdateTicketDto } from "@/types/event";

interface TicketsTabProps {
  eventId: string;
}

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
    requiresCipValidation: z.boolean().optional(),
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
      requiresCipValidation: false,
    },
  });

  const openCreateDrawer = () => {
    setEditingTicket(null);
    setIsFreeTicket(true);
    form.reset({
      name: "",
      price: 0,
      stock: 100,
      requiresCipValidation: false,
    });
    setIsDrawerOpen(true);
  };

  const openEditDrawer = (ticket: EventTicket) => {
    setEditingTicket(ticket);
    const price = typeof ticket.price === "string" ? parseFloat(ticket.price) : ticket.price;
    const stock = typeof ticket.stock === "string" ? parseInt(ticket.stock) : ticket.stock;
    setIsFreeTicket(price === 0);
    form.reset({
      name: ticket.name,
      price: price,
      stock: stock,
      requiresCipValidation: ticket.requiresCipValidation,
    });
    setIsDrawerOpen(true);
  };

  const openDeleteDialog = (ticket: EventTicket) => {
    setDeletingTicket(ticket);
    setIsDeleteDialogOpen(true);
  };

  const handleSubmit = async (values: TicketFormValues) => {
    try {
      if (editingTicket) {
        await updateTicket({
          ticketId: editingTicket.id,
          data: values as UpdateTicketDto,
        });
        toast.success(t("event_management.tickets.toast.updated"), {
          description: t("event_management.tickets.toast.updated_desc", { name: values.name }),
        });
      } else {
        await createTicket(values as CreateTicketDto);
        toast.success(t("event_management.tickets.toast.created"), {
          description: t("event_management.tickets.toast.created_desc", { name: values.name }),
        });
      }
      setIsDrawerOpen(false);
      form.reset();
    } catch (err) {
      toast.error(t("event_management.tickets.toast.error"), {
        description: t("event_management.tickets.toast.error_save"),
      });
    }
  };

  const handleDelete = async () => {
    if (!deletingTicket) return;

    try {
      await deleteTicket(deletingTicket.id);
      toast.success(t("event_management.tickets.toast.deleted"), {
        description: t("event_management.tickets.toast.deleted_desc", { name: deletingTicket.name }),
      });
      setIsDeleteDialogOpen(false);
      setDeletingTicket(null);
    } catch (err) {
      toast.error(t("event_management.tickets.toast.error"), {
        description: t("event_management.tickets.toast.error_delete"),
      });
    }
  };

  const handleToggleActive = async (ticket: EventTicket) => {
    try {
      await updateTicket({
        ticketId: ticket.id,
        data: { isActive: !ticket.isActive },
      });
      const statusKey = ticket.isActive ? "deactivated" : "activated";
      toast.success(t(`event_management.tickets.toast.${statusKey}`), {
        description: t("event_management.tickets.toast.status_changed_desc", {
          name: ticket.name,
          status: ticket.isActive
            ? t("event_management.tickets.actions.deactivate").toLowerCase()
            : t("event_management.tickets.actions.activate").toLowerCase()
        }),
      });
    } catch (err) {
      toast.error(t("event_management.tickets.toast.error"), {
        description: t("event_management.tickets.toast.error_status"),
      });
    }
  };

  const formatPrice = (price: number | string) => {
    const numPrice = typeof price === "string" ? parseFloat(price) : price;
    if (numPrice === 0 || isNaN(numPrice)) return t("event_management.tickets.table.free");
    return `S/ ${numPrice.toFixed(2)}`;
  };

  // Calcular estadísticas
  const totalStock = tickets.reduce((sum, tkt) => sum + (typeof tkt.stock === "string" ? parseInt(tkt.stock) : tkt.stock), 0);
  const activeTickets = tickets.filter((tkt) => tkt.isActive).length;

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-16">
          <AlertCircle className="h-8 w-8 text-destructive mb-4" />
          <p className="text-sm text-muted-foreground">{t("event_management.tickets.loading_error")}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header con estadísticas */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t("event_management.tickets.stats.total")}</CardTitle>
            <Ticket className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{tickets.length}</div>
            <p className="text-xs text-muted-foreground">
              {activeTickets} {t("event_management.tickets.stats.active")}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t("event_management.tickets.stats.total_stock")}</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalStock}</div>
            <p className="text-xs text-muted-foreground">
              {t("event_management.tickets.stats.available")}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t("event_management.tickets.stats.cip_validation")}</CardTitle>
            <BadgeCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {tickets.filter((tkt) => tkt.requiresCipValidation).length}
            </div>
            <p className="text-xs text-muted-foreground">
              {t("event_management.tickets.stats.requires_membership")}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tabla de entradas */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>{t("event_management.tickets.table.title")}</CardTitle>
              <CardDescription>
                {t("event_management.tickets.table.description")}
              </CardDescription>
            </div>
            <Button onClick={openCreateDrawer}>
              <Plus className="mr-2 h-4 w-4" />
              {t("event_management.tickets.actions.new")}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {tickets.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="rounded-full bg-muted p-4 mb-4">
                <Ticket className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold mb-2">{t("event_management.tickets.empty.title")}</h3>
              <p className="text-sm text-muted-foreground max-w-md mb-4">
                {t("event_management.tickets.empty.description")}
              </p>
              <Button onClick={openCreateDrawer}>
                <Plus className="mr-2 h-4 w-4" />
                {t("event_management.tickets.empty.create_first")}
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("event_management.tickets.table.name")}</TableHead>
                  <TableHead>{t("event_management.tickets.table.price")}</TableHead>
                  <TableHead>{t("event_management.tickets.table.stock")}</TableHead>
                  <TableHead>{t("event_management.tickets.table.cip_validation")}</TableHead>
                  <TableHead>{t("event_management.tickets.table.status")}</TableHead>
                  <TableHead className="text-right">{t("event_management.tickets.table.actions")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tickets.map((ticket) => (
                  <TableRow key={ticket.id} className={!ticket.isActive ? "opacity-50" : ""}>
                    <TableCell className="font-medium">{ticket.name}</TableCell>
                    <TableCell>
                      <Badge variant={parseFloat(String(ticket.price)) === 0 ? "success" : "secondary"}>
                        {formatPrice(ticket.price)}
                      </Badge>
                    </TableCell>
                    <TableCell>{ticket.stock}</TableCell>
                    <TableCell>
                      {ticket.requiresCipValidation ? (
                        <Badge variant="info">{t("event_management.tickets.table.required")}</Badge>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant={ticket.isActive ? "success" : "gray"}>
                        {ticket.isActive
                          ? t("event_management.tickets.table.active")
                          : t("event_management.tickets.table.inactive")}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => openEditDrawer(ticket)}>
                            <Pencil className="mr-2 h-4 w-4" />
                            {t("event_management.tickets.actions.edit")}
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleToggleActive(ticket)}>
                            {ticket.isActive
                              ? t("event_management.tickets.actions.deactivate")
                              : t("event_management.tickets.actions.activate")}
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => openDeleteDialog(ticket)}
                            className="text-destructive focus:text-destructive"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            {t("event_management.tickets.actions.delete")}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Drawer para crear/editar entrada */}
      <Drawer open={isDrawerOpen} onOpenChange={setIsDrawerOpen}>
        <DrawerContent>
          <DrawerHeader className="border-b">
            <DrawerTitle>
              {editingTicket
                ? t("event_management.tickets.dialog.edit_title")
                : t("event_management.tickets.dialog.create_title")}
            </DrawerTitle>
            <DrawerDescription>
              {editingTicket
                ? t("event_management.tickets.dialog.edit_description")
                : t("event_management.tickets.dialog.create_description")}
            </DrawerDescription>
          </DrawerHeader>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="flex flex-1 flex-col">
            <div className="flex-1 overflow-y-auto p-4">
              <div className="space-y-4">
                {/* Nombre del ticket */}
                <div className="space-y-2">
                  <Label htmlFor="name">
                    {t("event_management.tickets.dialog.name_label")}
                  </Label>
                  <Input
                    id="name"
                    placeholder={t("event_management.tickets.dialog.name_placeholder")}
                    {...form.register("name")}
                  />
                  {form.formState.errors.name && (
                    <p className="text-sm text-destructive">{form.formState.errors.name.message}</p>
                  )}
                </div>

                {/* Precio y Stock en la misma línea */}
                <div className="grid grid-cols-2 gap-4">
                  {/* Precio */}
                  <div className="space-y-2">
                    <Label htmlFor="price">
                      {t("event_management.tickets.dialog.pricing")}
                    </Label>
                    <div className="flex rounded-md shadow-sm">
                      <span className="inline-flex items-center rounded-l-md border border-r-0 border-input bg-muted px-3 text-sm text-muted-foreground">
                        S/
                      </span>
                      <Input
                        id="price"
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder="0"
                        className="rounded-l-none border-l-0 focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:border-input"
                        disabled={isFreeTicket}
                        {...form.register("price")}
                      />
                    </div>
                    {form.formState.errors.price && (
                      <p className="text-sm text-destructive">{form.formState.errors.price.message}</p>
                    )}
                  </div>

                  {/* Stock */}
                  <div className="space-y-2">
                    <Label htmlFor="stock">
                      {t("event_management.tickets.dialog.stock_label")}
                    </Label>
                    <Input
                      id="stock"
                      type="number"
                      min="0"
                      placeholder="100"
                      {...form.register("stock")}
                    />
                    {form.formState.errors.stock && (
                      <p className="text-sm text-destructive">{form.formState.errors.stock.message}</p>
                    )}
                  </div>
                </div>

                {/* Entrada gratuita */}
                <div className="flex items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <Label htmlFor="isFree">{t("event_management.tickets.dialog.free_ticket")}</Label>
                    <p className="text-sm text-muted-foreground">
                      {t("event_management.tickets.dialog.free_ticket_description")}
                    </p>
                  </div>
                  <Switch
                    id="isFree"
                    checked={isFreeTicket}
                    onCheckedChange={(checked) => {
                      setIsFreeTicket(checked);
                      if (checked) {
                        form.setValue("price", 0);
                      }
                    }}
                  />
                </div>

                {/* Validación CIP */}
                <div className="flex items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <Label htmlFor="requiresCipValidation">{t("event_management.tickets.dialog.cip_validation_label")}</Label>
                    <p className="text-sm text-muted-foreground">
                      {t("event_management.tickets.dialog.cip_validation_description")}
                    </p>
                  </div>
                  <Switch
                    id="requiresCipValidation"
                    checked={form.watch("requiresCipValidation")}
                    onCheckedChange={(checked) => form.setValue("requiresCipValidation", checked)}
                  />
                </div>
              </div>
            </div>

            <DrawerFooter className="border-t">
              <Button type="submit" disabled={isCreating || isUpdating}>
                {(isCreating || isUpdating) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {editingTicket
                  ? t("event_management.tickets.dialog.save")
                  : t("event_management.tickets.dialog.create")}
              </Button>
              <DrawerClose asChild>
                <Button type="button" variant="outline">
                  {t("event_management.tickets.dialog.cancel")}
                </Button>
              </DrawerClose>
            </DrawerFooter>
          </form>
        </DrawerContent>
      </Drawer>

      {/* Dialog de confirmación de eliminación */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("event_management.tickets.delete.title")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("event_management.tickets.delete.description", { name: deletingTicket?.name || "" })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("event_management.tickets.delete.cancel")}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {t("event_management.tickets.delete.confirm")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
