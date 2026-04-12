import API from './api';

export const questionService = {
  getQuestions: (params = {}) => API.get('/questions', { params }),
  createQuestion: (questionData) => API.post('/questions', questionData),
  updateQuestion: (id, questionData) => API.put(`/questions/${id}`, questionData),
  deleteQuestion: (id) => API.delete(`/questions/${id}`),
  bulkImport: (importData) => API.post('/questions/bulk-import', importData),
  bulkMove: (questionIds, targetSectionId) => API.patch('/questions/bulk-move', { questionIds, targetSectionId }),
  searchQuestions: (query) => API.get('/questions/search', { params: query }),
  exportQuestions: (params = {}) => API.get('/questions/export', { params }),
  toggleBookmark: (id) => API.patch(`/questions/${id}/bookmark`),
};