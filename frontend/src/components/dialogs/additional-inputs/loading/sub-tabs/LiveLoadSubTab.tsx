import React from 'react';
import { useBridgeStore } from '../../../../../store/useBridgeStore';
import { inputClass, selectClass } from '../../styles';
import { LoadDescriptionPanel } from './LoadDescriptionPanel';
import { OsdagCheckbox } from '../../OsdagCheckbox';

export const LiveLoadSubTab: React.FC = () => {
  const { additionalInputs, updateAdditionalInput } = useBridgeStore();

  const vehicles = [
    { id: 'loading.live_load.irc.class_a', label: 'Class A' },
    { id: 'loading.live_load.irc.aa_wheeled', label: 'Class AA Wheeled' },
    { id: 'loading.live_load.irc.aa_tracked', label: 'Class AA Tracked' },
    { id: 'loading.live_load.irc.70r_wheeled', label: 'Class 70R Wheeled' },
    { id: 'loading.live_load.irc.70r_tracked', label: 'Class 70R Tracked' },
    { id: 'loading.live_load.irc.70r_bogie', label: 'Class 70R Bogie' },
    { id: 'loading.live_load.irc.class_sv', label: 'Class SV' },
    { id: 'loading.live_load.irc.class_fatigue', label: 'Class Fatigue' },
  ];

  const brakingSv = additionalInputs['bl_irc_class_sv'] ?? true;
  const eccentricity = additionalInputs['loading.live_load.eccentricity'] ?? '1.20';
  const fpPressureMode = additionalInputs['loading.live_load.footpath_pressure.mode'] ?? 'As per IRC 6';
  const fpPressureVal = additionalInputs['loading.live_load.footpath_pressure.value'] ?? '';

  return (
    <div className="flex gap-4 h-full min-h-0">
      {/* Left Column */}
      <div className="card-scroll flex-[1.2] min-w-0 flex flex-col gap-3 overflow-y-auto pr-1">
        {/* Vehicles from IRC 6 */}
        <div className="border border-[#c0c0c0] rounded-[6px] p-[12px_16px] bg-white">
          <div className="text-xs font-bold text-black mb-2.5">
            Vehicles from IRC 6
          </div>
          <div className="flex flex-col gap-2">
            {vehicles.map((v) => {
              const checked = additionalInputs[v.id] ?? true;
              return (
                <div
                  key={v.id}
                  onClick={() => updateAdditionalInput(v.id, !checked)}
                  className="flex items-center justify-between cursor-pointer"
                >
                  <label className="text-xs text-black cursor-pointer select-none">
                    {v.label}
                  </label>
                  <div className="w-[186px] flex items-center">
                    <OsdagCheckbox
                      checked={Boolean(checked)}
                      onChange={(val) => updateAdditionalInput(v.id, val)}
                      ariaLabel={v.label}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Braking Load from Vehicles */}
        <div className="border border-[#c0c0c0] rounded-[6px] p-[12px_16px] bg-white">
          <div className="text-xs font-bold text-black mb-2.5">
            Braking Load from Vehicles
          </div>
          <div className="flex flex-col gap-2.5">
            <div
              onClick={() => updateAdditionalInput('bl_irc_class_sv', !brakingSv)}
              className="flex items-center justify-between cursor-pointer"
            >
              <label className="text-xs text-black cursor-pointer select-none">
                Class SV
              </label>
              <div className="w-[186px] flex items-center">
                <OsdagCheckbox
                  checked={Boolean(brakingSv)}
                  onChange={(val) => updateAdditionalInput('bl_irc_class_sv', val)}
                  ariaLabel="Class SV"
                />
              </div>
            </div>

            <div className="flex items-center justify-between">
              <label className="text-xs text-black">
                Eccentricity from top of Deck (m)
              </label>
              <input
                type="text"
                value={eccentricity}
                onChange={(e) => updateAdditionalInput('loading.live_load.eccentricity', e.target.value)}
                className={inputClass}
              />
            </div>
          </div>
        </div>

        {/* Footpath Pressure */}
        <div className="border border-[#c0c0c0] rounded-[6px] p-[12px_16px] bg-white">
          <div className="flex items-center justify-between">
            <label className="text-xs text-black">
              Footpath Pressure (kN/mm²)
            </label>
            <div className="w-[186px] flex items-center gap-1.5 justify-end">
              <select
                value={fpPressureMode}
                onChange={(e) => updateAdditionalInput('loading.live_load.footpath_pressure.mode', e.target.value)}
                className={`${selectClass} ${fpPressureMode === 'Custom' ? '!w-[105px]' : '!w-[186px]'}`}
              >
                <option value="As per IRC 6">As per IRC 6</option>
                <option value="Custom">Custom</option>
              </select>

              {fpPressureMode === 'Custom' && (
                <input
                  type="text"
                  value={fpPressureVal}
                  onChange={(e) => updateAdditionalInput('loading.live_load.footpath_pressure.value', e.target.value)}
                  placeholder=""
                  className={`${inputClass} !w-[75px]`}
                />
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Right Column: Description Panel */}
      <LoadDescriptionPanel title="Live Load (LL)">
        <p className="mb-[1px]">IRC Vehicles:</p>
        <p className="mb-2">
          Live load considers standard IRC 6 vehicle classes: Class A, Class 70R (Wheeled, Tracked,
          Bogie), Class AA (Wheeled, Tracked), Class SV (Special Vehicle), and Fatigue vehicle. Only
          checked vehicles are included in the analysis.
        </p>

        <p className="mb-[1px]">Braking Load (IRC 6 Cl. 211.2):</p>
        <p className="mb-[1px]">
          Braking forces are derived from the live load. For single- or two-lane bridges: 20% of the
          first train of load plus 10% of succeeding trains in one lane.
        </p>
        <p className="mb-[1px]">
          For bridges with more than two lanes: as above for the first two lanes, plus 5% for each
          additional lane.
        </p>
        <p className="mb-2">
          Class SV does not require a braking load by default, but a checkbox is provided if the user
          wishes to include it.
        </p>

        <p className="mb-[1px]">Braking Load Eccentricity:</p>
        <p className="mb-2">
          As per IRC 6, braking load acts as a horizontal longitudinal force applied at 1.2 m above the
          top of the deck surface.
        </p>

        <p className="mb-[1px]">Footpath Pressure:</p>
        <p className="m-0">
          Footpath live load is applied as a uniform pressure per IRC 6. The default value follows the
          code; the user can switch to 'User-defined' to enter a custom value.
        </p>
      </LoadDescriptionPanel>
    </div>
  );
};
