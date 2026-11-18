/**
 * App.tsx
 * Root workbench layout styled with Tailwind CSS utility classes.
 */

import React, { useEffect } from 'react';
import { useBridgeStore } from './store/useBridgeStore';
import { Header } from './components/layout/Header';
import { InputDock } from './components/docks/InputDock';
import { OutputDock } from './components/docks/OutputDock';
import { LogDock } from './components/docks/LogDock';
import { ProjectLocationModal } from './components/dialogs/ProjectLocationModal';
import { InputErrorDialog } from './components/dialogs/InputErrorDialog';
import { AdditionalInputsModal } from './components/dialogs/additional-inputs';

export default function App() {
  const darkMode = useBridgeStore((s) => s.darkMode);
  const isLogDockOpen = useBridgeStore((s) => s.isLogDockOpen);
  const fetchConstants = useBridgeStore((s) => s.fetchConstants);

  useEffect(() => {
    fetchConstants();
  }, [fetchConstants]);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', darkMode ? 'dark' : 'light');
    document.documentElement.style.colorScheme = darkMode ? 'dark' : 'light';
  }, [darkMode]);

  return (
    <div className="flex flex-col h-screen w-screen border border-[var(--accent-border)] box-border bg-[var(--bg-app)] text-[var(--text-main)] overflow-hidden select-none">
      {/* Accessibility: skip-nav link */}
      <a
        href="#main-workbench"
        className="sr-only focus:not-sr-only focus:absolute focus:left-2 focus:top-2 focus:z-[2000] focus:bg-[var(--accent-osdag)] focus:text-white focus:px-2.5 focus:py-1.5 focus:rounded text-xs font-semibold"
      >
        Skip to workbench
      </a>

      <Header />

      {/* Three-column workbench: Input | Center (Log) | Output */}
      <div id="main-workbench" className="flex flex-1 overflow-hidden" role="main">
        <InputDock />

        <div className="flex flex-col flex-1 overflow-hidden min-w-0 relative">
          {/* Main workspace canvas area */}
          <div className="flex-1 min-h-0 w-full relative overflow-hidden bg-[var(--bg-viewport)]" />

          {/* Log Window anchored at bottom of the center workspace */}
          {isLogDockOpen && <LogDock />}
        </div>

        <OutputDock />
      </div>

      {/* Modals */}
      <ProjectLocationModal />
      <InputErrorDialog />
      <AdditionalInputsModal />
    </div>
  );
}
