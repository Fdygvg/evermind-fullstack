// components/TerminalEffect.jsx
import React, { useState, useEffect } from 'react';
import { Terminal } from 'lucide-react';

const TerminalEffect = () => {
  const [lines, setLines] = useState([]);
  const [currentLine, setCurrentLine] = useState('');
  const [currentCommand, setCurrentCommand] = useState(0);
  
  const commands = [
    '$ evermind init --tech-stack=react',
    'Initializing React learning deck...',
    '✓ Imported 50+ React hooks flashcards',
    '✓ Added 30 React pattern examples',
    '✓ Configured daily review schedule',
    '',
    '$ evermind review --today',
    '🔍 Finding cards due for review...',
    '📚 15 cards ready (7 new, 8 review)',
    '🎯 Estimated time: 12 minutes',
    '',
    'Ready to start? [Y/n]'
  ];

  useEffect(() => {
    if (currentCommand < commands.length) {
      const timer = setTimeout(() => {
        const command = commands[currentCommand];
        if (currentLine.length < command.length) {
          setCurrentLine(command.substring(0, currentLine.length + 1));
        } else {
          setLines(prev => [...prev, currentLine]);
          setCurrentLine('');
          setCurrentCommand(prev => prev + 1);
        }
      }, currentLine.length === 0 ? 500 : 50);
      
      return () => clearTimeout(timer);
    }
  }, [currentCommand, currentLine, commands]);

  return (
    <div className="terminal-effect">
      <div className="terminal-header">
        <div className="terminal-dots">
          <span className="dot red"></span>
          <span className="dot yellow"></span>
          <span className="dot green"></span>
        </div>
        <span className="terminal-title">
          <Terminal size={14} />
          evermind-cli
        </span>
      </div>
      <div className="terminal-content">
        {lines.map((line, index) => (
          <div key={index} className="terminal-line">
            {line.startsWith('✓') ? (
              <span style={{ color: '#00ff00' }}>{line}</span>
            ) : line.startsWith('🔍') || line.startsWith('📚') || line.startsWith('🎯') ? (
              <span style={{ color: '#ffff00' }}>{line}</span>
            ) : line.startsWith('$') ? (
              <span style={{ color: '#0000ff' }}>{line}</span>
            ) : (
              <span>{line}</span>
            )}
          </div>
        ))}
        <div className="terminal-line">
          {currentLine}
          <span className="blinking-cursor">█</span>
        </div>
      </div>
    </div>
  );
};

export default TerminalEffect;