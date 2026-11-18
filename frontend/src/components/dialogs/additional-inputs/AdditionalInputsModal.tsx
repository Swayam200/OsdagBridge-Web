import React, { useState, useEffect, useRef } from 'react';
import { useBridgeStore } from '../../../store/useBridgeStore';
import { TypicalSectionDetailsTab } from './typical-section-details/TypicalSectionDetailsTab';
import { MemberPropertiesTab } from './member-properties/MemberPropertiesTab';
import { LoadingTab } from './loading/LoadingTab';
import { AnalysisDesignOptionsTab } from './analysis-design-options/AnalysisDesignOptionsTab';
import { DesignOptionsContTab } from './design-options-cont/DesignOptionsContTab';
import { actionBtnClass } from './styles';

type ResizeEdge =
  | 'top'
  | 'bottom'
  | 'left'
  | 'right'
  | 'top-left'
  | 'top-right'
  | 'bottom-left'
  | 'bottom-right';

const getInitialDialogSize = () => {
  const w = typeof window !== 'undefined' ? window.innerWidth : 1200;
  const h = typeof window !== 'undefined' ? window.innerHeight : 800;
  return {
    width: Math.min(980, Math.max(750, w - 40)),
    height: Math.min(680, Math.max(500, h - 50)),
  };
};

export const AdditionalInputsModal: React.FC = () => {
  const {
    isAdditionalInputsOpen,
    setAdditionalInputsOpen,
    saveAdditionalInputs,
    resetAdditionalDefaults,
  } = useBridgeStore();

  const [activeMainTab, setActiveMainTab] = useState(0);
  const [isCloseHovered, setIsCloseHovered] = useState(false);
  const [dialogSize, setDialogSize] = useState(getInitialDialogSize);
  const [position, setPosition] = useState<{ x: number; y: number } | null>(null);

  const isDraggingRef = useRef(false);
  const isResizingRef = useRef(false);

  useEffect(() => {
    if (isAdditionalInputsOpen) {
      setActiveMainTab(0);
      const size = getInitialDialogSize();
      setDialogSize(size);
      const posX = Math.max(10, Math.round((window.innerWidth - size.width) / 2));
      const posY = Math.max(10, Math.round((window.innerHeight - size.height) / 2));
      setPosition({ x: posX, y: posY });
    }
  }, [isAdditionalInputsOpen]);

  // Drag Title Bar to move the window
  const handleTitleBarMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return;
    if ((e.target as HTMLElement).closest('button')) return;

    e.preventDefault();
    isDraggingRef.current = true;

    const startMouseX = e.clientX;
    const startMouseY = e.clientY;
    const startX = position?.x ?? Math.max(10, (window.innerWidth - dialogSize.width) / 2);
    const startY = position?.y ?? Math.max(10, (window.innerHeight - dialogSize.height) / 2);

    const onMouseMove = (moveEvent: MouseEvent) => {
      if (!isDraggingRef.current) return;
      const dx = moveEvent.clientX - startMouseX;
      const dy = moveEvent.clientY - startMouseY;

      const nextX = Math.max(0, Math.min(window.innerWidth - 120, startX + dx));
      const nextY = Math.max(0, Math.min(window.innerHeight - 50, startY + dy));

      setPosition({ x: nextX, y: nextY });
    };

    const onMouseUp = () => {
      isDraggingRef.current = false;
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  };

  // Resize window from edges/corners
  const handleBorderResizeStart = (e: React.MouseEvent, edge: ResizeEdge) => {
    e.preventDefault();
    e.stopPropagation();
    isResizingRef.current = true;

    const initialW = dialogSize.width;
    const initialH = dialogSize.height;
    const startMouseX = e.clientX;
    const startMouseY = e.clientY;
    const initX = position?.x ?? Math.max(10, (window.innerWidth - initialW) / 2);
    const initY = position?.y ?? Math.max(10, (window.innerHeight - initialH) / 2);

    const onMouseMove = (moveEvent: MouseEvent) => {
      if (!isResizingRef.current) return;
      const deltaX = moveEvent.clientX - startMouseX;
      const deltaY = moveEvent.clientY - startMouseY;

      let newWidth = initialW;
      let newHeight = initialH;
      let newPosX = initX;
      let newPosY = initY;

      if (edge.includes('right')) {
        newWidth = Math.min(Math.max(initialW + deltaX, 720), window.innerWidth - initX - 10);
      } else if (edge.includes('left')) {
        const potentialWidth = initialW - deltaX;
        if (potentialWidth >= 720) {
          newWidth = potentialWidth;
          newPosX = initX + deltaX;
        }
      }

      if (edge.includes('bottom')) {
        newHeight = Math.min(Math.max(initialH + deltaY, 480), window.innerHeight - initY - 10);
      } else if (edge.includes('top')) {
        const potentialHeight = initialH - deltaY;
        if (potentialHeight >= 480) {
          newHeight = potentialHeight;
          newPosY = initY + deltaY;
        }
      }

      setDialogSize({ width: newWidth, height: newHeight });
      setPosition({ x: newPosX, y: newPosY });
    };

    const onMouseUp = () => {
      isResizingRef.current = false;
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  };

  if (!isAdditionalInputsOpen) return null;

  const mainTabs = [
    'Typical Section Details',
    'Member Properties',
    'Loading',
    'Analysis & Design Options',
    'Design Options (Cont.)',
  ];

  return (
    <div className="fixed inset-0 bg-black/25 flex items-center justify-center z-[9999]">
      <div
        className="fixed max-w-[calc(100vw-20px)] max-h-[calc(100vh-20px)] bg-[var(--bg-surface)] text-[var(--text-main)] rounded-[4px] shadow-[0_8px_32px_rgba(0,0,0,0.35)] flex flex-col border-2 border-[var(--accent-osdag)] overflow-hidden z-[10000]"
        style={{
          left: position ? `${position.x}px` : '50%',
          top: position ? `${position.y}px` : '50%',
          transform: position ? undefined : 'translate(-50%, -50%)',
          width: `${dialogSize.width}px`,
          height: `${dialogSize.height}px`,
        }}
      >
        {/* Resize Handles */}
        <div onMouseDown={(e) => handleBorderResizeStart(e, 'top')} className="absolute top-0 left-2.5 right-2.5 h-1.5 cursor-ns-resize z-[100]" />
        <div onMouseDown={(e) => handleBorderResizeStart(e, 'bottom')} className="absolute bottom-0 left-2.5 right-2.5 h-1.5 cursor-ns-resize z-[100]" />
        <div onMouseDown={(e) => handleBorderResizeStart(e, 'left')} className="absolute left-0 top-2.5 bottom-2.5 w-1.5 cursor-ew-resize z-[100]" />
        <div onMouseDown={(e) => handleBorderResizeStart(e, 'right')} className="absolute right-0 top-2.5 bottom-2.5 w-1.5 cursor-ew-resize z-[100]" />
        <div onMouseDown={(e) => handleBorderResizeStart(e, 'top-left')} className="absolute top-0 left-0 w-2.5 h-2.5 cursor-nwse-resize z-[101]" />
        <div onMouseDown={(e) => handleBorderResizeStart(e, 'top-right')} className="absolute top-0 right-0 w-2.5 h-2.5 cursor-nesw-resize z-[101]" />
        <div onMouseDown={(e) => handleBorderResizeStart(e, 'bottom-left')} className="absolute bottom-0 left-0 w-2.5 h-2.5 cursor-nesw-resize z-[101]" />
        <div onMouseDown={(e) => handleBorderResizeStart(e, 'bottom-right')} className="absolute bottom-0 right-0 w-2.5 h-2.5 cursor-nwse-resize z-[101]" />

        {/* Modal Title Bar (Draggable) */}
        <div
          onMouseDown={handleTitleBarMouseDown}
          className="h-8 bg-[var(--header-bg)] flex items-center justify-between pl-2.5 border-b border-[var(--border-color)] select-none relative cursor-move"
        >
          <div className="flex items-center gap-2">
            <img
              src="/vectors/Osdag_logo.svg"
              alt="Osdag"
              width={18}
              height={18}
              className="block select-none pointer-events-none"
            />
            <span className="text-xs font-semibold text-[var(--text-main)]">
              Additional Inputs
            </span>
          </div>

          <div className="relative h-full flex">
            <button
              type="button"
              onClick={() => setAdditionalInputsOpen(false)}
              onMouseEnter={() => setIsCloseHovered(true)}
              onMouseLeave={() => setIsCloseHovered(false)}
              className="w-[46px] h-8 border-0 rounded-none bg-transparent hover:bg-[#fa382f] active:bg-[#c0392b] text-[var(--text-main)] hover:text-white cursor-pointer flex items-center justify-center p-0 text-[15px] font-bold font-sans transition-colors"
              aria-label="Close"
            >
              ✕
            </button>

            {/* Tooltip matching Desktop Osdag (Green border #8cae11) */}
            {isCloseHovered && (
              <div className="absolute top-[34px] right-1 bg-[var(--bg-surface)] border-[1.5px] border-[var(--accent-osdag)] rounded-[2px] p-[3px_8px] shadow-[0_2px_8px_rgba(0,0,0,0.2)] z-[99999] pointer-events-none whitespace-nowrap">
                <span className="text-xs font-bold text-[var(--text-main)] font-sans">
                  Close
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Main Tabs Header */}
        <div className="flex justify-center bg-[var(--bg-surface)] border-b border-[var(--border-color)] pt-2 px-3.5 gap-0 shrink-0">
          {mainTabs.map((tabLabel, idx) => {
            const isSelected = activeMainTab === idx;
            return (
              <button
                key={tabLabel}
                type="button"
                onClick={() => setActiveMainTab(idx)}
                className={`px-[22px] py-[7px] text-xs font-bold border border-[var(--border-color)] relative -bottom-px whitespace-nowrap transition-colors cursor-pointer ${
                  idx < mainTabs.length - 1 ? 'border-r-0' : ''
                } ${
                  isSelected
                    ? 'bg-[var(--accent-osdag)] text-white border-b-0 z-[3]'
                    : 'bg-[var(--bg-grouped)] text-[var(--text-sub)] hover:bg-[var(--bg-surface)] z-[1]'
                }`}
              >
                {tabLabel}
              </button>
            );
          })}
        </div>

        {/* Tab Body Content */}
        <div className="flex-1 flex flex-col min-h-0 overflow-hidden bg-[var(--bg-surface)] pt-1.5">
          {activeMainTab === 0 && <TypicalSectionDetailsTab dialogSize={dialogSize} />}
          {activeMainTab === 1 && <MemberPropertiesTab />}
          {activeMainTab === 2 && <LoadingTab />}
          {activeMainTab === 3 && <AnalysisDesignOptionsTab />}
          {activeMainTab === 4 && <DesignOptionsContTab />}
        </div>

        {/* Bottom Action Bar (Defaults, Save) */}
        <div className="bg-[var(--bg-grouped)] border border-[var(--border-subtle)] rounded-[6px] p-[8px_16px] mx-3.5 mt-1 mb-2.5 flex items-center justify-center gap-3.5 shrink-0 relative">
          <button
            type="button"
            onClick={resetAdditionalDefaults}
            className={actionBtnClass}
          >
            Defaults
          </button>
          <button
            type="button"
            onClick={saveAdditionalInputs}
            className={actionBtnClass}
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
};
