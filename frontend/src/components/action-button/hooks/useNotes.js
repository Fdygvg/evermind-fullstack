// src/components/action-button/hooks/useNotes.js
import { useState, useEffect, useCallback } from 'react';

const STORAGE_KEY = 'evermind_global_notes';

const useNotes = () => {
  const [notes, setNotes] = useState([]);

  // Load notes on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        setNotes(JSON.parse(stored));
      }
    } catch (error) {
      console.error('Failed to load notes:', error);
    }
  }, []);

  // Save helpers
  const persistNotes = (newNotes) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newNotes));
    setNotes(newNotes);
  };

  const addNote = useCallback((title, content) => {
    const newNote = {
      id: Date.now().toString(),
      title: title || 'Untitled Note',
      content: content || '',
      lastModified: new Date().toISOString()
    };
    const updated = [newNote, ...notes];
    persistNotes(updated);
    return newNote;
  }, [notes]);

  const updateNote = useCallback((id, updates) => {
    const updated = notes.map(note =>
      note.id === id
        ? { ...note, ...updates, lastModified: new Date().toISOString() }
        : note
    );
    persistNotes(updated);
  }, [notes]);

  const deleteNote = useCallback((id) => {
    const updated = notes.filter(note => note.id !== id);
    persistNotes(updated);
  }, [notes]);

  return {
    notes,
    addNote,
    updateNote,
    deleteNote
  };
};

export default useNotes;