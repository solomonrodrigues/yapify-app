import { authClient } from './client';

export interface AppConfig {
  minimum_version: string;
  ios_store_url: string;
  android_store_url: string;
}

export async function getAppConfig(): Promise<AppConfig> {
  const res = await authClient.get<AppConfig>('/config/');
  return res.data;
}
