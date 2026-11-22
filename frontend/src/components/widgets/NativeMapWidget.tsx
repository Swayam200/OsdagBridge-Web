/**
 * NativeMapWidget.tsx
 *
 * Canvas port of desktop osdagbridge_desktop.ui.widgets.native_map.NativeMapWidget:
 *   - ArcGIS World Imagery + boundaries/places label tiles (Web Mercator, 256px).
 *   - Starts centred on India (20.5937, 78.9629) at zoom 5; zoom 4–18 by mouse wheel.
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

// Loaded tiles shared across dialog openings (desktop keeps a pixmap cache).
const tileCache = new Map<string, HTMLImageElement>();

// Boundary rings pre-projected to normalised Web Mercator [x0, y0, x1, y1, ...].
type Shape = { points: Float64Array; closed: boolean };
let boundaryPromise: Promise<Shape[]> | null = null;

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

function loadBoundary(): Promise<Shape[]> {
  if (!boundaryPromise) {
    boundaryPromise = fetchIndiaBoundary().then((data) => {
      const shapes: Shape[] = [];
      const add = (coords: number[][], closed: boolean) => {
        const points = new Float64Array(coords.length * 2);
        coords.forEach(([lon, lat], i) => {
          points[2 * i] = normX(lon);
          points[2 * i + 1] = normY(lat);
        });
        shapes.push({ points, closed });
      };
      for (const feature of data.features ?? []) {
        const geometry = feature.geometry ?? {};
        const coords = geometry.coordinates ?? [];
        if (geometry.type === 'Polygon') coords.forEach((ring: number[][]) => add(ring, true));
        else if (geometry.type === 'MultiPolygon')
          coords.forEach((poly: number[][][]) => poly.forEach((ring) => add(ring, true)));
        else if (geometry.type === 'LineString') add(coords, false);
        else if (geometry.type === 'MultiLineString') coords.forEach((line: number[][]) => add(line, false));
      }
      return shapes;
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
    const shapes = useRef<Shape[]>([]);
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
          const baseUrl = `https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/${zoom}/${row}/${tileX}`;
          const labelsUrl = `https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/${zoom}/${row}/${tileX}`;

          const base = getTile(baseUrl);
          if (base) {
            ctx.drawImage(base, screenX, screenY, TILE_SIZE, TILE_SIZE);
          } else {
            ctx.fillStyle = 'rgb(240, 240, 240)';
            ctx.fillRect(screenX, screenY, TILE_SIZE, TILE_SIZE);
          }
          const labels = getTile(labelsUrl);
          if (labels) ctx.drawImage(labels, screenX, screenY, TILE_SIZE, TILE_SIZE);
        }
      }

      // India boundary on top of raster layers
      if (showBoundaryRef.current && shapes.current.length) {
        const world = totalTiles * TILE_SIZE;
        ctx.save();
        ctx.strokeStyle = '#092133';
        ctx.lineWidth = 3;
        ctx.beginPath();
        for (const { points, closed } of shapes.current) {
          if (points.length < 4) continue;
          ctx.moveTo(points[0] * world - viewX, points[1] * world - viewY);
          for (let i = 2; i < points.length; i += 2) {
            ctx.lineTo(points[i] * world - viewX, points[i + 1] * world - viewY);
          }
          if (closed) ctx.closePath();
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

    /** Cached, loaded tile or null; starts the fetch on first request (repaints on load). */
    const getTile = (url: string): HTMLImageElement | null => {
      const cached = tileCache.get(url);
      if (cached) return cached.complete && cached.naturalWidth > 0 ? cached : null;
      const img = new Image();
      img.onload = update;
      img.onerror = () => tileCache.delete(url);
      img.src = url;
      tileCache.set(url, img);
      return null;
    };

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
        shapes.current = loaded;
        update();
      });

      const resizeObserver = new ResizeObserver(update);
      resizeObserver.observe(canvas);

      // Native listener so the wheel can be prevented from scrolling the dialog.
      const onWheel = (e: WheelEvent) => {
        e.preventDefault();
        if (e.deltaY === 0) return;
        const zoom = view.current.zoom;
        const next = e.deltaY < 0 ? Math.min(zoom + 1, MAX_ZOOM) : Math.max(zoom - 1, MIN_ZOOM);
        if (next !== zoom) {
          view.current = { ...view.current, zoom: next };
          update();
        }
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
      view.current = {
        zoom,
        lat: Math.max(Math.min(newLat, INDIA_BOUNDS.north + 1.0), INDIA_BOUNDS.south - 1.0),
        lon: Math.max(Math.min(newLon, INDIA_BOUNDS.east + 1.0), INDIA_BOUNDS.west - 1.0),
      };
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
