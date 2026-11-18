import React from 'react';
import { useBridgeStore } from '../../../../../store/useBridgeStore';
import { inputClass, readOnlyInputClass } from '../../styles';
import { LoadDescriptionPanel } from './LoadDescriptionPanel';

export const TemperatureLoadSubTab: React.FC = () => {
  const { additionalInputs, updateAdditionalInput } = useBridgeStore();

  const maxTemp = additionalInputs['loading.temperature_load.highest_max_temp'] ?? '36.4';
  const minTemp = additionalInputs['loading.temperature_load.lowest_min_temp'] ?? '14.6';
  const steelCoeff = additionalInputs['loading.temperature_load.thermal_coeff_steel'] ?? '11.7';
  const rccCoeff = additionalInputs['loading.temperature_load.thermal_coeff_rcc'] ?? '11.7';

  return (
    <div className="flex gap-4 h-full min-h-0">
      {/* Left Column */}
      <div className="card-scroll flex-[1.2] min-w-0 flex flex-col gap-3 overflow-y-auto pr-1">
        {/* Temperature Load (TL) Inputs for Evaluation per IRC6 */}
        <div className="border border-[#c0c0c0] rounded-[6px] p-[12px_16px] bg-white">
          <div className="text-xs font-bold text-black mb-2.5">
            Temperature Load (TL) Inputs for Evaluation per IRC6
          </div>
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <label className="text-xs text-black">Highest Maximum Air Temperature (°C)</label>
              <input type="text" readOnly value={maxTemp} className={readOnlyInputClass} />
            </div>

            <div className="flex items-center justify-between">
              <label className="text-xs text-black">Lowest Minimum Air Temperature (°C)</label>
              <input type="text" readOnly value={minTemp} className={readOnlyInputClass} />
            </div>

            <div className="flex items-center justify-between">
              <label className="text-xs text-black">
                Coefficient of Thermal Expansion for Steel (×10⁻⁶/°C)
              </label>
              <input
                type="text"
                value={steelCoeff}
                onChange={(e) => updateAdditionalInput('loading.temperature_load.thermal_coeff_steel', e.target.value)}
                className={inputClass}
              />
            </div>

            <div className="flex items-center justify-between">
              <label className="text-xs text-black">
                Coefficient of Thermal Expansion for RCC (×10⁻⁶/°C)
              </label>
              <input
                type="text"
                value={rccCoeff}
                onChange={(e) => updateAdditionalInput('loading.temperature_load.thermal_coeff_rcc', e.target.value)}
                className={inputClass}
              />
            </div>
          </div>
        </div>

        {/* Range of Effective Bridge Temperature */}
        <div className="border border-[#c0c0c0] rounded-[6px] p-[12px_16px] bg-white">
          <div className="text-xs font-bold text-black mb-2.5">
            Range of Effective Bridge Temperature
          </div>
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <label className="text-xs text-black">Minimum (°C)</label>
              <input type="text" readOnly value="4.60" className={readOnlyInputClass} />
            </div>

            <div className="flex items-center justify-between">
              <label className="text-xs text-black">Maximum (°C)</label>
              <input type="text" readOnly value="51.40" className={readOnlyInputClass} />
            </div>
          </div>
        </div>

        {/* Temperature for Design */}
        <div className="border border-[#c0c0c0] rounded-[6px] p-[12px_16px] bg-white">
          <div className="text-xs font-bold text-black mb-2.5">
            Temperature for Design
          </div>
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <label className="text-xs text-black">Rise (°C)</label>
              <input type="text" readOnly value="23.40" className={readOnlyInputClass} />
            </div>

            <div className="flex items-center justify-between">
              <label className="text-xs text-black">Fall (°C)</label>
              <input type="text" readOnly value="23.40" className={readOnlyInputClass} />
            </div>
          </div>
        </div>
      </div>

      {/* Right Column: Description Panel */}
      <LoadDescriptionPanel title="Temperature Load (TL)">
        <p className="mb-2">
          Highest maximum and lowest minimum air shade temperatures are auto-filled from the project location (per IRC 6 Annex B meteorological data).
        </p>

        <p className="mb-[1px]">Coefficient of thermal expansion (α):</p>
        <p className="mb-2">
          Governs the unit change in length per degree Celsius. IRC 6 Cl. 215 specifies 12 x 10⁻⁶ /°C for steel and 12 x 10⁻⁶ /°C for RCC; values may be revised if site-specific material data is available. Both coefficients are user-editable.
        </p>

        <p className="mb-[1px]">Range of effective bridge temperature (EBT):</p>
        <p className="mb-2">
          The effective bridge temperature is the uniform temperature through the depth of the bridge cross-section at any instant. The minimum and maximum EBT values are derived from the air shade temperatures using IRC 6 Cl. 215. These are computed automatically and shown read-only.
        </p>

        <p className="mb-[1px]">Temperature for design:</p>
        <p className="mb-[1px]">• Temperature Rise = Maximum EBT – Mean temperature</p>
        <p className="mb-[1px]">• Temperature Fall = Mean temperature – Minimum EBT</p>
        <p className="m-0">
          The Mean temperature is the midpoint of min and max air shade temperatures. The rise and fall values are used to compute thermal expansion and contraction forces, and longitudinal effects throughout the analysis.
        </p>
      </LoadDescriptionPanel>
    </div>
  );
};
