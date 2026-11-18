import React, { useState, useEffect } from 'react';

interface SetBoundsModalProps {
  isOpen: boolean;
  onClose: () => void;
  lowerBound: string;
  upperBound: string;
  onSave: (lower: string, upper: string) => void;
}

export const SetBoundsModal: React.FC<SetBoundsModalProps> = ({
  isOpen,
  onClose,
  lowerBound,
  upperBound,
  onSave,
}) => {
  const [lower, setLower] = useState(lowerBound || '');
  const [upper, setUpper] = useState(upperBound || '');

  useEffect(() => {
    if (isOpen) {
      setLower(lowerBound || '');
      setUpper(upperBound || '');
    }
  }, [isOpen, lowerBound, upperBound]);

  if (!isOpen) return null;

  const handleOK = () => {
    onSave(lower.trim(), upper.trim());
    onClose();
  };

  return (
    <div
      className="fixed inset-0 bg-black/35 flex items-center justify-center z-[10005]"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-[370px] bg-white rounded-[4px] border-[1.5px] border-[#8cae11] shadow-[0_10px_25px_rgba(0,0,0,0.3)] flex flex-col overflow-hidden font-sans">
        {/* Title Bar */}
        <div className="h-8 bg-white flex items-center justify-between px-2.5 border-b-2 border-[#8cae11] select-none">
          <div className="flex items-center gap-2">
            <img
              src="/vectors/Osdag_logo.svg"
              alt="Osdag"
              width={18}
              height={18}
              className="block pointer-events-none"
            />
            <span className="text-[13px] font-bold text-black">
              Set Bounds
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="bg-transparent border-0 text-[15px] font-bold text-black cursor-pointer leading-none px-1.5 py-0.5 hover:text-[#555555]"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <div className="p-[22px_24px_18px_24px] flex flex-col gap-4">
          {/* Lower Bound */}
          <div className="flex items-center justify-between">
            <label className="text-[13px] font-bold text-black">
              Lower Bound:
            </label>
            <input
              type="text"
              value={lower}
              placeholder="Min: 8.00"
              onChange={(e) => setLower(e.target.value)}
              className="w-[145px] h-[30px] px-2.5 py-0.5 text-[13px] font-semibold border-[1.5px] border-[#8cae11] rounded-[6px] outline-none bg-white text-black box-border"
            />
          </div>

          {/* Upper Bound */}
          <div className="flex items-center justify-between">
            <label className="text-[13px] font-bold text-black">
              Upper Bound:
            </label>
            <input
              type="text"
              value={upper}
              placeholder="Max: 40.00"
              onChange={(e) => setUpper(e.target.value)}
              className="w-[145px] h-[30px] px-2.5 py-0.5 text-[13px] font-semibold border-[1.5px] border-[#c0c0c0] focus:border-[#8cae11] rounded-[6px] outline-none bg-white text-black box-border"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-2.5 mt-2.5">
            <button
              type="button"
              onClick={onClose}
              className="w-[78px] h-[30px] bg-white hover:bg-[#f2f2f2] border-[1.5px] border-black rounded-[6px] text-black text-[13px] font-bold cursor-pointer transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleOK}
              className="w-[60px] h-[30px] bg-white hover:bg-[#f2f2f2] border-[1.5px] border-black rounded-[6px] text-black text-[13px] font-bold cursor-pointer transition-colors"
            >
              OK
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
