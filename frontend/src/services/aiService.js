import API from './api'

export const aiService = {
  chat: (message, questionContext, conversationHistory, signal) =>
    API.post('/ai/chat', { message, questionContext, conversationHistory }, { signal }),
  explain: (question, answer) => API.post('/ai/explain', { question, answer }),
  rewrite: (question, answer) => API.post('/ai/rewrite', { question, answer }),
  saveAnswer: (questionId, newAnswer, newQuestion) => API.put(`/ai/save-answer/${questionId}`, { newAnswer, newQuestion }),
}
