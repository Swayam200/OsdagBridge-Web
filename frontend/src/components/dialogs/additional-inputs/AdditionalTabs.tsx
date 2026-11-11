/** Keyboard navigation shared by the dialog's group and subtab bars. */
import React from 'react';

export function AdditionalTabs({ tabs, active, onSelect, panelId, label, className = '' }: {
  tabs: { label: string; disabled?: boolean }[];
  active: number;
  onSelect: (index: number) => void;
  panelId: string;
  label: string;
  className?: string;
}) {
  return <div className={`additional-tabs ${className}`} role="tablist" aria-label={label}
    onKeyDown={event => {
      if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
      const buttons = [...event.currentTarget.querySelectorAll<HTMLButtonElement>('button:not(:disabled)')];
      const index = buttons.indexOf(document.activeElement as HTMLButtonElement);
      const next = event.key === 'Home' ? 0 : event.key === 'End' ? buttons.length - 1
        : (index + (event.key === 'ArrowRight' ? 1 : -1) + buttons.length) % buttons.length;
      event.preventDefault();
      buttons[next]?.focus();
      buttons[next]?.click();
    }}>
    {tabs.map((tab, index) => <button key={index} id={`${panelId}-tab-${index}`} type="button" role="tab"
      aria-selected={index === active} aria-controls={panelId} tabIndex={index === active ? 0 : -1}
      disabled={tab.disabled} className={index === active ? 'selected' : ''}
      onClick={() => onSelect(index)}>{tab.label}</button>)}
  </div>;
}
