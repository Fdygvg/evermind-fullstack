import React, { useState } from 'react'
import SessionContext from './SessionContextInstance'

export const SessionProvider = ({ children }) => {
  const [activeSession, setActiveSession] = useState(null)
  const [currentQuestion, setCurrentQuestion] = useState(null)

  const value = {
    activeSession,
    setActiveSession,
    currentQuestion, 
    setCurrentQuestion
  }

  return (
    <SessionContext.Provider value={value}>
      {children}
    </SessionContext.Provider>
  )
}