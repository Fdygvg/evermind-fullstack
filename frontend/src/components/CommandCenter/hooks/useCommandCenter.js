/**
 * useCommandCenter - Main hook for Command Center state management
 */

import { useState, useCallback, useEffect } from 'react';
import eventBus, { CommandCenterEvents } from '../core/event-bus';
import { getFeatures, isFeatureAvailable } from '../core/FeatureRegistry';

/**
 * Main Command Center hook
 */
export function useCommandCenter(config = {}) {
  // State
  const [isOpen, setIsOpen] = useState(config.isOpen || false);
  const [position, setPosition] = useState(
    config.position || { x: 20, y: 20 }
  );
  const [activeWidgets, setActiveWidgets] = useState([]);
  const [availableFeatures, setAvailableFeatures] = useState([]);
  const [userPermissions, setUserPermissions] = useState(
    config.permissions || ['has-active-session']
  );

  // Initialize available features based on permissions
  useEffect(() => {
    const features = getFeatures({
      enabledOnly: true,
      permissions: userPermissions,
    });

    setAvailableFeatures(features);
  }, [userPermissions]);

  // Handle auto-launch widgets from config
  useEffect(() => {
    if (config.autoLaunchWidgets && activeWidgets.length === 0) {
      config.autoLaunchWidgets.forEach(widgetId => {
        // Find feature description
        const features = getFeatures();
        const feature = features.find(f => f.id === widgetId);

        if (feature) {
          addWidget({
            id: `${widgetId}-${Date.now()}`,
            type: widgetId,
            title: feature.label,
            featureId: widgetId,
            config: feature.config || {},
          });
        }
      });
    }
  }, [config.autoLaunchWidgets]);

  // Open/close handlers
  const open = useCallback(() => {
    setIsOpen(true);
    eventBus.emit(CommandCenterEvents.COMMAND_CENTER_OPENED, {
      timestamp: Date.now(),
      position,
    });
  }, [position]);

  const close = useCallback(() => {
    setIsOpen(false);
    eventBus.emit(CommandCenterEvents.COMMAND_CENTER_CLOSED, {
      timestamp: Date.now(),
    });
  }, []);

  const toggle = useCallback(() => {
    if (isOpen) {
      close();
    } else {
      open();
    }
  }, [isOpen, open, close]);

  // Position management
  const updatePosition = useCallback((newPosition) => {
    setPosition(newPosition);

    // Save to localStorage (would be in a real app)
    try {
      localStorage.setItem('command-center-position', JSON.stringify(newPosition));
    } catch (error) {
      console.warn('Failed to save position:', error);
    }
  }, []);

  // Widget management
  const addWidget = useCallback((widgetConfig) => {
    const widgetId = widgetConfig.id || `widget-${Date.now()}`;

    const widget = {
      id: widgetId,
      createdAt: Date.now(),
      ...widgetConfig,
    };

    setActiveWidgets(prev => [...prev, widget]);

    eventBus.emit(CommandCenterEvents.WIDGET_CREATED, {
      widgetId,
      type: widgetConfig.type,
      config: widgetConfig,
    });

    return widgetId;
  }, []);

  const removeWidget = useCallback((widgetId) => {
    setActiveWidgets(prev => prev.filter(w => w.id !== widgetId));

    eventBus.emit(CommandCenterEvents.WIDGET_CLOSED, {
      widgetId,
      timestamp: Date.now(),
    });
  }, []);

  const updateWidget = useCallback((widgetId, updates) => {
    setActiveWidgets(prev =>
      prev.map(w =>
        w.id === widgetId ? { ...w, ...updates, updatedAt: Date.now() } : w
      )
    );
  }, []);

  const clearAllWidgets = useCallback(() => {
    setActiveWidgets([]);
  }, []);

  // Feature execution
  const executeFeature = useCallback((featureId, context = {}) => {
    const feature = availableFeatures.find(f => f.id === featureId);

    if (!feature) {
      console.warn(`Feature ${featureId} not found or not available`);
      return null;
    }

    // Check if feature is available with current permissions
    if (!isFeatureAvailable(featureId, userPermissions)) {
      console.warn(`Feature ${featureId} is not available with current permissions`);
      return null;
    }

    // Emit feature selected event
    eventBus.emit(CommandCenterEvents.FEATURE_SELECTED, {
      featureId,
      feature,
      context,
      timestamp: Date.now(),
    });

    // Handle different feature types
    let result = null;

    switch (feature.type) {
      case 'instant':
        // For now, just log - in real app would dispatch to store
        console.log(`Executing instant feature: ${featureId}`, { feature, context });
        result = { type: 'instant', featureId, executed: true };
        break;

      case 'widget':
        // Create a widget
        {
          const widgetId = addWidget({
            id: `${featureId}-${Date.now()}`,
            type: featureId,
            title: feature.label,
            featureId,
            config: { ...feature.config, ...context },
          });
          result = { type: 'widget', featureId, widgetId };
          break;
        }
      case 'modal':
        // Would open a modal in real implementation
        console.log(`Opening modal for feature: ${featureId}`);
        result = { type: 'modal', featureId, context };
        break;

      case 'toggle':
        // Toggle state
        console.log(`Toggling feature: ${featureId}`);
        result = { type: 'toggle', featureId, context };
        break;

      default:
        console.warn(`Unknown feature type: ${feature.type}`);
    }

    // Close dropdown after selection
    close();

    return result;
  }, [availableFeatures, userPermissions, addWidget, close]);

  // Permission management
  const addPermission = useCallback((permission) => {
    setUserPermissions(prev =>
      prev.includes(permission) ? prev : [...prev, permission]
    );
  }, []);

  const removePermission = useCallback((permission) => {
    setUserPermissions(prev => prev.filter(p => p !== permission));
  }, []);

  const hasPermission = useCallback((permission) => {
    return userPermissions.includes(permission);
  }, [userPermissions]);

  // Listen to session events to update permissions
  useEffect(() => {
    const handleSessionStarted = () => {
      addPermission('has-active-session');
      addPermission('session-started');
    };

    const handleSessionEnded = () => {
      removePermission('has-active-session');
      removePermission('session-started');
      clearAllWidgets(); // Clean up widgets when session ends
    };

    const handleQuestionsLoaded = (data) => {
      if (data.count > 0) {
        addPermission('has-questions');
      } else {
        removePermission('has-questions');
      }
    };

    // Subscribe to session events
    const unsubscribeStarted = eventBus.on(
      CommandCenterEvents.SESSION_STARTED,
      handleSessionStarted
    );

    const unsubscribeEnded = eventBus.on(
      CommandCenterEvents.SESSION_ENDED,
      handleSessionEnded
    );

    const unsubscribeQuestions = eventBus.on(
      'questions:loaded',
      handleQuestionsLoaded
    );

    return () => {
      unsubscribeStarted();
      unsubscribeEnded();
      unsubscribeQuestions();
    };
  }, [addPermission, removePermission, clearAllWidgets]);

  // Return public API
  return {
    // State
    isOpen,
    position,
    activeWidgets,
    availableFeatures,
    userPermissions,

    // Controls
    open,
    close,
    toggle,

    // Position
    updatePosition,

    // Widget Management
    addWidget,
    removeWidget,
    updateWidget,
    clearAllWidgets,

    // Feature Management
    executeFeature,

    // Permissions
    addPermission,
    removePermission,
    hasPermission,
  };
}

export default useCommandCenter;