import axios from 'axios';

const http = axios.create({ baseURL: import.meta.env.VITE_API_URL });

export const generatePdf = async (files, onUploadProgress) => {
  const formData = new FormData();

  formData.append('paths', JSON.stringify(files.map((f) => f.webkitRelativePath)));
  files.forEach((file) => formData.append('files', file));

  const { data } = await http.post('/pdf/generate', formData, { onUploadProgress });
  return data;
};

export const downloadPdf = async (token, filename) => {
  const { data } = await http.get(`/pdf/download/${token}`, { responseType: 'blob' });
  const url = URL.createObjectURL(new Blob([data], { type: 'application/pdf' }));
  const link = document.createElement('a');

  link.href = url;
  link.download = filename;
  link.click();

  setTimeout(() => URL.revokeObjectURL(url), 1000);
};