import API from './api'

export const sectionService = {
  getSections: () => API.get('/sections'),
  getArchivedSections: () => API.get('/sections?archived=true'),
  getSection: (id) => API.get(`/sections/${id}`),
  createSection: (data) => API.post('/sections', data),
  updateSection: (id, data) => API.put(`/sections/${id}`, data),
  deleteSection: (id) => API.delete(`/sections/${id}`),
  getSectionStats: (sectionId) => API.get(`/sections/${sectionId}/stats`),
  archiveSection: (id) => API.patch(`/sections/${id}/archive`),
  restoreSection: (id) => API.patch(`/sections/${id}/restore`),
  resetAllProgress: (sectionIds) => API.post('/sections/reset-progress', { sectionIds }),
}