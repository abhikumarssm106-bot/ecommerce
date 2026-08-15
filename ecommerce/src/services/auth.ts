import api from './api';

export const login = async (email: string, password: string) => {
  const { data } = await api.post('/auth/login', { email, password });
  return data;
};

export const register = async (userData: any) => {
  const { data } = await api.post('/auth/register', userData);
  return data;
};

export const logout = async () => {
  const { data } = await api.post('/auth/logout');
  return data;
};

export const getProfile = async () => {
  const { data } = await api.get('/auth/profile');
  return data;
};

export const addAddress = async (addressData: any) => {
  const { data } = await api.post('/auth/profile/addresses', addressData);
  return data;
};
