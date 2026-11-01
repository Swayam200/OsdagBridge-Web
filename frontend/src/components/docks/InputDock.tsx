/**
 * InputDock.tsx
 *
 * Input dock component for the Highway Bridge Design workbench.
 * Adapts osdagbridge.desktop.ui.docks.input_dock.InputDock for React.
 *
 * Structural organization:
 *   - Top bar: "Basic Inputs" tab, "Additional Inputs" tab, Lock/Unlock toggle.
 *   - Scroll area: Schema-driven containers & groupboxes (.osdag-groupbox).
 *   - Offline / unloaded state: When backend is unreachable, the dock remains
 *     unloaded and presents a clear error state without mock or fallback schemas.
 *   - Bottom action bar: "Save Input" and "Design" dock buttons.
 *   - Toggle strip: Expandable indicator strip on the panel edge.
 */

import React, { useEffect, useState, useRef } from 'react';
import { useBridgeStore } from '../../store/useBridgeStore';
import { SchemaField } from '../forms/SchemaField';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { UIFieldSchema } from '../../types/schema';

export const InputDock: React.FC = () => {
  const {
    schema,
    fetchSchema,
    schemaLoading,
    schemaError,
    constantsLoading,
    constantsError,
    isLocked,
    toggleLock,
    isDockCollapsed,
    toggleDock,
    collapsedContainers,
    toggleContainer,
    saveInputs,
    runDesign,
    setAdditionalInputsOpen,
  } = useBridgeStore();

  const [showLockTooltip, setShowLockTooltip] = useState(false);
  const tooltipTimerRef = useRef<number | null>(null);

  // Fetch schema (which internally fetches constants first) on mount
  useEffect(() => {
    fetchSchema();
  }, [fetchSchema]);

  // Floating lock notification on click
  const handleScrollAreaClick = () => {
    if (isLocked) {
      setShowLockTooltip(true);
      if (tooltipTimerRef.current) clearTimeout(tooltipTimerRef.current);
      tooltipTimerRef.current = window.setTimeout(() => {
        setShowLockTooltip(false);
      }, 3000);
    }
  };

  // Group schema fields by container -> group (mirrors desktop _make_container and _build_field_loop)
  const containers = schema.reduce<Record<string, Record<string, UIFieldSchema[]>>>((acc, item) => {
    const c = item.container || 'main';
    const g = item.group || 'General Details';
    if (!acc[c]) acc[c] = {};
    if (!acc[c][g]) acc[c][g] = [];
    acc[c][g].push(item);
    return acc;
  }, {});

  const renderGroup = (groupTitle: string, fields: UIFieldSchema[]) => {
    const showTitle = fields[0]?.show_group_title !== false;
    return (
      <div
        key={groupTitle}
        className="osdag-groupbox"
        style={!showTitle ? { paddingTop: '8px', marginTop: '10px' } : undefined}
      >
        {showTitle && (
          <div className="osdag-groupbox__title">
            <span>{groupTitle}</span>
          </div>
        )}
        <div style={{ marginTop: showTitle ? '4px' : '0' }}>
          {fields.map((f) => (
            <SchemaField key={f.key} field={f} />
          ))}
        </div>
      </div>
    );
  };

  // Combined loading: constants OR schema
  const isLoading = constantsLoading || schemaLoading;
  // Combined error: show constants error first (it's more fundamental)
  const errorMessage = constantsError || schemaError;

  return (
    <div
      className="osdag-input-dock"
      style={{
        display: 'flex',
        height: '100%',
        position: 'relative',
        zIndex: 10,
        flexShrink: 0,
      }}
    >
      {isDockCollapsed ? (
        // ─── Collapsed Indicator (mirrors desktop InputDockIndicator) ─────────
        <div className="osdag-dock-indicator osdag-dock-indicator--input">
          <img
            src="/vectors/inputs_label_light.svg"
            alt="Inputs"
            style={{ width: '32px', height: '100%', display: 'block', userSelect: 'none' }}
          />
          <div
            className="osdag-toggle-strip"
            onClick={toggleDock}
            title="Show input panel"
          >
            <button
              type="button"
              className="osdag-toggle-strip__button"
              style={{ borderRadius: '0 3px 3px 0' }}
              onClick={(e) => {
                e.stopPropagation();
                toggleDock();
              }}
              title="Show input panel"
              aria-label="Expand input dock"
            >
              ❯
            </button>
          </div>
        </div>
      ) : (
        // ─── Expanded Input Panel ─────────────────────────────────────────────
        <>
          <aside
            aria-label="Bridge Input Parameters"
            style={{
              width: '340px',
              minWidth: '340px',
              background: 'var(--bg-surface)',
              borderRight: '1px solid var(--border-color)',
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                padding: '12px 15px 10px 15px',
                display: 'flex',
                flexDirection: 'column',
                height: '100%',
                minWidth: '310px',
                boxSizing: 'border-box',
              }}
            >
              {/* ── 1. Top Bar (_build_top_bar) ──────────────────────────────── */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  marginBottom: '12px',
                  flexWrap: 'nowrap',
                  minWidth: 0,
                }}
              >
                {/* Basic Inputs Tab (active) */}
                <button
                  type="button"
                  aria-current="page"
                  style={{
                    flex: '1 1 0',
                    minWidth: 0,
                    background: 'var(--accent-osdag)',
                    color: '#ffffff',
                    fontWeight: 'bold',
                    fontSize: '13px',
                    border: 'none',
                    borderRadius: '4px',
                    padding: '7px 8px',
                    cursor: 'default',
                    textAlign: 'center',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  Basic Inputs
                </button>

                {/* Additional Inputs Tab */}
                <button
                  type="button"
                  disabled={schema.length === 0}
                  onClick={() => setAdditionalInputsOpen(true)}
                  title="Additional Inputs"
                  aria-label="Additional Inputs"
                  className="osdag-btn-standard"
                  style={{
                    flex: '1 1 0',
                    minWidth: 0,
                    padding: '7px 8px',
                    fontSize: '13px',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    cursor: 'pointer',
                  }}
                >
                  Additional Inputs
                </button>

                {/* Lock / Unlock Toggle Button */}
                <button
                  type="button"
                  onClick={toggleLock}
                  title={isLocked ? 'Locked (Click to Unlock)' : 'Unlocked (Click to Lock)'}
                  aria-pressed={isLocked}
                  aria-label={isLocked ? 'Unlock inputs' : 'Lock inputs'}
                  style={{
                    flexShrink: 0,
                    flexGrow: 0,
                    width: '34px',
                    height: '34px',
                    background: isLocked ? '#FFA500' : 'var(--bg-grouped)',
                    border: `1px solid ${isLocked ? '#fa7a02' : 'var(--border-color)'}`,
                    padding: '6px',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'background 0.15s ease',
                  }}
                >
                  <img
                    src={isLocked ? '/vectors/lock_close.svg' : '/vectors/lock_open.svg'}
                    alt=""
                    width={16}
                    height={16}
                  />
                </button>
              </div>

              {/* ── 2. Scroll Area (_build_scroll_area) ────────────────────────── */}
              <div
                onClick={handleScrollAreaClick}
                role="region"
                aria-label="Bridge input parameters form"
                style={{
                  flex: 1,
                  overflowY: 'auto',
                  borderTop: '1px solid var(--border-color)',
                  borderBottom: '1px solid var(--border-color)',
                  padding: '6px 5px 10px 2px',
                  position: 'relative',
                  opacity: isLocked ? 0.75 : 1,
                }}
              >
                {/* Floating Lock Tooltip */}
                {showLockTooltip && (
                  <div
                    style={{
                      position: 'absolute',
                      top: '12px',
                      right: '12px',
                      background: 'var(--bg-surface)',
                      border: '1px solid var(--accent-osdag)',
                      borderRadius: '0px',
                      padding: '4px 8px',
                      fontSize: '12px',
                      fontWeight: 600,
                      color: 'var(--text-main)',
                      boxShadow: 'var(--shadow-md)',
                      zIndex: 20,
                    }}
                  >
                    🔒 Unlock to Edit
                  </div>
                )}

                {/* Loading State (constants or schema) */}
                {isLoading && (
                  <div className="osdag-dock-status osdag-dock-status--loading" role="status">
                    <RefreshCw size={18} className="osdag-spin" aria-hidden="true" />
                    <span style={{ fontSize: '12px', color: 'var(--text-sub)' }}>
                      {constantsLoading ? 'Loading constants…' : 'Loading schema definitions…'}
                    </span>
                  </div>
                )}

                {/* Backend Unavailable / Constants Error State */}
                {!isLoading && errorMessage && (
                  <div role="alert" className="osdag-dock-status osdag-dock-status--error">
                    <div className="osdag-dock-status__header">
                      <AlertCircle size={16} aria-hidden="true" />
                      <span>Backend Unavailable</span>
                    </div>
                    <p className="osdag-dock-status__message">
                      {constantsError
                        ? 'Could not load backend constants. The input form requires the backend server to be running.'
                        : 'Could not load the bridge input schema. The input dock remains unloaded until the backend service is reachable.'}
                    </p>
                    <button
                      type="button"
                      onClick={() => void fetchSchema()}
                      className="osdag-btn-standard"
                      style={{ alignSelf: 'flex-start', marginTop: '4px', fontSize: '11px' }}
                    >
                      Retry Connection
                    </button>
                  </div>
                )}

                {/* Empty State when no error and no schema */}
                {!isLoading && !errorMessage && schema.length === 0 && (
                  <div className="osdag-dock-status" role="status">
                    <p className="osdag-dock-status__message">
                      No bridge input schema is currently loaded.
                    </p>
                  </div>
                )}

                {/* Container & Group Field Loop */}
                {Object.entries(containers).map(([containerKey, containerGroups]) => {
                  const isMain = containerKey === 'main';
                  const isCollapsed = Boolean(collapsedContainers[containerKey]);
                  const containerTitle =
                    containerKey.charAt(0).toUpperCase() + containerKey.slice(1).replace(/_/g, ' ');

                  if (isMain) {
                    return (
                      <React.Fragment key={containerKey}>
                        {Object.entries(containerGroups).map(([groupTitle, fields]) =>
                          renderGroup(groupTitle, fields)
                        )}
                      </React.Fragment>
                    );
                  }

                  return (
                    <div key={containerKey} className="osdag-container-box">
                      <div className="osdag-container-box__header">
                        <span className="osdag-container-box__title">{containerTitle}</span>
                        <button
                          type="button"
                          onClick={() => toggleContainer(containerKey)}
                          className="osdag-container-box__toggle"
                          title={isCollapsed ? `Expand ${containerTitle}` : `Collapse ${containerTitle}`}
                          aria-expanded={!isCollapsed}
                        >
                          <img
                            src={isCollapsed ? '/vectors/arrow_down_light.svg' : '/vectors/arrow_up_light.svg'}
                            alt={isCollapsed ? 'Expand' : 'Collapse'}
                            width={18}
                            height={18}
                            style={{ objectFit: 'contain' }}
                          />
                        </button>
                      </div>

                      {!isCollapsed && (
                        <div>
                          {Object.entries(containerGroups).map(([groupTitle, fields]) =>
                            renderGroup(groupTitle, fields)
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* ── 3. Bottom Action Buttons (_build_bottom_buttons) ──────────── */}
              <div
                style={{
                  display: 'flex',
                  gap: '10px',
                  marginTop: '12px',
                  paddingTop: '2px',
                }}
              >
                {/* Save Input Button */}
                <button
                  type="button"
                  disabled={isLocked || schema.length === 0}
                  onClick={saveInputs}
                  className="dock-custom-button"
                  style={{ flex: 1 }}
                  title={schema.length === 0 ? 'Inputs not loaded' : 'Save Inputs'}
                >
                  <img src="/vectors/save.svg" alt="" width={18} height={18} />
                  <span>Save Input</span>
                </button>

                {/* Design Button */}
                <button
                  type="button"
                  disabled={isLocked || schema.length === 0}
                  onClick={runDesign}
                  className="dock-custom-button"
                  style={{ flex: 1 }}
                  title={schema.length === 0 ? 'Inputs not loaded' : 'Run Bridge Design'}
                >
                  <img src="/vectors/design.svg" alt="" width={18} height={18} />
                  <span>Design</span>
                </button>
              </div>
            </div>
          </aside>

          {/* ── 4. Toggle Strip (_build_toggle_strip) ─────────────────────────── */}
          <div
            className="osdag-toggle-strip"
            onClick={toggleDock}
            title="Hide input panel"
          >
            <button
              type="button"
              className="osdag-toggle-strip__button"
              style={{ borderRadius: '3px 0 0 3px' }}
              onClick={(e) => {
                e.stopPropagation();
                toggleDock();
              }}
              title="Hide input panel"
              aria-label="Collapse input dock"
            >
              ❮
            </button>
          </div>
        </>
      )}
    </div>
  );
};
