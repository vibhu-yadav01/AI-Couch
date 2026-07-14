import apiClient from './client';

export const uploadResume = async (formData: FormData) => {
  const response = await apiClient.post('/resume/upload', formData);

  return response.data;
};

export const getUserResume = async () => {
  const response = await apiClient.get('/resume/me');
  return response.data;
};

export const getResume = async (id: string) => {
  const response = await apiClient.get(`/resume/${id}`);
  return response.data;
};
