import React, { useState, useRef, useLayoutEffect, useEffect } from 'react';
import { useBridgeStore } from '../../../../store/useBridgeStore';
import { CrossSectionPreview } from './CrossSectionPreview';
import { DeckDetailsSubTab } from './sub-tabs/DeckDetailsSubTab';
import { CrashBarrierSubTab } from './sub-tabs/CrashBarrierSubTab';
import { MedianSubTab } from './sub-tabs/MedianSubTab';
import { RailingSubTab } from './sub-tabs/RailingSubTab';
import { WearingCourseSubTab } from './sub-tabs/WearingCourseSubTab';
import { inputClass, readOnlyInputClass } from '../styles';

interface TypicalSectionDetailsTabProps {
  dialogSize: { width: number; height: number };
}

export const TypicalSectionDetailsTab: React.FC<TypicalSectionDetailsTabProps> = ({ dialogSize }) => {
  const {
    inputs,
    additionalInputs,
    updateAdditionalInput,
    recomputeLayout,
    isAdditionalInputsOpen,
  } = useBridgeStore();

  const [activeSubTab, setActiveSubTab] = useState(0);

  const numGirders = Number(additionalInputs['typical_section.no_of_girders'] ?? 4);
  const girderSpacing = Number(additionalInputs['typical_section.girder_spacing'] ?? 1.98);
  const deckOverhang = Number(additionalInputs['typical_section.deck_overhang'] ?? 0.99);
  const overallBridgeWidth = Number(additionalInputs['typical_section.overall_bridge_width'] ?? 7.90);

  const includeMedian = inputs['geometry.include_median'] === 'Yes';
  const footpathSetting = inputs['geometry.footpath'] ?? 'None';
  const hasFootpath = footpathSetting === 'Single Side' || footpathSetting === 'Both Sides';

  const [adjustmentMessage, setAdjustmentMessage] = useState<string | null>(
    'Values adjusted: overhang 1.16 -> 0.98'
  );
  const lastOverhangRef = useRef<number>(deckOverhang);

  useEffect(() => {
    if (lastOverhangRef.current !== deckOverhang && lastOverhangRef.current > 0) {
      setAdjustmentMessage(
        `Values adjusted: overhang ${lastOverhangRef.current.toFixed(2)} -> ${deckOverhang.toFixed(2)}`
      );
    }
    lastOverhangRef.current = deckOverhang;
  }, [deckOverhang]);

  const railingTabRef = useRef<HTMLButtonElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const [railingOffset, setRailingOffset] = useState<number>(450);

  useLayoutEffect(() => {
    const updateOffset = () => {
      if (cardRef.current && railingTabRef.current) {
        const cRect = cardRef.current.getBoundingClientRect();
        const rRect = railingTabRef.current.getBoundingClientRect();
        const offset = Math.round(rRect.left - cRect.left - 18);
        if (offset > 150) setRailingOffset(offset);
      }
    };
    updateOffset();
    const timer = setTimeout(updateOffset, 50);
    window.addEventListener('resize', updateOffset);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', updateOffset);
    };
  }, [dialogSize, activeSubTab, isAdditionalInputsOpen]);

  const typicalSubTabs = [
    { label: 'Deck Details', disabled: false },
    { label: 'Crash Barrier', disabled: false },
    { label: 'Median', disabled: !includeMedian },
    { label: 'Railing', disabled: !hasFootpath },
    { label: 'Wearing Course', disabled: false },
    { label: 'Lane Details', disabled: true },
  ];

  const handleGirderChange = (valStr: string) => {
    const val = parseInt(valStr, 10);
    if (!isNaN(val) && val >= 2) {
      updateAdditionalInput('typical_section.no_of_girders', val);
      recomputeLayout('girders', val);
    }
  };

  const handleSpacingChange = (valStr: string) => {
    const val = parseFloat(valStr);
    if (!isNaN(val) && val > 0) {
      updateAdditionalInput('typical_section.girder_spacing', val);
      recomputeLayout('spacing', val);
    }
  };

  return (
    <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
      {/* CAD Cross-Section Graphic Preview */}
      <div className="mx-3.5 mb-1.5 border border-[var(--border-color)] rounded-[6px] flex-1 min-h-[200px] bg-[var(--bg-surface)] overflow-hidden relative z-[1]">
        <CrossSectionPreview />
      </div>

      {/* Inputs Group Box */}
      <div className="card-scroll mx-3.5 mt-1 mb-1.5 border border-[var(--border-color)] rounded-[6px] p-[10px_16px_12px_16px] bg-[var(--bg-surface)] shrink-0">
        <div className="text-xs font-bold text-[var(--text-main)] mb-2">
          Inputs:
        </div>

        <div className="grid grid-cols-2 gap-x-8 gap-y-2">
          {/* No. of Girders */}
          <div className="flex items-center justify-between">
            <label className="text-xs text-[var(--text-main)] min-w-[160px]">
              No. of Girders:
            </label>
            <input
              type="number"
              min="2"
              step="1"
              value={numGirders || ''}
              onChange={(e) => handleGirderChange(e.target.value)}
              className={inputClass}
            />
          </div>

          {/* Girder Spacing */}
          <div className="flex items-center justify-between">
            <label className="text-xs text-[var(--text-main)] min-w-[160px]">
              Girder Spacing (m):
            </label>
            <input
              type="number"
              step="0.01"
              value={girderSpacing ? girderSpacing.toFixed(2) : ''}
              onChange={(e) => handleSpacingChange(e.target.value)}
              className={inputClass}
            />
          </div>

          {/* Deck Overhang Width */}
          <div className="flex items-center justify-between">
            <label className="text-xs text-[var(--text-main)] min-w-[160px]">
              Deck Overhang Width (m):
            </label>
            <input
              type="text"
              readOnly
              value={deckOverhang ? deckOverhang.toFixed(2) : ''}
              className={readOnlyInputClass}
            />
          </div>

          {/* Overall Bridge Width */}
          <div className="flex items-center justify-between">
            <label className="text-xs text-[var(--text-main)] min-w-[160px]">
              Overall Bridge Width (m):
            </label>
            <input
              type="text"
              readOnly
              value={overallBridgeWidth ? overallBridgeWidth.toFixed(2) : ''}
              className={readOnlyInputClass}
            />
          </div>

          {/* Adjustment Notice */}
          {adjustmentMessage && (
            <>
              <div />
              <div className="flex justify-end -mt-0.5">
                <div className="text-[10px] italic text-[var(--text-main)] whitespace-nowrap text-right leading-tight">
                  {adjustmentMessage}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Sub-Tabs Bar */}
        <div className="flex items-end justify-center w-full mt-4 relative z-[2] -mb-px">
          <div className="inline-flex bg-[var(--bg-grouped)] border border-[var(--border-color)] border-b-0 overflow-hidden relative z-[2]">
            {typicalSubTabs.map((st, idx) => {
              const isSelected = activeSubTab === idx;
              const isDisabled = st.disabled;
              return (
                <button
                  key={st.label}
                  ref={st.label === 'Railing' ? railingTabRef : undefined}
                  type="button"
                  disabled={isDisabled}
                  onClick={() => !isDisabled && setActiveSubTab(idx)}
                  className={`px-[18px] py-1.5 text-xs font-bold border-0 text-center whitespace-nowrap transition-colors ${
                    idx < typicalSubTabs.length - 1 ? 'border-r border-[var(--border-color)]' : ''
                  } ${
                    isSelected
                      ? 'bg-[var(--accent-osdag)] text-white border-b-0'
                      : isDisabled
                      ? 'bg-[var(--bg-grouped)] text-[#a8a8a8] border-b border-[var(--border-color)] cursor-not-allowed'
                      : 'bg-[var(--bg-grouped)] text-[var(--text-sub)] border-b border-[var(--border-color)] hover:bg-[var(--bg-grouped)] cursor-pointer'
                  }`}
                >
                  {st.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Sub-Tab Inner Card */}
        <div
          ref={cardRef}
          className="border border-[var(--border-color)] rounded-[6px] p-[12px_18px] mt-0 bg-[var(--bg-surface)] relative z-[1]"
        >
          {activeSubTab === 0 && <DeckDetailsSubTab />}
          {activeSubTab === 1 && <CrashBarrierSubTab />}
          {activeSubTab === 2 && <MedianSubTab />}
          {activeSubTab === 3 && <RailingSubTab />}
          {activeSubTab === 4 && <WearingCourseSubTab />}
        </div>
      </div>
    </div>
  );
};
