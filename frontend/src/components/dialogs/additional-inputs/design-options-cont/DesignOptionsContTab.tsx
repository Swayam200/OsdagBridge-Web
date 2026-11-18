import React from 'react';
import { useBridgeStore } from '../../../../store/useBridgeStore';
import { inputClass, selectClass } from '../styles';
import { LoadDescriptionPanel } from '../loading/sub-tabs/LoadDescriptionPanel';
import { OsdagCheckbox } from '../OsdagCheckbox';

export const DesignOptionsContTab: React.FC = () => {
  const { additionalInputs, updateAdditionalInput } = useBridgeStore();

  // Partial Factors
  const concreteBasic =
    additionalInputs['design_options_cont.partial_factor.concrete_basic'] ?? '1.50';
  const concreteAccidental =
    additionalInputs['design_options_cont.partial_factor.concrete_accidental'] ?? '1.20';
  const steelYielding =
    additionalInputs['design_options_cont.partial_factor.steel_yielding'] ?? '1.10';
  const steelUltimate =
    additionalInputs['design_options_cont.partial_factor.steel_ultimate'] ?? '1.25';
  const reinforcingSteel =
    additionalInputs['design_options_cont.partial_factor.reinforcing_steel'] ?? '1.15';
  const shearConnectors =
    additionalInputs['design_options_cont.partial_factor.shear_connectors'] ?? '1.25';
  const fatigueLoad =
    additionalInputs['design_options_cont.partial_factor.fatigue_load'] ?? '1.00';
  const fatigueStrength =
    additionalInputs['design_options_cont.partial_factor.fatigue_strength'] ?? '1.35';

  // Resistance to Fatigue
  const loadCycles =
    additionalInputs['design_options_cont.fatigue.number_of_cycles'] ?? '2000000';

  // Deflection Control
  const camberMode =
    additionalInputs['design_options_cont.deflection.camber.mode'] ?? 'Default';
  const camberCustomVal =
    additionalInputs['design_options_cont.deflection.camber.value'] ?? '';

  // Limit States Checkboxes (Default: all true)
  const isULS_Bending =
    additionalInputs['design_options_cont.limit_states.bending_resistance'] ?? true;
  const isULS_VerticalShear =
    additionalInputs['design_options_cont.limit_states.vertical_shear'] ?? true;
  const isULS_LTB =
    additionalInputs['design_options_cont.limit_states.ltb'] ?? true;
  const isULS_Transverse =
    additionalInputs['design_options_cont.limit_states.transverse_force'] ?? true;
  const isULS_LongShear =
    additionalInputs['design_options_cont.limit_states.longitudinal_shear'] ?? true;
  const isULS_Fatigue =
    additionalInputs['design_options_cont.limit_states.fatigue'] ?? true;

  const isSLS_Stress =
    additionalInputs['design_options_cont.limit_states.stress_limitation'] ?? true;
  const isSLS_LongShear =
    additionalInputs['design_options_cont.limit_states.longitudinal_shear_sls'] ?? true;
  const isSLS_Deflection =
    additionalInputs['design_options_cont.limit_states.deflection_control'] ?? true;
  const isSLS_Crack =
    additionalInputs['design_options_cont.limit_states.crack_width'] ?? true;

  const renderCheckboxRow = (
    label: string,
    key: string,
    val: boolean,
    onToggle: () => void
  ) => (
    <div
      onClick={onToggle}
      className="flex items-center gap-2 py-[3px] cursor-pointer"
    >
      <OsdagCheckbox checked={Boolean(val)} onChange={onToggle} ariaLabel={label} />
      <span className="text-[11.5px] text-black select-none font-sans">
        {label}
      </span>
    </div>
  );

  return (
    <div className="hide-scrollbar flex-1 flex flex-col min-h-0 h-full mx-3.5 mb-1.5 overflow-y-auto pb-2">
      {/* Top Section: Left cards + Right Description Panel */}
      <div className="flex gap-4 min-h-0 shrink-0">
        {/* Left Column (Cards) */}
        <div className="flex-[1.2] min-w-0 flex flex-col gap-3">
          {/* Card 1: Partial Factor */}
          <div className="border border-[#c0c0c0] rounded-[6px] p-[12px_16px] bg-white">
            <div className="text-xs font-bold text-black mb-2.5">Partial Factor</div>
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <label className="text-xs text-black">
                  Concrete basic & seismic, γ<sub>c</sub>
                </label>
                <input
                  type="text"
                  value={concreteBasic}
                  onChange={(e) =>
                    updateAdditionalInput(
                      'design_options_cont.partial_factor.concrete_basic',
                      e.target.value
                    )
                  }
                  className={inputClass}
                />
              </div>

              <div className="flex items-center justify-between">
                <label className="text-xs text-black">
                  Concrete Accidental, γ<sub>c</sub>
                </label>
                <input
                  type="text"
                  value={concreteAccidental}
                  onChange={(e) =>
                    updateAdditionalInput(
                      'design_options_cont.partial_factor.concrete_accidental',
                      e.target.value
                    )
                  }
                  className={inputClass}
                />
              </div>

              <div className="flex items-center justify-between">
                <label className="text-xs text-black">
                  Structural steel for Yielding and Buckling, γ<sub>M0</sub>
                </label>
                <input
                  type="text"
                  value={steelYielding}
                  onChange={(e) =>
                    updateAdditionalInput(
                      'design_options_cont.partial_factor.steel_yielding',
                      e.target.value
                    )
                  }
                  className={inputClass}
                />
              </div>

              <div className="flex items-center justify-between">
                <label className="text-xs text-black">
                  Structural Steel For Ultimate Stress, γ<sub>M1</sub>
                </label>
                <input
                  type="text"
                  value={steelUltimate}
                  onChange={(e) =>
                    updateAdditionalInput(
                      'design_options_cont.partial_factor.steel_ultimate',
                      e.target.value
                    )
                  }
                  className={inputClass}
                />
              </div>

              <div className="flex items-center justify-between">
                <label className="text-xs text-black">
                  Reinforcing Steel, γ<sub>s</sub>
                </label>
                <input
                  type="text"
                  value={reinforcingSteel}
                  onChange={(e) =>
                    updateAdditionalInput(
                      'design_options_cont.partial_factor.reinforcing_steel',
                      e.target.value
                    )
                  }
                  className={inputClass}
                />
              </div>

              <div className="flex items-center justify-between">
                <label className="text-xs text-black">
                  Shear Connectors For Yield, γ<sub>v</sub>
                </label>
                <input
                  type="text"
                  value={shearConnectors}
                  onChange={(e) =>
                    updateAdditionalInput(
                      'design_options_cont.partial_factor.shear_connectors',
                      e.target.value
                    )
                  }
                  className={inputClass}
                />
              </div>

              <div className="flex items-center justify-between">
                <label className="text-xs text-black">
                  Fatigue Load, γ<sub>Ff</sub>
                </label>
                <input
                  type="text"
                  value={fatigueLoad}
                  onChange={(e) =>
                    updateAdditionalInput(
                      'design_options_cont.partial_factor.fatigue_load',
                      e.target.value
                    )
                  }
                  className={inputClass}
                />
              </div>

              <div className="flex items-center justify-between">
                <label className="text-xs text-black">
                  Fatigue Strength, γ<sub>Mf, f</sub>
                </label>
                <input
                  type="text"
                  value={fatigueStrength}
                  onChange={(e) =>
                    updateAdditionalInput(
                      'design_options_cont.partial_factor.fatigue_strength',
                      e.target.value
                    )
                  }
                  className={inputClass}
                />
              </div>
            </div>
          </div>

          {/* Card 2: Resistance to Fatigue */}
          <div className="border border-[#c0c0c0] rounded-[6px] p-[12px_16px] bg-white">
            <div className="text-xs font-bold text-black mb-2.5">Resistance to Fatigue</div>
            <div className="flex items-center justify-between">
              <label className="text-xs text-black">Number of Load Cycles</label>
              <input
                type="text"
                value={loadCycles}
                onChange={(e) =>
                  updateAdditionalInput(
                    'design_options_cont.fatigue.number_of_cycles',
                    e.target.value
                  )
                }
                className={inputClass}
              />
            </div>
          </div>

          {/* Card 3: Deflection Control */}
          <div className="border border-[#c0c0c0] rounded-[6px] p-[12px_16px] bg-white">
            <div className="text-xs font-bold text-black mb-2.5">Deflection Control</div>
            <div className="flex items-center justify-between">
              <label className="text-xs text-black">Camber (mm)</label>
              <div className="w-[186px] flex items-center gap-1.5 justify-end">
                <select
                  value={camberMode}
                  onChange={(e) =>
                    updateAdditionalInput(
                      'design_options_cont.deflection.camber.mode',
                      e.target.value
                    )
                  }
                  className={`${selectClass} ${camberMode === 'Custom' ? '!w-[105px]' : '!w-[186px]'}`}
                >
                  <option value="Default">Default</option>
                  <option value="Custom">Custom</option>
                </select>

                {camberMode === 'Custom' && (
                  <input
                    type="text"
                    value={camberCustomVal}
                    onChange={(e) =>
                      updateAdditionalInput(
                        'design_options_cont.deflection.camber.value',
                        e.target.value
                      )
                    }
                    placeholder="0 - 4000"
                    className={`${inputClass} !w-[75px]`}
                  />
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Right Column (Description Panel) */}
        <LoadDescriptionPanel title="Design Options">
          <p className="mb-2.5">
            Default values for partial factors are per IRC 22, and the default number of
            fatigue load cycles is per IRC 6.
          </p>
          <p className="mb-2.5">
            Deflection limits per IRC 6: L/800 for live load alone, L/600 for DL+LL.
          </p>
          <p className="mb-0.5">Camber operates in two modes:</p>
          <p className="mb-1">
            • Default — camber equals the dead load deflection, where DL comprises
            self-weight (SW), dead load on steel (DC), deck dead load (DD), and
            superimposed dead load (SIDL), excluding the wearing surface (DW).
          </p>
          <p className="m-0">
            • Custom — the user specifies the camber value directly.
          </p>
        </LoadDescriptionPanel>
      </div>

      {/* Bottom Section: Limit States */}
      <div className="mt-3.5 shrink-0">
        <div className="text-xs font-bold text-black mb-2">
          Limit States
        </div>

        <div className="flex gap-4">
          {/* Group 1: Ultimate Limit States */}
          <fieldset className="border border-[#757575] rounded-[6px] p-[8px_14px_12px_14px] flex-1 min-w-0 bg-white">
            <legend className="text-[11.5px] font-bold text-black px-1.5">Ultimate Limit States</legend>
            <div className="flex flex-col gap-0.5">
              {renderCheckboxRow(
                'Bending Resistance',
                'design_options_cont.limit_states.bending_resistance',
                Boolean(isULS_Bending),
                () =>
                  updateAdditionalInput(
                    'design_options_cont.limit_states.bending_resistance',
                    !isULS_Bending
                  )
              )}
              {renderCheckboxRow(
                'Resistance to Vertical Shear',
                'design_options_cont.limit_states.vertical_shear',
                Boolean(isULS_VerticalShear),
                () =>
                  updateAdditionalInput(
                    'design_options_cont.limit_states.vertical_shear',
                    !isULS_VerticalShear
                  )
              )}
              {renderCheckboxRow(
                'Resistance to Lateral-torsional Buckling',
                'design_options_cont.limit_states.ltb',
                Boolean(isULS_LTB),
                () =>
                  updateAdditionalInput(
                    'design_options_cont.limit_states.ltb',
                    !isULS_LTB
                  )
              )}
              {renderCheckboxRow(
                'Resistance to Transverse force',
                'design_options_cont.limit_states.transverse_force',
                Boolean(isULS_Transverse),
                () =>
                  updateAdditionalInput(
                    'design_options_cont.limit_states.transverse_force',
                    !isULS_Transverse
                  )
              )}
              {renderCheckboxRow(
                'Resistance to Longitudinal Shear',
                'design_options_cont.limit_states.longitudinal_shear',
                Boolean(isULS_LongShear),
                () =>
                  updateAdditionalInput(
                    'design_options_cont.limit_states.longitudinal_shear',
                    !isULS_LongShear
                  )
              )}
              {renderCheckboxRow(
                'Resistance to Fatigue',
                'design_options_cont.limit_states.fatigue',
                Boolean(isULS_Fatigue),
                () =>
                  updateAdditionalInput(
                    'design_options_cont.limit_states.fatigue',
                    !isULS_Fatigue
                  )
              )}
            </div>
          </fieldset>

          {/* Group 2: Serviceability Limit States */}
          <fieldset className="border border-[#757575] rounded-[6px] p-[8px_14px_12px_14px] flex-1 min-w-0 bg-white">
            <legend className="text-[11.5px] font-bold text-black px-1.5">Serviceability Limit States</legend>
            <div className="flex flex-col gap-0.5">
              {renderCheckboxRow(
                'Stress Limitation',
                'design_options_cont.limit_states.stress_limitation',
                Boolean(isSLS_Stress),
                () =>
                  updateAdditionalInput(
                    'design_options_cont.limit_states.stress_limitation',
                    !isSLS_Stress
                  )
              )}
              {renderCheckboxRow(
                'Longitudinal Shear (SLS)',
                'design_options_cont.limit_states.longitudinal_shear_sls',
                Boolean(isSLS_LongShear),
                () =>
                  updateAdditionalInput(
                    'design_options_cont.limit_states.longitudinal_shear_sls',
                    !isSLS_LongShear
                  )
              )}
              {renderCheckboxRow(
                'Deflection Control',
                'design_options_cont.limit_states.deflection_control',
                Boolean(isSLS_Deflection),
                () =>
                  updateAdditionalInput(
                    'design_options_cont.limit_states.deflection_control',
                    !isSLS_Deflection
                  )
              )}
              {renderCheckboxRow(
                'Crack Width Check',
                'design_options_cont.limit_states.crack_width',
                Boolean(isSLS_Crack),
                () =>
                  updateAdditionalInput(
                    'design_options_cont.limit_states.crack_width',
                    !isSLS_Crack
                  )
              )}
            </div>
          </fieldset>
        </div>
      </div>
    </div>
  );
};
