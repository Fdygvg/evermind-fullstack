
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import eventBus, { CommandCenterEvents } from '../core/event-bus';

/**
 * Widget state store
 */
export const useWidgetStore = create(
  persist(
    (set, get) => ({
      // ===== STATE =====
      widgets: [],
      nextZIndex: 10000,
      widgetCounter: 0,
      
      // ===== WIDGET MANAGEMENT =====
      
      /**
       * Add a new widget
       */
      addWidget: (widgetConfig) => {
        const widgetId = widgetConfig.id || `widget-${Date.now()}-${get().widgetCounter}`;
        const zIndex = get().nextZIndex;
        
        const widget = {
          id: widgetId,
          type: widgetConfig.type || 'generic',
          title: widgetConfig.title || 'Widget',
          component: widgetConfig.component,
          config: widgetConfig.config || {},
          position: widgetConfig.position || { x: 100, y: 100 },
          size: widgetConfig.size || { width: 220, height: 150 },
          zIndex,
          isMinimized: false,
          isPinned: false,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        };
        
        set((state) => ({
          widgets: [...state.widgets, widget],
          nextZIndex: state.nextZIndex + 1,
          widgetCounter: state.widgetCounter + 1,
        }));
        
        // Emit event
        eventBus.emit(CommandCenterEvents.WIDGET_CREATED, {
          widgetId,
          widget,
          type: widget.type,
        });
        
        return widgetId;
      },
      
      /**
       * Remove a widget
       */
      removeWidget: (widgetId) => {
        set((state) => ({
          widgets: state.widgets.filter(w => w.id !== widgetId),
        }));
        
        // Emit event
        eventBus.emit(CommandCenterEvents.WIDGET_CLOSED, {
          widgetId,
          timestamp: Date.now(),
        });
      },
      
      /**
       * Update widget position
       */
      updateWidgetPosition: (widgetId, position) => {
        set((state) => ({
          widgets: state.widgets.map(w => 
            w.id === widgetId 
              ? { 
                  ...w, 
                  position, 
                  updatedAt: Date.now(),
                  zIndex: state.nextZIndex, // Bring to front
                } 
              : w
          ),
          nextZIndex: state.nextZIndex + 1,
        }));
        
        // Emit event
        eventBus.emit(CommandCenterEvents.WIDGET_MOVED, {
          widgetId,
          position,
          timestamp: Date.now(),
        });
      },
      
      /**
       * Update widget size
       */
      updateWidgetSize: (widgetId, size) => {
        set((state) => ({
          widgets: state.widgets.map(w => 
            w.id === widgetId 
              ? { 
                  ...w, 
                  size, 
                  updatedAt: Date.now(),
                  zIndex: state.nextZIndex,
                } 
              : w
          ),
          nextZIndex: state.nextZIndex + 1,
        }));
        
        // Emit event
        eventBus.emit(CommandCenterEvents.WIDGET_RESIZED, {
          widgetId,
          size,
          timestamp: Date.now(),
        });
      },
      
      /**
       * Update widget configuration
       */
      updateWidgetConfig: (widgetId, configUpdates) => {
        set((state) => ({
          widgets: state.widgets.map(w => 
            w.id === widgetId 
              ? { 
                  ...w, 
                  config: { ...w.config, ...configUpdates },
                  updatedAt: Date.now(),
                } 
              : w
          ),
        }));
      },
      
      /**
       * Toggle minimized state
       */
      toggleWidgetMinimized: (widgetId) => {
        set((state) => ({
          widgets: state.widgets.map(w => 
            w.id === widgetId 
              ? { 
                  ...w, 
                  isMinimized: !w.isMinimized,
                  updatedAt: Date.now(),
                  zIndex: state.nextZIndex,
                } 
              : w
          ),
          nextZIndex: state.nextZIndex + 1,
        }));
      },
      
      /**
       * Bring widget to front
       */
      bringToFront: (widgetId) => {
        set((state) => ({
          widgets: state.widgets.map(w => 
            w.id === widgetId 
              ? { 
                  ...w, 
                  zIndex: state.nextZIndex,
                  updatedAt: Date.now(),
                } 
              : w
          ),
          nextZIndex: state.nextZIndex + 1,
        }));
      },
      
      /**
       * Get a specific widget
       */
      getWidget: (widgetId) => {
        return get().widgets.find(w => w.id === widgetId);
      },
      
      /**
       * Check if widget exists
       */
      hasWidget: (widgetId) => {
        return get().widgets.some(w => w.id === widgetId);
      },
      
      /**
       * Get widgets by type
       */
      getWidgetsByType: (type) => {
        return get().widgets.filter(w => w.type === type);
      },
      
      /**
       * Clear all widgets
       */
      clearAllWidgets: () => {
        set({ widgets: [] });
      },
      
      /**
       * Clear widgets by type
       */
      clearWidgetsByType: (type) => {
        set((state) => ({
          widgets: state.widgets.filter(w => w.type !== type),
        }));
      },
    }),
    {
      name: 'evermind-widget-storage',
      partialize: (state) => ({
        widgets: state.widgets.map(w => ({
          id: w.id,
          type: w.type,
          position: w.position,
          size: w.size,
          isMinimized: w.isMinimized,
          config: w.config,
        })),
      }),
    }
  )
);

/**
 * Hook to easily use widget store
 */
export function useWidgetManager() {
  const store = useWidgetStore();
  
  // Helper to create a timer widget
  const createTimerWidget = (config = {}) => {
    return store.addWidget({
      type: 'timer',
      title: 'Timer',
      component: 'TimerWidget',
      config: {
        duration: config.duration || 30,
        autoScore: config.autoScore || 1,
        ...config,
      },
      position: config.position || { x: window.innerWidth - 250, y: 100 },
      size: { width: 220, height: 140 },
    });
  };
  
  // Helper to create a notes widget
  const createNotesWidget = (config = {}) => {
    return store.addWidget({
      type: 'notes',
      title: 'Notes',
      component: 'NotesWidget',
      config,
      position: config.position || { x: 50, y: 200 },
      size: { width: 300, height: 400 },
    });
  };
  
  return {
    ...store,
    createTimerWidget,
    createNotesWidget,
  };
}

export default useWidgetManager;