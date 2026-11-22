/**
 * CustomTitleBar.tsx
 *
 * Dialog title bar mirroring desktop osdagbridge_desktop.ui.utils.custom_titlebar.CustomTitleBar:
 * 32px height, Osdag logo (20x20), 12px title, "✕" close button (red on hover).
 */

import React from 'react';

export const CustomTitleBar: React.FC<{ title: string; titleId: string; onClose: () => void }> = ({
  title,
  titleId,
  onClose,
}) => (
  <div className="h-8 shrink-0 bg-header border-b border-border flex items-center justify-between pl-2 select-none">
    <div className="flex items-center gap-2">
      <img src="/vectors/Osdag_logo.svg" alt="Osdag" width={20} height={20} className="block" />
      <span id={titleId} className="text-xs font-semibold text-main">
        {title}
      </span>
    </div>
    <button
      type="button"
      onClick={onClose}
      aria-label="Close"
      className="w-10 h-8 border-0 bg-transparent hover:bg-[#e81123] text-muted hover:text-white text-[13px] flex items-center justify-center cursor-pointer transition-colors"
    >
      ✕
    </button>
  </div>
);
