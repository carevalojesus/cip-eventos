import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { User, IdentificationCard, CheckCircle, Warning, SpinnerGap } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuthStore } from "@/store/auth.store";
import {
  profileService,
  personService,
  type Profile,
  type Person,
  type UpdateProfileDto,
  type CreatePersonDto,
  DocumentType,
} from "@/services/profile.service";
import { grey, cyan, green, red, yellow } from "@/lib/styleTokens";

// ============================================
// Tab Component
// ============================================
interface TabProps {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}

const Tab: React.FC<TabProps> = ({ active, onClick, icon, label }) => (
  <button
    onClick={onClick}
    style={{
      display: "flex",
      alignItems: "center",
      gap: "8px",
      padding: "10px 16px",
      fontSize: "14px",
      fontWeight: active ? 600 : 500,
      color: active ? grey[900] : grey[600],
      background: active ? "white" : "transparent",
      border: "none",
      borderRadius: "8px",
      cursor: "pointer",
      transition: "all 150ms ease",
      boxShadow: active ? "0 1px 3px rgba(0,0,0,0.1)" : "none",
    }}
  >
    {icon}
    {label}
  </button>
);

// ============================================
// Profile Form (Datos de Cuenta)
// ============================================
interface ProfileFormProps {
  profile: Profile | null;
  isLoading: boolean;
  onSave: (data: UpdateProfileDto) => void;
  isSaving: boolean;
}

const ProfileForm: React.FC<ProfileFormProps> = ({ profile, isLoading, onSave, isSaving }) => {
  const { t } = useTranslation();
  const { user } = useAuthStore();
  const [formData, setFormData] = useState<UpdateProfileDto>({
    firstName: profile?.firstName || "",
    lastName: profile?.lastName || "",
    phoneNumber: profile?.phoneNumber || "",
    designation: profile?.designation || "",
    description: profile?.description || "",
    address: profile?.address || "",
  });

  React.useEffect(() => {
    if (profile) {
      setFormData({
        firstName: profile.firstName || "",
        lastName: profile.lastName || "",
        phoneNumber: profile.phoneNumber || "",
        designation: profile.designation || "",
        description: profile.description || "",
        address: profile.address || "",
      });
    }
  }, [profile]);

  const handleChange = (field: keyof UpdateProfileDto) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setFormData((prev) => ({ ...prev, [field]: e.target.value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  if (isLoading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", padding: "48px" }}>
        <SpinnerGap size={32} style={{ animation: "spin 1s linear infinite", color: grey[400] }} />
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit}>
      <div style={{ display: "grid", gap: "20px" }}>
        {/* Email (readonly) */}
        <div>
          <label style={{ display: "block", marginBottom: "6px", fontSize: "14px", fontWeight: 500, color: grey[700] }}>
            {t("profile.email", "Correo electrónico")}
          </label>
          <Input
            value={user?.email || ""}
            disabled
            style={{ backgroundColor: grey[100], cursor: "not-allowed" }}
          />
          <p style={{ marginTop: "4px", fontSize: "12px", color: grey[500] }}>
            {t("profile.email_readonly", "El correo no puede ser modificado")}
          </p>
        </div>

        {/* Nombre y Apellido */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
          <div>
            <label style={{ display: "block", marginBottom: "6px", fontSize: "14px", fontWeight: 500, color: grey[700] }}>
              {t("profile.first_name", "Nombre")}
            </label>
            <Input
              value={formData.firstName}
              onChange={handleChange("firstName")}
              placeholder={t("profile.first_name_placeholder", "Tu nombre")}
            />
          </div>
          <div>
            <label style={{ display: "block", marginBottom: "6px", fontSize: "14px", fontWeight: 500, color: grey[700] }}>
              {t("profile.last_name", "Apellido")}
            </label>
            <Input
              value={formData.lastName}
              onChange={handleChange("lastName")}
              placeholder={t("profile.last_name_placeholder", "Tu apellido")}
            />
          </div>
        </div>

        {/* Teléfono */}
        <div>
          <label style={{ display: "block", marginBottom: "6px", fontSize: "14px", fontWeight: 500, color: grey[700] }}>
            {t("profile.phone", "Teléfono")}
          </label>
          <Input
            value={formData.phoneNumber}
            onChange={handleChange("phoneNumber")}
            placeholder={t("profile.phone_placeholder", "+51 999 999 999")}
          />
        </div>

        {/* Cargo */}
        <div>
          <label style={{ display: "block", marginBottom: "6px", fontSize: "14px", fontWeight: 500, color: grey[700] }}>
            {t("profile.designation", "Cargo / Profesión")}
          </label>
          <Input
            value={formData.designation}
            onChange={handleChange("designation")}
            placeholder={t("profile.designation_placeholder", "Ej: Ingeniero Civil")}
          />
        </div>

        {/* Dirección */}
        <div>
          <label style={{ display: "block", marginBottom: "6px", fontSize: "14px", fontWeight: 500, color: grey[700] }}>
            {t("profile.address", "Dirección")}
          </label>
          <Input
            value={formData.address}
            onChange={handleChange("address")}
            placeholder={t("profile.address_placeholder", "Tu dirección")}
          />
        </div>

        {/* Descripción */}
        <div>
          <label style={{ display: "block", marginBottom: "6px", fontSize: "14px", fontWeight: 500, color: grey[700] }}>
            {t("profile.description", "Acerca de ti")}
          </label>
          <textarea
            value={formData.description}
            onChange={handleChange("description")}
            placeholder={t("profile.description_placeholder", "Una breve descripción sobre ti...")}
            rows={3}
            style={{
              width: "100%",
              padding: "10px 12px",
              fontSize: "14px",
              border: `1px solid ${grey[200]}`,
              borderRadius: "6px",
              resize: "vertical",
              fontFamily: "inherit",
            }}
          />
        </div>

        {/* Botón guardar */}
        <div style={{ display: "flex", justifyContent: "flex-end", paddingTop: "8px" }}>
          <Button type="submit" variant="primary" isLoading={isSaving}>
            {t("profile.save", "Guardar cambios")}
          </Button>
        </div>
      </div>
    </form>
  );
};

// ============================================
// Person Form (Datos Nominales)
// ============================================
interface PersonFormProps {
  person: Person | null;
  hasData: boolean;
  isLoading: boolean;
  onSave: (data: CreatePersonDto) => void;
  isSaving: boolean;
  userEmail: string;
}

const PersonForm: React.FC<PersonFormProps> = ({ person, hasData, isLoading, onSave, isSaving, userEmail }) => {
  const { t } = useTranslation();
  const [formData, setFormData] = useState<CreatePersonDto>({
    firstName: "",
    lastName: "",
    documentType: DocumentType.DNI,
    documentNumber: "",
    email: userEmail,
    phone: "",
    country: "Perú",
    birthDate: "",
  });

  const handleChange = (field: keyof CreatePersonDto) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    setFormData((prev) => ({ ...prev, [field]: e.target.value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  if (isLoading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", padding: "48px" }}>
        <SpinnerGap size={32} style={{ animation: "spin 1s linear infinite", color: grey[400] }} />
      </div>
    );
  }

  // Si ya tiene Person, mostrar en modo lectura
  if (hasData && person) {
    const isValidated = person.reniecValidationScore !== null && person.reniecValidationScore >= 80;

    return (
      <div style={{ display: "grid", gap: "20px" }}>
        {/* Badge de validación */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            padding: "12px 16px",
            backgroundColor: isValidated ? green[50] : yellow[50],
            borderRadius: "8px",
            border: `1px solid ${isValidated ? green[200] : yellow[200]}`,
          }}
        >
          {isValidated ? (
            <CheckCircle size={20} weight="fill" color={green[600]} />
          ) : (
            <Warning size={20} weight="fill" color={yellow[600]} />
          )}
          <span style={{ fontSize: "14px", fontWeight: 500, color: isValidated ? green[700] : yellow[700] }}>
            {isValidated
              ? t("profile.person_verified", "Datos verificados con RENIEC")
              : t("profile.person_pending", "Datos pendientes de verificación")}
          </span>
        </div>

        {/* Datos en modo lectura */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
          <ReadOnlyField label={t("profile.first_name", "Nombre")} value={person.firstName} />
          <ReadOnlyField label={t("profile.last_name", "Apellido")} value={person.lastName} />
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
          <ReadOnlyField label={t("profile.document_type", "Tipo de documento")} value={person.documentType} />
          <ReadOnlyField label={t("profile.document_number", "Número de documento")} value={person.documentNumber} />
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
          <ReadOnlyField label={t("profile.country", "País")} value={person.country || "-"} />
          <ReadOnlyField
            label={t("profile.birth_date", "Fecha de nacimiento")}
            value={person.birthDate ? new Date(person.birthDate).toLocaleDateString("es-PE") : "-"}
          />
        </div>

        {/* Aviso */}
        <div
          style={{
            padding: "12px 16px",
            backgroundColor: grey[50],
            borderRadius: "8px",
            border: `1px solid ${grey[200]}`,
          }}
        >
          <p style={{ margin: 0, fontSize: "13px", color: grey[600] }}>
            {t(
              "profile.person_readonly_notice",
              "Los datos nominales se utilizan para emitir certificados oficiales. Si necesitas corregirlos, contacta a soporte."
            )}
          </p>
        </div>
      </div>
    );
  }

  // Formulario para crear Person
  return (
    <form onSubmit={handleSubmit}>
      <div style={{ display: "grid", gap: "20px" }}>
        {/* Aviso */}
        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            gap: "12px",
            padding: "16px",
            backgroundColor: cyan[50],
            borderRadius: "8px",
            border: `1px solid ${cyan[200]}`,
          }}
        >
          <IdentificationCard size={24} weight="duotone" color={cyan[600]} style={{ flexShrink: 0, marginTop: "2px" }} />
          <div>
            <p style={{ margin: 0, fontSize: "14px", fontWeight: 600, color: cyan[800] }}>
              {t("profile.complete_nominal_data", "Completa tus datos nominales")}
            </p>
            <p style={{ margin: "4px 0 0", fontSize: "13px", color: cyan[700] }}>
              {t(
                "profile.nominal_data_notice",
                "Estos datos se usarán para emitir certificados oficiales. Asegúrate de que coincidan con tu documento de identidad."
              )}
            </p>
          </div>
        </div>

        {/* Nombre y Apellido */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
          <div>
            <label style={{ display: "block", marginBottom: "6px", fontSize: "14px", fontWeight: 500, color: grey[700] }}>
              {t("profile.first_name", "Nombre")} *
            </label>
            <Input
              value={formData.firstName}
              onChange={handleChange("firstName")}
              placeholder={t("profile.legal_name_placeholder", "Como aparece en tu documento")}
              required
            />
          </div>
          <div>
            <label style={{ display: "block", marginBottom: "6px", fontSize: "14px", fontWeight: 500, color: grey[700] }}>
              {t("profile.last_name", "Apellido")} *
            </label>
            <Input
              value={formData.lastName}
              onChange={handleChange("lastName")}
              placeholder={t("profile.legal_lastname_placeholder", "Como aparece en tu documento")}
              required
            />
          </div>
        </div>

        {/* Tipo y Número de documento */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: "16px" }}>
          <div>
            <label style={{ display: "block", marginBottom: "6px", fontSize: "14px", fontWeight: 500, color: grey[700] }}>
              {t("profile.document_type", "Tipo de documento")} *
            </label>
            <select
              value={formData.documentType}
              onChange={handleChange("documentType")}
              required
              style={{
                width: "100%",
                height: "40px",
                padding: "0 12px",
                fontSize: "14px",
                border: `1px solid ${grey[200]}`,
                borderRadius: "6px",
                backgroundColor: "white",
                cursor: "pointer",
              }}
            >
              <option value={DocumentType.DNI}>DNI</option>
              <option value={DocumentType.CE}>Carné de Extranjería</option>
              <option value={DocumentType.PASSPORT}>Pasaporte</option>
              <option value={DocumentType.OTHER}>Otro</option>
            </select>
          </div>
          <div>
            <label style={{ display: "block", marginBottom: "6px", fontSize: "14px", fontWeight: 500, color: grey[700] }}>
              {t("profile.document_number", "Número de documento")} *
            </label>
            <Input
              value={formData.documentNumber}
              onChange={handleChange("documentNumber")}
              placeholder={t("profile.document_number_placeholder", "12345678")}
              required
            />
          </div>
        </div>

        {/* País y Fecha de nacimiento */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
          <div>
            <label style={{ display: "block", marginBottom: "6px", fontSize: "14px", fontWeight: 500, color: grey[700] }}>
              {t("profile.country", "País")}
            </label>
            <Input
              value={formData.country}
              onChange={handleChange("country")}
              placeholder="Perú"
            />
          </div>
          <div>
            <label style={{ display: "block", marginBottom: "6px", fontSize: "14px", fontWeight: 500, color: grey[700] }}>
              {t("profile.birth_date", "Fecha de nacimiento")}
            </label>
            <Input
              type="date"
              value={formData.birthDate}
              onChange={handleChange("birthDate")}
            />
          </div>
        </div>

        {/* Botón guardar */}
        <div style={{ display: "flex", justifyContent: "flex-end", paddingTop: "8px" }}>
          <Button type="submit" variant="primary" isLoading={isSaving}>
            {t("profile.save_nominal_data", "Guardar datos nominales")}
          </Button>
        </div>
      </div>
    </form>
  );
};

// ============================================
// ReadOnly Field Component
// ============================================
const ReadOnlyField: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <div>
    <label style={{ display: "block", marginBottom: "6px", fontSize: "14px", fontWeight: 500, color: grey[700] }}>
      {label}
    </label>
    <div
      style={{
        padding: "10px 12px",
        fontSize: "14px",
        color: grey[900],
        backgroundColor: grey[50],
        border: `1px solid ${grey[200]}`,
        borderRadius: "6px",
      }}
    >
      {value}
    </div>
  </div>
);

// ============================================
// Main ProfileView Component
// ============================================
export const ProfileView: React.FC = () => {
  const { t } = useTranslation();
  const { user, updateUser } = useAuthStore();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<"account" | "nominal">("account");

  // Query: Profile
  const {
    data: profile,
    isLoading: isLoadingProfile,
  } = useQuery({
    queryKey: ["profile", "me"],
    queryFn: profileService.getMyProfile,
    retry: false,
  });

  // Query: Person
  const {
    data: personResponse,
    isLoading: isLoadingPerson,
  } = useQuery({
    queryKey: ["person", "me"],
    queryFn: personService.getMyPerson,
  });

  // Mutation: Update Profile
  const updateProfileMutation = useMutation({
    mutationFn: profileService.updateProfile,
    onSuccess: (updatedProfile) => {
      queryClient.invalidateQueries({ queryKey: ["profile", "me"] });
      // Actualizar el store de auth
      updateUser({
        firstName: updatedProfile.firstName,
        lastName: updatedProfile.lastName,
        avatar: updatedProfile.avatar,
      });
      toast.success(t("profile.save_success", "Perfil actualizado correctamente"));
    },
    onError: () => {
      toast.error(t("profile.save_error", "Error al actualizar el perfil"));
    },
  });

  // Mutation: Create Person
  const createPersonMutation = useMutation({
    mutationFn: personService.createMyPerson,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["person", "me"] });
      toast.success(t("profile.nominal_save_success", "Datos nominales guardados correctamente"));
    },
    onError: (error: any) => {
      const message = error?.response?.data?.message || t("profile.nominal_save_error", "Error al guardar los datos nominales");
      toast.error(message);
    },
  });

  return (
    <div style={{ maxWidth: "800px", margin: "0 auto" }}>
      {/* Header */}
      <div style={{ marginBottom: "24px" }}>
        <h1 style={{ margin: 0, fontSize: "24px", fontWeight: 700, color: grey[900] }}>
          {t("profile.title", "Mi Perfil")}
        </h1>
        <p style={{ margin: "4px 0 0", fontSize: "14px", color: grey[600] }}>
          {t("profile.subtitle", "Administra tu información personal y datos nominales")}
        </p>
      </div>

      {/* Tabs */}
      <div
        style={{
          display: "flex",
          gap: "4px",
          padding: "4px",
          marginBottom: "24px",
          backgroundColor: grey[100],
          borderRadius: "10px",
        }}
      >
        <Tab
          active={activeTab === "account"}
          onClick={() => setActiveTab("account")}
          icon={<User size={18} />}
          label={t("profile.tab_account", "Cuenta")}
        />
        <Tab
          active={activeTab === "nominal"}
          onClick={() => setActiveTab("nominal")}
          icon={<IdentificationCard size={18} />}
          label={t("profile.tab_nominal", "Datos Nominales")}
        />
      </div>

      {/* Content Card */}
      <div
        style={{
          padding: "24px",
          backgroundColor: "white",
          borderRadius: "12px",
          border: `1px solid ${grey[200]}`,
          boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
        }}
      >
        {activeTab === "account" ? (
          <ProfileForm
            profile={profile || null}
            isLoading={isLoadingProfile}
            onSave={(data) => updateProfileMutation.mutate(data)}
            isSaving={updateProfileMutation.isPending}
          />
        ) : (
          <PersonForm
            person={personResponse?.data || null}
            hasData={personResponse?.hasData || false}
            isLoading={isLoadingPerson}
            onSave={(data) => createPersonMutation.mutate(data)}
            isSaving={createPersonMutation.isPending}
            userEmail={user?.email || ""}
          />
        )}
      </div>
    </div>
  );
};
