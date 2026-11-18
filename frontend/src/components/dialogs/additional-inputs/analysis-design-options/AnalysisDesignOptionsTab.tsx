import React, { useState } from 'react';
import { useBridgeStore } from '../../../../store/useBridgeStore';
import { inputClass, selectClass } from '../styles';
import { LoadDescriptionPanel } from '../loading/sub-tabs/LoadDescriptionPanel';
import { SetBoundsModal } from './SetBoundsModal';

const REINFORCEMENT_MATERIALS = [
  'Fe 415',
  'Fe 415D',
  'Fe 500',
  'Fe 500D',
  'Fe 550',
  'Fe 550D',
  'Fe 600',
];

const SHEAR_STUD_DIAMETERS = ['12', '16', '20', '22', '25'];

const SHEAR_STUD_COUNTS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10'];

export const AnalysisDesignOptionsTab: React.FC = () => {
  const { additionalInputs, updateAdditionalInput } = useBridgeStore();
  const [isSetBoundsOpen, setIsSetBoundsOpen] = useState(false);

  // Construction Stages
  const includeDefaultStages =
    additionalInputs['design_options.construction_stages.include_default'] ?? 'Yes';

  // Deck Design
  const rebarLowerBound =
    additionalInputs['design_options.deck.rebar_lower_bound'] ?? '';
  const rebarUpperBound =
    additionalInputs['design_options.deck.rebar_upper_bound'] ?? '';
  const rebarMaterial =
    additionalInputs['design_options.deck.reinforcement_material'] ?? 'Fe 500';
  const topClearCover =
    additionalInputs['design_options.deck.top_clear_cover'] ?? '50';
  const bottomClearCover =
    additionalInputs['design_options.deck.bottom_clear_cover'] ?? '50';
  const sideClearCover =
    additionalInputs['design_options.deck.side_clear_cover'] ?? '50';

  // Shear Studs
  const yieldStrength =
    additionalInputs['design_options.shear_studs.yield_strength'] ?? '385';
  const ultimateStrength =
    additionalInputs['design_options.shear_studs.ultimate_strength'] ?? '495';
  const studDiameter =
    additionalInputs['design_options.shear_studs.diameter'] ?? '20';
  const studHeight =
    additionalInputs['design_options.shear_studs.height'] ?? '100';
  const studCount =
    additionalInputs['design_options.shear_studs.no_of_studs'] ?? '2';
  const transverseSpacing =
    additionalInputs['design_options.shear_studs.transverse_spacing'] ?? '100';

  const handleSaveBounds = (lower: string, upper: string) => {
    updateAdditionalInput('design_options.deck.rebar_lower_bound', lower);
    updateAdditionalInput('design_options.deck.rebar_upper_bound', upper);
  };

  return (
    <div className="flex-1 flex min-h-0 h-full mx-3.5 mb-1.5 gap-4 overflow-hidden">
      {/* Left Column: Input Cards */}
      <div className="hide-scrollbar flex-[1.2] min-w-0 flex flex-col gap-3 h-full overflow-y-auto pr-0.5 pb-2">
        {/* Card 1: Construction Stages */}
        <div className="border border-[#c0c0c0] rounded-[6px] p-[12px_16px] bg-white">
          <div className="text-xs font-bold text-black mb-2.5">Construction Stages</div>
          <div className="flex items-center justify-between">
            <label className="text-xs text-black">Include default</label>
            <select
              value={includeDefaultStages}
              onChange={(e) =>
                updateAdditionalInput(
                  'design_options.construction_stages.include_default',
                  e.target.value
                )
              }
              className={selectClass}
            >
              <option value="Yes">Yes</option>
              <option value="No">No</option>
            </select>
          </div>
        </div>

        {/* Card 2: Deck Design */}
        <div className="border border-[#c0c0c0] rounded-[6px] p-[12px_16px] bg-white">
          <div className="text-xs font-bold text-black mb-2.5">Deck Design</div>
          <div className="flex flex-col gap-2">
            {/* Reinforcement Size */}
            <div className="flex items-center justify-between">
              <label className="text-xs text-black">Reinforcement Size</label>
              <button
                type="button"
                onClick={() => setIsSetBoundsOpen(true)}
                className="w-[186px] h-6 bg-[#f5f5f5] hover:bg-[#e8e8e8] border border-[#757575] rounded-[4px] text-[11.5px] font-semibold text-[#222222] cursor-pointer text-center transition-colors"
              >
                Set Bounds
              </button>
            </div>

            {/* Reinforcement Material */}
            <div className="flex items-center justify-between">
              <label className="text-xs text-black">Reinforcement Material</label>
              <select
                value={rebarMaterial}
                onChange={(e) =>
                  updateAdditionalInput(
                    'design_options.deck.reinforcement_material',
                    e.target.value
                  )
                }
                className={selectClass}
              >
                {REINFORCEMENT_MATERIALS.map((mat) => (
                  <option key={mat} value={mat}>
                    {mat}
                  </option>
                ))}
              </select>
            </div>

            {/* Top Clear Cover (mm) */}
            <div className="flex items-center justify-between">
              <label className="text-xs text-black">Top Clear Cover (mm)</label>
              <input
                type="text"
                value={topClearCover}
                onChange={(e) =>
                  updateAdditionalInput(
                    'design_options.deck.top_clear_cover',
                    e.target.value
                  )
                }
                className={inputClass}
              />
            </div>

            {/* Bottom Clear Cover (mm) */}
            <div className="flex items-center justify-between">
              <label className="text-xs text-black">Bottom Clear Cover (mm)</label>
              <input
                type="text"
                value={bottomClearCover}
                onChange={(e) =>
                  updateAdditionalInput(
                    'design_options.deck.bottom_clear_cover',
                    e.target.value
                  )
                }
                className={inputClass}
              />
            </div>

            {/* Side Clear Cover (mm) */}
            <div className="flex items-center justify-between">
              <label className="text-xs text-black">Side Clear Cover (mm)</label>
              <input
                type="text"
                value={sideClearCover}
                onChange={(e) =>
                  updateAdditionalInput(
                    'design_options.deck.side_clear_cover',
                    e.target.value
                  )
                }
                className={inputClass}
              />
            </div>
          </div>
        </div>

        {/* Card 3: Shear Studs */}
        <div className="border border-[#c0c0c0] rounded-[6px] p-[12px_16px] bg-white">
          <div className="text-xs font-bold text-black mb-2.5">Shear Studs</div>
          <div className="flex flex-col gap-2">
            {/* Yield Strength (MPa) */}
            <div className="flex items-center justify-between">
              <label className="text-xs text-black">Yield Strength (MPa)</label>
              <input
                type="text"
                value={yieldStrength}
                onChange={(e) =>
                  updateAdditionalInput(
                    'design_options.shear_studs.yield_strength',
                    e.target.value
                  )
                }
                className={inputClass}
              />
            </div>

            {/* Ultimate Strength (MPa) */}
            <div className="flex items-center justify-between">
              <label className="text-xs text-black">Ultimate Strength (MPa)</label>
              <input
                type="text"
                value={ultimateStrength}
                onChange={(e) =>
                  updateAdditionalInput(
                    'design_options.shear_studs.ultimate_strength',
                    e.target.value
                  )
                }
                className={inputClass}
              />
            </div>

            {/* Diameter (mm) */}
            <div className="flex items-center justify-between">
              <label className="text-xs text-black">Diameter (mm)</label>
              <select
                value={studDiameter}
                onChange={(e) =>
                  updateAdditionalInput(
                    'design_options.shear_studs.diameter',
                    e.target.value
                  )
                }
                className={selectClass}
              >
                {SHEAR_STUD_DIAMETERS.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </div>

            {/* Height (mm) */}
            <div className="flex items-center justify-between">
              <label className="text-xs text-black">Height (mm)</label>
              <input
                type="text"
                value={studHeight}
                onChange={(e) =>
                  updateAdditionalInput(
                    'design_options.shear_studs.height',
                    e.target.value
                  )
                }
                className={inputClass}
              />
            </div>

            {/* No. of Shear Studs per Section */}
            <div className="flex items-center justify-between">
              <label className="text-xs text-black">No. of Shear Studs per Section</label>
              <select
                value={studCount}
                onChange={(e) =>
                  updateAdditionalInput(
                    'design_options.shear_studs.no_of_studs',
                    e.target.value
                  )
                }
                className={selectClass}
              >
                {SHEAR_STUD_COUNTS.map((cnt) => (
                  <option key={cnt} value={cnt}>
                    {cnt}
                  </option>
                ))}
              </select>
            </div>

            {/* Transverse Spacing (mm) */}
            <div className="flex items-center justify-between">
              <label className="text-xs text-black">Transverse Spacing (mm)</label>
              <input
                type="text"
                value={transverseSpacing}
                onChange={(e) =>
                  updateAdditionalInput(
                    'design_options.shear_studs.transverse_spacing',
                    e.target.value
                  )
                }
                className={inputClass}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Right Column: Description Panel */}
      <LoadDescriptionPanel title="Construction Stages">
        <p className="mb-2.5">
          When included ('Yes'), the analysis accounts for three stages.
          <br />
          In Stage 1, the steel girder carries its self-weight alone.
          <br />
          In Stage 2, the wet concrete deck load (DD) and the weight of other structural
          steel components act on the bare steel section before composite action is
          activated.
          <br />
          In Stage 3, composite action is fully active, and all remaining loads
          (superimposed dead load, live load, wind load, seismic load, and temperature load)
          are applied to the composite section.
          <br />
          Stages 1 and 2 are critical for lateral-torsional buckling (LTB) checks, as the
          compression flange is unrestrained until the deck provides lateral support.
        </p>
        <p className="m-0">
          When 'No' is selected, only the final composite state is checked and no
          separate construction-stage verification is performed.
        </p>
      </LoadDescriptionPanel>

      {/* Set Bounds Modal */}
      <SetBoundsModal
        isOpen={isSetBoundsOpen}
        onClose={() => setIsSetBoundsOpen(false)}
        lowerBound={rebarLowerBound}
        upperBound={rebarUpperBound}
        onSave={handleSaveBounds}
      />
    </div>
  );
};
