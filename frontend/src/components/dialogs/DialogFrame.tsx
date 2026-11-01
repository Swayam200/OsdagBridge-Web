/**
 * Native modal shell shared by both input dialogs. Owns focus restoration,
 * keyboard containment and the Core validation warning overlay. Draft state,
 * Save/Add and discard behaviour belong to the dialog using this frame.
 */
import React, { useEffect, useId, useRef } from 'react';
import './additional-inputs/additional-inputs.css';

export function DialogFrame({ title, children, onClose, className = '', warning, dismissWarning }: {
  title: string; children: React.ReactNode; onClose: () => void; className?: string;
  warning?: { message: string; onOk: () => void } | null; dismissWarning?: () => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const ok = useRef<HTMLButtonElement>(null);
  const id = useId();
  useEffect(() => {
    // Mount opens a fresh session; unmount returns focus to the triggering control.
    const opener = document.activeElement as HTMLElement | null;
    const node = dialog.current!;
    node.showModal();
    return () => {
      node.close();
      opener?.focus();
    };
  }, []);
  useEffect(() => { if (warning) ok.current?.focus(); }, [warning]);
  return <dialog ref={dialog} className={`additional-dialog ${className}`} aria-labelledby={id}
    onCancel={event => {
      event.preventDefault();
      if (warning) dismissWarning?.(); else onClose();
    }}
    onKeyDown={event => {
      if (event.key !== 'Tab') return;
      // While a warning is open, keyboard focus must stay on its acknowledgment.
      const selector = warning
        ? '[role="alertdialog"] button'
        : 'button:not(:disabled), input:not(:disabled), select:not(:disabled)';
      const controls = [...event.currentTarget.querySelectorAll<HTMLElement>(selector)]
        .filter(control => control.tabIndex >= 0 && control.getClientRects().length);
      const first = controls[0], last = controls[controls.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last?.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first?.focus();
      }
    }}>
    <header className="additional-titlebar">
      <img src="/vectors/Osdag_logo.svg" alt="Osdag" width={22} height={22} />
      <h2 id={id}>{title}</h2>
      <button type="button" className="osdag-btn-standard" aria-label={`Close ${title}`} onClick={onClose}>×</button>
    </header>
    {children}
    {warning && <div className="additional-warning-backdrop"><div role="alertdialog" aria-modal="true"
      aria-labelledby={`${id}-warning`} aria-describedby={`${id}-message`} className="additional-warning">
      <h3 id={`${id}-warning`}>Input Error</h3>
      <p id={`${id}-message`}>{warning.message}</p>
      <button ref={ok} type="button" className="osdag-btn-standard" onClick={warning.onOk}>OK</button>
    </div></div>}
  </dialog>;
}
