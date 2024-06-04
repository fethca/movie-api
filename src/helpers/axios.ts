import axios, { AxiosRequestConfig, AxiosResponse } from 'axios'

export function request<T = never>(url: string, config: AxiosRequestConfig): Promise<AxiosResponse<T>> {
  const headers = { 'Content-Type': 'application/json', ...config.headers }
  return axios.request<T>({ ...config, headers, baseURL: url, timeout: 60000 })
}
