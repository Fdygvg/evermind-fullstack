import API from './api'

export const sessionService = {
  startSession: (data) => API.post('/sessions/start', data),
  getNextQuestion: () => API.get('/sessions/next-question'),
  submitAnswer: (data) => API.post('/sessions/answer', data),
  endSession: () => API.delete('/sessions/current'),
  getCurrentSession: () => API.get('/sessions/current'),
  getActiveSession: () => API.get('/sessions/current'),
  getLastResults: () => API.get('/sessions/last-results'),
  updateProgress: (data) => API.post('/sessions/update-progress', data),
  pauseSession: (sessionId) => API.post('/sessions/pause', sessionId ? { sessionId } : {}),

  // Simplified (Quick Play) session methods
  getSimplifiedSessions: () => API.get('/sessions/simplified'),
  resumeSimplifiedSession: (sessionId) => API.post(`/sessions/simplified/${sessionId}/resume`),
  endSimplifiedSession: (sessionId) => API.delete(`/sessions/simplified/${sessionId}`)
}