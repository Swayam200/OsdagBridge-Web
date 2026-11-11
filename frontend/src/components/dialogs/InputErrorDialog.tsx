/** Desktop-style input errors, including the critical required-fields check. */
import React from 'react';
import { useBridgeStore } from '../../store/useBridgeStore';
import { DialogFrame } from './DialogFrame';

export const InputErrorDialog: React.FC = () => {
  const error = useBridgeStore(s => s.inputErrorDialog);
  const dismiss = useBridgeStore(s => s.dismissInputErrorDialog);
  if (!error) return null;

  const critical = error.tone === 'critical';
  return <DialogFrame title={error.title ?? 'Input Error'} onClose={dismiss}
    className={`input-error-dialog ${critical ? 'input-error-critical' : ''}`}>
    <div className="input-error-content">
      <div className="additional-warning-message">
        <img src={`/vectors/msg_${critical ? 'critical' : 'warning'}.svg`} alt="" width={34} height={34} />
        <p>{error.message}</p>
      </div>
      <button type="button" className="osdag-btn-standard" data-dialog-autofocus onClick={() => {
        error.onOk();
        dismiss();
      }}>OK</button>
    </div>
  </DialogFrame>;
};
