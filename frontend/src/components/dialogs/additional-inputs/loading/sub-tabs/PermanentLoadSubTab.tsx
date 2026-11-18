import React from 'react';
import { useBridgeStore } from '../../../../../store/useBridgeStore';
import { inputClass } from '../../styles';
import { LoadDescriptionPanel } from './LoadDescriptionPanel';

export const PermanentLoadSubTab: React.FC = () => {
  const { additionalInputs, updateAdditionalInput } = useBridgeStore();

  const swFactor = additionalInputs['loading.permanent_load.dead_load.self_weight_factor'] ?? '1.00';

  return (
    <div className="flex gap-4 h-full min-h-0">
      {/* Left Column */}
      <div className="flex-[1.2] min-w-0 flex flex-col gap-3">
        <div className="border border-[#c0c0c0] rounded-[6px] p-[12px_16px] bg-white">
          <div className="text-xs font-bold text-black mb-3">
            Dead Load (DL)
          </div>

          <div className="flex items-center justify-between">
            <label className="text-xs text-black">
              Self-weight modification factor
            </label>
            <input
              type="text"
              value={swFactor}
              onChange={(e) =>
                updateAdditionalInput('loading.permanent_load.dead_load.self_weight_factor', e.target.value)
              }
              className={inputClass}
            />
          </div>
        </div>
      </div>

      {/* Right Column: Description Panel */}
      <LoadDescriptionPanel title="Permanent Loads">
        <p className="mb-0.5">Dead loads are divided into the following categories:</p>
        <p className="mb-[1px]">
          SW: Self-weight of the girder. The self-weight modification factor entered by the user is multiplied with this case to account for connections and accessories not explicitly modelled.
        </p>
        <p className="mb-[1px]">
          DC: Weight of structural steel components other than the girder, including cross bracing and end diaphragms.
        </p>
        <p className="mb-[1px]">
          DD: Weight of the concrete deck slab.
        </p>
        <p className="mb-[1px]">
          DW: Weight of the wearing course (surfacing) applied on the deck.
        </p>
        <p className="mb-2">
          SIDL: Superimposed Dead Load, comprising crash barriers, median, and railings.
        </p>
        <p className="m-0">
          All load magnitudes are computed internally from member dimensions and material densities. The self-weight modification factor (SW) is the only user-controlled parameter for this load group.
        </p>
      </LoadDescriptionPanel>
    </div>
  );
};
