import React, { useState } from 'react';
import { PermanentLoadSubTab } from './sub-tabs/PermanentLoadSubTab';
import { LiveLoadSubTab } from './sub-tabs/LiveLoadSubTab';
import { SeismicLoadSubTab } from './sub-tabs/SeismicLoadSubTab';
import { WindLoadSubTab } from './sub-tabs/WindLoadSubTab';
import { TemperatureLoadSubTab } from './sub-tabs/TemperatureLoadSubTab';
import { LoadCombinationSubTab } from './sub-tabs/LoadCombinationSubTab';

export const LoadingTab: React.FC = () => {
  const [activeSubTab, setActiveSubTab] = useState(0);

  const subTabs = [
    { label: 'Permanent Load', disabled: false },
    { label: 'Live Lo...', tooltip: 'Live Load', disabled: false },
    { label: 'Seismic Load', disabled: false },
    { label: 'Wind Load', disabled: false },
    { label: 'Temperature Load', disabled: false },
    { label: 'Custom Lo...', tooltip: 'Custom Load (coming soon)', disabled: true },
    { label: 'Load Combination', tooltip: 'Load Combination', disabled: false },
  ];

  return (
    <div className="flex-1 flex flex-col min-h-0 mx-3.5 mb-1.5 overflow-hidden">
      {/* Sub-tabs bar */}
      <div className="flex items-stretch bg-[#2b2b2b] border border-[var(--border-color)] border-b-0 h-8 shrink-0">
        {subTabs.map((tab, idx) => {
          const isSelected = activeSubTab === idx;
          const isDisabled = tab.disabled;

          return (
            <button
              key={tab.label}
              type="button"
              disabled={isDisabled}
              onClick={() => !isDisabled && setActiveSubTab(idx)}
              title={tab.tooltip || tab.label}
              className={`px-4 text-[11.5px] font-bold font-sans border-0 border-r border-[var(--border-color)] whitespace-nowrap transition-colors flex items-center justify-center select-none ${
                isSelected
                  ? 'bg-[var(--accent-osdag)] text-white'
                  : isDisabled
                  ? 'bg-[var(--bg-surface)] text-[#9e9e9e] cursor-not-allowed'
                  : 'bg-[var(--bg-surface)] text-[var(--text-sub)] hover:bg-[var(--bg-grouped)] cursor-pointer'
              }`}
            >
              {tab.label}
            </button>
          );
        })}
        {/* Dark spacer filling the rest of the tab bar */}
        <div className="flex-1" />
      </div>

      {/* Sub-tab content */}
      <div className="flex-1 min-h-0 border border-[var(--border-color)] p-3.5 bg-[var(--bg-surface)] flex flex-col overflow-hidden">
        {activeSubTab === 0 && <PermanentLoadSubTab />}
        {activeSubTab === 1 && <LiveLoadSubTab />}
        {activeSubTab === 2 && <SeismicLoadSubTab />}
        {activeSubTab === 3 && <WindLoadSubTab />}
        {activeSubTab === 4 && <TemperatureLoadSubTab />}
        {activeSubTab === 6 && <LoadCombinationSubTab />}
      </div>
    </div>
  );
};
