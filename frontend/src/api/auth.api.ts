import apiClient from './client';

export const register = async (name: string, email: string, password: string) => {
  const response = await apiClient.post('/auth/register', {
    name,
    email,
    password,
  });

  return response.data.data;
};

export const login = async (email: string, password: string) => {
  const response = await apiClient.post('/auth/login', { email, password });
  return response.data.data;
};

export const getProfile = async () => {
  const response = await apiClient.get('/auth/profile');
  return response.data.data;
};

export const updateProfile = async (data: {
  name?: string;
  targetRole?: string;
  experienceLevel?: string;
}) => {
  const response = await apiClient.put('/auth/profile', data);
  return response.data;
};
