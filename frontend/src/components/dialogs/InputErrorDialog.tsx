/**
 * InputErrorDialog.tsx
 *
 * Modal mirroring desktop CustomMessageBox and CustomTitleBar
 * from osdagbridge.desktop.ui.dialogs.custom_messagebox.
 * Title defaults to "Input Error"; type "warning" (default) or "critical"
 * selects the desktop icon and OK button colours (orange / red).
 */

import React, { useEffect, useCallback } from 'react';
import { useBridgeStore } from '../../store/useBridgeStore';
import { CustomTitleBar } from './CustomTitleBar';

export const InputErrorDialog: React.FC = () => {
  const inputErrorDialog = useBridgeStore((s) => s.inputErrorDialog);
  const dismissInputErrorDialog = useBridgeStore((s) => s.dismissInputErrorDialog);

  // Close on Escape
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape' && inputErrorDialog) {
        dismissInputErrorDialog();
      }
    },
    [inputErrorDialog, dismissInputErrorDialog],
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  if (!inputErrorDialog) return null;

  const isCritical = inputErrorDialog.type === 'critical';

  const handleOk = () => {
    inputErrorDialog.onOk();
    dismissInputErrorDialog();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="input-error-title"
      aria-describedby="input-error-message"
      className="fixed inset-0 bg-black/40 flex items-center justify-center z-[10000]"
    >
      {/* Dialog card — mirrors CustomMessageBox (1px solid #90AF13 border, white bg) */}
      <div className="bg-surface border border-accent rounded-[4px] min-w-[380px] max-w-[460px] shadow-[0_8px_24px_rgba(0,0,0,0.25)] overflow-hidden flex flex-col">
        <CustomTitleBar
          title={inputErrorDialog.title ?? 'Input Error'}
          titleId="input-error-title"
          onClose={dismissInputErrorDialog}
        />

        {/* ContentWidget — mirrors contentLayout (20px margins, icon, 12px text) */}
        <div className="p-[20px_20px_16px_20px] flex flex-col">
          {/* Inner row: warning/critical icon + text */}
          <div className="flex items-start gap-3.5">
            <img
              src={isCritical ? '/vectors/msg_critical.svg' : '/vectors/msg_warning.svg'}
              alt={isCritical ? 'Critical' : 'Warning'}
              width={34}
              height={34}
              className="shrink-0 block mt-0.5"
            />
            <div
              id="input-error-message"
              className="text-xs text-main leading-normal m-0 text-left whitespace-pre-line font-sans"
            >
              {inputErrorDialog.message}
            </div>
          </div>

          {/* Button layout — right-aligned OK button */}
          <div className="flex justify-end mt-4">
            <button
              type="button"
              onClick={handleOk}
              autoFocus
              className={`h-[30px] min-w-[70px] px-[18px] py-[5px] text-white border-0 rounded-[5px] text-xs font-semibold cursor-pointer transition-colors ${
                isCritical
                  ? 'bg-[#F44336] hover:bg-[#E53935] active:bg-[#D32F2F]'
                  : 'bg-[#FF9800] hover:bg-[#FB8C00] active:bg-[#F57C00]'
              }`}
            >
              OK
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
