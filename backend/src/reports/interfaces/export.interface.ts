export interface ColumnConfig {
  key: string;
  header: string;
  width?: number;
  format?: 'text' | 'number' | 'currency' | 'date' | 'percentage' | 'datetime';
}

export interface ExcelSheet {
  name: string;
  data: any[];
  columns: ColumnConfig[];
}

export interface ExportOptions {
  filename?: string;
  title?: string;
  metadata?: Record<string, any>;
}
