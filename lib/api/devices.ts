import api from './client';

export const registerDeviceToken = async (token: string): Promise<void> => {
  await api.post('/devices/', { token });
};

export const deregisterDeviceToken = async (token: string): Promise<void> => {
  await api.delete('/devices/', { data: { token } });
};
