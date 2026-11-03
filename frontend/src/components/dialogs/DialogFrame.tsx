/** Native modal with focus restoration and keyboard containment. */
import React, { useEffect, useId, useRef } from 'react';
import './additional-inputs/additional-inputs.css';

export function DialogFrame({ title, children, onClose }: {
  title: string; children: React.ReactNode; onClose: () => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
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
  return <dialog ref={dialog} className="additional-dialog" aria-labelledby={id}
    onCancel={event => {
      event.preventDefault();
      onClose();
    }}
    onKeyDown={event => {
      if (event.key !== 'Tab') return;
      const selector = 'button:not(:disabled), input:not(:disabled), select:not(:disabled)';
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
  </dialog>;
}
