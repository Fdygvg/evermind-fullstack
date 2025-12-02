// components/Playground/MiniPlayground.jsx
import React, { useState, useEffect, useRef } from 'react';
import CodeMirror from '@uiw/react-codemirror';
import { html } from '@codemirror/lang-html';
import { css } from '@codemirror/lang-css';
import { javascript } from '@codemirror/lang-javascript';
import { oneDark } from '@codemirror/theme-one-dark';

const MiniPlayground = ({ 
  isOpen, 
  onClose,
  initialHTML = '',
  initialCSS = '',
  initialJS = ''
}) => {
  const [activeTab, setActiveTab] = useState('html');
  const [htmlCode, setHtmlCode] = useState(initialHTML);
  const [cssCode, setCssCode] = useState(initialCSS);
  const [jsCode, setJsCode] = useState(initialJS);
  const [output, setOutput] = useState('');
  const [consoleLogs, setConsoleLogs] = useState([]);
  const iframeRef = useRef(null);

  if (!isOpen) return null;

  // Generate the full HTML document
  const generateFullHTML = () => {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <style>${cssCode}</style>
        </head>
        <body>
          ${htmlCode}
          <script>
            // Override console.log to capture logs
            const originalLog = console.log;
            console.log = (...args) => {
              originalLog(...args);
              window.parent.postMessage({
                type: 'CONSOLE_LOG',
                data: args.map(arg => 
                  typeof arg === 'object' ? JSON.stringify(arg) : String(arg)
                ).join(' ')
              }, '*');
            };
            
            // Error handling
            window.onerror = (msg, url, line, col, error) => {
              window.parent.postMessage({
                type: 'CONSOLE_ERROR',
                data: \`Error: \${msg} at line \${line}:\${col}\`
              }, '*');
            };
            
            // Execute user JS
            try {
              ${jsCode}
            } catch (error) {
              window.parent.postMessage({
                type: 'CONSOLE_ERROR',
                data: \`Execution Error: \${error.message}\`
              }, '*');
            }
          </script>
        </body>
      </html>
    `;
  };

  // Run the code
  const runCode = () => {
    setConsoleLogs([]);
    const fullHTML = generateFullHTML();
    setOutput(fullHTML);
    
    // Clear previous iframe content and reload
    if (iframeRef.current) {
      const iframe = iframeRef.current;
      const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
      iframeDoc.open();
      iframeDoc.write(fullHTML);
      iframeDoc.close();
    }
  };

  // Handle console messages from iframe
  useEffect(() => {
    const handleMessage = (event) => {
      if (event.data.type === 'CONSOLE_LOG') {
        setConsoleLogs(prev => [...prev, { type: 'log', message: event.data.data }]);
      } else if (event.data.type === 'CONSOLE_ERROR') {
        setConsoleLogs(prev => [...prev, { type: 'error', message: event.data.data }]);
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  // Auto-run on first open
  useEffect(() => {
    if (isOpen) {
      setTimeout(runCode, 100);
    }
  }, [isOpen]);

  return (
    <div className="mini-playground-overlay">
      <div className="mini-playground-modal">
        {/* Header */}
        <div className="playground-header">
          <h3>Code Playground</h3>
          <div className="header-controls">
            <button className="run-btn" onClick={runCode}>
              ▶ Run Code
            </button>
            <button className="close-btn" onClick={onClose}>
              ✕ Close
            </button>
          </div>
        </div>

        <div className="playground-content">
          {/* Left: Code Editor */}
          <div className="editor-section">
            {/* Tabs */}
            <div className="code-tabs">
              {['html', 'css', 'js'].map(tab => (
                <button
                  key={tab}
                  className={`tab-btn ${activeTab === tab ? 'active' : ''}`}
                  onClick={() => setActiveTab(tab)}
                >
                  {tab.toUpperCase()}
                </button>
              ))}
            </div>

            {/* Code Editor */}
            <div className="code-editor">
              {activeTab === 'html' && (
                <CodeMirror
                  value={htmlCode}
                  height="300px"
                  theme={oneDark}
                  extensions={[html()]}
                  onChange={setHtmlCode}
                  basicSetup={{
                    lineNumbers: true,
                    highlightActiveLineGutter: true,
                    bracketMatching: true,
                    closeBrackets: true,
                    autocompletion: true,
                    rectangularSelection: true,
                    crosshairCursor: true,
                  }}
                />
              )}
              {activeTab === 'css' && (
                <CodeMirror
                  value={cssCode}
                  height="300px"
                  theme={oneDark}
                  extensions={[css()]}
                  onChange={setCssCode}
                  basicSetup={{
                    lineNumbers: true,
                    highlightActiveLineGutter: true,
                    bracketMatching: true,
                    closeBrackets: true,
                    autocompletion: true,
                  }}
                />
              )}
              {activeTab === 'js' && (
                <CodeMirror
                  value={jsCode}
                  height="300px"
                  theme={oneDark}
                  extensions={[javascript()]}
                  onChange={setJsCode}
                  basicSetup={{
                    lineNumbers: true,
                    highlightActiveLineGutter: true,
                    bracketMatching: true,
                    closeBrackets: true,
                    autocompletion: true,
                  }}
                />
              )}
            </div>
          </div>

          {/* Right: Preview & Console */}
          <div className="preview-section">
            {/* Preview */}
            <div className="preview-pane">
              <h4>Preview</h4>
              <div className="preview-container">
                <iframe
                  ref={iframeRef}
                  title="code-preview"
                  sandbox="allow-scripts allow-same-origin"
                  style={{
                    width: '100%',
                    height: '200px',
                    border: '1px solid #ccc',
                    borderRadius: '4px',
                    background: 'white'
                  }}
                />
              </div>
            </div>

            {/* Console */}
            <div className="console-pane">
              <h4>Console</h4>
              <div className="console-output">
                {consoleLogs.length === 0 ? (
                  <div className="no-logs">No logs yet. Run your code!</div>
                ) : (
                  consoleLogs.map((log, index) => (
                    <div 
                      key={index} 
                      className={`log-entry ${log.type}`}
                    >
                      <span className="log-type">{log.type === 'error' ? '❌' : '📝'}</span>
                      <span className="log-message">{log.message}</span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="playground-footer">
          <div className="shortcuts">
            <kbd>Ctrl/Cmd + S</kbd> to run • 
            <kbd>Esc</kbd> to close
          </div>
        </div>
      </div>
    </div>
  );
};

export default MiniPlayground;