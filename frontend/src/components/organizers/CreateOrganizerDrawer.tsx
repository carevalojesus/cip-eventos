import React, { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import {
    Buildings,
    Envelope,
    Globe,
    IdentificationCard,
    MapPin,
    CurrencyCircleDollar,
    Receipt,
} from "@phosphor-icons/react";

import {
    Drawer,
    DrawerContent,
    DrawerHeader,
    DrawerTitle,
    DrawerDescription,
    DrawerBody,
    DrawerFooter,
} from "@/components/ui/drawer";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { FormSelect } from "@/components/ui/form/index";

import {
    organizersService,
    type CreateOrganizerDto,
} from "@/services/organizers.service";

interface CreateOrganizerDrawerProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess?: () => void;
}

const createOrganizerSchema = z.object({
    name: z.string().min(2, "El nombre debe tener al menos 2 caracteres"),
    email: z.string().email("Email inválido").optional().or(z.literal("")),
    website: z.string().url("URL inválida").optional().or(z.literal("")),
    logoUrl: z.string().url("URL inválida").optional().or(z.literal("")),
    ruc: z
        .string()
        .regex(/^\d{11}$/, "El RUC debe tener 11 dígitos")
        .optional()
        .or(z.literal("")),
    businessName: z.string().optional(),
    fiscalAddress: z.string().optional(),
    baseCurrency: z.string().default("PEN"),
    emitsFiscalDocuments: z.boolean().default(false),
});

type CreateOrganizerFormData = z.infer<typeof createOrganizerSchema>;

export const CreateOrganizerDrawer: React.FC<CreateOrganizerDrawerProps> = ({
    isOpen,
    onClose,
    onSuccess,
}) => {
    const { t } = useTranslation();
    const [submitting, setSubmitting] = useState(false);

    const form = useForm<CreateOrganizerFormData>({
        resolver: zodResolver(createOrganizerSchema),
        defaultValues: {
            name: "",
            email: "",
            website: "",
            logoUrl: "",
            ruc: "",
            businessName: "",
            fiscalAddress: "",
            baseCurrency: "PEN",
            emitsFiscalDocuments: false,
        },
    });

    const {
        handleSubmit,
        control,
        reset,
        formState: { errors },
    } = form;

    const handleFormSubmit = handleSubmit(async (data) => {
        setSubmitting(true);
        try {
            const dto: CreateOrganizerDto = {
                name: data.name,
                email: data.email || undefined,
                website: data.website || undefined,
                logoUrl: data.logoUrl || undefined,
                ruc: data.ruc || undefined,
                businessName: data.businessName || undefined,
                fiscalAddress: data.fiscalAddress || undefined,
                baseCurrency: data.baseCurrency,
                emitsFiscalDocuments: data.emitsFiscalDocuments,
            };

            await organizersService.create(dto);
            toast.success(
                t("organizers.create.success", "Organizador creado correctamente")
            );
            reset();
            onClose();
            onSuccess?.();
        } catch (error) {
            console.error("Error creating organizer:", error);
            toast.error(
                t("organizers.create.error", "Error al crear el organizador")
            );
        } finally {
            setSubmitting(false);
        }
    });

    const handleClose = () => {
        reset();
        onClose();
    };

    const currencyOptions = [
        { value: "PEN", label: "PEN - Sol Peruano" },
        { value: "USD", label: "USD - Dólar Americano" },
        { value: "EUR", label: "EUR - Euro" },
    ];

    // Styles
    const sectionStyle: React.CSSProperties = {
        marginBottom: "var(--space-5)",
    };

    const sectionTitleStyle: React.CSSProperties = {
        fontSize: "var(--font-size-sm)",
        fontWeight: 600,
        color: "var(--color-text-primary)",
        marginBottom: "var(--space-1)",
    };

    const sectionDescStyle: React.CSSProperties = {
        fontSize: "var(--font-size-xs)",
        color: "var(--color-text-muted)",
        marginBottom: "var(--space-3)",
    };

    const formFieldsStyle: React.CSSProperties = {
        display: "flex",
        flexDirection: "column",
        gap: "var(--space-3)",
    };

    const switchRowStyle: React.CSSProperties = {
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "var(--space-3)",
        backgroundColor: "var(--color-grey-050)",
        borderRadius: "var(--radius-md)",
        border: "1px solid var(--color-grey-200)",
    };

    const switchLabelStyle: React.CSSProperties = {
        display: "flex",
        flexDirection: "column",
        gap: "var(--space-1)",
    };

    return (
        <Drawer open={isOpen} onOpenChange={(open) => !open && handleClose()}>
            <DrawerContent width="sm">
                <DrawerHeader>
                    <DrawerTitle>
                        {t("organizers.create.title", "Crear Organizador")}
                    </DrawerTitle>
                    <DrawerDescription>
                        {t(
                            "organizers.create.subtitle",
                            "Complete la información para registrar una nueva entidad organizadora."
                        )}
                    </DrawerDescription>
                </DrawerHeader>
                <DrawerBody>
                    <form id="create-organizer-form" onSubmit={handleFormSubmit}>
                        {/* Section 1: Basic Info */}
                        <div style={sectionStyle}>
                            <h3 style={sectionTitleStyle}>
                                {t("organizers.section.basic", "Información Básica")}
                            </h3>
                            <p style={sectionDescStyle}>
                                {t(
                                    "organizers.section.basic_desc",
                                    "Datos principales del organizador."
                                )}
                            </p>
                            <div style={formFieldsStyle}>
                                <Controller
                                    name="name"
                                    control={control}
                                    render={({ field }) => (
                                        <Input
                                            {...field}
                                            type="text"
                                            label={t("organizers.field.name", "Nombre")}
                                            placeholder={t(
                                                "organizers.placeholder.name",
                                                "Colegio de Ingenieros del Perú"
                                            )}
                                            error={errors.name?.message}
                                            required
                                            leftIcon={<Buildings size={16} />}
                                        />
                                    )}
                                />
                                <Controller
                                    name="email"
                                    control={control}
                                    render={({ field }) => (
                                        <Input
                                            {...field}
                                            type="email"
                                            label={t("organizers.field.email", "Email de contacto")}
                                            placeholder={t(
                                                "organizers.placeholder.email",
                                                "contacto@organizador.com"
                                            )}
                                            error={errors.email?.message}
                                            leftIcon={<Envelope size={16} />}
                                        />
                                    )}
                                />
                                <Controller
                                    name="website"
                                    control={control}
                                    render={({ field }) => (
                                        <Input
                                            {...field}
                                            type="url"
                                            label={t("organizers.field.website", "Sitio web")}
                                            placeholder={t(
                                                "organizers.placeholder.website",
                                                "https://www.ejemplo.com"
                                            )}
                                            error={errors.website?.message}
                                            leftIcon={<Globe size={16} />}
                                        />
                                    )}
                                />
                                <Controller
                                    name="logoUrl"
                                    control={control}
                                    render={({ field }) => (
                                        <Input
                                            {...field}
                                            type="url"
                                            label={t("organizers.field.logo", "URL del Logo")}
                                            placeholder={t(
                                                "organizers.placeholder.logo",
                                                "https://ejemplo.com/logo.png"
                                            )}
                                            error={errors.logoUrl?.message}
                                        />
                                    )}
                                />
                            </div>
                        </div>

                        {/* Section 2: Fiscal Data */}
                        <div style={sectionStyle}>
                            <h3 style={sectionTitleStyle}>
                                {t("organizers.section.fiscal", "Datos Fiscales")}
                            </h3>
                            <p style={sectionDescStyle}>
                                {t(
                                    "organizers.section.fiscal_desc",
                                    "Información para facturación y comprobantes."
                                )}
                            </p>
                            <div style={formFieldsStyle}>
                                <Controller
                                    name="ruc"
                                    control={control}
                                    render={({ field }) => (
                                        <Input
                                            {...field}
                                            type="text"
                                            label={t("organizers.field.ruc", "RUC")}
                                            placeholder={t(
                                                "organizers.placeholder.ruc",
                                                "20123456789"
                                            )}
                                            error={errors.ruc?.message}
                                            leftIcon={<IdentificationCard size={16} />}
                                            maxLength={11}
                                        />
                                    )}
                                />
                                <Controller
                                    name="businessName"
                                    control={control}
                                    render={({ field }) => (
                                        <Input
                                            {...field}
                                            type="text"
                                            label={t("organizers.field.business_name", "Razón Social")}
                                            placeholder={t(
                                                "organizers.placeholder.business_name",
                                                "EMPRESA S.A.C."
                                            )}
                                            error={errors.businessName?.message}
                                        />
                                    )}
                                />
                                <Controller
                                    name="fiscalAddress"
                                    control={control}
                                    render={({ field }) => (
                                        <Input
                                            {...field}
                                            type="text"
                                            label={t(
                                                "organizers.field.fiscal_address",
                                                "Dirección Fiscal"
                                            )}
                                            placeholder={t(
                                                "organizers.placeholder.fiscal_address",
                                                "Av. Principal 123, Lima"
                                            )}
                                            error={errors.fiscalAddress?.message}
                                            leftIcon={<MapPin size={16} />}
                                        />
                                    )}
                                />
                                <Controller
                                    name="baseCurrency"
                                    control={control}
                                    render={({ field }) => (
                                        <FormSelect
                                            label={t("organizers.field.currency", "Moneda Base")}
                                            value={field.value}
                                            onChange={field.onChange}
                                            options={currencyOptions}
                                            error={errors.baseCurrency?.message}
                                        />
                                    )}
                                />

                                <Controller
                                    name="emitsFiscalDocuments"
                                    control={control}
                                    render={({ field }) => (
                                        <div style={switchRowStyle}>
                                            <div style={switchLabelStyle}>
                                                <span
                                                    style={{
                                                        fontSize: "var(--font-size-sm)",
                                                        fontWeight: 500,
                                                        color: "var(--color-text-primary)",
                                                        display: "flex",
                                                        alignItems: "center",
                                                        gap: "var(--space-2)",
                                                    }}
                                                >
                                                    <Receipt size={16} />
                                                    {t(
                                                        "organizers.field.emits_fiscal",
                                                        "Emite comprobantes fiscales"
                                                    )}
                                                </span>
                                                <span
                                                    style={{
                                                        fontSize: "var(--font-size-xs)",
                                                        color: "var(--color-text-muted)",
                                                    }}
                                                >
                                                    {t(
                                                        "organizers.field.emits_fiscal_desc",
                                                        "Boletas y facturas electrónicas"
                                                    )}
                                                </span>
                                            </div>
                                            <Switch
                                                checked={field.value}
                                                onCheckedChange={field.onChange}
                                            />
                                        </div>
                                    )}
                                />
                            </div>
                        </div>
                    </form>
                </DrawerBody>
                <DrawerFooter>
                    <Button
                        type="button"
                        variant="secondary"
                        onClick={handleClose}
                        disabled={submitting}
                    >
                        {t("form.cancel", "Cancelar")}
                    </Button>
                    <Button
                        type="submit"
                        form="create-organizer-form"
                        variant="primary"
                        disabled={submitting}
                        isLoading={submitting}
                        loadingText={t("form.loading", "Guardando...")}
                    >
                        {t("organizers.create.btn", "Crear Organizador")}
                    </Button>
                </DrawerFooter>
            </DrawerContent>
        </Drawer>
    );
};

export default CreateOrganizerDrawer;
