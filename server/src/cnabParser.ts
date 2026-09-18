import type {
  CnabDetailRecord,
  CnabHeaderRecord,
  CnabParseResult,
  CnabTrailerRecord,
} from './types';

const LINE_LENGTH = 444;
const ACCESS_KEY_START = 400;
const ACCESS_KEY_LENGTH = 44;

const RECORD_TYPE = {
  HEADER: '0',
  DETAIL: '1',
  TRAILER: '9',
} as const;

const splitLines = (content: string): string[] =>
  content.split(/\r\n|\r|\n/).filter((line) => line.trim().length > 0);

const parseDetailRecord = (line: string, index: number): CnabDetailRecord => {
  const accessKey = line.slice(ACCESS_KEY_START, ACCESS_KEY_START + ACCESS_KEY_LENGTH).trim();

  const speciesMatch = line.match(/MERCANTIL\s+(\d{2})(\d{2})(\d{2})(\d+?)(99\s+N)/);
  let dueDate: string | null = null;
  let amount: number | null = null;
  if (speciesMatch) {
    const [, day, month, year, amountDigits] = speciesMatch;
    dueDate = `${day}/${month}/20${year}`;
    amount = Number(amountDigits) / 100;
  }

  const controlMatch = line.match(/CONTROLE(\d+)/);
  const ourNumber = controlMatch ? controlMatch[1] : null;

  const payerMatch = line.match(/PAGADOR\s+FAKE\s+\d+/i);
  const payer = payerMatch ? payerMatch[0].trim() : null;

  const cityMatch = line.match(/([A-Z ]{3,})\s+\d{5}-?\d{3}\s+([A-Z]{2})/);

  return {
    line: index + 1,
    recordType: RECORD_TYPE.DETAIL,
    accessKey,
    ourNumber,
    payer,
    dueDate,
    amount,
    city: cityMatch ? cityMatch[1].trim() : null,
    state: cityMatch ? cityMatch[2] : null,
  };
};

export const parseCnab444 = (content: string): CnabParseResult => {
  if (typeof content !== 'string' || content.trim().length === 0) {
    throw new Error('Arquivo vazio ou inválido.');
  }

  const lines = splitLines(content);
  if (lines.length === 0) {
    throw new Error('Nenhuma linha válida encontrada no arquivo.');
  }

  const warnings: string[] = [];
  let header: CnabHeaderRecord | null = null;
  let trailer: CnabTrailerRecord | null = null;
  const details: CnabDetailRecord[] = [];

  lines.forEach((line, index) => {
    if (line.length !== LINE_LENGTH) {
      warnings.push(
        `Linha ${index + 1} possui ${line.length} caracteres (esperado ${LINE_LENGTH}) e foi ignorada.`,
      );
      return;
    }

    const recordType = line[0];
    if (recordType === RECORD_TYPE.HEADER) {
      header = { line: index + 1, recordType, raw: line };
    } else if (recordType === RECORD_TYPE.TRAILER) {
      trailer = { line: index + 1, recordType, raw: line };
    } else if (recordType === RECORD_TYPE.DETAIL) {
      const detail = parseDetailRecord(line, index);
      if (
        !detail.accessKey ||
        detail.accessKey.length !== ACCESS_KEY_LENGTH ||
        !/^\d+$/.test(detail.accessKey)
      ) {
        warnings.push(`Linha ${index + 1}: chave NFe ausente ou inválida, registro ignorado.`);
        return;
      }
      details.push(detail);
    } else {
      warnings.push(`Linha ${index + 1}: tipo de registro desconhecido ('${recordType}').`);
    }
  });

  if (details.length === 0) {
    throw new Error(
      'Nenhum registro de detalhe (tipo 1) com chave válida foi encontrado no arquivo.',
    );
  }

  return { header, details, trailer, warnings };
};

export { LINE_LENGTH, ACCESS_KEY_START, ACCESS_KEY_LENGTH };
