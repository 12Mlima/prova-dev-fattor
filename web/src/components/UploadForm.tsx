import { useRef, useState, type FormEvent } from 'react';

interface UploadFormProps {
  onSubmit: (file: File) => Promise<void>;
  loading: boolean;
}

export const UploadForm = ({ onSubmit, loading }: UploadFormProps) => {
  const [fileName, setFileName] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    const file = inputRef.current?.files?.[0];
    if (file) {
      await onSubmit(file);
    }
  };

  return (
    <form className="upload-form" onSubmit={handleSubmit}>
      <label className="dropzone" htmlFor="file-input">
        <span>{fileName ?? 'Clique para selecionar o arquivo .rem (CNAB 444)'}</span>
        <input
          id="file-input"
          ref={inputRef}
          type="file"
          accept=".rem,.txt"
          required
          onChange={(e) => setFileName(e.target.files?.[0]?.name ?? null)}
        />
      </label>
      <button type="submit" disabled={loading}>
        {loading ? 'Processando...' : 'Processar arquivo'}
      </button>
    </form>
  );
};
