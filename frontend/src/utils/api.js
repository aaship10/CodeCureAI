import { getToken } from './auth';

const BASE_URL = 'http://localhost:8000/api'; // Adjust if your backend port differs

export const apiCall = async (endpoint, method = 'GET', body = null) => {
  const token = getToken();
  const headers = { 'Content-Type': 'application/json' };
  
  // Hybrid Auth: Only attach token if the user is logged in
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const options = { method, headers };
  if (body) options.body = JSON.stringify(body);

  const response = await fetch(`${BASE_URL}${endpoint}`, options);
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.detail || 'API Error');
  }
  return data;
};