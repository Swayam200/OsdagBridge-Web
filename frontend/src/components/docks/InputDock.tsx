/**
 * InputDock.tsx
 * Input dock component styled with Tailwind CSS utility classes.
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
    validateRequiredInputs,
  } = useBridgeStore();

  const [showLockTooltip, setShowLockTooltip] = useState(false);
  const tooltipTimerRef = useRef<number | null>(null);

  useEffect(() => {
    fetchSchema();
  }, [fetchSchema]);

  const handleScrollAreaClick = () => {
    if (isLocked) {
      setShowLockTooltip(true);
      if (tooltipTimerRef.current) clearTimeout(tooltipTimerRef.current);
      tooltipTimerRef.current = window.setTimeout(() => {
        setShowLockTooltip(false);
      }, 3000);
    }
  };

  const containers = schema.reduce<Record<string, Record<string, UIFieldSchema[]>>>((acc, item) => {
    const c = item.container || 'main';
    const g = item.group || 'General Details';
    if (!acc[c]) acc[c] = {};
    if (!acc[c][g]) acc[c][g] = [];
    acc[c][g].push(item);
    return acc;
  }, {});

  const GROUPS_WITH_TITLE = new Set(['Type of Structure', 'Geometric Details', 'Material Inputs']);

  const renderGroup = (groupTitle: string, fields: UIFieldSchema[]) => {
    const showTitle = GROUPS_WITH_TITLE.has(groupTitle);
    return (
      <div
        key={groupTitle}
        className={`relative border border-[var(--accent-osdag)] rounded-[4px] bg-[var(--bg-surface)] px-2.5 pb-2.5 ${
          showTitle ? 'pt-3.5 mt-2' : 'pt-2.5'
        }`}
      >
        {showTitle && (
          <span
            className="absolute -top-[8px] left-2 px-1 text-[10px] font-bold text-[var(--text-muted)] tracking-[0.03em] uppercase leading-none select-none z-10 bg-[var(--bg-surface)]"
          >
            {groupTitle}
          </span>
        )}
        <div className="flex flex-col gap-2">
          {fields.map((f) => (
            <SchemaField key={f.key} field={f} />
          ))}
        </div>
      </div>
    );
  };

  const isLoading = constantsLoading || schemaLoading;
  const errorMessage = constantsError || schemaError;

  return (
    <div className="flex h-full relative z-10 shrink-0">
      {isDockCollapsed ? (
        <div className="flex items-stretch h-full shrink-0 select-none bg-transparent w-10 flex-row">
          <img
            src="/vectors/inputs_label_light.svg"
            alt="Inputs"
            className="w-8 h-full block select-none"
          />
          <div
            className="w-1.5 min-w-[6px] bg-[var(--accent-osdag)] h-full flex items-center justify-center relative cursor-pointer select-none shrink-0"
            onClick={toggleDock}
            title="Show input panel"
          >
            <button
              type="button"
              className="absolute top-1/2 -translate-y-1/2 left-0 w-1.5 h-[60px] bg-[#6c8408] hover:bg-[#5e7407] text-white text-[10px] font-bold border-0 cursor-pointer p-0 flex items-center justify-center transition-colors rounded-r-[3px]"
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
        <>
          <aside
            aria-label="Bridge Input Parameters"
            className="w-[340px] min-w-[340px] bg-[var(--bg-surface)] border-r border-[var(--border-color)] h-full flex flex-col overflow-hidden"
          >
            <div className="p-[12px_15px_10px_15px] flex flex-col h-full min-w-[310px] box-border">
              {/* ── 1. Top Bar ──────────────────────────────── */}
              <div className="flex items-center gap-2 mb-3 flex-nowrap min-w-0">
                <button
                  type="button"
                  aria-current="page"
                  className="flex-[1_1_0] min-w-0 bg-[var(--accent-osdag)] text-white font-bold text-[13px] border-0 rounded p-[7px_8px] text-center whitespace-nowrap overflow-hidden text-ellipsis select-none cursor-default"
                >
                  Basic Inputs
                </button>

                <button
                  type="button"
                  title="Open Additional Inputs dialog"
                  aria-label="Open Additional Inputs dialog"
                  onClick={() => {
                    if (validateRequiredInputs()) {
                      setAdditionalInputsOpen(true);
                    }
                  }}
                  className="flex-[1_1_0] min-w-0 bg-[var(--bg-surface)] hover:bg-[var(--accent-osdag)] hover:text-white text-[var(--text-main)] font-bold text-xs border border-[var(--input-border)] hover:border-[var(--accent-osdag)] rounded-[5px] p-[6px_8px] text-center whitespace-nowrap overflow-hidden text-ellipsis transition-colors cursor-pointer select-none"
                >
                  Additional Inputs
                </button>

                <button
                  type="button"
                  onClick={toggleLock}
                  title={isLocked ? 'Locked (Click to Unlock)' : 'Unlocked (Click to Lock)'}
                  aria-pressed={isLocked}
                  aria-label={isLocked ? 'Unlock inputs' : 'Lock inputs'}
                  className={`shrink-0 w-[34px] h-[34px] p-1.5 rounded-[4px] flex items-center justify-center cursor-pointer transition-colors border ${
                    isLocked ? 'bg-[#FFA500] border-[#fa7a02]' : 'bg-[var(--bg-grouped)] border-[var(--border-color)] hover:border-[var(--accent-osdag)]'
                  }`}
                >
                  <img
                    src={isLocked ? '/vectors/lock_close.svg' : '/vectors/lock_open.svg'}
                    alt=""
                    width={16}
                    height={16}
                  />
                </button>
              </div>

              {/* ── 2. Scroll Area ────────────────────────── */}
              <div
                onClick={handleScrollAreaClick}
                role="region"
                aria-label="Bridge input parameters form"
                className={`flex-1 overflow-y-auto border-t border-b border-[var(--border-color)] pt-3 pb-2.5 px-0.5 relative ${
                  isLocked ? 'opacity-75' : ''
                }`}
              >
                {/* Floating Lock Tooltip */}
                {showLockTooltip && (
                  <div className="absolute top-3 right-3 bg-[var(--bg-surface)] border border-[var(--accent-osdag)] p-[4px_8px] text-xs font-semibold text-[var(--text-main)] shadow-md z-20">
                    🔒 Unlock to Edit
                  </div>
                )}

                {/* Loading State */}
                {isLoading && (
                  <div className="my-4 p-5 rounded bg-[var(--bg-grouped)] border border-[var(--border-color)] text-xs text-[var(--text-main)] flex flex-col items-center text-center gap-2" role="status">
                    <RefreshCw size={18} className="animate-spin" aria-hidden="true" />
                    <span className="text-xs text-[var(--text-sub)]">
                      {constantsLoading ? 'Loading constants…' : 'Loading schema definitions…'}
                    </span>
                  </div>
                )}

                {/* Backend Unavailable */}
                {!isLoading && errorMessage && (
                  <div role="alert" className="my-4 p-3 rounded bg-[var(--danger-bg)] border border-[var(--danger)] text-xs text-[var(--danger)] flex flex-col gap-2">
                    <div className="flex items-center gap-1.5 font-bold text-xs">
                      <AlertCircle size={16} aria-hidden="true" />
                      <span>Backend Unavailable</span>
                    </div>
                    <p className="m-0 text-[11px] leading-snug text-[var(--text-main)]">
                      {constantsError
                        ? 'Could not load backend constants. The input form requires the backend server to be running.'
                        : 'Could not load the bridge input schema. The input dock remains unloaded until the backend service is reachable.'}
                    </p>
                    <button
                      type="button"
                      onClick={() => void fetchSchema()}
                      className="self-start mt-1 bg-[var(--input-bg)] hover:bg-[var(--accent-osdag)] hover:text-white text-[var(--text-main)] font-bold text-[11px] border border-[var(--input-border)] hover:border-[var(--accent-osdag)] rounded p-[4px_10px] transition-colors cursor-pointer"
                    >
                      Retry Connection
                    </button>
                  </div>
                )}

                {/* Empty State */}
                {!isLoading && !errorMessage && schema.length === 0 && (
                  <div className="my-4 p-3 rounded bg-[var(--bg-grouped)] border border-[var(--border-color)] text-xs text-[var(--text-main)]" role="status">
                    <p className="m-0 text-[11px] text-[var(--text-sub)]">
                      No bridge input schema is currently loaded.
                    </p>
                  </div>
                )}

                {/* Container & Group Field Loop */}
                <div className="flex flex-col gap-3 pb-2 pt-1">
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
                      <div key={containerKey} className="border border-[var(--accent-osdag)] rounded-[5px] bg-[var(--bg-surface)] mt-2.5 p-[8px_10px_10px_10px]">
                        <div className="flex items-center justify-between mb-1.5 select-none">
                          <span className="text-[13px] font-bold text-[var(--text-main)]">{containerTitle}</span>
                          <button
                            type="button"
                            onClick={() => toggleContainer(containerKey)}
                            className="bg-transparent border-0 cursor-pointer p-0.5 flex items-center justify-center"
                            title={isCollapsed ? `Expand ${containerTitle}` : `Collapse ${containerTitle}`}
                            aria-expanded={!isCollapsed}
                          >
                            <img
                              src={isCollapsed ? '/vectors/arrow_down_light.svg' : '/vectors/arrow_up_light.svg'}
                              alt={isCollapsed ? 'Expand' : 'Collapse'}
                              width={18}
                              height={18}
                              className="object-contain"
                            />
                          </button>
                        </div>

                        {!isCollapsed && (
                          <div className="flex flex-col gap-3">
                            {Object.entries(containerGroups).map(([groupTitle, fields]) =>
                              renderGroup(groupTitle, fields)
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* ── 3. Bottom Action Buttons ──────────────── */}
              <div className="flex gap-2.5 mt-3 pt-0.5">
                <button
                  type="button"
                  disabled={isLocked || schema.length === 0}
                  onClick={saveInputs}
                  className="flex-1 h-[34px] min-h-[34px] bg-[var(--accent-osdag)] hover:bg-[var(--accent-hover)] disabled:bg-[var(--accent-disabled)] disabled:text-[var(--text-muted)] text-white font-semibold text-[11px] rounded px-3 py-2 flex items-center justify-center gap-1.5 transition-colors cursor-pointer select-none disabled:cursor-not-allowed"
                  title={schema.length === 0 ? 'Inputs not loaded' : 'Save Inputs'}
                >
                  <img src="/vectors/save.svg" alt="" width={18} height={18} />
                  <span>Save Input</span>
                </button>

                <button
                  type="button"
                  disabled={isLocked || schema.length === 0}
                  onClick={runDesign}
                  className="flex-1 h-[34px] min-h-[34px] bg-[var(--accent-osdag)] hover:bg-[var(--accent-hover)] disabled:bg-[var(--accent-disabled)] disabled:text-[var(--text-muted)] text-white font-semibold text-[11px] rounded px-3 py-2 flex items-center justify-center gap-1.5 transition-colors cursor-pointer select-none disabled:cursor-not-allowed"
                  title={schema.length === 0 ? 'Inputs not loaded' : 'Run Bridge Design'}
                >
                  <img src="/vectors/design.svg" alt="" width={18} height={18} />
                  <span>Design</span>
                </button>
              </div>
            </div>
          </aside>

          {/* ── 4. Toggle Strip ───────────────────────── */}
          <div
            className="w-1.5 min-w-[6px] bg-[#90af13] h-full flex items-center justify-center relative cursor-pointer select-none shrink-0"
            onClick={toggleDock}
            title="Hide input panel"
          >
            <button
              type="button"
              className="absolute top-1/2 -translate-y-1/2 left-0 w-1.5 h-[60px] bg-[#6c8408] hover:bg-[#5e7407] text-white text-[10px] font-bold border-0 cursor-pointer p-0 flex items-center justify-center transition-colors rounded-l-[3px]"
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
