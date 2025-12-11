/**
 * Form Components - Refactoring UI Style
 *
 * Componentes de formulario con diseño consistente basado en Refactoring UI.
 * Usan CSS Variables para tokens y inline styles para estados interactivos.
 *
 * @example
 * import { FormCard, FormGroup, FormRow, FormSelect, FormTextarea } from '@/components/ui/form'
 *
 * <FormCard title="Información General">
 *   <FormGroup>
 *     <FormRow columns={2}>
 *       <FormSelect label="Tipo" options={options} value={value} onChange={setValue} />
 *       <FormSelect label="Categoría" options={categories} value={cat} onChange={setCat} />
 *     </FormRow>
 *   </FormGroup>
 *   <FormGroup>
 *     <FormTextarea label="Descripción" maxLength={500} showCounter />
 *   </FormGroup>
 * </FormCard>
 */

// Layout components
export { FormCard } from "./form-card";
export { FormRow } from "./form-row";
export { FormGroup } from "./form-group";

// Input components
export { FormSelect } from "./form-select";
export { FormTextarea } from "./form-textarea";
export { FormDateTimePicker } from "./form-datetime-picker";
export { FormImageUpload } from "./form-image-upload";
