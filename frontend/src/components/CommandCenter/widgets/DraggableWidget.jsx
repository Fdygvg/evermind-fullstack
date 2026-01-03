/**
 * DraggableWidget - Base draggable container for all widgets
 * Handles dragging, resizing, and common widget interactions
 */

import React, { useState, useRef, useEffect } from 'react';
import Draggable from 'react-draggable';
import { ResizableBox } from 'react-resizable';
import 'react-resizable/css/styles.css';

/**
 * Component mapping for dynamic widget rendering
 */
const WIDGET_COMPONENTS = {
  TimerWidget: React.lazy(() => import('./TimerWidget')),
  // Other widgets will be added here
};

/**
 * DraggableWidget Component
 */
export function DraggableWidget({
  widget,
  onClose,
  onMove,
  onResize,
  onMinimize,
}) {
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [showContent, setShowContent] = useState(!widget.isMinimized);
  const nodeRef = useRef(null);
  
  // Update showContent when minimized state changes
  useEffect(() => {
    setShowContent(!widget.isMinimized);
  }, [widget.isMinimized]);
  
  // Handle drag start
  const handleDragStart = () => {
    setIsDragging(true);
  };
  
  // Handle drag stop
  const handleDragStop = (e, data) => {
    setIsDragging(false);
    onMove({ x: data.x, y: data.y });
  };
  
  // Handle resize start
  const handleResizeStart = () => {
    setIsResizing(true);
  };
  
  // Handle resize stop
  const handleResizeStop = (e, { size }) => {
    setIsResizing(false);
    onResize({ width: size.width, height: size.height });
  };
  
  // Handle minimize/maximize
  const handleMinimize = () => {
    setShowContent(!showContent);
    onMinimize();
  };
  
  // Get widget component
  const WidgetComponent = WIDGET_COMPONENTS[widget.component];
  
  // Calculate styles based on state
  const widgetStyles = {
    zIndex: widget.zIndex,
    opacity: isDragging || isResizing ? 0.8 : 1,
    transition: isDragging || isResizing ? 'none' : 'opacity 0.2s',
  };
  
  const headerStyles = {
    cursor: isDragging ? 'grabbing' : 'grab',
    userSelect: 'none',
  };
  
  return (
    <Draggable
      nodeRef={nodeRef}
      position={widget.position}
      onStart={handleDragStart}
      onStop={handleDragStop}
      handle=".widget-header"
      bounds="parent"
      cancel=".widget-controls button, .resize-handle"
    >
      <ResizableBox
        width={widget.size.width}
        height={showContent ? widget.size.height : 40}
        minConstraints={[150, 40]}
        maxConstraints={[600, 800]}
        onResizeStart={handleResizeStart}
        onResizeStop={handleResizeStop}
        handle={
          showContent ? (
            <div className="resize-handle" style={{
              position: 'absolute',
              bottom: 0,
              right: 0,
              width: '20px',
              height: '20px',
              cursor: 'se-resize',
              background: 'linear-gradient(135deg, transparent 50%, #ccc 50%)',
            }} />
          ) : null
        }
        resizeHandles={showContent ? ['se'] : []}
      >
        <div
          ref={nodeRef}
          className="draggable-widget"
          style={{
            ...widgetStyles,
            position: 'absolute',
            width: '100%',
            height: '100%',
            backgroundColor: 'rgba(30, 30, 40, 0.95)',
            backdropFilter: 'blur(10px)',
            borderRadius: '12px',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
            overflow: 'hidden',
            pointerEvents: 'auto',
          }}
        >
          {/* Widget Header */}
          <div
            className="widget-header"
            style={{
              ...headerStyles,
              padding: '10px 12px',
              background: 'linear-gradient(90deg, rgba(50, 50, 70, 0.9), rgba(40, 40, 60, 0.9))',
              borderBottom: showContent ? '1px solid rgba(255, 255, 255, 0.1)' : 'none',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '18px' }}>{widget.icon || '📦'}</span>
              <span style={{ 
                fontWeight: '500', 
                fontSize: '14px',
                color: '#fff',
              }}>
                {widget.title}
              </span>
            </div>
            
            <div className="widget-controls" style={{ display: 'flex', gap: '4px' }}>
              <button
                onClick={handleMinimize}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#ccc',
                  cursor: 'pointer',
                  padding: '4px 8px',
                  borderRadius: '4px',
                  fontSize: '12px',
                }}
                onMouseEnter={(e) => e.target.style.background = 'rgba(255, 255, 255, 0.1)'}
                onMouseLeave={(e) => e.target.style.background = 'transparent'}
              >
                {showContent ? '−' : '+'}
              </button>
              
              <button
                onClick={onClose}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#ff6b6b',
                  cursor: 'pointer',
                  padding: '4px 8px',
                  borderRadius: '4px',
                  fontSize: '14px',
                  fontWeight: 'bold',
                }}
                onMouseEnter={(e) => e.target.style.background = 'rgba(255, 107, 107, 0.2)'}
                onMouseLeave={(e) => e.target.style.background = 'transparent'}
              >
                ×
              </button>
            </div>
          </div>
          
          {/* Widget Content */}
          {showContent && WidgetComponent && (
            <div style={{
              padding: '16px',
              height: 'calc(100% - 45px)',
              overflow: 'auto',
            }}>
              <React.Suspense fallback={
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'center', 
                  alignItems: 'center',
                  height: '100%',
                  color: '#888',
                }}>
                  Loading widget...
                </div>
              }>
                <WidgetComponent
                  widgetId={widget.id}
                  config={widget.config}
                  onClose={onClose}
                />
              </React.Suspense>
            </div>
          )}
          
          {/* Widget Footer (when minimized) */}
          {!showContent && (
            <div style={{
              padding: '10px 12px',
              fontSize: '12px',
              color: '#aaa',
              textAlign: 'center',
            }}>
              {widget.title} (click + to restore)
            </div>
          )}
        </div>
      </ResizableBox>
    </Draggable>
  );
}

/**
 * Helper component for widget boundaries
 */
export function WidgetBoundary({ children, padding = 20 }) {
  const containerRef = useRef(null);
  
  useEffect(() => {
    const updateBoundary = () => {
      if (containerRef.current) {
        const container = containerRef.current;
        const bounds = {
          left: -padding,
          top: -padding,
          right: container.parentElement.offsetWidth - container.offsetWidth + padding,
          bottom: container.parentElement.offsetHeight - container.offsetHeight + padding,
        };
        
        // Update Draggable bounds if needed
        // This would require a ref to the Draggable component
      }
    };
    
    updateBoundary();
    window.addEventListener('resize', updateBoundary);
    
    return () => window.removeEventListener('resize', updateBoundary);
  }, [padding]);
  
  return (
    <div ref={containerRef} style={{ width: '100%', height: '100%' }}>
      {children}
    </div>
  );
}

export default DraggableWidget;