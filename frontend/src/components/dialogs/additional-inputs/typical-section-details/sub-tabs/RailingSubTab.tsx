import React from 'react';
import { useBridgeStore } from '../../../../../store/useBridgeStore';
import { inputClass, selectClass } from '../../styles';

export const RailingSubTab: React.FC = () => {
  const { additionalInputs, updateAdditionalInput } = useBridgeStore();

  return (
    <div className="grid grid-cols-2 gap-x-8 gap-y-2">
      <div className="flex items-center justify-between">
        <label className="text-xs text-[var(--text-main)] min-w-[160px]">Type:</label>
        <select
          value={additionalInputs['typical_section.railing.type'] ?? 'IRC 5 - RCC Railing'}
          onChange={(e) => updateAdditionalInput('typical_section.railing.type', e.target.value)}
          className={selectClass}
        >
          <option value="IRC 5 - RCC Railing">IRC 5 - RCC Railing</option>
          <option value="IRC 5 - Steel Railing">IRC 5 - Steel Railing</option>
        </select>
      </div>

      <div className="flex items-center justify-between">
        <label className="text-xs text-[var(--text-main)] min-w-[160px]">Height (m):</label>
        <input
          type="number"
          step="0.01"
          value={Number(additionalInputs['typical_section.railing.height'] ?? 1.1).toFixed(2)}
          onChange={(e) => updateAdditionalInput('typical_section.railing.height', parseFloat(e.target.value))}
          className={inputClass}
        />
      </div>
    </div>
  );
};
