import API from './api'

export const sectionService = {
  getSections: () => API.get('/sections'),
  createSection: (data) => API.post('/sections', data),
  updateSection: (id, data) => API.put(`/sections/${id}`, data),
  deleteSection: (id) => API.delete(`/sections/${id}`),
  getSectionStats: (sectionId) => API.get(`/sections/${sectionId}/stats`)
}