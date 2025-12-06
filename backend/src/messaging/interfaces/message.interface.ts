export interface Message {
  channel: 'SMS' | 'WHATSAPP';
  to: string;           // Número de teléfono con código país
  content: string;
  templateId?: string;
  variables?: Record<string, string>;
}
