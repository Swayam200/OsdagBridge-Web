import React from 'react';

interface LoadDescriptionPanelProps {
  title: string;
  children: React.ReactNode;
}

export const LoadDescriptionPanel: React.FC<LoadDescriptionPanelProps> = ({ title, children }) => {
  return (
    <div className="flex-1 min-w-0 h-full bg-[#c8c8c8] border border-[#b5b5b5] rounded-[6px] p-[12px_14px] overflow-y-auto box-border text-[11px] text-black leading-[1.38]">
      <div className="text-center font-bold text-xs text-black mb-2.5">
        {title}
      </div>
      <div>{children}</div>
    </div>
  );
};
