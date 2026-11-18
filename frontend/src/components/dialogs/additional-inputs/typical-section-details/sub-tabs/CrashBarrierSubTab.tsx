import React from 'react';
import { useBridgeStore } from '../../../../../store/useBridgeStore';
import { inputClass, readOnlyInputClass, selectClass } from '../../styles';

export const CrashBarrierSubTab: React.FC = () => {
  const { additionalInputs, updateAdditionalInput } = useBridgeStore();

  const cbType = additionalInputs['typical_section.crash_barrier.type'] ?? 'IRC 5 - RCC Crash Barrier';
  const isCustom = cbType === 'Custom';
  const isMetallic = cbType.includes('Metallic');

  const cbDensity = additionalInputs['typical_section.crash_barrier.density'] ?? 25.0;
  const cbWidth = Number(additionalInputs['typical_section.crash_barrier.width'] ?? 0.450);
  const cbHeight = Number(additionalInputs['typical_section.crash_barrier.height'] ?? 1.100);
  const cbArea = additionalInputs['typical_section.crash_barrier.area'] ?? 302282.7680;
  const cbLoad = Number(additionalInputs['typical_section.crash_barrier.load'] ?? 7.56);
  const cbPostSpacing = Number(additionalInputs['typical_section.crash_barrier.post_spacing'] ?? 2.0);

  const handleCbTypeChange = (newType: string) => {
    updateAdditionalInput('typical_section.crash_barrier.type', newType);
    if (newType === 'IRC 5 - RCC Crash Barrier') {
      updateAdditionalInput('typical_section.crash_barrier.density', 25.0);
      updateAdditionalInput('typical_section.crash_barrier.width', 0.450);
      updateAdditionalInput('typical_section.crash_barrier.height', 1.100);
      updateAdditionalInput('typical_section.crash_barrier.area', 302282.7680);
      updateAdditionalInput('typical_section.crash_barrier.load', 7.56);
    } else if (newType === 'IRC 5 - High Containment RCC Crash Barrier') {
      updateAdditionalInput('typical_section.crash_barrier.density', 25.0);
      updateAdditionalInput('typical_section.crash_barrier.width', 0.550);
      updateAdditionalInput('typical_section.crash_barrier.height', 1.550);
      updateAdditionalInput('typical_section.crash_barrier.area', 0.4586);
      updateAdditionalInput('typical_section.crash_barrier.load', 11.47);
    } else if (newType === 'IRC 5 - Metallic Crash Barrier with Single W-Beam') {
      updateAdditionalInput('typical_section.crash_barrier.width', 0.450);
      updateAdditionalInput('typical_section.crash_barrier.height', 1.050);
      updateAdditionalInput('typical_section.crash_barrier.post_spacing', 2);
      updateAdditionalInput('typical_section.crash_barrier.load', 1.70);
    } else if (newType === 'IRC 5 - Metallic Crash Barrier with Double W-Beam') {
      updateAdditionalInput('typical_section.crash_barrier.width', 0.450);
      updateAdditionalInput('typical_section.crash_barrier.height', 1.050);
      updateAdditionalInput('typical_section.crash_barrier.post_spacing', 2);
      updateAdditionalInput('typical_section.crash_barrier.load', 1.87);
    } else if (newType === 'Custom') {
      if (additionalInputs['typical_section.crash_barrier.density'] === undefined) {
        updateAdditionalInput('typical_section.crash_barrier.density', 25);
      }
      if (additionalInputs['typical_section.crash_barrier.width'] === undefined) {
        updateAdditionalInput('typical_section.crash_barrier.width', 0.45);
      }
      if (additionalInputs['typical_section.crash_barrier.height'] === undefined) {
        updateAdditionalInput('typical_section.crash_barrier.height', 1.05);
      }
      if (additionalInputs['typical_section.crash_barrier.area'] === undefined) {
        updateAdditionalInput('typical_section.crash_barrier.area', 302282.7680);
      }
      if (additionalInputs['typical_section.crash_barrier.load'] === undefined) {
        updateAdditionalInput('typical_section.crash_barrier.load', 7.56);
      }
    }
  };

  return (
    <div className="flex flex-col gap-2 pt-1">
      {/* Type */}
      <div className="flex items-center">
        <div className="w-[200px] shrink-0">
          <label className="text-xs font-bold text-black">
            Type:
          </label>
        </div>
        <select
          value={cbType}
          onChange={(e) => handleCbTypeChange(e.target.value)}
          className={selectClass}
        >
          <option value="IRC 5 - RCC Crash Barrier">IRC 5 - RCC Crash Barrier</option>
          <option value="IRC 5 - High Containment RCC Crash Barrier">IRC 5 - High Containment RCC Crash Barrier</option>
          <option value="IRC 5 - Metallic Crash Barrier with Single W-Beam">IRC 5 - Metallic Crash Barrier with Single W-Beam</option>
          <option value="IRC 5 - Metallic Crash Barrier with Double W-Beam">IRC 5 - Metallic Crash Barrier with Double W-Beam</option>
          <option value="Custom">Custom</option>
        </select>
      </div>

      {/* Material Density (kN/m³) */}
      {!isMetallic && (
        <div className="flex items-center">
          <div className="w-[200px] shrink-0">
            <label className="text-xs font-bold text-black">
              Material Density (kN/m³):
            </label>
          </div>
          <input
            type={isCustom ? 'number' : 'text'}
            readOnly={!isCustom}
            value={isCustom ? (cbDensity ?? 25) : '25.0'}
            onChange={(e) => updateAdditionalInput('typical_section.crash_barrier.density', parseFloat(e.target.value))}
            className={isCustom ? inputClass : readOnlyInputClass}
          />
        </div>
      )}

      {/* Width (m) */}
      <div className="flex items-center">
        <div className="w-[200px] shrink-0">
          <label className="text-xs font-bold text-black">
            Width (m):
          </label>
        </div>
        <input
          type={isCustom ? 'number' : 'text'}
          step="0.01"
          readOnly={!isCustom}
          value={isCustom ? (cbWidth ?? 0.45) : (cbType === 'IRC 5 - High Containment RCC Crash Barrier' ? '0.550' : '0.450')}
          onChange={(e) => updateAdditionalInput('typical_section.crash_barrier.width', parseFloat(e.target.value))}
          className={isCustom ? inputClass : readOnlyInputClass}
        />
      </div>

      {/* Height (m) */}
      <div className="flex items-center">
        <div className="w-[200px] shrink-0">
          <label className="text-xs font-bold text-black">
            Height (m):
          </label>
        </div>
        <input
          type={isCustom ? 'number' : 'text'}
          step="0.01"
          readOnly={!isCustom}
          value={isCustom ? (cbHeight ?? 1.10) : (cbType === 'IRC 5 - High Containment RCC Crash Barrier' ? '1.550' : '1.100')}
          onChange={(e) => updateAdditionalInput('typical_section.crash_barrier.height', parseFloat(e.target.value))}
          className={isCustom ? inputClass : readOnlyInputClass}
        />
      </div>

      {/* Area (m²) */}
      {!isMetallic && (
        <div className="flex items-center">
          <div className="w-[200px] shrink-0">
            <label className="text-xs font-bold text-black">
              Area (m²):
            </label>
          </div>
          <input
            type={isCustom ? 'number' : 'text'}
            step="0.0001"
            readOnly={!isCustom}
            value={
              isCustom
                ? (cbArea ?? 302282.7680)
                : cbType === 'IRC 5 - RCC Crash Barrier'
                ? '302282.7680'
                : cbType === 'IRC 5 - High Containment RCC Crash Barrier'
                ? '0.4586'
                : Number(cbArea).toFixed(4)
            }
            onChange={(e) => updateAdditionalInput('typical_section.crash_barrier.area', parseFloat(e.target.value))}
            className={isCustom ? inputClass : readOnlyInputClass}
          />
        </div>
      )}

      {/* Load (kN/m) */}
      <div className="flex items-center">
        <div className="w-[200px] shrink-0">
          <label className="text-xs font-bold text-black">
            Load (kN/m):
          </label>
        </div>
        <input
          type={isCustom ? 'number' : 'text'}
          step="0.01"
          readOnly={!isCustom}
          value={
            isCustom
              ? (cbLoad ?? 7.56)
              : cbType === 'IRC 5 - RCC Crash Barrier'
              ? '7.56'
              : cbType === 'IRC 5 - High Containment RCC Crash Barrier'
              ? '11.47'
              : Number(cbLoad).toFixed(2)
          }
          onChange={(e) => updateAdditionalInput('typical_section.crash_barrier.load', parseFloat(e.target.value))}
          className={isCustom ? inputClass : readOnlyInputClass}
        />
      </div>

      {/* Spacing between Posts (m) for metallic */}
      {isMetallic && (
        <div className="flex items-center">
          <div className="w-[200px] shrink-0">
            <label className="text-xs font-bold text-black">
              Spacing between Posts (m):
            </label>
          </div>
          <input
            type="number"
            step="0.1"
            value={cbPostSpacing ?? 2}
            onChange={(e) => updateAdditionalInput('typical_section.crash_barrier.post_spacing', parseFloat(e.target.value))}
            className={inputClass}
          />
        </div>
      )}
    </div>
  );
};
