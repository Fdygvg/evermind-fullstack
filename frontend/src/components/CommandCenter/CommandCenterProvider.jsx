/**
 * CommandCenterProvider - Main provider component for Command Center
 * Wraps the entire Command Center system and provides context
 */

import React, { useState } from 'react';
import CommandCenterButton from './CommandCenterButton';
import CommandCenterDropdown from './CommandCenterDropdown';
import { WidgetPortal } from './widgets';
import { useCommandCenter } from './hooks';

/**
 * CommandCenterProvider Component
 */
export function CommandCenterProvider({ children, config = {} }) {
  // Initialize command center
  const commandCenter = useCommandCenter(config);

  return (
    <>
      {/* Main app content */}
      {children}

      {/* Command Center UI */}
      <CommandCenterButton />
      <CommandCenterDropdown />

      {/* Widget Portal */}
      <WidgetPortal />
    </>
  );
}

/**
 * Hook to use Command Center context
 */
export function useCommandCenterContext() {
  return useCommandCenter();
}

export default CommandCenterProvider;