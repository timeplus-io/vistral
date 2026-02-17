/**
 * Geo Chart Component
 * Displays geographic points on a map with streaming support
 */

import React, { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import type { GeoChartConfig, StreamDataSource, ColumnDefinition } from '../types';
import { DEFAULT_MAX_ITEMS } from '../types/spec';
import { findColumnIndex, rowToArray, applyTemporalFilter } from '../utils';
import { multiColorPalettes } from '../themes';

export interface GeoChartProps {
  /** Chart configuration */
  config: GeoChartConfig;
  /** Data source */
  data: StreamDataSource;
  /** Theme */
  theme?: 'dark' | 'light';
  /** Container className */
  className?: string;
  /** Container style */
  style?: React.CSSProperties;
  /** Maximum data points for streaming. Defaults to config.maxItems or DEFAULT_MAX_ITEMS. */
  maxItems?: number;
}

// Tile providers
const TILE_PROVIDERS: Record<string, string> = {
  'openstreetmap': 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
  'cartodb-dark': 'https://basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png',
  'cartodb-light': 'https://basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png',
};

// Tile cache to avoid re-fetching
const tileCache = new Map<string, HTMLImageElement>();

/**
 * Load a map tile image
 */
function loadTile(url: string): Promise<HTMLImageElement> {
  if (tileCache.has(url)) {
    return Promise.resolve(tileCache.get(url)!);
  }

  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      tileCache.set(url, img);
      resolve(img);
    };
    img.onerror = reject;
    img.src = url;
  });
}

/**
 * Get tile URL for a given tile coordinate
 */
function getTileUrl(provider: string, x: number, y: number, z: number): string {
  const template = TILE_PROVIDERS[provider] || TILE_PROVIDERS['cartodb-dark'];
  return template
    .replace('{x}', String(x))
    .replace('{y}', String(y))
    .replace('{z}', String(z))
    .replace('{s}', ['a', 'b', 'c'][Math.floor(Math.random() * 3)]);
}

/**
 * Get default configuration for geo chart
 */
export function getGeoChartDefaults(
  columns: ColumnDefinition[]
): Partial<GeoChartConfig> | null {
  // Look for lat/lng columns
  const latNames = ['lat', 'latitude', 'y'];
  const lngNames = ['lng', 'lon', 'longitude', 'x'];

  const latCol = columns.find(({ name }) =>
    latNames.some((n) => name.toLowerCase().includes(n))
  );
  const lngCol = columns.find(({ name }) =>
    lngNames.some((n) => name.toLowerCase().includes(n))
  );

  if (!latCol || !lngCol) return null;

  return {
    chartType: 'geo',
    latitude: latCol.name,
    longitude: lngCol.name,
    zoom: 2,
    showZoomControl: true,
    pointOpacity: 0.8,
    pointColor: '#3B82F6',
  };
}

/**
 * Convert lat/lng to tile coordinates
 */
function latLngToTile(lat: number, lng: number, zoom: number): { x: number; y: number } {
  const n = Math.pow(2, zoom);
  const x = ((lng + 180) / 360) * n;
  const latRad = (lat * Math.PI) / 180;
  const y = ((1 - Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI) / 2) * n;
  return { x, y };
}

/**
 * Convert tile coordinates to pixel position
 */
function tileToPixel(
  tileX: number,
  tileY: number,
  centerTileX: number,
  centerTileY: number,
  width: number,
  height: number,
  tileSize: number = 256
): { x: number; y: number } {
  const pixelX = (tileX - centerTileX) * tileSize + width / 2;
  const pixelY = (tileY - centerTileY) * tileSize + height / 2;
  return { x: pixelX, y: pixelY };
}

/**
 * Convert lat/lng to pixel position
 */
function latLngToPixel(
  lat: number,
  lng: number,
  center: [number, number],
  zoom: number,
  width: number,
  height: number
): { x: number; y: number } {
  const tile = latLngToTile(lat, lng, zoom);
  const centerTile = latLngToTile(center[0], center[1], zoom);
  return tileToPixel(tile.x, tile.y, centerTile.x, centerTile.y, width, height);
}

/**
 * Get color for a category value
 */
function getCategoryColor(value: string, categories: string[], colors: string[]): string {
  const index = categories.indexOf(value);
  return colors[index % colors.length];
}

/**
 * GeoChart Component
 */
export const GeoChart: React.FC<GeoChartProps> = ({
  config: configRaw,
  data: dataSource,
  theme = 'dark',
  className,
  style,
  maxItems,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const [zoom, setZoom] = useState(configRaw.zoom || 2);
  const [center, setCenter] = useState<[number, number]>(configRaw.center || [0, 0]);
  const [isDragging, setIsDragging] = useState(false);
  const dragStart = useRef<{ x: number; y: number; center: [number, number] } | null>(null);

  // Merge with defaults
  const defaults = getGeoChartDefaults(dataSource.columns);
  const config = useMemo(
    () => ({
      ...defaults,
      ...configRaw,
    } as GeoChartConfig),
    [configRaw, defaults]
  );

  // Get column indices
  const latIndex = findColumnIndex(dataSource.columns, config.latitude);
  const lngIndex = findColumnIndex(dataSource.columns, config.longitude);
  const colorIndex = config.color ? findColumnIndex(dataSource.columns, config.color) : -1;
  const sizeIndex = config.size?.key ? findColumnIndex(dataSource.columns, config.size.key) : -1;

  // Process data points
  const points = useMemo(() => {
    if (latIndex < 0 || lngIndex < 0) return [];

    const { columns, data } = dataSource;
    const { temporal } = config;

    // Convert data to array format and apply temporal filtering
    let processedData = data.map((row) => rowToArray(row, columns));

    // Apply temporal filtering if configured
    if (temporal) {
      processedData = applyTemporalFilter(processedData, columns, temporal);
    }

    // Limit data to maxItems
    const effectiveMaxItems = maxItems ?? config.maxItems ?? DEFAULT_MAX_ITEMS;
    processedData = processedData.slice(-effectiveMaxItems);

    const result: Array<{
      lat: number;
      lng: number;
      color?: string;
      size?: number;
      row: unknown[];
    }> = [];

    // Get unique color values for categorical coloring
    const colorValues: string[] = [];
    if (colorIndex >= 0) {
      processedData.forEach((arr) => {
        const val = String(arr[colorIndex] ?? '');
        if (!colorValues.includes(val)) {
          colorValues.push(val);
        }
      });
    }

    // Get color palette
    const palette = multiColorPalettes[0]?.values || ['#3B82F6'];

    // Calculate size range if needed
    let sizeMin = Infinity;
    let sizeMax = -Infinity;
    if (sizeIndex >= 0) {
      processedData.forEach((arr) => {
        const val = Number(arr[sizeIndex]);
        if (!isNaN(val)) {
          sizeMin = Math.min(sizeMin, val);
          sizeMax = Math.max(sizeMax, val);
        }
      });
    }

    processedData.forEach((arr) => {
      const lat = Number(arr[latIndex]);
      const lng = Number(arr[lngIndex]);

      if (isNaN(lat) || isNaN(lng)) return;

      let color = config.pointColor || '#3B82F6';
      if (colorIndex >= 0) {
        const colorVal = String(arr[colorIndex] ?? '');
        color = getCategoryColor(colorVal, colorValues, palette);
      }

      let size = 6;
      if (sizeIndex >= 0) {
        const sizeVal = Number(arr[sizeIndex]);
        if (!isNaN(sizeVal) && sizeMax > sizeMin) {
          const normalized = (sizeVal - sizeMin) / (sizeMax - sizeMin);
          const minSize = config.size?.min || 4;
          const maxSize = config.size?.max || 20;
          size = minSize + normalized * (maxSize - minSize);
        }
      }

      result.push({ lat, lng, color, size, row: arr });
    });

    return result;
  }, [dataSource, latIndex, lngIndex, colorIndex, sizeIndex, config]);

  // Set initial center from first point if not specified
  useEffect(() => {
    if (!configRaw.center && points.length > 0 && center[0] === 0 && center[1] === 0) {
      setCenter([points[0].lat, points[0].lng]);
    }
  }, [points, configRaw.center, center]);

  // Handle resize
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const resizeObserver = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (entry) {
        setDimensions({
          width: entry.contentRect.width,
          height: entry.contentRect.height,
        });
      }
    });

    resizeObserver.observe(container);
    return () => resizeObserver.disconnect();
  }, []);

  // Draw the map and points
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || dimensions.width === 0 || dimensions.height === 0) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { width, height } = dimensions;
    canvas.width = width;
    canvas.height = height;

    // Clear canvas with background color
    ctx.fillStyle = theme === 'dark' ? '#1a1a2e' : '#F3F4F6';
    ctx.fillRect(0, 0, width, height);

    const tileSize = 256;
    const zoomInt = Math.floor(zoom);
    const scale = Math.pow(2, zoom - zoomInt);

    // Calculate center tile
    const centerTile = latLngToTile(center[0], center[1], zoomInt);

    // Calculate how many tiles we need to cover the viewport
    const tilesX = Math.ceil(width / (tileSize * scale)) + 2;
    const tilesY = Math.ceil(height / (tileSize * scale)) + 2;

    // Calculate the top-left tile
    const startTileX = Math.floor(centerTile.x - tilesX / 2);
    const startTileY = Math.floor(centerTile.y - tilesY / 2);

    // Get tile provider
    const provider = config.tileProvider || (theme === 'dark' ? 'cartodb-dark' : 'cartodb-light');

    // Load and draw tiles
    const tilePromises: Promise<void>[] = [];
    const maxTile = Math.pow(2, zoomInt);

    for (let dx = 0; dx < tilesX; dx++) {
      for (let dy = 0; dy < tilesY; dy++) {
        let tileX = startTileX + dx;
        let tileY = startTileY + dy;

        // Wrap X coordinate
        while (tileX < 0) tileX += maxTile;
        while (tileX >= maxTile) tileX -= maxTile;

        // Skip invalid Y tiles
        if (tileY < 0 || tileY >= maxTile) continue;

        const url = getTileUrl(provider, tileX, tileY, zoomInt);

        // Calculate pixel position for this tile
        const pixelX = (startTileX + dx - centerTile.x) * tileSize * scale + width / 2;
        const pixelY = (startTileY + dy - centerTile.y) * tileSize * scale + height / 2;

        const promise = loadTile(url)
          .then((img) => {
            ctx.drawImage(
              img,
              pixelX,
              pixelY,
              tileSize * scale,
              tileSize * scale
            );
          })
          .catch(() => {
            // Draw placeholder for failed tiles
            ctx.fillStyle = theme === 'dark' ? '#2d2d44' : '#E5E7EB';
            ctx.fillRect(pixelX, pixelY, tileSize * scale, tileSize * scale);
          });

        tilePromises.push(promise);
      }
    }

    // After all tiles are loaded, draw points on top
    Promise.all(tilePromises).then(() => {
      // Draw points
      const opacity = config.pointOpacity || 0.8;
      points.forEach((point) => {
        const pos = latLngToPixel(point.lat, point.lng, center, zoom, width, height);

        // Skip points outside viewport
        if (pos.x < -50 || pos.x > width + 50 || pos.y < -50 || pos.y > height + 50) {
          return;
        }

        const pointSize = point.size ?? 6;
        const pointColor = point.color ?? '#3B82F6';

        ctx.beginPath();
        ctx.arc(pos.x, pos.y, pointSize, 0, Math.PI * 2);

        // Parse color and add opacity
        const hexColor = pointColor.startsWith('#') ? pointColor : '#3B82F6';
        const r = parseInt(hexColor.slice(1, 3), 16);
        const g = parseInt(hexColor.slice(3, 5), 16);
        const b = parseInt(hexColor.slice(5, 7), 16);
        ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${opacity})`;
        ctx.fill();

        // Draw border
        ctx.strokeStyle = theme === 'dark' ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.3)';
        ctx.lineWidth = 1.5;
        ctx.stroke();
      });
    });
  }, [dimensions, points, center, zoom, theme, config.pointOpacity, config.tileProvider]);

  // Mouse event handlers for panning
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    setIsDragging(true);
    dragStart.current = { x: e.clientX, y: e.clientY, center: [...center] as [number, number] };
  }, [center]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDragging || !dragStart.current) return;

    const dx = e.clientX - dragStart.current.x;
    const dy = e.clientY - dragStart.current.y;

    // Convert pixel delta to lat/lng delta
    const scale = Math.pow(2, zoom) * 256;
    const lngDelta = (-dx / scale) * 360;
    const latDelta = (dy / scale) * 180;

    setCenter([
      Math.max(-85, Math.min(85, dragStart.current.center[0] + latDelta)),
      dragStart.current.center[1] + lngDelta,
    ]);
  }, [isDragging, zoom]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
    dragStart.current = null;
  }, []);

  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.5 : 0.5;
    setZoom((z) => Math.max(1, Math.min(18, z + delta)));
  }, []);

  // Zoom controls
  const handleZoomIn = useCallback(() => {
    setZoom((z) => Math.min(18, z + 1));
  }, []);

  const handleZoomOut = useCallback(() => {
    setZoom((z) => Math.max(1, z - 1));
  }, []);

  const buttonStyle: React.CSSProperties = {
    width: '32px',
    height: '32px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme === 'dark' ? '#374151' : '#FFFFFF',
    color: theme === 'dark' ? '#F3F4F6' : '#1F2937',
    border: `1px solid ${theme === 'dark' ? '#4B5563' : '#E5E7EB'}`,
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '18px',
    fontWeight: 'bold',
  };

  return (
    <div
      ref={containerRef}
      className={className}
      style={{
        width: '100%',
        height: '100%',
        position: 'relative',
        overflow: 'hidden',
        backgroundColor: theme === 'dark' ? '#1F2937' : '#F3F4F6',
        ...style,
      }}
      data-testid="geo-chart"
    >
      <canvas
        ref={canvasRef}
        style={{
          width: '100%',
          height: '100%',
          cursor: isDragging ? 'grabbing' : 'grab',
        }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
      />

      {/* Zoom Controls */}
      {config.showZoomControl !== false && (
        <div
          style={{
            position: 'absolute',
            top: '10px',
            right: '10px',
            display: 'flex',
            flexDirection: 'column',
            gap: '4px',
          }}
        >
          <button style={buttonStyle} onClick={handleZoomIn}>
            +
          </button>
          <button style={buttonStyle} onClick={handleZoomOut}>
            −
          </button>
        </div>
      )}

      {/* Center Display */}
      {config.showCenterDisplay && (
        <div
          style={{
            position: 'absolute',
            bottom: '10px',
            left: '10px',
            padding: '4px 8px',
            backgroundColor: theme === 'dark' ? 'rgba(55, 65, 81, 0.9)' : 'rgba(255, 255, 255, 0.9)',
            color: theme === 'dark' ? '#F3F4F6' : '#1F2937',
            borderRadius: '4px',
            fontSize: '12px',
            fontFamily: 'monospace',
          }}
        >
          {center[0].toFixed(4)}, {center[1].toFixed(4)} | Zoom: {zoom.toFixed(1)}
        </div>
      )}

      {/* Point count */}
      <div
        style={{
          position: 'absolute',
          bottom: '10px',
          right: '10px',
          padding: '4px 8px',
          backgroundColor: theme === 'dark' ? 'rgba(55, 65, 81, 0.9)' : 'rgba(255, 255, 255, 0.9)',
          color: theme === 'dark' ? '#9CA3AF' : '#6B7280',
          borderRadius: '4px',
          fontSize: '12px',
        }}
      >
        {points.length} points
      </div>

      {/* Loading state */}
      {points.length === 0 && (
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '8px',
            color: theme === 'dark' ? '#9CA3AF' : '#6B7280',
          }}
        >
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            style={{ animation: 'spin 1s linear infinite' }}
          >
            <circle cx="12" cy="12" r="10" strokeOpacity="0.25" />
            <path d="M12 2a10 10 0 0 1 10 10" strokeLinecap="round" />
          </svg>
          <span>Waiting for data...</span>
          <style>
            {`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}
          </style>
        </div>
      )}
    </div>
  );
};

export default GeoChart;
