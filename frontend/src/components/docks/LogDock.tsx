/**
 * LogDock.tsx
 * Log dock component styled with Tailwind CSS utility classes.
 */

import React, { useEffect, useRef, useState } from 'react';
import { useBridgeStore } from '../../store/useBridgeStore';

function getLevelClass(level: string): string {
  switch (level) {
    case 'error':        return 'text-[#FF0000]';
    case 'warning':      return 'text-[#FFA500]';
    case 'success':      return 'text-[#008000]';
    case 'stdout_print':
    case 'info':
    default:             return 'text-log-text';
  }
}

export const LogDock: React.FC = () => {
  const {
    isLogDockOpen,
    isLogDockCollapsed,
    logWindowTitle,
    logProgress,
    logs,
    activeViewportTab,
  } = useBridgeStore();

  const scrollRef = useRef<HTMLDivElement>(null);
  const [isAutoScroll, setIsAutoScroll] = useState(true);

  useEffect(() => {
    if (!scrollRef.current || !isAutoScroll || isLogDockCollapsed) return;
    scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [logs, isAutoScroll, isLogDockCollapsed]);

  const handleScroll = () => {
    if (!scrollRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
    setIsAutoScroll(scrollHeight - scrollTop - clientHeight <= 15);
  };

  if (!isLogDockOpen) return null;

  return (
    <div
      id="logs_dock"
      className={`w-full shrink-0 border-t border-border bg-log-header flex flex-col box-border overflow-hidden ${
        isLogDockCollapsed
          ? 'h-[26px] px-2'
          : activeViewportTab === 'plots'
          ? 'h-[140px] pt-1 px-2 pb-3.5'
          : 'h-[clamp(160px,22vh,210px)] pt-1 px-2 pb-3.5'
      }`}
    >
      {/* ── Title Bar ── */}
      <div className={`flex items-center select-none bg-transparent ${isLogDockCollapsed ? 'h-[26px]' : 'h-5 mb-1'}`}>
        <span className="text-xs font-bold text-main leading-none">
          {logWindowTitle}
        </span>

        {/* Inline progress bar */}
        {logProgress !== null && logProgress < 100 && (
          <div className="ml-2 w-[60px] h-1 bg-accent/20 rounded overflow-hidden">
            <div
              className="h-full bg-accent transition-[width] duration-200"
              style={{ width: `${logProgress}%` }}
            />
          </div>
        )}
      </div>

      {/* ── Log Display Area ── */}
      {!isLogDockCollapsed && (
        <div
          ref={scrollRef}
          onScroll={handleScroll}
          id="textEdit"
          role="log"
          aria-live="polite"
          aria-label="Design log messages"
          className="flex-1 overflow-y-auto py-1 px-1.5 bg-log text-log-text font-mono text-xs leading-[1.45] border-t border-l border-r border-log-border border-b-0 rounded-t whitespace-pre-wrap break-words select-text box-border m-0 min-h-0"
        >
          {logs.map((entry) => (
            <div
              key={entry.id}
              className={`mb-0.5 ${getLevelClass(entry.level)}`}
            >
              {entry.message}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
