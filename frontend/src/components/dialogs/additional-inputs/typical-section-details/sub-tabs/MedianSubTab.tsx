import React from 'react';
import { useBridgeStore } from '../../../../../store/useBridgeStore';
import { inputClass, selectClass } from '../../styles';

export const MedianSubTab: React.FC = () => {
  const { additionalInputs, updateAdditionalInput } = useBridgeStore();

  return (
    <div className="grid grid-cols-2 gap-x-8 gap-y-2">
      <div className="flex items-center justify-between">
        <label className="text-xs text-black min-w-[160px]">Type:</label>
        <select
          value={additionalInputs['typical_section.median.type'] ?? 'None'}
          onChange={(e) => updateAdditionalInput('typical_section.median.type', e.target.value)}
          className={selectClass}
        >
          <option value="None">None</option>
          <option value="Concrete Barrier">Concrete Barrier</option>
        </select>
      </div>

      <div className="flex items-center justify-between">
        <label className="text-xs text-black min-w-[160px]">Width (m):</label>
        <input
          type="number"
          step="0.01"
          value={Number(additionalInputs['typical_section.median.width'] ?? 0.0).toFixed(2)}
          onChange={(e) => updateAdditionalInput('typical_section.median.width', parseFloat(e.target.value))}
          className={inputClass}
        />
      </div>
    </div>
  );
};
