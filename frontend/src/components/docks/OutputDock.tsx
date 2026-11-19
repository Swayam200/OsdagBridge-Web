/**
 * OutputDock.tsx
 * Output dock component styled with Tailwind CSS utility classes.
 */

import React from 'react';
import { useBridgeStore } from '../../store/useBridgeStore';
import { PercentBarWidget } from '../widgets/PercentBarWidget';
import { ChevronUp, ChevronDown } from 'lucide-react';

interface ForceOption {
  key: string;
  label: React.ReactNode;
}

const FORCE_COLUMNS: ForceOption[][] = [
  [
    { key: 'Fx', label: <>F<sub>x</sub></> },
    { key: 'Vy', label: <>V<sub>y</sub></> },
    { key: 'Vz', label: <>V<sub>z</sub></> },
  ],
  [
    { key: 'Tx', label: <>T<sub>x</sub></> },
    { key: 'My', label: <>M<sub>y</sub></> },
    { key: 'Mz', label: <>M<sub>z</sub></> },
  ],
  [
    { key: 'Dx', label: <>D<sub>x</sub></> },
    { key: 'Dy', label: <>D<sub>y</sub></> },
    { key: 'Dz', label: <>D<sub>z</sub></> },
  ],
];

export const OutputDock: React.FC = () => {
  const {
    isOutputDockCollapsed,
    toggleOutputDock,
    outputCollapsedSections,
    toggleOutputSection,
    analysisMember,
    setAnalysisMember,
    analysisLoadCase,
    setAnalysisLoadCase,
    analysisForce,
    setAnalysisForce,
    analysisDisplayOptions,
    toggleAnalysisDisplayOption,
    designMember,
    setDesignMember,
    designLoadCase,
    setDesignLoadCase,
    dcrValues,
    requireDesignCheck,
    setSteelDesignModalOpen,
    setTransverseDesignModalOpen,
    setDeckDesignModalOpen,
    setGenerateResultsModalOpen,
    setReportModalOpen,
  } = useBridgeStore();

  const isDesignAvailable = requireDesignCheck();
  const girderItems = Array.from({ length: 4 }, (_, i) => `G${i + 1}`);

  const isSuperstructureCollapsed = Boolean(outputCollapsedSections['superstructure']);
  const isSubstructureCollapsed = Boolean(outputCollapsedSections['substructure']);

  return (
    <div className="osdag-output-dock flex w-full md:w-auto h-auto md:h-full max-h-[42vh] md:max-h-none relative z-10 shrink-0">
      {isOutputDockCollapsed ? (
        <div className="flex items-stretch h-full shrink-0 select-none bg-transparent w-10 flex-row-reverse">
          <img
            src="/vectors/outputs_label_light.svg"
            alt="Outputs"
            className="w-8 h-full block select-none"
          />
          <div
            className="w-1.5 min-w-[6px] bg-accent h-full flex items-center justify-center relative cursor-pointer select-none shrink-0"
            onClick={toggleOutputDock}
            title="Show output panel"
          >
            <button
              type="button"
              className="absolute top-1/2 -translate-y-1/2 left-0 w-1.5 h-[60px] bg-[#6c8408] hover:bg-[#5e7407] text-white text-[10px] font-bold border-0 cursor-pointer p-0 flex items-center justify-center transition-colors rounded-l-[3px]"
              onClick={(e) => {
                e.stopPropagation();
                toggleOutputDock();
              }}
              title="Show output panel"
              aria-label="Expand output dock"
            >
              ❮
            </button>
          </div>
        </div>
      ) : (
        <>
          {/* ── 1. Toggle Strip on Left of Output Dock ───────────────────────── */}
          <div
            className="w-1.5 min-w-[6px] bg-accent h-full flex items-center justify-center relative cursor-pointer select-none shrink-0"
            onClick={toggleOutputDock}
            title="Hide output panel"
          >
            <button
              type="button"
              className="absolute top-1/2 -translate-y-1/2 left-0 w-1.5 h-[60px] bg-[#6c8408] hover:bg-[#5e7407] text-white text-[10px] font-bold border-0 cursor-pointer p-0 flex items-center justify-center transition-colors rounded-r-[3px]"
              onClick={(e) => {
                e.stopPropagation();
                toggleOutputDock();
              }}
              title="Hide output panel"
              aria-label="Collapse output dock"
            >
              ❯
            </button>
          </div>

          {/* ── 2. Content Container (Output Panel) ─────────────────────────── */}
          <aside
            aria-label="Bridge Design Outputs"
            className="w-full md:w-[340px] md:min-w-[340px] max-h-[42vh] md:max-h-none bg-surface border-l border-border h-full flex flex-col overflow-hidden"
          >
            <div className="p-[12px_15px_10px_15px] flex flex-col h-full w-full min-w-0 md:min-w-[310px] box-border">
              {/* ── Top Bar ─────────────────────────────────── */}
              <div className="flex items-center mb-3">
                <button
                  type="button"
                  className="flex-1 bg-accent text-white font-bold text-[13px] border-0 rounded p-[7px_20px] text-center cursor-default select-none"
                >
                  Output Dock
                </button>
              </div>

              {/* ── Scroll Area ─────────────────────────── */}
              <div
                role="region"
                aria-label="Analysis and design results"
                className="flex-1 overflow-y-auto border-t border-b border-border pt-3 pb-2.5 px-0.5"
              >
                {/* ─── SECTION 1: Superstructure ──────────── */}
                <div className="border border-accent rounded-[5px] bg-surface p-[8px_10px_10px_10px] mt-1">
                  <div
                    className={`flex items-center justify-between cursor-pointer select-none ${
                      isSuperstructureCollapsed ? '' : 'pb-2 border-b border-border-subtle mb-2'
                    }`}
                    onClick={() => toggleOutputSection('superstructure')}
                  >
                    <span className="text-[13px] font-bold text-main">Superstructure</span>
                    <button
                      type="button"
                      className="bg-transparent border-0 cursor-pointer p-0.5 flex items-center justify-center text-main"
                      aria-expanded={!isSuperstructureCollapsed}
                      title={isSuperstructureCollapsed ? 'Expand Superstructure' : 'Collapse Superstructure'}
                    >
                      {isSuperstructureCollapsed ? <ChevronDown size={17} /> : <ChevronUp size={17} />}
                    </button>
                  </div>

                  {!isSuperstructureCollapsed && (
                    <div className="flex flex-col gap-2.5">
                      {/* ── 1.1 Girder Analysis Results Group ─────────────────── */}
                      <div className="relative border border-accent rounded bg-surface px-2.5 pt-3.5 pb-2 mt-5 mb-1.5">
                        <span
                          className="absolute -top-[8px] left-2 px-1.5 text-[10px] font-bold text-muted tracking-[0.03em] uppercase leading-none select-none z-10 bg-surface"
                        >
                          Girder Analysis Results
                        </span>

                        {/* Member Dropdown */}
                        <div className="flex items-center justify-between gap-3 mb-2 min-h-[28px]">
                          <label className="w-[95px] min-w-[95px] max-w-[95px] shrink-0 text-xs text-main font-semibold select-none">
                            Member
                          </label>
                          <select
                            value={analysisMember ?? ''}
                            onChange={(e) => setAnalysisMember(e.target.value || null)}
                            className="w-[155px] min-w-[155px] max-w-[155px] shrink-0 h-7 min-h-[28px] py-0.5 pl-2 pr-7 text-xs border border-input-border rounded-[5px] bg-input text-main outline-none focus:border-border-focus cursor-pointer appearance-none bg-[image:var(--select-arrow)] bg-no-repeat bg-[right_6px_center] bg-[length:16px_16px]"
                            aria-label="Analysis Member"
                          >
                            <option value="" className="bg-input text-main">-</option>
                            <option value="All" className="bg-input text-main">All</option>
                            {girderItems.map((g) => (
                              <option key={g} value={g} className="bg-input text-main">{g}</option>
                            ))}
                          </select>
                        </div>

                        {/* Load Case Dropdown */}
                        <div className="flex items-center justify-between gap-3 mb-2 min-h-[28px]">
                          <label className="w-[95px] min-w-[95px] max-w-[95px] shrink-0 text-xs text-main font-semibold leading-tight select-none">
                            Load Case /<br />Combination
                          </label>
                          <select
                            value={analysisLoadCase ?? ''}
                            onChange={(e) => setAnalysisLoadCase(e.target.value || null)}
                            className="w-[155px] min-w-[155px] max-w-[155px] shrink-0 h-7 min-h-[28px] py-0.5 pl-2 pr-7 text-xs border border-input-border rounded-[5px] bg-input text-main outline-none focus:border-border-focus cursor-pointer appearance-none bg-[image:var(--select-arrow)] bg-no-repeat bg-[right_6px_center] bg-[length:16px_16px]"
                            aria-label="Analysis Load Case"
                          >
                            <option value="" className="bg-input text-main">-</option>
                            <option value="1.35 DL + 1.5 LL" className="bg-input text-main">1.35 DL + 1.5 LL</option>
                            <option value="1.0 DL + 1.0 LL" className="bg-input text-main">1.0 DL + 1.0 LL</option>
                            <option value="0.9 DL + 1.5 LL" className="bg-input text-main">0.9 DL + 1.5 LL</option>
                            <option value="Design Envelope" className="bg-input text-main">Design Envelope</option>
                          </select>
                        </div>

                        {/* 3x3 Force Component Radio Grid */}
                        <div className="grid grid-cols-3 gap-1 py-1.5 border-t border-b border-border-subtle my-1.5">
                          {FORCE_COLUMNS.map((col, cIdx) => (
                            <div key={cIdx} className="flex flex-col gap-1 items-center">
                              {col.map((item) => (
                                <label
                                  key={item.key}
                                  className="flex items-center justify-center gap-1.5 text-[11px] cursor-pointer select-none w-full py-0.5 text-main"
                                >
                                  <input
                                    type="radio"
                                    name="force_radio_grid"
                                    checked={Boolean(analysisForce && analysisForce === item.key)}
                                    onChange={() => setAnalysisForce(item.key)}
                                    className="accent-accent cursor-pointer"
                                  />
                                  <span className={analysisForce === item.key ? 'font-bold' : 'font-medium'}>
                                    {item.label}
                                  </span>
                                </label>
                              ))}
                            </div>
                          ))}
                        </div>

                        {/* Display Values Checkboxes */}
                        <div className="border border-border-subtle rounded p-[6px_8px] mt-1.5">
                          <div className="text-[10px] font-bold text-sub uppercase mb-1">
                            Display Values
                          </div>
                          <div className="flex gap-4 mb-1">
                            <label className="flex items-center gap-1.5 text-[11px] cursor-pointer select-none text-main">
                              <input
                                type="checkbox"
                                checked={Boolean(analysisDisplayOptions?.Max)}
                                onChange={() => toggleAnalysisDisplayOption('Max')}
                                className="accent-accent cursor-pointer"
                              />
                              <span>Max</span>
                            </label>
                            <label className="flex items-center gap-1.5 text-[11px] cursor-pointer select-none text-main">
                              <input
                                type="checkbox"
                                checked={Boolean(analysisDisplayOptions?.Min)}
                                onChange={() => toggleAnalysisDisplayOption('Min')}
                                className="accent-accent cursor-pointer"
                              />
                              <span>Min</span>
                            </label>
                          </div>
                          <div className="flex gap-4">
                            <label className="flex items-center gap-1.5 text-[11px] cursor-pointer select-none text-main">
                              <input
                                type="checkbox"
                                checked={Boolean(analysisDisplayOptions?.All)}
                                onChange={() => toggleAnalysisDisplayOption('All')}
                                className="accent-accent cursor-pointer"
                              />
                              <span>All</span>
                            </label>
                            <label className="flex items-center gap-1.5 text-[11px] cursor-pointer select-none text-main">
                              <input
                                type="checkbox"
                                checked={Boolean(analysisDisplayOptions?.Summary)}
                                onChange={() => toggleAnalysisDisplayOption('Summary')}
                                className="accent-accent cursor-pointer"
                              />
                              <span>Summary</span>
                            </label>
                          </div>
                        </div>
                      </div>

                      {/* ── 1.2 Girder Design Group ─────────────────── */}
                      <div className="relative border border-accent rounded bg-surface px-2.5 pt-3.5 pb-2 mt-5 mb-1.5">
                        <span
                          className="absolute -top-[8px] left-2 px-1.5 text-[10px] font-bold text-muted tracking-[0.03em] uppercase leading-none select-none z-10 bg-surface"
                        >
                          Girder Design
                        </span>

                        {/* Member Dropdown */}
                        <div className="flex items-center justify-between gap-3 mb-2 min-h-[28px]">
                          <label className="w-[95px] min-w-[95px] max-w-[95px] shrink-0 text-xs text-main font-semibold select-none">
                            Member
                          </label>
                          <select
                            value={designMember ?? ''}
                            onChange={(e) => setDesignMember(e.target.value || null)}
                            className="w-[155px] min-w-[155px] max-w-[155px] shrink-0 h-7 min-h-[28px] py-0.5 pl-2 pr-7 text-xs border border-input-border rounded-[5px] bg-input text-main outline-none focus:border-border-focus cursor-pointer appearance-none bg-[image:var(--select-arrow)] bg-no-repeat bg-[right_6px_center] bg-[length:16px_16px]"
                            aria-label="Design Member"
                          >
                            <option value="" className="bg-input text-main">-</option>
                            {girderItems.map((g) => (
                              <option key={g} value={g} className="bg-input text-main">{g}</option>
                            ))}
                          </select>
                        </div>

                        {/* Load Case Dropdown */}
                        <div className="flex items-center justify-between gap-3 mb-2.5 min-h-[28px]">
                          <label className="w-[95px] min-w-[95px] max-w-[95px] shrink-0 text-xs text-main font-semibold leading-tight select-none">
                            Load Case /<br />Combination
                          </label>
                          <select
                            value={designLoadCase ?? ''}
                            onChange={(e) => setDesignLoadCase(e.target.value || null)}
                            className="w-[155px] min-w-[155px] max-w-[155px] shrink-0 h-7 min-h-[28px] py-0.5 pl-2 pr-7 text-xs border border-input-border rounded-[5px] bg-input text-main outline-none focus:border-border-focus cursor-pointer appearance-none bg-[image:var(--select-arrow)] bg-no-repeat bg-[right_6px_center] bg-[length:16px_16px]"
                            aria-label="Design Load Case"
                          >
                            <option value="" className="bg-input text-main">-</option>
                            <option value="Design Envelope" className="bg-input text-main">Design Envelope</option>
                            <option value="1.35 DL + 1.5 LL" className="bg-input text-main">1.35 DL + 1.5 LL</option>
                            <option value="1.0 DL + 1.0 LL" className="bg-input text-main">1.0 DL + 1.0 LL</option>
                          </select>
                        </div>

                        {/* DCR Utilization Bars */}
                        <div className="flex flex-col gap-0.5 mb-2.5">
                          <PercentBarWidget label="Strength Limit State (Flexure)" value={dcrValues?.flexure ?? 0} />
                          <PercentBarWidget label="Strength Limit State (Shear)" value={dcrValues?.shear ?? 0} />
                          <PercentBarWidget label="Interaction" value={dcrValues?.interaction ?? 0} />
                          <PercentBarWidget label="Lateral Torsional Buckling" value={dcrValues?.ltb ?? 0} />
                          <PercentBarWidget label="Resistance to Longitudinal Shear" value={dcrValues?.longTransShear ?? 0} />
                          <PercentBarWidget label="Resistance to Fatigue" value={dcrValues?.fatigue ?? 0} />
                          <PercentBarWidget label="Stress Limitation" value={dcrValues?.stressLimitation ?? 0} />
                          <PercentBarWidget label="Deflection" value={dcrValues?.deflection ?? 0} />
                        </div>

                        {/* Analysis and Design Summary Button */}
                        <button
                          type="button"
                          disabled={!isDesignAvailable}
                          title={!isDesignAvailable ? 'Available after running design' : undefined}
                          onClick={isDesignAvailable ? () => setSteelDesignModalOpen(true) : undefined}
                          className="w-full bg-accent hover:bg-accent-hover disabled:bg-border disabled:text-muted text-white font-bold rounded p-[6px_14px] text-[11px] min-h-[28px] transition-colors cursor-pointer select-none disabled:cursor-not-allowed mt-2"
                        >
                          Analysis and Design Summary
                        </button>
                      </div>

                      {/* ── 1.3 Transverse Design Group ───────────────────────── */}
                      <div className="relative border border-accent rounded bg-surface px-2.5 pt-3.5 pb-2 mt-5 mb-1.5">
                        <span
                          className="absolute -top-[8px] left-2 px-1.5 text-[10px] font-bold text-muted tracking-[0.03em] uppercase leading-none select-none z-10 bg-surface"
                        >
                          Transverse Design
                        </span>
                        <button
                          type="button"
                          disabled={!isDesignAvailable}
                          title={!isDesignAvailable ? 'Available after running design' : undefined}
                          onClick={isDesignAvailable ? () => setTransverseDesignModalOpen(true) : undefined}
                          className="w-full bg-accent hover:bg-accent-hover disabled:bg-border disabled:text-muted text-white font-bold rounded p-[6px_14px] text-[11px] min-h-[28px] transition-colors cursor-pointer select-none disabled:cursor-not-allowed mt-0.5"
                        >
                          Design Summary
                        </button>
                      </div>

                      {/* ── 1.4 Deck Design Group ─────────────────────────────── */}
                      <div className="relative border border-accent rounded bg-surface px-2.5 pt-3.5 pb-2 mt-5 mb-1.5">
                        <span
                          className="absolute -top-[8px] left-2 px-1.5 text-[10px] font-bold text-muted tracking-[0.03em] uppercase leading-none select-none z-10 bg-surface"
                        >
                          Deck Design
                        </span>
                        <button
                          type="button"
                          disabled={!isDesignAvailable}
                          title={!isDesignAvailable ? 'Available after running design' : undefined}
                          onClick={isDesignAvailable ? () => setDeckDesignModalOpen(true) : undefined}
                          className="w-full bg-accent hover:bg-accent-hover disabled:bg-border disabled:text-muted text-white font-bold rounded p-[6px_14px] text-[11px] min-h-[28px] transition-colors cursor-pointer select-none disabled:cursor-not-allowed mt-0.5"
                        >
                          Design Summary
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* ─── SECTION 2: Substructure ────────────── */}
                <div className="border border-accent rounded-[5px] bg-surface p-[8px_10px_10px_10px] mt-2.5">
                  <div
                    className={`flex items-center justify-between cursor-pointer select-none ${
                      isSubstructureCollapsed ? '' : 'pb-2 border-b border-border-subtle mb-2'
                    }`}
                    onClick={() => toggleOutputSection('substructure')}
                  >
                    <span className="text-[13px] font-bold text-main">Substructure</span>
                    <button
                      type="button"
                      className="bg-transparent border-0 cursor-pointer p-0.5 flex items-center justify-center text-main"
                      aria-expanded={!isSubstructureCollapsed}
                      title={isSubstructureCollapsed ? 'Expand Substructure' : 'Collapse Substructure'}
                    >
                      {isSubstructureCollapsed ? <ChevronDown size={17} /> : <ChevronUp size={17} />}
                    </button>
                  </div>

                  {!isSubstructureCollapsed && (
                    <div className="py-1.5 px-1 text-[11px] text-sub italic">
                      Substructure modules will activate when substructure geometry is configured.
                    </div>
                  )}
                </div>
              </div>

              {/* ── 3. Bottom Action Buttons ──────────────── */}
              <div className="flex gap-2 mt-2.5 pt-0.5">
                <button
                  type="button"
                  disabled={!isDesignAvailable}
                  title={!isDesignAvailable ? 'Available after running design' : undefined}
                  onClick={isDesignAvailable ? () => setGenerateResultsModalOpen(true) : undefined}
                  className="flex-[1.28] min-w-0 h-[34px] min-h-[34px] bg-accent hover:bg-accent-hover disabled:bg-accent-disabled disabled:text-muted text-white font-semibold text-[11px] rounded px-2 py-1.5 flex items-center justify-center gap-1.5 transition-colors cursor-pointer select-none disabled:cursor-not-allowed"
                >
                  <img src="/vectors/design_result_table.svg" alt="" width={16} height={16} />
                  <span className="truncate">Generate Results Table</span>
                </button>

                <button
                  type="button"
                  disabled={!isDesignAvailable}
                  title={!isDesignAvailable ? 'Available after running design' : undefined}
                  onClick={isDesignAvailable ? () => setReportModalOpen(true) : undefined}
                  className="flex-[0.88] min-w-0 h-[34px] min-h-[34px] bg-accent hover:bg-accent-hover disabled:bg-accent-disabled disabled:text-muted text-white font-semibold text-[11px] rounded px-2 py-1.5 flex items-center justify-center gap-1.5 transition-colors cursor-pointer select-none disabled:cursor-not-allowed"
                >
                  <img src="/vectors/design_report.svg" alt="" width={16} height={16} />
                  <span className="truncate">Generate Report</span>
                </button>
              </div>
            </div>
          </aside>
        </>
      )}
    </div>
  );
};
