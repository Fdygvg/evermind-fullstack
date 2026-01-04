// src/components/action-button/components/NotesModal.jsx
import React, { useState } from 'react';
import Modal from './shared/Modal';
import Button from './shared/Button';
import useNotes from '../hooks/useNotes';
import { FaPlus, FaTrash, FaChevronLeft, FaPen } from 'react-icons/fa';
import '../styles/NotesModal.css';

const NotesModal = ({ isOpen, onClose }) => {
  const { notes, addNote, updateNote, deleteNote } = useNotes();
  const [view, setView] = useState('list'); // 'list' or 'editor'
  const [activeNote, setActiveNote] = useState(null);

  // Editor State
  const [editTitle, setEditTitle] = useState('');
  const [editContent, setEditContent] = useState('');

  const handleCreateNew = () => {
    setEditTitle('');
    setEditContent('');
    setActiveNote(null);
    setView('editor');
  };

  const handleEdit = (note) => {
    setActiveNote(note);
    setEditTitle(note.title);
    setEditContent(note.content);
    setView('editor');
  };

  const handleSave = () => {
    if (!editTitle.trim() && !editContent.trim()) {
      setView('list');
      return;
    }

    const title = editTitle.trim() || 'Untitled Note';

    if (activeNote) {
      updateNote(activeNote.id, { title, content: editContent });
    } else {
      addNote(title, editContent);
    }
    setView('list');
  };

  const handleDelete = (e, id) => {
    e.stopPropagation();
    if (window.confirm('Delete this note?')) {
      deleteNote(id);
    }
  };

  const handleClose = () => {
    // Reset state on close
    setView('list');
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title={view === 'list' ? "My Notes" : (activeNote ? "Edit Note" : "New Note")}>
      <div className="notes-modal">

        {/* LIST VIEW */}
        {view === 'list' && (
          <div className="notes-list-view">
            <div className="notes-list">
              {notes.length === 0 ? (
                <div className="notes-empty-state">
                  <p>No notes yet</p>
                  <Button variant="primary" onClick={handleCreateNew}>
                    <FaPlus /> Create First Note
                  </Button>
                  <p className="sub-text">Notes are saved locally and persist between sessions.</p>
                </div>
              ) : (
                notes.map(note => (
                  <div key={note.id} className="note-item" onClick={() => handleEdit(note)}>
                    <div className="note-info">
                      <h4 className="note-title">{note.title}</h4>
                      <p className="note-preview">
                        {note.content.substring(0, 60) || <em>No content</em>}
                        {note.content.length > 60 ? '...' : ''}
                      </p>
                      <span className="note-date">
                        {new Date(note.lastModified).toLocaleDateString()}
                      </span>
                    </div>
                    <button
                      className="note-delete-btn"
                      onClick={(e) => handleDelete(e, note.id)}
                      title="Delete"
                    >
                      <FaTrash />
                    </button>
                  </div>
                ))
              )}
            </div>

            {notes.length > 0 && (
              <div className="notes-fab-actions">
                <Button variant="primary" onClick={handleCreateNew} className="create-btn">
                  <FaPlus /> New Note
                </Button>
              </div>
            )}
          </div>
        )}

        {/* EDITOR VIEW */}
        {view === 'editor' && (
          <div className="notes-editor-view">
            <input
              type="text"
              className="note-title-input"
              placeholder="Note Title"
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              autoFocus
            />

            <textarea
              className="notes-textarea"
              placeholder="Start typing..."
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              rows={12}
            />

            <div className="notes-actions">
              <Button variant="outline" onClick={() => setView('list')}>
                <FaChevronLeft /> Back
              </Button>
              <Button variant="primary" onClick={handleSave}>
                Save Note
              </Button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};

export default NotesModal;