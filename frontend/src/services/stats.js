import API from './api';

export const statsService = {
  getOverview: () => API.get('/stats'),
  getAnalytics: (params) => API.get('/stats/analytics', { params }),
  getSessionHistory: (params) => API.get('/stats/sessions', { params }),
};

