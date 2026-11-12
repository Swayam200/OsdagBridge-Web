/**
 * App.tsx
 *
 * Root component for the OsdagBridge web workbench.
 * Mirrors the top-level layout of osdagbridge.desktop.ui.template_page.
 *
 * Layout structure:
 *   ┌─────────────────────────────────────────────────┐
 *   │ Header (menu bar + viewport toggles)            │
 *   ├────────────┬──────────────────────┬─────────────┤
 *   │ InputDock  │   (app-center)       │ OutputDock  │
 *   │            │                      │             │
 *   │            ├──────────────────────┤             │
 *   │            │ LogDock (bottom-ctr) │             │
 *   └────────────┴──────────────────────┴─────────────┘
 *
 * Modals:
 *   ProjectLocationModal — project location picker (always mounted, hidden until triggered)
 */

import React, { useEffect } from 'react';
import { useBridgeStore } from './store/useBridgeStore';
import { Header } from './components/layout/Header';
import { InputDock } from './components/docks/InputDock';
import { OutputDock } from './components/docks/OutputDock';
import { LogDock } from './components/docks/LogDock';
import { ProjectLocationModal } from './components/dialogs/ProjectLocationModal';
import { InputErrorDialog } from './components/dialogs/InputErrorDialog';
import { MaterialInputsDialog } from './components/dialogs/MaterialInputsDialog';

export default function App() {
  const darkMode = useBridgeStore((s) => s.darkMode);
  const isLogDockOpen = useBridgeStore((s) => s.isLogDockOpen);
  const fetchConstants = useBridgeStore((s) => s.fetchConstants);

  const materialDialog = useBridgeStore(s => s.materialDialog);
  const fetchMaterialCatalogue = useBridgeStore(s => s.fetchMaterialCatalogue);
  useEffect(() => {
    // Information dialogs surface failures and provide Retry without blocking Basic Inputs.
    fetchMaterialCatalogue().catch(() => {});
  }, [fetchMaterialCatalogue]);

  // Fetch backend constants once at application initialization
  useEffect(() => {
    fetchConstants();
  }, [fetchConstants]);

  // Sync the HTML root element's data-theme attribute with the store flag
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', darkMode ? 'dark' : 'light');
    document.documentElement.style.colorScheme = darkMode ? 'dark' : 'light';
  }, [darkMode]);

  return (
    <div
      className="app-root"
      style={{ display: 'flex', flexDirection: 'column', height: '100vh', width: '100vw' }}
    >
      {/* Accessibility: skip-nav link */}
      <a href="#main-workbench" className="skip-link">Skip to workbench</a>

      <Header />

      {/* Three-column workbench: Input | Center (Log) | Output */}
      <div
        id="main-workbench"
        className="app-workbench"
        role="main"
        style={{ display: 'flex', flex: 1, overflow: 'hidden' }}
      >
        <InputDock />

        <div
          className="app-center"
          style={{
            display: 'flex',
            flexDirection: 'column',
            flex: 1,
            overflow: 'hidden',
            minWidth: 0,
            position: 'relative',
          }}
        >
          {/* Main workspace canvas area occupying space above the log dock */}
          <div
            className="main-canvas"
            style={{
              flex: 1,
              minHeight: 0,
              width: '100%',
              position: 'relative',
              overflow: 'hidden',
            }}
          />

          {/* Log Window anchored at bottom of the center workspace */}
          {isLogDockOpen && <LogDock />}
        </div>

        <OutputDock />
      </div>

      {/* Modals — always mounted, revealed by store flags */}
      <ProjectLocationModal />
      <InputErrorDialog />
      {materialDialog && <MaterialInputsDialog key={`${materialDialog.member}:${materialDialog.grade}`} />}
    </div>
  );
}
