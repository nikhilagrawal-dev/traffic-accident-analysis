import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const checkHealth = async () => {
  try {
    const response = await api.get('/health');
    return response.data;
  } catch (error) {
    throw new Error('Health check failed');
  }
};

export const predictSeverity = async (data) => {
  try {
    const response = await api.post('/predict', data);
    return response.data;
  } catch (error) {
    if (error.response) {
      throw new Error(error.response.data.detail || 'Prediction failed');
    }
    throw new Error('Network error or server is down');
  }
};

export const predictByCity = async (data) => {
  try {
    const response = await api.post('/predict-by-city', data);
    return response.data;
  } catch (error) {
    if (error.response) {
      throw new Error(error.response.data.detail || 'Prediction failed');
    }
    throw new Error('Network error or server is down');
  }
};

export const fetchAccidentsMap = async (city, state = null, lat = null, lng = null) => {
  try {
    const params = { city };
    if (state) params.state = state;
    if (lat != null) params.lat = lat;
    if (lng != null) params.lng = lng;
    const response = await api.get('/accidents-map', { params });
    return response.data;
  } catch (error) {
    console.error('Failed to fetch accident map data:', error);
    return null;
  }
};

