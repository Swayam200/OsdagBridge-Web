import React, { useState, useRef, useLayoutEffect } from 'react';

interface CrossSectionPreviewProps {
  carriagewayWidth?: number;
  overallWidth?: number;
  numGirders?: number;
  girderSpacing?: number;
  deckOverhang?: number;
  deckThickness?: number;
  crashBarrierWidth?: number;
  footpathWidth?: number;
  wearingCourseThickness?: number;
}

export const CrossSectionPreview: React.FC<CrossSectionPreviewProps> = () => {
  const [zoom, setZoom] = useState(1.0);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Start scroll at top with clean space above carriageway width dimension
  useLayoutEffect(() => {
    const centerView = () => {
      if (scrollRef.current) {
        const el = scrollRef.current;
        el.scrollTop = 0;
      }
    };
    centerView();
    const t = setTimeout(centerView, 60);
    return () => clearTimeout(t);
  }, []);

  const handleZoomIn = () => {
    setZoom((z) => Math.min(z + 0.2, 2.0));
  };

  const handleZoomOut = () => {
    setZoom((z) => Math.max(z - 0.2, 0.7));
  };

  const handleResetZoom = () => {
    setZoom(1.0);
    if (scrollRef.current) {
      const el = scrollRef.current;
      el.scrollTop = 0;
      el.scrollLeft = Math.max(0, (el.scrollWidth - el.clientWidth) / 2);
    }
  };

  // ── Exact CAD Dimensions matching Desktop Osdag (1000 x 390 Canvas) ──
  const svgWidth = 1000;
  const svgHeight = 390;

  const deckLeft = 63.0;
  const deckRight = 937.0;
  const deckWidthPx = deckRight - deckLeft; // 874px
  const midDeckX = (deckLeft + deckRight) / 2; // 500.0px

  const displayCarriagewayWidth = 7.00;
  const displayOverallWidth = 7.90;
  const displayGirderSpacing = 1.98;
  const displayDeckOverhang = 0.99;
  const displayDeckThickness = 250;

  // Scale: 874px / 7.90m = 110.63 px/m
  const scale = deckWidthPx / displayOverallWidth;

  // Vertical layout Y coordinates (generous space at top and bottom)
  const topDimY = 32;       // Clean space above carriageway width line
  const barrierTopY = 54;   // Top of crash barrier
  const deckTopY = 98;      // Top of deck slab
  const deckThicknessPx = 34;
  const deckBottomY = deckTopY + deckThicknessPx; // 132

  // Crash barrier width
  const barrierWidthPx = 50;

  // Wearing course
  const wcThicknessPx = 5;
  const wcStartX = deckLeft + barrierWidthPx;
  const wcEndX = deckRight - barrierWidthPx;
  const wcWidthPx = wcEndX - wcStartX;

  // Exactly 4 Girder positions
  const overhangPx = displayDeckOverhang * scale; // ~109.5px
  const gSpacingPx = displayGirderSpacing * scale; // ~219.0px

  const girderPositions: number[] = [
    deckLeft + overhangPx,
    deckLeft + overhangPx + gSpacingPx,
    deckLeft + overhangPx + 2 * gSpacingPx,
    deckLeft + overhangPx + 3 * gSpacingPx,
  ];

  // Girder structural dimensions (exact Desktop Osdag proportions)
  const flangeWidth = 76;
  const flangeThick = 10;
  const webThick = 7;
  const girderDepth = 170;
  const girderBottomY = deckBottomY + girderDepth; // 302
  const webTopY = deckBottomY + flangeThick; // 142
  const webBottomY = girderBottomY - flangeThick; // 292
  const stiffenerWidth = (flangeWidth - webThick) / 2; // 34.5px
  const chamfer = 12;

  // Bottom Dimension line levels
  const bottomDimY1 = 338; // Overhang & Girder Spacing
  const bottomDimY2 = 372; // Overall Bridge Width

  return (
    <div className="w-full h-full bg-white relative overflow-hidden">
      {/* Zoom / View controls (Top-Right, Fixed above scroll area) */}
      <div className="absolute top-2.5 right-4.5 flex flex-col gap-[3px] z-30">
        <button
          type="button"
          onClick={handleZoomIn}
          title="Zoom In"
          className="w-[22px] h-[22px] bg-[var(--bg-surface)] border border-[var(--border-color)] rounded-[2px] cursor-pointer flex items-center justify-center p-0 text-sm font-bold text-[var(--text-main)] shadow-[0_1px_3px_rgba(0,0,0,0.15)] hover:bg-[var(--bg-grouped)]"
        >
          +
        </button>
        <button
          type="button"
          onClick={handleZoomOut}
          title="Zoom Out"
          className="w-[22px] h-[22px] bg-[var(--bg-surface)] border border-[var(--border-color)] rounded-[2px] cursor-pointer flex items-center justify-center p-0 text-sm font-bold text-[var(--text-main)] shadow-[0_1px_3px_rgba(0,0,0,0.15)] hover:bg-[var(--bg-grouped)]"
        >
          -
        </button>
        <button
          type="button"
          onClick={handleResetZoom}
          title="Fit to Screen"
          className="w-[22px] h-[22px] bg-[var(--bg-surface)] border border-[var(--border-color)] rounded-[2px] cursor-pointer flex items-center justify-center p-0 shadow-[0_1px_3px_rgba(0,0,0,0.15)] hover:bg-[var(--bg-grouped)]"
        >
          <div className="w-2.5 h-2.5 border-2 border-[var(--text-main)] rounded-[1px]" />
        </button>
      </div>

      {/* Scrollable Container with Native Scrollbar & Trackpad Scrolling (No trackpad zoom) */}
      <div
        ref={scrollRef}
        className="card-scroll w-full h-full overflow-y-scroll overflow-x-auto bg-white relative"
      >
        <div
          className="min-w-[960px] w-full min-h-[390px] flex items-center justify-center py-2.5 box-border"
          style={{ height: `${390 * zoom}px` }}
        >
          {/* Cross section SVG Canvas (Large, Crisp, Legible) */}
          <svg
            viewBox={`0 0 ${svgWidth} ${svgHeight}`}
            width={960 * zoom}
            height={390 * zoom}
            className="block mx-auto"
          >
            <defs>
              {/* Concrete hatch pattern with aggregates (realistic Desktop Osdag texture) */}
              <pattern id="concreteHatch" width="40" height="40" patternUnits="userSpaceOnUse">
                <rect width="40" height="40" fill="#dcdcdb" />
                <polygon points="5,8 11,4 9,12" fill="#666666" />
                <polygon points="25,28 32,24 29,33" fill="#555555" />
                <polygon points="18,16 23,12 21,19" fill="#777777" />
                <polygon points="34,8 39,5 37,13" fill="#555555" />
                <polygon points="4,32 10,29 7,37" fill="#666666" />
                <circle cx="14" cy="24" r="1.1" fill="#333333" />
                <circle cx="28" cy="14" r="1.0" fill="#222222" />
                <circle cx="8" cy="18" r="0.9" fill="#444444" />
                <circle cx="36" cy="36" r="1.2" fill="#333333" />
                <circle cx="20" cy="38" r="0.8" fill="#444444" />
                <circle cx="2" cy="3" r="0.8" fill="#333333" />
              </pattern>

              {/* Dimension arrows */}
              <marker id="arrowLeft" viewBox="0 0 10 10" refX="2" refY="5" markerWidth="6" markerHeight="6" orient="auto">
                <path d="M 10 2 L 0 5 L 10 8 z" fill="#000000" />
              </marker>
              <marker id="arrowRight" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto">
                <path d="M 0 2 L 10 5 L 0 8 z" fill="#000000" />
              </marker>
              <marker id="arrowUp" viewBox="0 0 10 10" refX="5" refY="2" markerWidth="6" markerHeight="6" orient="auto">
                <path d="M 2 10 L 5 0 L 8 10 z" fill="#000000" />
              </marker>
              <marker id="arrowDown" viewBox="0 0 10 10" refX="5" refY="8" markerWidth="6" markerHeight="6" orient="auto">
                <path d="M 2 0 L 5 10 L 8 0 z" fill="#000000" />
              </marker>
            </defs>

            {/* ── 1. EXACTLY 4 STEEL I-GIRDERS & STIFFENERS ─────────────────── */}
            {girderPositions.map((gx, idx) => {
              const halfWeb = webThick / 2;
              const lxLeft = gx - halfWeb - stiffenerWidth;
              const rxLeft = gx - halfWeb;
              const lxRight = gx + halfWeb;
              const rxRight = gx + halfWeb + stiffenerWidth;

              return (
                <g key={`girder-${idx}`}>
                  {/* Left Stiffener with inner chamfers */}
                  <polygon
                    points={`
                      ${lxLeft},${webTopY}
                      ${rxLeft - chamfer},${webTopY}
                      ${rxLeft},${webTopY + chamfer}
                      ${rxLeft},${webBottomY - chamfer}
                      ${rxLeft - chamfer},${webBottomY}
                      ${lxLeft},${webBottomY}
                    `}
                    fill="#d2d2cd"
                    stroke="#000000"
                    strokeWidth="1"
                  />

                  {/* Right Stiffener with inner chamfers */}
                  <polygon
                    points={`
                      ${lxRight},${webTopY + chamfer}
                      ${lxRight + chamfer},${webTopY}
                      ${rxRight},${webTopY}
                      ${rxRight},${webBottomY}
                      ${lxRight + chamfer},${webBottomY}
                      ${lxRight},${webBottomY - chamfer}
                    `}
                    fill="#d2d2cd"
                    stroke="#000000"
                    strokeWidth="1"
                  />

                  {/* Web */}
                  <rect
                    x={gx - halfWeb}
                    y={webTopY}
                    width={webThick}
                    height={webBottomY - webTopY}
                    fill="#f9fae4"
                    stroke="#000000"
                    strokeWidth="1.2"
                  />

                  {/* Top Flange */}
                  <rect
                    x={gx - flangeWidth / 2}
                    y={deckBottomY}
                    width={flangeWidth}
                    height={flangeThick}
                    fill="#f9fae4"
                    stroke="#000000"
                    strokeWidth="1.2"
                  />

                  {/* Bottom Flange */}
                  <rect
                    x={gx - flangeWidth / 2}
                    y={webBottomY}
                    width={flangeWidth}
                    height={flangeThick}
                    fill="#f9fae4"
                    stroke="#000000"
                    strokeWidth="1.2"
                  />
                </g>
              );
            })}

            {/* ── 2. CROSS BRACING (3 Bays between 4 Girders) ─────────────── */}
            {girderPositions.slice(0, 3).map((gx, idx) => {
              const nextGx = girderPositions[idx + 1];
              const halfWeb = webThick / 2;

              const xL = gx + halfWeb;
              const xR = nextGx - halfWeb;
              const topConnY = webTopY + 7;
              const botConnY = webBottomY - 7;

              return (
                <g key={`bracing-${idx}`}>
                  {/* Corner triangular connection gussets */}
                  <polygon
                    points={`${xL},${webTopY} ${xL + 16},${webTopY} ${xL},${webTopY + 16}`}
                    fill="#f9fae4"
                    stroke="#444444"
                    strokeWidth="1"
                  />
                  <polygon
                    points={`${xL},${webBottomY} ${xL + 16},${webBottomY} ${xL},${webBottomY - 16}`}
                    fill="#f9fae4"
                    stroke="#444444"
                    strokeWidth="1"
                  />
                  <polygon
                    points={`${xR},${webTopY} ${xR - 16},${webTopY} ${xR},${webTopY + 16}`}
                    fill="#f9fae4"
                    stroke="#444444"
                    strokeWidth="1"
                  />
                  <polygon
                    points={`${xR},${webBottomY} ${xR - 16},${webBottomY} ${xR},${webBottomY - 16}`}
                    fill="#f9fae4"
                    stroke="#444444"
                    strokeWidth="1"
                  />

                  {/* Diagonal X arms (outer dark border) */}
                  <line
                    x1={xL}
                    y1={topConnY}
                    x2={xR}
                    y2={botConnY}
                    stroke="#444444"
                    strokeWidth="4"
                  />
                  <line
                    x1={xL}
                    y1={botConnY}
                    x2={xR}
                    y2={topConnY}
                    stroke="#444444"
                    strokeWidth="4"
                  />

                  {/* Diagonal X arms (inner pale cream fill) */}
                  <line
                    x1={xL}
                    y1={topConnY}
                    x2={xR}
                    y2={botConnY}
                    stroke="#e5e6ca"
                    strokeWidth="2.2"
                  />
                  <line
                    x1={xL}
                    y1={botConnY}
                    x2={xR}
                    y2={topConnY}
                    stroke="#e5e6ca"
                    strokeWidth="2.2"
                  />
                </g>
              );
            })}

            {/* ── 3. GIRDER LEADER POINTER (On Girder 2) ───────────────────── */}
            <g key="girder-leader">
              <circle
                cx={girderPositions[1]}
                cy={(webTopY + webBottomY) / 2}
                r="3.5"
                fill="#ffffff"
                stroke="#555555"
                strokeWidth="1.2"
              />
              <line
                x1={girderPositions[1] + 3.5}
                y1={(webTopY + webBottomY) / 2 + 2}
                x2={girderPositions[1] + 42}
                y2={(webTopY + webBottomY) / 2 + 38}
                stroke="#555555"
                strokeWidth="1"
                strokeDasharray="2 2"
              />
              <text
                x={girderPositions[1] + 46}
                y={(webTopY + webBottomY) / 2 + 42}
                fontSize="10.5"
                fill="#222222"
                fontFamily="Segoe UI, Arial, sans-serif"
              >
                Girder
              </text>
            </g>

            {/* ── 4. CONCRETE DECK SLAB ─────────────────────────────────────── */}
            <rect
              x={deckLeft}
              y={deckTopY}
              width={deckWidthPx}
              height={deckThicknessPx}
              fill="url(#concreteHatch)"
              stroke="#000000"
              strokeWidth="1.2"
            />

            {/* ── 5. WEARING COURSE (Asphalt Layer) ─────────────────────────── */}
            <rect
              x={wcStartX}
              y={deckTopY - wcThicknessPx}
              width={wcWidthPx}
              height={wcThicknessPx}
              fill="#282828"
              stroke="#111111"
              strokeWidth="0.8"
            />

            {/* ── 6. CRASH BARRIERS (IRC 5 RCC Geometry) ───────────────────── */}
            <path
              d={`
                M ${deckLeft} ${deckTopY}
                L ${deckLeft} ${barrierTopY}
                L ${deckLeft + barrierWidthPx * 0.45} ${barrierTopY}
                L ${deckLeft + barrierWidthPx * 0.55} ${barrierTopY + 15}
                L ${deckLeft + barrierWidthPx * 0.78} ${barrierTopY + 34}
                L ${deckLeft + barrierWidthPx} ${deckTopY}
                Z
              `}
              fill="url(#concreteHatch)"
              stroke="#000000"
              strokeWidth="1.2"
            />
            <path
              d={`
                M ${deckRight} ${deckTopY}
                L ${deckRight} ${barrierTopY}
                L ${deckRight - barrierWidthPx * 0.45} ${barrierTopY}
                L ${deckRight - barrierWidthPx * 0.55} ${barrierTopY + 15}
                L ${deckRight - barrierWidthPx * 0.78} ${barrierTopY + 34}
                L ${deckRight - barrierWidthPx} ${deckTopY}
                Z
              `}
              fill="url(#concreteHatch)"
              stroke="#000000"
              strokeWidth="1.2"
            />

            {/* ── 7. TOP DIMENSION: Carriageway Width = 7.00 m (With Clean Top Space) ── */}
            <line
              x1={wcStartX}
              y1={barrierTopY}
              x2={wcStartX}
              y2={topDimY - 4}
              stroke="#000000"
              strokeWidth="0.8"
              strokeDasharray="2 2"
            />
            <line
              x1={wcEndX}
              y1={barrierTopY}
              x2={wcEndX}
              y2={topDimY - 4}
              stroke="#000000"
              strokeWidth="0.8"
              strokeDasharray="2 2"
            />
            <line
              x1={wcStartX + 2}
              y1={topDimY}
              x2={wcEndX - 2}
              y2={topDimY}
              stroke="#000000"
              strokeWidth="0.9"
              markerStart="url(#arrowLeft)"
              markerEnd="url(#arrowRight)"
            />
            <rect
              x={midDeckX - 85}
              y={topDimY - 14}
              width="170"
              height="12"
              fill="#ffffff"
            />
            <text
              x={midDeckX}
              y={topDimY - 5}
              textAnchor="middle"
              fontSize="10"
              fontWeight="500"
              fill="#000000"
              fontFamily="Segoe UI, Arial, sans-serif"
            >
              Carriageway Width = {displayCarriagewayWidth.toFixed(2)} m
            </text>

            {/* ── 8. DECK THICKNESS DIMENSION = 250 mm ─────────────────────── */}
            <line
              x1={midDeckX}
              y1={deckTopY + 2}
              x2={midDeckX}
              y2={deckBottomY - 2}
              stroke="#000000"
              strokeWidth="0.8"
              markerStart="url(#arrowUp)"
              markerEnd="url(#arrowDown)"
            />
            <line x1={midDeckX - 5} y1={deckTopY} x2={midDeckX + 5} y2={deckTopY} stroke="#000000" strokeWidth="0.8" />
            <line x1={midDeckX - 5} y1={deckBottomY} x2={midDeckX + 5} y2={deckBottomY} stroke="#000000" strokeWidth="0.8" />
            <rect
              x={midDeckX - 70}
              y={deckTopY - 17}
              width="140"
              height="13"
              fill="#ffffff"
              rx="1"
            />
            <text
              x={midDeckX}
              y={deckTopY - 7}
              textAnchor="middle"
              fontSize="9.5"
              fill="#000000"
              fontFamily="Segoe UI, Arial, sans-serif"
            >
              Deck Thickness = {displayDeckThickness.toFixed(0)} mm
            </text>

            {/* ── 9. BOTTOM DIMENSIONS (4 Girders Layout) ──────────────────── */}
            {/* ── LEVEL 1: Overhang & Girder Spacing (Y = 338) ── */}

            {/* A. Overhang Dimension = 0.99 m */}
            <g key="dim-overhang">
              <line
                x1={deckLeft}
                y1={deckBottomY}
                x2={deckLeft}
                y2={bottomDimY1 + 6}
                stroke="#000000"
                strokeWidth="0.8"
                strokeDasharray="2 2"
              />
              <line
                x1={girderPositions[0]}
                y1={girderBottomY}
                x2={girderPositions[0]}
                y2={bottomDimY1 + 6}
                stroke="#000000"
                strokeWidth="0.8"
                strokeDasharray="2 2"
              />
              <line
                x1={deckLeft + 2}
                y1={bottomDimY1}
                x2={girderPositions[0] - 2}
                y2={bottomDimY1}
                stroke="#000000"
                strokeWidth="0.8"
                markerStart="url(#arrowLeft)"
                markerEnd="url(#arrowRight)"
              />
              <rect
                x={(deckLeft + girderPositions[0]) / 2 - 50}
                y={bottomDimY1 - 15}
                width="100"
                height="12"
                fill="#ffffff"
              />
              <text
                x={(deckLeft + girderPositions[0]) / 2}
                y={bottomDimY1 - 6}
                textAnchor="middle"
                fontSize="9.5"
                fill="#000000"
                fontFamily="Segoe UI, Arial, sans-serif"
              >
                Overhang = {displayDeckOverhang.toFixed(2)} m
              </text>
            </g>

            {/* B. Girder Spacing Dimension = 1.98 m (Between Girder 2 & Girder 3) */}
            <g key="dim-spacing">
              <line
                x1={girderPositions[1]}
                y1={girderBottomY}
                x2={girderPositions[1]}
                y2={bottomDimY1 + 6}
                stroke="#000000"
                strokeWidth="0.8"
                strokeDasharray="2 2"
              />
              <line
                x1={girderPositions[2]}
                y1={girderBottomY}
                x2={girderPositions[2]}
                y2={bottomDimY1 + 6}
                stroke="#000000"
                strokeWidth="0.8"
                strokeDasharray="2 2"
              />
              <line
                x1={girderPositions[1] + 2}
                y1={bottomDimY1}
                x2={girderPositions[2] - 2}
                y2={bottomDimY1}
                stroke="#000000"
                strokeWidth="0.8"
                markerStart="url(#arrowLeft)"
                markerEnd="url(#arrowRight)"
              />
              <rect
                x={(girderPositions[1] + girderPositions[2]) / 2 - 60}
                y={bottomDimY1 - 15}
                width="120"
                height="12"
                fill="#ffffff"
              />
              <text
                x={(girderPositions[1] + girderPositions[2]) / 2}
                y={bottomDimY1 - 6}
                textAnchor="middle"
                fontSize="9.5"
                fill="#000000"
                fontFamily="Segoe UI, Arial, sans-serif"
              >
                Girder Spacing = {displayGirderSpacing.toFixed(2)} m
              </text>
            </g>

            {/* ── LEVEL 2: Overall Bridge Width = 7.90 m (Y = 372) ─────────── */}
            <g key="dim-overall">
              <line
                x1={deckLeft}
                y1={bottomDimY1 + 8}
                x2={deckLeft}
                y2={bottomDimY2 + 6}
                stroke="#000000"
                strokeWidth="0.8"
                strokeDasharray="2 2"
              />
              <line
                x1={deckRight}
                y1={deckBottomY}
                x2={deckRight}
                y2={bottomDimY2 + 6}
                stroke="#000000"
                strokeWidth="0.8"
                strokeDasharray="2 2"
              />
              <line
                x1={deckLeft + 2}
                y1={bottomDimY2}
                x2={deckRight - 2}
                y2={bottomDimY2}
                stroke="#000000"
                strokeWidth="0.8"
                markerStart="url(#arrowLeft)"
                markerEnd="url(#arrowRight)"
              />
              <rect
                x={midDeckX - 90}
                y={bottomDimY2 - 15}
                width="180"
                height="12"
                fill="#ffffff"
              />
              <text
                x={midDeckX}
                y={bottomDimY2 - 6}
                textAnchor="middle"
                fontSize="10"
                fontWeight="bold"
                fill="#000000"
                fontFamily="Segoe UI, Arial, sans-serif"
              >
                Overall Bridge Width = {displayOverallWidth.toFixed(2)} m
              </text>
            </g>
          </svg>
        </div>
      </div>
    </div>
  );
};
