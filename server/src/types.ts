export interface CnabHeaderRecord {
  line: number;
  recordType: '0';
  raw: string;
}

export interface CnabTrailerRecord {
  line: number;
  recordType: '9';
  raw: string;
}

export interface CnabDetailRecord {
  line: number;
  recordType: '1';
  accessKey: string;
  ourNumber: string | null;
  payer: string | null;
  dueDate: string | null;
  amount: number | null;
  city: string | null;
  state: string | null;
}

export interface CnabParseResult {
  header: CnabHeaderRecord | null;
  details: CnabDetailRecord[];
  trailer: CnabTrailerRecord | null;
  warnings: string[];
}

export type Situation = 'autorizada' | 'cancelada' | 'rejeitada' | 'denegada' | 'nao_encontrada';

export interface StatusApiResponse {
  status: string;
  usuario: string;
  ambiente: string;
  versao: string;
  ultima_consulta: string;
  chave_nfe: string;
  situacao: Situation;
}

export interface LoginResponse {
  token: string;
  expires_in: number;
  type: string;
}

export interface ResultItem extends CnabDetailRecord {
  situation: Situation | null;
  error: string | null;
}

export interface UploadResponse {
  totalRecords: number;
  warnings: string[];
  items: ResultItem[];
}
