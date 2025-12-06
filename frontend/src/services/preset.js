import API from './api';

export const presetService = {
  getRecommendedPresets: () => API.get('/presets/recommended'),
  importPreset: (presetId, category) => API.post(`/presets/import/${presetId}`, { category }),
  getCategoryPresets: (category) => API.get(`/presets/${category}`),
  autoImportPresets: (preferences) => API.post('/presets/auto-import', preferences)
};

