import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { test } from 'node:test';

import { ACCESS_KEY_LENGTH, LINE_LENGTH, parseCnab444 } from './cnabParser';

const SAMPLE_FILE_PATH = join(__dirname, '..', '..', '_prova', 'meu_cnab.rem');

const buildLine = (recordType: string, body: string, accessKey = ''): string => {
  const middle = body.padEnd(LINE_LENGTH - 1 - ACCESS_KEY_LENGTH, ' ');
  return `${recordType}${middle}${accessKey.padStart(ACCESS_KEY_LENGTH, '0')}`;
};

test('parses the real sample CNAB 444 file and extracts all 10 access keys', () => {
  const content = readFileSync(SAMPLE_FILE_PATH, 'latin1');
  const result = parseCnab444(content);

  assert.equal(result.warnings.length, 0);
  assert.ok(result.header);
  assert.ok(result.trailer);
  assert.equal(result.details.length, 10);

  const accessKeys = result.details.map((detail) => detail.accessKey);
  assert.equal(new Set(accessKeys).size, 10);
  for (const key of accessKeys) {
    assert.equal(key.length, 44);
    assert.match(key, /^\d{44}$/);
  }

  assert.equal(result.details[0].accessKey, '35240300000000000199550010000000011234567890');
});

test('throws on empty content', () => {
  assert.throws(() => parseCnab444(''), /vazio ou inválido/);
  assert.throws(() => parseCnab444('   '), /vazio ou inválido/);
});

test('throws when no valid detail record is found', () => {
  const header = buildLine('0', 'REMESSA');
  assert.throws(() => parseCnab444(header), /Nenhum registro de detalhe/);
});

test('skips lines with the wrong length and reports a warning', () => {
  const header = buildLine('0', 'REMESSA');
  const detail = buildLine(
    '1',
    'DUPLICATA MERCANTIL',
    '35240300000000000199550010000000011234567890',
  );
  const shortLine = '1TOO SHORT';
  const content = [header, shortLine, detail].join('\n');

  const result = parseCnab444(content);

  assert.equal(result.details.length, 1);
  assert.equal(result.warnings.length, 1);
  assert.match(result.warnings[0], /esperado 444/);
});

test('skips detail records with an invalid access key and reports a warning', () => {
  const header = buildLine('0', 'REMESSA');
  const validDetail = buildLine(
    '1',
    'DUPLICATA MERCANTIL',
    '35240300000000000199550010000000011234567890',
  );
  const invalidDetail = buildLine('1', 'DUPLICATA MERCANTIL', 'A'.repeat(ACCESS_KEY_LENGTH));
  const content = [header, validDetail, invalidDetail].join('\n');

  const result = parseCnab444(content);

  assert.equal(result.details.length, 1);
  assert.equal(result.warnings.length, 1);
  assert.match(result.warnings[0], /chave NFe ausente ou inválida/);
});

test('reports unknown record types as warnings', () => {
  const validDetail = buildLine(
    '1',
    'DUPLICATA MERCANTIL',
    '35240300000000000199550010000000011234567890',
  );
  const unknown = buildLine('5', 'UNKNOWN');
  const content = [validDetail, unknown].join('\n');

  const result = parseCnab444(content);

  assert.equal(result.details.length, 1);
  assert.equal(result.warnings.length, 1);
  assert.match(result.warnings[0], /tipo de registro desconhecido/);
});
