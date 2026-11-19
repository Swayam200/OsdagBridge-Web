/**
 * Header.tsx
 * Application menu bar styled with Tailwind CSS utility classes.
 */

import React, { useEffect, useRef, useState } from 'react';
import { useBridgeStore } from '../../store/useBridgeStore';

type MenuItem = {
  label?: string;
  shortcut?: string;
  action?: () => void;
  separator?: boolean;
  submenu?: MenuItem[];
};

type ViewControl = {
  key: string;
  tooltip: string;
  active: boolean;
  activeIcon: string;
  inactiveIcon: string;
  onClick: () => void;
};

const VIEW_BTN_BASE = '/vectors/view_btn';

const MenuDropdown: React.FC<{
  title: string;
  items: MenuItem[];
  open: boolean;
  onToggle: () => void;
  onClose: () => void;
}> = ({ title, items, open, onToggle, onClose }) => {
  const renderItems = (list: MenuItem[]): React.ReactNode =>
    list.map((item, idx) => {
      if (item.separator) {
        return <div key={`sep-${idx}`} role="separator" className="h-px bg-border-subtle my-1 mx-0.5" />;
      }
      if (item.submenu) {
        return (
          <div key={item.label} className="relative group">
            <button
              type="button"
              className="flex items-center justify-between gap-6 w-full bg-transparent border-0 text-main text-xs py-1.5 px-3.5 text-left cursor-pointer hover:bg-accent hover:text-white"
              role="menuitem"
              aria-haspopup="true"
            >
              <span>{item.label}</span>
              <span className="text-xs">▸</span>
            </button>
            <div
              className="absolute top-[-3px] left-full min-w-[170px] bg-surface border border-accent shadow-md py-0.5 z-[1100] hidden group-hover:block"
              role="menu"
            >
              {renderItems(item.submenu)}
            </div>
          </div>
        );
      }
      return (
        <button
          key={item.label}
          type="button"
          className="flex items-center justify-between gap-6 w-full bg-transparent border-0 text-main text-xs py-1.5 px-3.5 text-left cursor-pointer hover:bg-accent hover:text-white"
          role="menuitem"
          onClick={() => {
            item.action?.();
            onClose();
          }}
        >
          <span>{item.label}</span>
          {item.shortcut && <span className="text-[11px] opacity-70">{item.shortcut}</span>}
        </button>
      );
    });

  return (
    <div className="relative">
      <button
        type="button"
        className={`bg-transparent border-0 text-header-text text-xs px-2.5 py-1 cursor-pointer rounded-none hover:bg-surface select-none ${
          open ? 'bg-surface text-main' : ''
        }`}
        aria-haspopup="true"
        aria-expanded={open}
        onClick={onToggle}
      >
        {title}
      </button>
      {open && (
        <div
          className="absolute top-full left-0 min-w-[220px] bg-surface border border-accent shadow-md py-0.5 z-[1100]"
          role="menu"
          aria-label={title}
        >
          {renderItems(items)}
        </div>
      )}
    </div>
  );
};

export const Header: React.FC = () => {
  const {
    activeViewportTab,
    setActiveViewportTab,
    showCrossSection,
    showTopView,
    toggleCrossSection,
    toggleTopView,
    toggleCad3dView,
    togglePlotsView,
    isLogDockOpen,
    toggleLogDock,
    isDockCollapsed,
    toggleDock,
    isOutputDockCollapsed,
    toggleOutputDock,
    resetInputs,
    saveInputs,
    loadInputs,
    saveLogs,
    export3DModel,
    exportCadImage,
    setReportModalOpen,
    darkMode,
    toggleDarkMode,
    runDesign,
  } = useBridgeStore();

  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const headerRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (headerRef.current && !headerRef.current.contains(e.target as Node)) {
        setOpenMenu(null);
      }
    };
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
        e.preventDefault();
        saveInputs();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [saveInputs]);

  const menus: { title: string; items: MenuItem[] }[] = [
    {
      title: 'File',
      items: [
        { label: 'Load Input',           shortcut: 'Ctrl+L',   action: loadInputs },
        { separator: true },
        { label: 'Save Input',           shortcut: 'Ctrl+S',   action: saveInputs },
        { label: 'Save Log Messages',    shortcut: 'Alt+M',    action: saveLogs },
        { label: 'Create Design Report', shortcut: 'Alt+C',    action: () => setReportModalOpen(true) },
        { separator: true },
        { label: 'Save 3D Model',        shortcut: 'Alt+3',    action: () => export3DModel('stp') },
        { label: 'Save CAD Image',       shortcut: 'Alt+I',    action: exportCadImage },
        { separator: true },
        { label: 'Quit',                 shortcut: 'Shift+Q',  action: () => window.close() },
      ],
    },
    {
      title: 'Graphics',
      items: [
        { label: 'Zoom In',              shortcut: 'Ctrl+I' },
        { label: 'Zoom Out',             shortcut: 'Ctrl+O' },
        { label: 'Pan',                  shortcut: 'Ctrl+P' },
        { label: 'Rotate 3D Model',      shortcut: 'Ctrl+R' },
        { separator: true },
        { label: 'Show Front View',      shortcut: 'Alt+Shift+F' },
        { label: 'Show Top View',        shortcut: 'Alt+Shift+T', action: () => setActiveViewportTab('plan') },
        { label: 'Show Side View',       shortcut: 'Alt+Shift+S' },
      ],
    },
    {
      title: 'Database',
      items: [
        { label: 'Save Inputs (.csv)' },
        { label: 'Save Outputs (.csv)' },
        { label: 'Save Inputs (.osi)',   action: saveInputs },
        {
          label: 'Download Database',
          submenu: [
            { label: 'Column' },
            { label: 'Beam' },
            { label: 'Channel' },
            { label: 'Angle' },
          ],
        },
        { separator: true },
        { label: 'Reset',               shortcut: 'Alt+R',    action: resetInputs },
      ],
    },
    {
      title: 'Help',
      items: [
        { label: 'Video Tutorials' },
        { label: 'Design Examples' },
        { separator: true },
        { label: 'Ask Us a Question' },
        { label: 'About Osdag' },
        { separator: true },
        { label: 'Check For Update' },
      ],
    },
  ];

  const viewControls: ViewControl[] = [
    {
      key: 'cross_section',
      tooltip: 'Toggle Cross-Section View',
      active: activeViewportTab !== '3d' && activeViewportTab !== 'plots' && showCrossSection,
      activeIcon:   `${VIEW_BTN_BASE}/cross_section_active.svg`,
      inactiveIcon: `${VIEW_BTN_BASE}/cross_section_inactive.svg`,
      onClick: toggleCrossSection,
    },
    {
      key: 'top_view',
      tooltip: 'Toggle Top View',
      active: activeViewportTab !== '3d' && activeViewportTab !== 'plots' && showTopView,
      activeIcon:   `${VIEW_BTN_BASE}/top_view_active.svg`,
      inactiveIcon: `${VIEW_BTN_BASE}/top_view_inactive.svg`,
      onClick: toggleTopView,
    },
    {
      key: 'logs_dock',
      tooltip: 'Toggle Log Dock',
      active: isLogDockOpen,
      activeIcon:   `${VIEW_BTN_BASE}/logs_dock_active.svg`,
      inactiveIcon: `${VIEW_BTN_BASE}/logs_dock_inactive.svg`,
      onClick: () => toggleLogDock(),
    },
    {
      key: '3d_cad',
      tooltip: 'Toggle 3D CAD View',
      active: activeViewportTab === '3d',
      activeIcon:   `${VIEW_BTN_BASE}/3d_cad_active.svg`,
      inactiveIcon: `${VIEW_BTN_BASE}/3d_cad_inactive.svg`,
      onClick: toggleCad3dView,
    },
    {
      key: 'plots',
      tooltip: 'Toggle Plots View',
      active: activeViewportTab === 'plots',
      activeIcon:   `${VIEW_BTN_BASE}/plots_active.svg`,
      inactiveIcon: `${VIEW_BTN_BASE}/plots_inactive.svg`,
      onClick: togglePlotsView,
    },
    {
      key: 'input_dock',
      tooltip: 'Toggle Input Dock',
      active: !isDockCollapsed,
      activeIcon:   `${VIEW_BTN_BASE}/input_dock_active.svg`,
      inactiveIcon: `${VIEW_BTN_BASE}/input_dock_inactive.svg`,
      onClick: toggleDock,
    },
    {
      key: 'output_dock',
      tooltip: 'Toggle Output Dock',
      active: !isOutputDockCollapsed,
      activeIcon:   `${VIEW_BTN_BASE}/output_dock_active.svg`,
      inactiveIcon: `${VIEW_BTN_BASE}/output_dock_inactive.svg`,
      onClick: toggleOutputDock,
    },
  ];

  return (
    <header
      ref={headerRef}
      role="banner"
      className="app-header min-h-[28px] md:h-7 flex flex-col md:flex-row md:items-center justify-between gap-1 md:gap-2 px-2 py-1 md:py-0 bg-header text-header-text border-b border-header-border relative z-[1000] select-none box-border"
    >
      {/* Brand / Logo Area + Menus (Row 1 on mobile, left on desktop) */}
      <div className="flex items-center gap-1 sm:gap-2 shrink-0 overflow-visible">
        <div className="flex items-center gap-1.5 pr-1.5 sm:pr-2 shrink-0">
          <img src="/vectors/Osdag_logo.svg" alt="Osdag" width={20} height={20} />
          <span className="text-xs font-bold text-header-text tracking-[0.02em]">OsdagBridge</span>
        </div>

        {/* Application Menu Bar */}
        <nav aria-label="Application menu" className="flex items-center gap-0 shrink-0">
          {menus.map((menu) => (
            <MenuDropdown
              key={menu.title}
              title={menu.title}
              items={menu.items}
              open={openMenu === menu.title}
              onToggle={() => setOpenMenu(openMenu === menu.title ? null : menu.title)}
              onClose={() => setOpenMenu(null)}
            />
          ))}
        </nav>
      </div>

      {/* Viewport Controls + Theme + Design Quick-Action (Row 2 on mobile, right on desktop) */}
      <div className="flex items-center gap-1.5 sm:gap-2 shrink-0 overflow-x-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden py-0.5 md:py-0 md:ml-auto">
        {viewControls.map((ctrl) => (
          <button
            key={ctrl.key}
            id={`btn_${ctrl.key}`}
            type="button"
            className={`flex items-center justify-center w-[26px] h-[22px] min-w-[26px] p-0 bg-transparent border rounded-[3px] cursor-pointer select-none hover:bg-accent/20 hover:border-accent transition-colors shrink-0 ${
              ctrl.active ? 'bg-accent/25 border-accent' : 'border-transparent'
            }`}
            title={ctrl.tooltip}
            aria-label={ctrl.tooltip}
            aria-pressed={ctrl.active}
            onClick={ctrl.onClick}
          >
            <img
              src={ctrl.active ? ctrl.activeIcon : ctrl.inactiveIcon}
              alt=""
              width={18}
              height={18}
            />
          </button>
        ))}

        <span className="w-px h-[18px] bg-border mx-0.5 sm:mx-1 shrink-0" aria-hidden="true" />

        <button
          type="button"
          className="bg-input text-main border border-border hover:border-border-focus rounded-[3px] py-0.5 px-2 sm:px-2.5 text-[11px] font-semibold cursor-pointer select-none transition-colors shrink-0"
          onClick={toggleDarkMode}
          title="Toggle theme"
          aria-label="Toggle dark/light theme"
        >
          {darkMode ? 'Light' : 'Dark'}
        </button>
        <button
          type="button"
          className="bg-accent hover:bg-accent-hover text-white border border-accent-border rounded-[3px] py-0.5 px-2 sm:px-2.5 text-[11px] font-semibold cursor-pointer select-none transition-colors shrink-0"
          onClick={runDesign}
          aria-label="Run bridge design"
        >
          Design
        </button>
      </div>
    </header>
  );
};
