import React from 'react';

interface OsdagCheckboxProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  id?: string;
  ariaLabel?: string;
}

export const OsdagCheckbox: React.FC<OsdagCheckboxProps> = ({ checked, onChange, ariaLabel }) => {
  return (
    <div
      role="checkbox"
      aria-checked={checked}
      aria-label={ariaLabel}
      tabIndex={0}
      onClick={(e) => {
        e.stopPropagation();
        onChange(!checked);
      }}
      onKeyDown={(e) => {
        if (e.key === ' ' || e.key === 'Enter') {
          e.preventDefault();
          e.stopPropagation();
          onChange(!checked);
        }
      }}
      className="w-[15px] h-[15px] min-w-[15px] min-h-[15px] bg-[var(--input-bg)] border border-[var(--input-border)] hover:border-[var(--border-focus)] rounded-[2px] inline-flex items-center justify-center cursor-pointer box-border select-none shrink-0 transition-colors"
    >
      {checked && (
        <svg
          width="11"
          height="11"
          viewBox="0 0 11 11"
          fill="none"
          className="block"
        >
          <path
            d="M2 5.8L4.4 8.5L9.2 2.5"
            stroke="var(--accent-osdag)"
            strokeWidth="1.85"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      )}
    </div>
  );
};
