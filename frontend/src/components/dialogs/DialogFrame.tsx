/** Shared native modal with Desktop-style dragging, keyboard focus and cleanup. */
import React, { useEffect, useId, useRef } from 'react';
import './additional-inputs/additional-inputs.css';

function positionDialog(node: HTMLDialogElement, left: number, top: number) {
  const rect = node.getBoundingClientRect();
  Object.assign(node.style, {
    position: 'fixed', inset: 'auto', margin: '0',
    left: `${Math.max(0, Math.min(left, window.innerWidth - rect.width))}px`,
    top: `${Math.max(0, Math.min(top, window.innerHeight - rect.height))}px`,
  });
}

export function DialogFrame({ title, children, onClose, className = '' }: {
  title: string; children: React.ReactNode; onClose: () => void; className?: string;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const drag = useRef<{ pointerId: number; offsetX: number; offsetY: number } | null>(null);
  const id = useId();
  useEffect(() => {
    // Mount opens a fresh session; unmount returns focus to the triggering control.
    const opener = document.activeElement as HTMLElement | null;
    const node = dialog.current!;
    node.showModal();
    node.querySelector<HTMLElement>('[data-dialog-autofocus]')?.focus();
    // Tabs can change the dialog height after it has been moved.
    const keepVisible = () => {
      if (!node.style.left) return;
      const rect = node.getBoundingClientRect();
      positionDialog(node, rect.left, rect.top);
    };
    const observer = new ResizeObserver(keepVisible);
    observer.observe(node);
    window.addEventListener('resize', keepVisible);
    return () => {
      observer.disconnect();
      window.removeEventListener('resize', keepVisible);
      node.close();
      opener?.focus();
    };
  }, []);
  return <dialog ref={dialog} className={`additional-dialog ${className}`} aria-labelledby={id}
    onCancel={event => {
      event.preventDefault();
      onClose();
    }}
    onKeyDown={event => {
      if (event.key !== 'Tab') return;
      const controls = [...event.currentTarget.querySelectorAll<HTMLElement>(
        'button:not(:disabled), input:not(:disabled), select:not(:disabled)',
      )]
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
    <header className="additional-titlebar additional-titlebar-movable"
      onPointerDown={event => {
        if (!event.isPrimary || event.button !== 0 || (event.target as Element).closest('button')) return;
        const rect = dialog.current!.getBoundingClientRect();
        drag.current = { pointerId: event.pointerId, offsetX: event.clientX - rect.left, offsetY: event.clientY - rect.top };
        event.currentTarget.setPointerCapture(event.pointerId);
        event.preventDefault();
        positionDialog(dialog.current!, rect.left, rect.top);
      }}
      onPointerMove={event => {
        const current = drag.current;
        if (current?.pointerId !== event.pointerId) return;
        positionDialog(dialog.current!, event.clientX - current.offsetX, event.clientY - current.offsetY);
      }}
      onLostPointerCapture={() => { drag.current = null; }}>
      <img src="/vectors/Osdag_logo.svg" alt="" width={20} height={20} />
      <h2 id={id}>{title}</h2>
      <button type="button" className="additional-close" aria-label={`Close ${title}`} onClick={onClose}>✕</button>
    </header>
    {children}
  </dialog>;
}
