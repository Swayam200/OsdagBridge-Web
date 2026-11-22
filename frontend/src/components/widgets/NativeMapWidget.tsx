/**
 * NativeMapWidget.tsx
 *
 * Canvas port of desktop osdagbridge_desktop.ui.widgets.native_map.NativeMapWidget:
 *   - ArcGIS World Imagery + boundaries/places label tiles (Web Mercator, 256px).
 *   - Starts centred on India (20.5937, 78.9629) at zoom 5; zoom 4–18 by mouse wheel
 *     (web: about the cursor; parent tile shown while new tiles load).
 *   - Drag pans (clamped to India bounds ± 1°); a click (< 5px movement) drops the
 *     red pin and calls onLocationSelected(lat, lon).
 *   - India boundary GeoJSON drawn on top (#092133, 3px), toggled by showBoundary.
 *   - Imperative handle mirrors set_marker_location() (pins + centres, no callback)
 *     and the dialog's direct marker reset (clearMarker()).
 */

import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef } from 'react';
import { fetchIndiaBoundary } from '../../services/api';

export interface NativeMapHandle {
  setMarkerLocation: (lat: number, lon: number) => void;
  clearMarker: () => void;
}

interface NativeMapWidgetProps {
  onLocationSelected: (lat: number, lon: number) => void;
  showBoundary: boolean;
}

const TILE_SIZE = 256;
const MIN_ZOOM = 4; // Restrict zoom out to keep focus on India
const MAX_ZOOM = 18;
const INDIA_BOUNDS = { north: 35, south: 6.5, west: 68.0, east: 97.5 };

// Tiles shared across dialog openings, least recently used evicted first
// (each decoded tile holds ~256 KB; the browser HTTP cache keeps evicted ones).
const MAX_CACHED_TILES = 300;
const tileCache = new Map<string, HTMLImageElement>();

// Boundary lines pre-projected to normalised Web Mercator [x0, y0, x1, y1, ...] and
// split into short chunks with bounding boxes, so a repaint skips off-screen chunks.
// GeoJSON rings repeat their first point, so chunks need no closePath.
const CHUNK_POINTS = 128;
type BoundaryChunk = { points: Float64Array; minX: number; minY: number; maxX: number; maxY: number };
let boundaryPromise: Promise<BoundaryChunk[]> | null = null;

function normX(lon: number): number {
  return (lon + 180) / 360;
}

function normY(lat: number): number {
  // Avoid infinity at poles
  const latRad = Math.max(Math.min((lat * Math.PI) / 180, 1.4844), -1.4844);
  return (1 - Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI) / 2;
}

function latLonToPixel(lat: number, lon: number, zoom: number): [number, number] {
  const world = 2 ** zoom * TILE_SIZE;
  return [normX(lon) * world, normY(lat) * world];
}

function pixelToLatLon(x: number, y: number, zoom: number): [number, number] {
  const world = 2 ** zoom * TILE_SIZE;
  const lon = (x / world) * 360 - 180;
  const lat = (Math.atan(Math.sinh(Math.PI * (1 - (2 * y) / world))) * 180) / Math.PI;
  return [lat, lon];
}

function imageryUrl(zoom: number, row: number, col: number): string {
  return `https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/${zoom}/${row}/${col}`;
}

/** Loaded tile or null, without fetching. */
function peekTile(url: string): HTMLImageElement | null {
  const img = tileCache.get(url);
  return img && img.complete && img.naturalWidth > 0 ? img : null;
}

/** Loaded tile or null; starts the fetch on first request and calls onLoad when it arrives. */
function getTile(url: string, onLoad: () => void): HTMLImageElement | null {
  const cached = tileCache.get(url);
  if (cached) {
    tileCache.delete(url); // mark as most recently used
    tileCache.set(url, cached);
    return peekTile(url);
  }
  const img = new Image();
  img.onload = onLoad;
  img.onerror = () => tileCache.delete(url);
  img.src = url;
  tileCache.set(url, img);
  if (tileCache.size > MAX_CACHED_TILES) tileCache.delete(tileCache.keys().next().value!);
  return null;
}

/** Centre clamped to India bounds ± 1° (desktop pan_map). */
function clampToIndia(lat: number, lon: number): { lat: number; lon: number } {
  return {
    lat: Math.max(Math.min(lat, INDIA_BOUNDS.north + 1.0), INDIA_BOUNDS.south - 1.0),
    lon: Math.max(Math.min(lon, INDIA_BOUNDS.east + 1.0), INDIA_BOUNDS.west - 1.0),
  };
}

function loadBoundary(): Promise<BoundaryChunk[]> {
  if (!boundaryPromise) {
    boundaryPromise = fetchIndiaBoundary().then((data) => {
      const chunks: BoundaryChunk[] = [];
      const add = (line: number[][]) => {
        // Consecutive chunks share an end point so the line stays continuous.
        for (let start = 0; start < line.length - 1; start += CHUNK_POINTS) {
          const part = line.slice(start, start + CHUNK_POINTS + 1);
          const points = new Float64Array(part.length * 2);
          const chunk = { points, minX: 1, minY: 1, maxX: 0, maxY: 0 };
          part.forEach(([lon, lat], i) => {
            const x = normX(lon);
            const y = normY(lat);
            points[2 * i] = x;
            points[2 * i + 1] = y;
            chunk.minX = Math.min(chunk.minX, x);
            chunk.maxX = Math.max(chunk.maxX, x);
            chunk.minY = Math.min(chunk.minY, y);
            chunk.maxY = Math.max(chunk.maxY, y);
          });
          chunks.push(chunk);
        }
      };
      for (const feature of data.features ?? []) {
        const geometry = feature.geometry ?? {};
        const coords = geometry.coordinates ?? [];
        if (geometry.type === 'Polygon' || geometry.type === 'MultiLineString') coords.forEach(add);
        else if (geometry.type === 'MultiPolygon') coords.forEach((poly: number[][][]) => poly.forEach(add));
        else if (geometry.type === 'LineString') add(coords);
      }
      return chunks;
    });
    boundaryPromise.catch(() => {
      boundaryPromise = null; // allow retry on next open
    });
  }
  return boundaryPromise;
}

export const NativeMapWidget = forwardRef<NativeMapHandle, NativeMapWidgetProps>(
  ({ onLocationSelected, showBoundary }, ref) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const view = useRef({ lat: 20.5937, lon: 78.9629, zoom: 5 });
    const marker = useRef<{ lat: number; lon: number } | null>(null);
    const boundary = useRef<BoundaryChunk[]>([]);
    const showBoundaryRef = useRef(showBoundary);
    const drag = useRef({ panning: false, lastX: 0, lastY: 0, pressX: 0, pressY: 0 });
    const frame = useRef(0);
    const onSelectRef = useRef(onLocationSelected);
    onSelectRef.current = onLocationSelected;

    const paint = useCallback(() => {
      frame.current = 0;
      const canvas = canvasRef.current;
      if (!canvas) return;
      const width = canvas.clientWidth;
      const height = canvas.clientHeight;
      if (width === 0 || height === 0) return;

      const dpr = window.devicePixelRatio || 1;
      if (canvas.width !== Math.round(width * dpr) || canvas.height !== Math.round(height * dpr)) {
        canvas.width = Math.round(width * dpr);
        canvas.height = Math.round(height * dpr);
      }
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, width, height);

      const { lat, lon, zoom } = view.current;
      const [centerX, centerY] = latLonToPixel(lat, lon, zoom);
      const viewX = centerX - width / 2;
      const viewY = centerY - height / 2;

      // Tiles
      const totalTiles = 2 ** zoom;
      const startCol = Math.floor(viewX / TILE_SIZE);
      const endCol = Math.floor((viewX + width) / TILE_SIZE);
      const startRow = Math.floor(viewY / TILE_SIZE);
      const endRow = Math.floor((viewY + height) / TILE_SIZE);

      for (let col = startCol; col <= endCol; col++) {
        for (let row = startRow; row <= endRow; row++) {
          if (row < 0 || row >= totalTiles) continue;
          const tileX = ((col % totalTiles) + totalTiles) % totalTiles;
          const screenX = col * TILE_SIZE - viewX;
          const screenY = row * TILE_SIZE - viewY;
          const baseUrl = imageryUrl(zoom, row, tileX);
          const labelsUrl = `https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/${zoom}/${row}/${tileX}`;

          const base = getTile(baseUrl, update);
          // While loading after a zoom, stretch the matching quarter of the parent tile.
          const parent = base ? null : peekTile(imageryUrl(zoom - 1, row >> 1, tileX >> 1));
          if (base) {
            ctx.drawImage(base, screenX, screenY, TILE_SIZE, TILE_SIZE);
          } else if (parent) {
            const half = TILE_SIZE / 2;
            ctx.drawImage(parent, (tileX & 1) * half, (row & 1) * half, half, half, screenX, screenY, TILE_SIZE, TILE_SIZE);
          } else {
            ctx.fillStyle = 'rgb(240, 240, 240)';
            ctx.fillRect(screenX, screenY, TILE_SIZE, TILE_SIZE);
          }
          const labels = getTile(labelsUrl, update);
          if (labels) ctx.drawImage(labels, screenX, screenY, TILE_SIZE, TILE_SIZE);
        }
      }

      // India boundary on top of raster layers: only on-screen chunks, and
      // segments shorter than 1px are skipped (245k points → a few thousand).
      if (showBoundaryRef.current && boundary.current.length) {
        const world = totalTiles * TILE_SIZE;
        const margin = 2 / world; // half the 3px line width, in normalised units
        const left = viewX / world - margin;
        const right = (viewX + width) / world + margin;
        const top = viewY / world - margin;
        const bottom = (viewY + height) / world + margin;

        ctx.save();
        ctx.strokeStyle = '#092133';
        ctx.lineWidth = 3;
        ctx.beginPath();
        for (const { points, minX, minY, maxX, maxY } of boundary.current) {
          if (maxX < left || minX > right || maxY < top || minY > bottom) continue;
          let lastX = points[0] * world - viewX;
          let lastY = points[1] * world - viewY;
          ctx.moveTo(lastX, lastY);
          for (let i = 2; i < points.length; i += 2) {
            const x = points[i] * world - viewX;
            const y = points[i + 1] * world - viewY;
            // Always keep a chunk's last point so neighbouring chunks join up.
            if (i < points.length - 2 && Math.abs(x - lastX) + Math.abs(y - lastY) < 1) continue;
            ctx.lineTo(x, y);
            lastX = x;
            lastY = y;
          }
        }
        ctx.stroke();
        ctx.restore();
      }

      // Marker (pin)
      if (marker.current) {
        const [mx, my] = latLonToPixel(marker.current.lat, marker.current.lon, zoom);
        const x = mx - viewX;
        const y = my - viewY;
        ctx.fillStyle = 'rgb(255, 0, 0)';
        ctx.beginPath();
        ctx.arc(x, y - 15, 8, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo(x - 7, y - 11);
        ctx.lineTo(x + 7, y - 11);
        ctx.lineTo(x, y);
        ctx.closePath();
        ctx.fill();
      }
    }, []);

    const update = useCallback(() => {
      if (!frame.current) frame.current = requestAnimationFrame(paint);
    }, [paint]);

    useImperativeHandle(
      ref,
      () => ({
        setMarkerLocation: (lat, lon) => {
          marker.current = { lat, lon };
          view.current = { ...view.current, lat, lon };
          update();
        },
        clearMarker: () => {
          marker.current = null;
          update();
        },
      }),
      [update],
    );

    useEffect(() => {
      showBoundaryRef.current = showBoundary;
      update();
    }, [showBoundary, update]);

    useEffect(() => {
      const canvas = canvasRef.current!;
      let active = true;
      loadBoundary().then((loaded) => {
        if (!active) return;
        boundary.current = loaded;
        update();
      });

      const resizeObserver = new ResizeObserver(update);
      resizeObserver.observe(canvas);

      // Native listener so the wheel can be prevented from scrolling the dialog.
      // Zooms one level about the cursor, so the point under it stays put.
      const onWheel = (e: WheelEvent) => {
        e.preventDefault();
        if (e.deltaY === 0) return;
        const { lat, lon, zoom } = view.current;
        const next = e.deltaY < 0 ? Math.min(zoom + 1, MAX_ZOOM) : Math.max(zoom - 1, MIN_ZOOM);
        if (next === zoom) return;

        const rect = canvas.getBoundingClientRect();
        const offsetX = e.clientX - rect.left - rect.width / 2;
        const offsetY = e.clientY - rect.top - rect.height / 2;
        const [cx, cy] = latLonToPixel(lat, lon, zoom);
        const [cursorLat, cursorLon] = pixelToLatLon(cx + offsetX, cy + offsetY, zoom);
        const [px, py] = latLonToPixel(cursorLat, cursorLon, next);
        const [newLat, newLon] = pixelToLatLon(px - offsetX, py - offsetY, next);
        view.current = { zoom: next, ...clampToIndia(newLat, newLon) };
        update();
      };
      canvas.addEventListener('wheel', onWheel, { passive: false });

      return () => {
        active = false;
        resizeObserver.disconnect();
        canvas.removeEventListener('wheel', onWheel);
        cancelAnimationFrame(frame.current);
        frame.current = 0;
      };
    }, [update]);

    const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
      if (e.button !== 0) return;
      e.currentTarget.setPointerCapture(e.pointerId);
      drag.current = { panning: true, lastX: e.clientX, lastY: e.clientY, pressX: e.clientX, pressY: e.clientY };
      e.currentTarget.style.cursor = 'grabbing';
    };

    const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
      const d = drag.current;
      if (!d.panning) return;
      const dx = e.clientX - d.lastX;
      const dy = e.clientY - d.lastY;
      d.lastX = e.clientX;
      d.lastY = e.clientY;

      // Shift centre opposite to the mouse, clamped to India bounds ± 1°
      const { lat, lon, zoom } = view.current;
      const [cx, cy] = latLonToPixel(lat, lon, zoom);
      const [newLat, newLon] = pixelToLatLon(cx - dx, cy - dy, zoom);
      view.current = { zoom, ...clampToIndia(newLat, newLon) };
      update();
    };

    const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
      const d = drag.current;
      if (e.button !== 0 || !d.panning) return;
      d.panning = false;
      e.currentTarget.style.cursor = 'default';

      // A click (moved < 5px) places the marker
      if (Math.abs(e.clientX - d.pressX) + Math.abs(e.clientY - d.pressY) < 5) {
        const rect = e.currentTarget.getBoundingClientRect();
        const { lat, lon, zoom } = view.current;
        const [cx, cy] = latLonToPixel(lat, lon, zoom);
        const [clickLat, clickLon] = pixelToLatLon(
          cx - rect.width / 2 + (e.clientX - rect.left),
          cy - rect.height / 2 + (e.clientY - rect.top),
          zoom,
        );
        marker.current = { lat: clickLat, lon: clickLon };
        update();
        onSelectRef.current(clickLat, clickLon);
      }
    };

    return (
      <canvas
        ref={canvasRef}
        // flex-basis 0 + explicit min sizes keep the canvas's pixel size from driving layout
        className="block w-full flex-[1_1_0] min-w-[400px] min-h-[300px] touch-none"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={() => (drag.current.panning = false)}
      />
    );
  },
);

NativeMapWidget.displayName = 'NativeMapWidget';
