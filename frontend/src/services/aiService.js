import API from './api'

export const aiService = {
  chat: (message, questionContext, conversationHistory) =>
    API.post('/ai/chat', { message, questionContext, conversationHistory }),
  explain: (question, answer) => API.post('/ai/explain', { question, answer }),
  rewrite: (question, answer) => API.post('/ai/rewrite', { question, answer }),
  saveAnswer: (questionId, newAnswer) => API.put(`/ai/save-answer/${questionId}`, { newAnswer }),
}
