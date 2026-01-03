/**
 * WidgetPortal - Renders all widgets at the root level using React Portal
 * Ensures widgets float above all other content
 */

import React, { useEffect } from 'react';
import ReactDOM from 'react-dom';
import { useWidgetStore } from './WidgetManager';
import DraggableWidget from './DraggableWidget';

/**
 * Creates a portal container if it doesn't exist
 */
function createPortalContainer() {
  let container = document.getElementById('evermind-widget-portal');
  
  if (!container) {
    container = document.createElement('div');
    container.id = 'evermind-widget-portal';
    container.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      pointer-events: none;
      z-index: 10000;
      overflow: hidden;
    `;
    document.body.appendChild(container);
  }
  
  return container;
}

/**
 * WidgetPortal Component
 */
export function WidgetPortal() {
  const widgets = useWidgetStore((state) => state.widgets);
  const removeWidget = useWidgetStore((state) => state.removeWidget);
  const updateWidgetPosition = useWidgetStore((state) => state.updateWidgetPosition);
  const updateWidgetSize = useWidgetStore((state) => state.updateWidgetSize);
  const toggleWidgetMinimized = useWidgetStore((state) => state.toggleWidgetMinimized);
  
  // Create portal container on mount
  useEffect(() => {
    const container = createPortalContainer();
    
    // Cleanup on unmount
    return () => {
      // Don't remove container - it's shared
    };
  }, []);
  
  // If no widgets, don't render anything
  if (widgets.length === 0) {
    return null;
  }
  
  const container = document.getElementById('evermind-widget-portal');
  
  if (!container) {
    console.error('Widget portal container not found');
    return null;
  }
  
  return ReactDOM.createPortal(
    <>
      {widgets.map((widget) => (
        <DraggableWidget
          key={widget.id}
          widget={widget}
          onClose={() => removeWidget(widget.id)}
          onMove={(position) => updateWidgetPosition(widget.id, position)}
          onResize={(size) => updateWidgetSize(widget.id, size)}
          onMinimize={() => toggleWidgetMinimized(widget.id)}
        />
      ))}
    </>,
    container
  );
}

/**
 * Hook to use widget portal functionality
 */
export function useWidgetPortal() {
  const container = createPortalContainer();
  
  const addWidgetToPortal = (widgetElement, widgetId) => {
    // This would be used for dynamic widget rendering
    // For now, we use the store-based approach
    console.log('Dynamic widget rendering not implemented yet');
  };
  
  const removeWidgetFromPortal = (widgetId) => {
    // Dynamic removal
  };
  
  return {
    container,
    addWidgetToPortal,
    removeWidgetFromPortal,
  };
}

export default WidgetPortal;