import axios from 'axios';
import { useState } from 'react';
import { api } from './api';
import { ResultsTable } from './components/ResultsTable';
import { UploadForm } from './components/UploadForm';
import type { UploadResponse } from './types';
import './App.css';

const App = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<UploadResponse | null>(null);

  const handleUpload = async (file: File) => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const formData = new FormData();

      formData.append('file', file);

      const { data } = await api.post<UploadResponse>('/upload', formData);

      if (data.warnings.length > 0) {
        console.warn('Avisos ao ler o CNAB 444:', data.warnings);
      }

      setResult(data);
    } catch (err) {
      const message = axios.isAxiosError(err) ? err.response?.data?.error : undefined;
      setError(message ?? (err instanceof Error ? err.message : 'Erro desconhecido.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="container">
      <h1>Consulta de Status - CNAB 444</h1>
      <p className="subtitle">
        Envie o arquivo de remessa CNAB 444 para extrair as chaves de acesso da NFe de cada registro
        e consultar a situação de cada uma na API da prova.
      </p>

      <UploadForm onSubmit={handleUpload} loading={loading} />

      {loading && (
        <div className="feedback info">Enviando arquivo e consultando a API de status...</div>
      )}
      {error && <div className="feedback error">{error}</div>}

      {result && <ResultsTable data={result} />}
    </main>
  );
};

export default App;
