/**
 * useWidgets - Hook for widget-specific state management
 */

import { useState, useCallback, useEffect } from 'react';
import eventBus, { CommandCenterEvents } from '../core/event-bus';

/**
 * Hook for managing widget state and positioning
 */
export function useWidgets(initialWidgets = []) {
  const [widgets, setWidgets] = useState(initialWidgets);
  const [zIndexCounter, setZIndexCounter] = useState(10000);
  
  // Add a new widget
  const addWidget = useCallback((widgetConfig) => {
    const widgetId = widgetConfig.id || `widget-${Date.now()}`;
    const zIndex = zIndexCounter + 1;
    
    const widget = {
      id: widgetId,
      zIndex,
      isMinimized: false,
      isPinned: false,
      position: widgetConfig.position || { x: 100, y: 100 },
      size: widgetConfig.size || { width: 200, height: 150 },
      createdAt: Date.now(),
      lastInteraction: Date.now(),
      ...widgetConfig,
    };
    
    setWidgets(prev => [...prev, widget]);
    setZIndexCounter(zIndex);
    
    eventBus.emit(CommandCenterEvents.WIDGET_CREATED, {
      widgetId,
      widget,
    });
    
    return widgetId;
  }, [zIndexCounter]);
  
  // Remove a widget
  const removeWidget = useCallback((widgetId) => {
    setWidgets(prev => prev.filter(w => w.id !== widgetId));
    
    eventBus.emit(CommandCenterEvents.WIDGET_CLOSED, {
      widgetId,
      timestamp: Date.now(),
    });
  }, []);
  
  // Update widget position
  const updateWidgetPosition = useCallback((widgetId, position) => {
    setWidgets(prev => 
      prev.map(w => 
        w.id === widgetId 
          ? { 
              ...w, 
              position, 
              lastInteraction: Date.now(),
              zIndex: zIndexCounter + 1, // Bring to front
            } 
          : w
      )
    );
    
    setZIndexCounter(prev => prev + 1);
    
    eventBus.emit(CommandCenterEvents.WIDGET_MOVED, {
      widgetId,
      position,
      timestamp: Date.now(),
    });
  }, [zIndexCounter]);
  
  // Update widget size
  const updateWidgetSize = useCallback((widgetId, size) => {
    setWidgets(prev => 
      prev.map(w => 
        w.id === widgetId 
          ? { 
              ...w, 
              size, 
              lastInteraction: Date.now(),
              zIndex: zIndexCounter + 1,
            } 
          : w
      )
    );
    
    setZIndexCounter(prev => prev + 1);
    
    eventBus.emit(CommandCenterEvents.WIDGET_RESIZED, {
      widgetId,
      size,
      timestamp: Date.now(),
    });
  }, [zIndexCounter]);
  
  // Toggle widget minimized state
  const toggleWidgetMinimized = useCallback((widgetId) => {
    setWidgets(prev => 
      prev.map(w => 
        w.id === widgetId 
          ? { 
              ...w, 
              isMinimized: !w.isMinimized,
              lastInteraction: Date.now(),
              zIndex: zIndexCounter + 1,
            } 
          : w
      )
    );
    
    setZIndexCounter(prev => prev + 1);
  }, [zIndexCounter]);
  
  // Bring widget to front
  const bringToFront = useCallback((widgetId) => {
    const newZIndex = zIndexCounter + 1;
    
    setWidgets(prev => 
      prev.map(w => 
        w.id === widgetId 
          ? { ...w, zIndex: newZIndex, lastInteraction: Date.now() }
          : w
      )
    );
    
    setZIndexCounter(newZIndex);
  }, [zIndexCounter]);
  
  // Save widget positions to localStorage
  const saveWidgetPositions = useCallback(() => {
    const positions = widgets.reduce((acc, widget) => {
      acc[widget.id] = {
        position: widget.position,
        size: widget.size,
        isMinimized: widget.isMinimized,
      };
      return acc;
    }, {});
    
    try {
      localStorage.setItem('evermind-widget-positions', JSON.stringify(positions));
      return true;
    } catch (error) {
      console.warn('Failed to save widget positions:', error);
      return false;
    }
  }, [widgets]);
  
  // Load widget positions from localStorage
  const loadWidgetPositions = useCallback(() => {
    try {
      const saved = localStorage.getItem('evermind-widget-positions');
      if (saved) {
        const positions = JSON.parse(saved);
        
        setWidgets(prev => 
          prev.map(widget => {
            const savedData = positions[widget.id];
            if (savedData) {
              return {
                ...widget,
                position: savedData.position || widget.position,
                size: savedData.size || widget.size,
                isMinimized: savedData.isMinimized || false,
              };
            }
            return widget;
          })
        );
        
        return true;
      }
    } catch (error) {
      console.warn('Failed to load widget positions:', error);
    }
    
    return false;
  }, []);
  
  // Auto-save positions when widgets change
  useEffect(() => {
    const saveTimeout = setTimeout(() => {
      saveWidgetPositions();
    }, 1000);
    
    return () => clearTimeout(saveTimeout);
  }, [widgets, saveWidgetPositions]);
  
  // Load positions on mount
  useEffect(() => {
    loadWidgetPositions();
  }, [loadWidgetPositions]);
  
  // Clear all widgets
  const clearAllWidgets = useCallback(() => {
    setWidgets([]);
  }, []);
  
  // Get a specific widget
  const getWidget = useCallback((widgetId) => {
    return widgets.find(w => w.id === widgetId);
  }, [widgets]);
  
  // Check if widget exists
  const hasWidget = useCallback((widgetId) => {
    return widgets.some(w => w.id === widgetId);
  }, [widgets]);
  
  return {
    // State
    widgets,
    
    // Widget Management
    addWidget,
    removeWidget,
    updateWidgetPosition,
    updateWidgetSize,
    toggleWidgetMinimized,
    bringToFront,
    clearAllWidgets,
    getWidget,
    hasWidget,
    
    // Persistence
    saveWidgetPositions,
    loadWidgetPositions,
  };
}

export default useWidgets;