import API from './api';

export const userService = {
  updatePreferences: (preferences) => API.post('/user/preferences', preferences),
  
  getPreferences: () => API.get('/user/preferences'),
  
  updateProfile: (profileData) => API.put('/user/profile', profileData),
};

