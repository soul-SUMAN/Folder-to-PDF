import axios from 'axios';

const API_BASE_URL = import.meta.env.DEV
  ? import.meta.env.VITE_LOCAL_API_URL ?? 'http://localhost:5000/api'
  : import.meta.env.VITE_API_URL ?? 'https://folder-to-pdf.onrender.com/api';

const http = axios.create({ baseURL: API_BASE_URL });

export const uploadFiles = async (files, onUploadProgress) => {
  const formData = new FormData();

  formData.append('paths', JSON.stringify(files.map((f) => f.webkitRelativePath)));
  files.forEach((file) => formData.append('files', file));

  const { data } = await http.post('/pdf/upload', formData, { onUploadProgress });
  return data;
};

export const generatePdf = (uploadId, onServerProgress) =>
  new Promise((resolve, reject) => {
    const request = new XMLHttpRequest();
    let responseOffset = 0;
    let responseBuffer = '';
    let result;
    let serverError;

    const handleRecord = (line) => {
      if (!line) return;

      let record;
      try {
        record = JSON.parse(line);
      } catch {
        serverError = new Error('The server returned an invalid progress update.');
        return;
      }

      if (record.type === 'progress') {
        onServerProgress?.(record);
      } else if (record.type === 'result') {
        result = record;
      } else if (record.type === 'error') {
        serverError = { response: { status: record.status, data: record } };
      }
    };

    const readProgress = () => {
      const received = request.responseText.slice(responseOffset);
      responseOffset = request.responseText.length;
      responseBuffer += received;

      const lines = responseBuffer.split('\n');
      responseBuffer = lines.pop();
      lines.forEach(handleRecord);
    };

    request.open('POST', http.getUri({ url: '/pdf/generate' }));
    request.setRequestHeader('Content-Type', 'application/json');
    request.addEventListener('progress', readProgress);
    request.addEventListener('load', () => {
      readProgress();
      handleRecord(responseBuffer);

      if (request.status < 200 || request.status >= 300) {
        let data;
        try {
          data = JSON.parse(request.responseText);
        } catch {
          data = {};
        }
        reject({ response: { status: request.status, data } });
        return;
      }

      if (serverError) {
        reject(serverError);
      } else if (result) {
        resolve(result);
      } else {
        reject(new Error('The server finished without returning a PDF link.'));
      }
    });
    request.addEventListener('error', () => reject(new Error('PDF generation failed. Check your connection and try again.')));
    request.send(JSON.stringify({ uploadId }));
  });

export const downloadPdf = async (token, filename) => {
  const { data } = await http.get(`/pdf/download/${token}`, { responseType: 'blob' });
  const url = URL.createObjectURL(new Blob([data], { type: 'application/pdf' }));
  const link = document.createElement('a');

  link.href = url;
  link.download = filename;
  link.click();

  setTimeout(() => URL.revokeObjectURL(url), 1000);
};