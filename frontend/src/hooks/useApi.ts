import { useState, useCallback } from 'react';
import api from '@/services/api';
import { AxiosRequestConfig } from 'axios';

interface UseApiState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

export function useApi<T = unknown>() {
  const [state, setState] = useState<UseApiState<T>>({
    data: null,
    loading: false,
    error: null,
  });

  const request = useCallback(async (config: AxiosRequestConfig): Promise<T | null> => {
    setState((prev) => ({ ...prev, loading: true, error: null }));
    try {
      const response = await api(config);
      const data = response.data?.data ?? response.data;
      setState({ data, loading: false, error: null });
      return data;
    } catch (err: any) {
      const message = err.response?.data?.message || err.message || 'An error occurred';
      setState({ data: null, loading: false, error: message });
      return null;
    }
  }, []);

  const get = useCallback((url: string, config?: AxiosRequestConfig) => {
    return request({ ...config, method: 'GET', url });
  }, [request]);

  const post = useCallback((url: string, data?: unknown, config?: AxiosRequestConfig) => {
    return request({ ...config, method: 'POST', url, data });
  }, [request]);

  const put = useCallback((url: string, data?: unknown, config?: AxiosRequestConfig) => {
    return request({ ...config, method: 'PUT', url, data });
  }, [request]);

  const del = useCallback((url: string, config?: AxiosRequestConfig) => {
    return request({ ...config, method: 'DELETE', url });
  }, [request]);

  return { ...state, request, get, post, put, del };
}
