import React from 'react';
import { useBridgeStore } from '../../../../store/useBridgeStore';
import { selectClass } from '../styles';

export const MemberPropertiesTab: React.FC = () => {
  const { additionalInputs, updateAdditionalInput } = useBridgeStore();

  return (
    <div className="mx-3.5 mb-1.5 p-4 border border-[#c0c0c0] border-t-0 rounded-b-[6px] bg-white">
      <div className="text-[13px] font-bold text-[#222222] mb-3">
        Member Properties (Girder Details, Stiffener Details, Cross Bracing, End Diaphragm)
      </div>

      <div className="grid grid-cols-2 gap-x-8 gap-y-2.5">
        <div className="flex items-center justify-between">
          <label className="text-xs text-black">Web Type:</label>
          <select
            value={additionalInputs['member_properties.girder_details.section_input.web_type.G1.M1'] ?? 'Thin Web with ITS'}
            onChange={(e) => updateAdditionalInput('member_properties.girder_details.section_input.web_type.G1.M1', e.target.value)}
            className={selectClass}
          >
            <option value="Thin Web with ITS">Thin Web with ITS</option>
            <option value="Thick Web without ITS">Thick Web without ITS</option>
          </select>
        </div>

        <div className="flex items-center justify-between">
          <label className="text-xs text-black">Support Type:</label>
          <select
            value={additionalInputs['member_properties.girder_details.section_inputs.support_type.G1.M1'] ?? 'Major Laterally Supported'}
            onChange={(e) => updateAdditionalInput('member_properties.girder_details.section_inputs.support_type.G1.M1', e.target.value)}
            className={selectClass}
          >
            <option value="Major Laterally Supported">Major Laterally Supported</option>
            <option value="Laterally Unsupported">Laterally Unsupported</option>
          </select>
        </div>
      </div>
    </div>
  );
};
