import axios from 'axios';

import type { LoginResponse, StatusApiResponse } from './types';

const apiClient = axios.create({
  baseURL: process.env.FATTOR_API_BASE_URL,
});

interface TokenCache {
  token: string | null;
  expiresAt: number;
}

let tokenCache: TokenCache = { token: null, expiresAt: 0 };

const login = async (): Promise<string> => {
  try {
    const { data } = await apiClient.post<LoginResponse>('/login', {
      email: process.env.FATTOR_API_EMAIL,
      password: process.env.FATTOR_API_PASSWORD,
    });

    const expiresInMs = (Number(data.expires_in) || 300) * 1000;
    tokenCache = {
      token: data.token,
      expiresAt: Date.now() + expiresInMs - 10_000,
    };

    return data.token;
  } catch (err) {
    const message = axios.isAxiosError(err) ? err.response?.data?.error || err.message : 'erro desconhecido';
    throw new Error(`Falha no login: ${message}`);
  }
};

const getToken = async (): Promise<string> => {
  if (tokenCache.token && Date.now() < tokenCache.expiresAt) {
    return tokenCache.token;
  }
  return login();
};

 const getStatus = async (accessKey: string, retry = true): Promise<StatusApiResponse> => {
  const token = await getToken();

  try {
    const { data } = await apiClient.get<StatusApiResponse>(
      `/status/${encodeURIComponent(accessKey)}`,
      {
        headers: { Authorization: `Bearer ${token}` },
      },
    );

    return data;
  } catch (err) {
    if (axios.isAxiosError(err) && err.response?.status === 401 && retry) {
      tokenCache = { token: null, expiresAt: 0 };
      return getStatus(accessKey, false);
    }

    const message = axios.isAxiosError(err) ? err.response?.data?.error || err.message : 'erro desconhecido';
    throw new Error(`Falha ao consultar status de ${accessKey}: ${message}`);
  }
};

export { login, getToken, getStatus };
