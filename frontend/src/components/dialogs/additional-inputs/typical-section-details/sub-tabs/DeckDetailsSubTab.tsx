import React from 'react';
import { useBridgeStore } from '../../../../../store/useBridgeStore';
import { inputClass, readOnlyInputClass } from '../../styles';

export const DeckDetailsSubTab: React.FC = () => {
  const { additionalInputs, updateAdditionalInput } = useBridgeStore();

  const deckThickness = Number(additionalInputs['typical_section.deck_thickness'] ?? 250.0);
  const footpathWidth = Number(additionalInputs['typical_section.footpath_width'] ?? 0.0);
  const footpathThickness = Number(additionalInputs['typical_section.footpath_thickness'] ?? 250.0);

  return (
    <div className="grid grid-cols-2 gap-x-8 gap-y-3">
      <div className="flex items-center justify-between">
        <label className="text-xs text-[var(--text-main)] min-w-[160px]">
          Deck Thickness (mm):
        </label>
        <input
          type="number"
          step="1"
          value={deckThickness ? deckThickness.toFixed(2) : '250.00'}
          onChange={(e) => updateAdditionalInput('typical_section.deck_thickness', parseFloat(e.target.value))}
          className={inputClass}
        />
      </div>

      <div />

      <div className="flex items-center justify-between">
        <label className="text-xs text-[var(--text-main)] min-w-[160px]">
          Footpath Width (m):
        </label>
        <input
          type="text"
          readOnly
          value={footpathWidth ? footpathWidth.toFixed(2) : '0.00'}
          className={readOnlyInputClass}
        />
      </div>

      <div className="flex items-center justify-between">
        <label className="text-xs text-[var(--text-main)] min-w-[160px]">
          Footpath Thickness (mm):
        </label>
        <input
          type="text"
          readOnly
          value={footpathThickness ? footpathThickness.toFixed(2) : '250.00'}
          className={readOnlyInputClass}
        />
      </div>
    </div>
  );
};
