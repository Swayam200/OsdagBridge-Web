import React, { useState } from 'react';
import { useBridgeStore } from '../../../../../store/useBridgeStore';
import { LoadDescriptionPanel } from './LoadDescriptionPanel';
import { OsdagCheckbox } from '../../OsdagCheckbox';
import { AddLoadCombinationModal } from './AddLoadCombinationModal';

interface CombinationItem {
  id: string;
  name: string;
  expr: string;
}

const DEFAULT_COMBINATIONS: CombinationItem[] = [
  { id: 'Basic_1', name: 'Basic_1', expr: '1.35DL + 1.75DW + 1.5LL + 0.9WL + 0.9TL' },
  { id: 'Basic_2', name: 'Basic_2', expr: '1.0DL + 1.0DW + 1.5LL + 0.9WL + 0.9TL' },
  { id: 'Basic_3', name: 'Basic_3', expr: '1.35DL + 1.75DW + 1.15LL + 1.5WL + 0.9TL' },
  { id: 'Basic_4', name: 'Basic_4', expr: '1.0DL + 1.0DW + 1.15LL + 1.5WL + 0.9TL' },
  { id: 'Basic_5', name: 'Basic_5', expr: '1.35DL + 1.75DW + 1.15LL + 0.9WL + 1.5TL' },
  { id: 'Basic_6', name: 'Basic_6', expr: '1.0DL + 1.0DW + 1.15LL + 0.9WL + 1.5TL' },
  { id: 'Accidental_1', name: 'Accidental_1', expr: '1.0DL + 1.0DW + 0.75LL + 0.5TL + 1.0VC' },
  { id: 'Accidental_2', name: 'Accidental_2', expr: '1.0DL + 1.0DW + 0.75LL + 0.5TL + 1.0BI' },
  { id: 'Accidental_3', name: 'Accidental_3', expr: '1.0DL + 1.0DW + 0.75LL + 0.5TL + 1.0FB' },
  { id: 'Seismic_1', name: 'Seismic_1', expr: '1.35DL + 1.75DW + 0.2LL + 0.5TL + 1.5EL' },
  { id: 'Seismic_2', name: 'Seismic_2', expr: '1.0DL + 1.0DW + 0.2LL + 0.5TL + 1.5EL' },
  { id: 'Seismic_3', name: 'Seismic_3', expr: '1.35DL + 1.75DW + 0.2LL + 0.5TL + 0.75EL' },
  { id: 'Seismic_4', name: 'Seismic_4', expr: '1.0DL + 1.0DW + 0.2LL + 0.5TL + 0.75EL' },
  { id: 'Rare_1', name: 'Rare_1', expr: '1.0DL + 1.2DW + 1.0LL + 0.6WL + 0.6TL' },
  { id: 'Rare_2', name: 'Rare_2', expr: '1.0DL + 1.0DW + 1.0LL + 0.6WL + 0.6TL' },
  { id: 'Rare_3', name: 'Rare_3', expr: '1.0DL + 1.2DW + 0.75LL + 1.0WL + 0.6TL' },
  { id: 'Rare_4', name: 'Rare_4', expr: '1.0DL + 1.0DW + 0.75LL + 1.0WL + 0.6TL' },
  { id: 'Rare_5', name: 'Rare_5', expr: '1.0DL + 1.2DW + 0.75LL + 0.6WL + 1.0TL' },
  { id: 'Rare_6', name: 'Rare_6', expr: '1.0DL + 1.0DW + 0.75LL + 0.6WL + 1.0TL' },
  { id: 'Frequent_1', name: 'Frequent_1', expr: '1.0DL + 1.2DW + 0.75LL + 0.5WL + 0.5TL' },
  { id: 'Frequent_2', name: 'Frequent_2', expr: '1.0DL + 1.0DW + 0.75LL + 0.5WL + 0.5TL' },
  { id: 'Frequent_3', name: 'Frequent_3', expr: '1.0DL + 1.2DW + 0.2LL + 0.6WL + 0.5TL' },
  { id: 'Frequent_4', name: 'Frequent_4', expr: '1.0DL + 1.0DW + 0.2LL + 0.6WL + 0.5TL' },
  { id: 'Frequent_5', name: 'Frequent_5', expr: '1.0DL + 1.2DW + 0.2LL + 0.5WL + 0.6TL' },
  { id: 'Frequent_6', name: 'Frequent_6', expr: '1.0DL + 1.0DW + 0.2LL + 0.5WL + 0.6TL' },
  { id: 'Quasi-Permanent_1', name: 'Quasi-Permanent_1', expr: '1.0DL + 1.2DW + 0.5TL' },
  { id: 'Quasi-Permanent_2', name: 'Quasi-Permanent_2', expr: '1.0DL + 1.0DW + 0.5TL' },
];

export const LoadCombinationSubTab: React.FC = () => {
  const { additionalInputs, updateAdditionalInput } = useBridgeStore();
  const [isAddingCustom, setIsAddingCustom] = useState(false);

  const customCombos: CombinationItem[] =
    additionalInputs['loading.load_combination.custom_combos'] || [];

  const handleToggle = (comboId: string, currentVal: boolean) => {
    updateAdditionalInput(`loading.load_combination.${comboId}`, !currentVal);
  };

  const handleSaveCustom = (newCombo: { name: string; expr: string }) => {
    const id = newCombo.name;
    const updatedList = [
      ...customCombos.filter((c) => c.name !== newCombo.name),
      { id, name: newCombo.name, expr: newCombo.expr },
    ];
    updateAdditionalInput('loading.load_combination.custom_combos', updatedList);
    updateAdditionalInput(`loading.load_combination.${id}`, true);
  };

  return (
    <div className="flex gap-4 h-full min-h-0">
      {/* Left Column */}
      <div className="hide-scrollbar flex-[1.2] min-w-0 flex flex-col gap-3 h-full overflow-y-auto pr-0.5 pb-2">
        {/* Load Combinations from IRC 6 */}
        <div className="border border-[var(--border-color)] rounded-[6px] p-[12px_16px] bg-[var(--bg-surface)] flex flex-col">
          <div className="text-xs font-bold text-[var(--text-main)] mb-2.5">
            Load Combinations from IRC 6
          </div>

          <div className="flex flex-col gap-1.5">
            {DEFAULT_COMBINATIONS.map((c) => {
              const checked = additionalInputs[`loading.load_combination.${c.id}`] ?? true;
              return (
                <div
                  key={c.id}
                  onClick={() => handleToggle(c.id, Boolean(checked))}
                  className="flex items-center justify-between p-[4px_2px] cursor-pointer rounded-[3px] transition-colors hover:bg-[#f7f7f7]"
                >
                  <label className="text-[11.5px] text-[var(--text-main)] cursor-pointer select-none font-sans pr-3">
                    {c.name} : {c.expr}
                  </label>
                  <div className="w-10 flex items-center justify-center">
                    <OsdagCheckbox
                      checked={Boolean(checked)}
                      onChange={() => handleToggle(c.id, Boolean(checked))}
                      ariaLabel={c.name}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Add Custom Combination Box */}
        <div className="border border-[var(--border-color)] rounded-[6px] p-[12px_16px] bg-[var(--bg-surface)]">
          <button
            type="button"
            onClick={() => setIsAddingCustom(true)}
            className={`bg-[var(--bg-surface)] hover:bg-[var(--bg-grouped)] border border-[#757575] rounded-[4px] p-[5px_14px] text-[11.5px] font-semibold text-[var(--text-sub)] cursor-pointer transition-colors ${
              customCombos.length > 0 ? 'mb-3' : 'mb-0'
            }`}
          >
            Add Custom Combination
          </button>

          {/* Custom combinations created by user */}
          {customCombos.length > 0 && (
            <div className="flex flex-col gap-1.5">
              {customCombos.map((c) => {
                const checked = additionalInputs[`loading.load_combination.${c.id}`] ?? true;
                const displayText = c.expr && c.expr !== c.name ? `${c.name} : ${c.expr}` : c.name;
                return (
                  <div
                    key={c.id}
                    onClick={() => handleToggle(c.id, Boolean(checked))}
                    className="flex items-center justify-between p-[4px_2px] cursor-pointer rounded-[3px] transition-colors hover:bg-[#f7f7f7]"
                  >
                    <label className="text-[11.5px] text-[var(--text-main)] cursor-pointer select-none font-sans pr-3">
                      {displayText}
                    </label>
                    <div className="w-10 flex items-center justify-center">
                      <OsdagCheckbox
                        checked={Boolean(checked)}
                        onChange={() => handleToggle(c.id, Boolean(checked))}
                        ariaLabel={c.name}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Add Load Combination Dialog */}
      <AddLoadCombinationModal
        isOpen={isAddingCustom}
        onClose={() => setIsAddingCustom(false)}
        onSave={handleSaveCustom}
      />

      {/* Right Column: Description Panel */}
      <LoadDescriptionPanel title="Load Combinations (IRC 6)">
        <p className="mb-0.5">
          Load combinations are formed per IRC 6 Table B.1. The following load cases are considered:
        </p>
        <p className="mb-[1px]">SW: Self-weight of steel girder</p>
        <p className="mb-[1px]">
          DC: Weight of structural steel components other than the girder, including cross bracing and end diaphragms
        </p>
        <p className="mb-[1px]">DD: Deck weight</p>
        <p className="mb-[1px]">DW: Wearing course</p>
        <p className="mb-[1px]">SIDL: Crash barriers, median, railing</p>
        <p className="mb-[1px]">LL: Live load</p>
        <p className="mb-[1px]">WL: Wind load</p>
        <p className="mb-[1px]">EL: Seismic / earthquake load</p>
        <p className="mb-2">TL: Temperature load</p>

        <p className="mb-0.5">IRC 6 combination types:</p>
        <p className="mb-[1px]">- Basic combination</p>
        <p className="mb-[1px]">- Accidental combination</p>
        <p className="mb-[1px]">- Seismic combination</p>
        <p className="mb-[1px]">- Frequent combination</p>
        <p className="mb-[1px]">- Rare combination</p>
        <p className="mb-2">- Quasi-permanent combination</p>

        <p className="m-0">
          Custom load combinations with user-defined partial safety factors can also be added.
        </p>
      </LoadDescriptionPanel>
    </div>
  );
};
