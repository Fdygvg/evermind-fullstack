import API from './api';

export const questionService = {
  getQuestions: (params = {}) => API.get('/questions', { params }),
  createQuestion: (questionData) => API.post('/questions', questionData),
  updateQuestion: (id, questionData) => API.put(`/questions/${id}`, questionData),
  deleteQuestion: (id) => API.delete(`/questions/${id}`),
  bulkImport: (importData) => API.post('/questions/bulk-import', importData),
  searchQuestions: (query) => API.get('/questions/search', { params: query }),
};