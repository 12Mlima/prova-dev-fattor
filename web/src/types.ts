export type Situation = 'autorizada' | 'cancelada' | 'rejeitada' | 'denegada' | 'nao_encontrada';

export interface ResultItem {
  line: number;
  recordType: '1';
  accessKey: string;
  ourNumber: string | null;
  payer: string | null;
  dueDate: string | null;
  amount: number | null;
  city: string | null;
  state: string | null;
  situation: Situation | null;
  error: string | null;
}

export interface UploadResponse {
  totalRecords: number;
  warnings: string[];
  items: ResultItem[];
}
