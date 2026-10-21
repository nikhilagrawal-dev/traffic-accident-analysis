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

export const fetchNearbyClusters = async (latitude, longitude, radiusKm = 30.0, limit = 50) => {
  const params = {
    latitude,
    longitude,
    radius_km: radiusKm,
    limit,
  };

  // When developing on localhost, use local FastAPI instance if available
  // to prevent remote pre-deployment 404 logs
  const isLocalhost = typeof window !== 'undefined' &&
    (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
  if (isLocalhost) {
    try {
      const localRes = await axios.get('http://127.0.0.1:8000/spatial/clusters', { params, timeout: 2500 });
      return localRes.data;
    } catch {
      // Fallback to configured API_URL if local server is not responding
    }
  }

  try {
    const response = await api.get('/spatial/clusters', { params });
    return response.data;
  } catch (error) {
    if (error.response) {
      throw new Error(error.response.data.detail || 'Failed to fetch spatial clusters');
    }
    throw new Error('Network error or server is down');
  }
};
