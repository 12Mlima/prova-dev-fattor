import type { UploadResponse } from '../types';

interface ResultsTableProps {
  data: UploadResponse;
}

export const ResultsTable = ({ data }: ResultsTableProps) => {
  return (
    <section className="results">
      <h2>Resultados</h2>
      <p className="summary">
        {data.totalRecords} registro(s) extraído(s) do arquivo.
        {data.warnings.length > 0 &&
          ` ${data.warnings.length} aviso(s) durante a leitura (ver console).`}
      </p>

      <table>
        <thead>
          <tr>
            <th>#</th>
            <th>Identificador (chave NFe)</th>
            <th>Nosso número</th>
            <th>Pagador</th>
            <th>Vencimento</th>
            <th>Situação</th>
          </tr>
        </thead>
        <tbody>
          {data.items.map((item, i) => {
            const situation = item.situation ?? 'erro';
            const label = item.error ? `Erro: ${item.error}` : situation.replace(/_/g, ' ');
            return (
              <tr key={item.accessKey}>
                <td>{i + 1}</td>
                <td className="access-key">{item.accessKey}</td>
                <td>{item.ourNumber ?? '-'}</td>
                <td>{item.payer ?? '-'}</td>
                <td>{item.dueDate ?? '-'}</td>
                <td>
                  <span className={`badge ${situation}`}>{label}</span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </section>
  );
};
