/**
 * api.js
 * Handles all communication with the Azure Function backend.
 * Update BASE_URL after deploying your Function App.
 */

const API = (() => {

  // Set this to your deployed Azure Function App base URL, e.g.:
  // "https://your-app.azurewebsites.net"
  // In the dashboard UI you can also paste it into the input field at runtime.
  const DEFAULT_BASE_URL = 'https://phase2-nutrition-func01.azurewebsites.net';

  const ENDPOINTS = {
    health:      '/api/health',
    processDiets: '/api/process-diets',
  };

  // helper functions

  function getBaseUrl() {
    const input = document.getElementById('base-url');
    const val = input ? input.value.trim().replace(/\/$/, '') : '';
    return val || DEFAULT_BASE_URL;
  }

  function buildUrl(endpoint, params = {}) {
    const base = getBaseUrl();
    const url = new URL(base + endpoint);
    Object.entries(params).forEach(([k, v]) => {
      if (v && v !== 'all') url.searchParams.set(k, v);
    });
    return url.toString();
  }

  
  // public api methods 
  
  async function health() {
    const url = buildUrl(ENDPOINTS.health);
    const res = await fetch(url);
    if (!res.ok) throw new Error('HTTP ' + res.status);
    return res.json();
  }

  async function processDiets(dietType = 'all') {
    const url = buildUrl(ENDPOINTS.processDiets, { diet_type: dietType });
    const res = await fetch(url);
    const data = await res.json();
    if (!res.ok) {
      throw new Error((data.error || 'Error') + ': ' + (data.message || res.status));
    }
    return data;
  }

  return { health, processDiets, getBaseUrl };
})();
