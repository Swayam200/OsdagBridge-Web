import React from 'react';
import { useBridgeStore } from '../../../../../store/useBridgeStore';
import { inputClass, readOnlyInputClass, selectClass } from '../../styles';

export const WearingCourseSubTab: React.FC = () => {
  const { additionalInputs, updateAdditionalInput } = useBridgeStore();

  const wcMaterial = additionalInputs['typical_section.wearing_course.material'] ?? 'Concrete';
  const isWcCustom = wcMaterial === 'Custom';
  const wcDensity = additionalInputs['typical_section.wearing_course.density'] ?? (wcMaterial === 'Bituminous' ? 24.0 : 25.0);
  const wcThickness = additionalInputs['typical_section.wearing_course.thickness'] ?? 50.0;

  const handleWcMaterialChange = (newMat: string) => {
    updateAdditionalInput('typical_section.wearing_course.material', newMat);
    if (newMat === 'Concrete') {
      updateAdditionalInput('typical_section.wearing_course.density', 25.0);
    } else if (newMat === 'Bituminous') {
      updateAdditionalInput('typical_section.wearing_course.density', 24.0);
    }
  };

  return (
    <div className="flex flex-col gap-2 pt-1">
      {/* Material */}
      <div className="flex items-center">
        <div className="w-[200px] shrink-0">
          <label className="text-xs font-bold text-black">
            Material:
          </label>
        </div>
        <select
          value={wcMaterial}
          onChange={(e) => handleWcMaterialChange(e.target.value)}
          className={selectClass}
        >
          <option value="Concrete">Concrete</option>
          <option value="Bituminous">Bituminous</option>
          <option value="Custom">Custom</option>
        </select>
      </div>

      {/* Density (kN/m³) */}
      <div className="flex items-center">
        <div className="w-[200px] shrink-0">
          <label className="text-xs font-bold text-black">
            Density (kN/m³):
          </label>
        </div>
        <input
          type={isWcCustom ? 'number' : 'text'}
          step="0.1"
          readOnly={!isWcCustom}
          value={isWcCustom ? wcDensity : (wcMaterial === 'Bituminous' ? '24.0' : '25.0')}
          onChange={(e) => updateAdditionalInput('typical_section.wearing_course.density', parseFloat(e.target.value))}
          className={isWcCustom ? inputClass : readOnlyInputClass}
        />
      </div>

      {/* Thickness (mm) */}
      <div className="flex items-center">
        <div className="w-[200px] shrink-0">
          <label className="text-xs font-bold text-black">
            Thickness (mm):
          </label>
        </div>
        <input
          type="number"
          step="1"
          value={Number(wcThickness).toFixed(2)}
          onChange={(e) => updateAdditionalInput('typical_section.wearing_course.thickness', parseFloat(e.target.value))}
          className={inputClass}
        />
      </div>
    </div>
  );
};
