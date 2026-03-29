import API from './api'

export const aiService = {
  explain: (question, answer) => API.post('/ai/explain', { question, answer }),
  rewrite: (question, answer) => API.post('/ai/rewrite', { question, answer }),
  saveAnswer: (questionId, newAnswer) => API.put(`/ai/save-answer/${questionId}`, { newAnswer }),
}
