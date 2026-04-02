/**
 * GeoChartL7 — AntV L7 / MapLibre GL-based geo chart.
 *
 * Uses the L7 `Map` adapter (maplibre-gl) for WebGL-accelerated rendering.
 * Free tile providers (CartoDB, OpenStreetMap) work without any API token.
 * Pass `config.mapboxToken` to use Mapbox-hosted styles instead.
 */

import React, { useEffect, useRef, useMemo } from 'react';
import { Scene, PointLayer } from '@antv/l7';
import { MapLibre as L7Map } from '@antv/l7-maps';

import type { GeoChartConfig, StreamDataSource } from '../types';
import type { VistralTheme } from '../types/theme';
import { DEFAULT_MAX_ITEMS } from '../types/spec';
import { findColumnIndex, rowToArray, applyTemporalFilter } from '../utils';
import { multiColorPalettes } from '../themes';
import { isDarkTheme } from '../core/theme-registry';

// ─── Tile style builders ────────────────────────────────────────────────────

const RASTER_TILES: Record<string, string[]> = {
  'openstreetmap': ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
  'cartodb-dark':  ['https://basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'],
  'cartodb-light': ['https://basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png'],
};

/** Build a minimal MapLibre GL style using a free raster tile provider. */
function buildRasterStyle(tileProvider: string): object {
  const tiles = RASTER_TILES[tileProvider] ?? RASTER_TILES['cartodb-dark'];
  return {
    version: 8,
    sources: {
      'base': { type: 'raster', tiles, tileSize: 256 },
    },
    layers: [{ id: 'base', type: 'raster', source: 'base' }],
  };
}

// ─── Props ───────────────────────────────────────────────────────────────────

export interface GeoChartL7Props {
  config: GeoChartConfig;
  data: StreamDataSource;
  theme?: string | VistralTheme;
  className?: string;
  style?: React.CSSProperties;
  maxItems?: number;
}

// ─── Shared data processing (mirrors GeoChart.tsx) ──────────────────────────

function useGeoPoints(
  dataSource: StreamDataSource,
  config: GeoChartConfig,
  maxItems?: number
) {
  const latIndex  = findColumnIndex(dataSource.columns, config.latitude);
  const lngIndex  = findColumnIndex(dataSource.columns, config.longitude);
  const colorIndex = config.color ? findColumnIndex(dataSource.columns, config.color) : -1;
  const sizeIndex  = config.size?.key ? findColumnIndex(dataSource.columns, config.size.key) : -1;

  return useMemo(() => {
    if (latIndex < 0 || lngIndex < 0) return [];

    const { columns, data } = dataSource;
    let rows = data.map((row) => rowToArray(row, columns));
    if (config.temporal) rows = applyTemporalFilter(rows, columns, config.temporal);
    rows = rows.slice(-(maxItems ?? config.maxItems ?? DEFAULT_MAX_ITEMS));

    // Collect unique color categories
    const colorValues: string[] = [];
    if (colorIndex >= 0) {
      rows.forEach((r) => {
        const v = String(r[colorIndex] ?? '');
        if (!colorValues.includes(v)) colorValues.push(v);
      });
    }

    const palette = multiColorPalettes[0]?.values ?? ['#3B82F6'];

    // Size range
    let sizeMin = Infinity, sizeMax = -Infinity;
    if (sizeIndex >= 0) {
      rows.forEach((r) => {
        const v = Number(r[sizeIndex]);
        if (!isNaN(v)) { sizeMin = Math.min(sizeMin, v); sizeMax = Math.max(sizeMax, v); }
      });
    }

    return rows
      .map((r) => {
        const lat = Number(r[latIndex]);
        const lng = Number(r[lngIndex]);
        if (isNaN(lat) || isNaN(lng)) return null;

        let color = config.pointColor ?? '#3B82F6';
        if (colorIndex >= 0) {
          const idx = colorValues.indexOf(String(r[colorIndex] ?? ''));
          color = palette[idx % palette.length];
        }

        let size = 6;
        if (sizeIndex >= 0) {
          const v = Number(r[sizeIndex]);
          if (!isNaN(v) && sizeMax > sizeMin) {
            const t = (v - sizeMin) / (sizeMax - sizeMin);
            size = (config.size?.min ?? 4) + t * ((config.size?.max ?? 20) - (config.size?.min ?? 4));
          }
        }

        return { lat, lng, color, size };
      })
      .filter(Boolean) as Array<{ lat: number; lng: number; color: string; size: number }>;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dataSource, latIndex, lngIndex, colorIndex, sizeIndex, config]);
}

// ─── Component ───────────────────────────────────────────────────────────────

export const GeoChartL7: React.FC<GeoChartL7Props> = ({
  config,
  data: dataSource,
  theme = 'dark',
  className,
  style,
  maxItems,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef     = useRef<Scene | null>(null);
  const layerRef     = useRef<PointLayer | null>(null);
  const loadedRef    = useRef(false);
  const pendingRef   = useRef<typeof points | null>(null);

  const dark = isDarkTheme(theme);
  const tileProvider = config.tileProvider ?? (dark ? 'cartodb-dark' : 'cartodb-light');
  const initCenter   = config.center ?? [0, 0]; // [lat, lng]
  const initZoom     = config.zoom ?? 2;

  const points = useGeoPoints(dataSource, config, maxItems);

  // ── Scene initialisation (once on mount) ─────────────────────────────────
  useEffect(() => {
    if (!containerRef.current || sceneRef.current) return;

    const mapStyle = buildRasterStyle(tileProvider);

    const scene = new Scene({
      id: containerRef.current,
      map: new L7Map({
        style: mapStyle as unknown as string,
        center: [initCenter[1], initCenter[0]], // L7 expects [lng, lat]
        zoom: initZoom,
        minZoom: 0,
        maxZoom: 18,
        rotateEnable: false,
        pitchEnable: false,
      }),
      logoVisible: false,
      antialias: true,
    });

    scene.on('loaded', () => {
      const layer = new PointLayer({ name: 'geoLayer' });
      layer
        .source([], { parser: { type: 'json', x: 'lng', y: 'lat' } })
        .shape('circle')
        .size(6)
        .color(config.pointColor ?? '#3B82F6')
        .style({ opacity: config.pointOpacity ?? 0.8 });

      scene.addLayer(layer);
      layerRef.current = layer;
      loadedRef.current = true;

      // Apply any data that arrived before the scene was ready
      if (pendingRef.current !== null) {
        const pending = pendingRef.current;
        applyPoints(layer, pending, config);
        pendingRef.current = null;
        if (config.autoFit && pending.length > 0) {
          const bounds = computeBounds(pending);
          if (bounds) scene.fitBounds(bounds);
        }
      }
    });

    sceneRef.current = scene;

    return () => {
      loadedRef.current = false;
      sceneRef.current = null;
      layerRef.current = null;
      scene.destroy();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Update data when points change ───────────────────────────────────────
  useEffect(() => {
    if (!loadedRef.current || !layerRef.current) {
      pendingRef.current = points; // buffer until scene is ready
      return;
    }
    applyPoints(layerRef.current, points, config);

    if (config.autoFit && sceneRef.current && points.length > 0) {
      const bounds = computeBounds(points);
      if (bounds) sceneRef.current.fitBounds(bounds);
    }
  }, [points, config]);

  return (
    <div
      ref={containerRef}
      className={className}
      style={{
        width: '100%',
        height: '100%',
        position: 'relative',
        ...style,
      }}
      data-testid="geo-chart-l7"
    />
  );
};

// ── Bounds helpers ────────────────────────────────────────────────────────

function computeBounds(points: Array<{ lat: number; lng: number }>): [[number, number], [number, number]] | null {
  if (points.length === 0) return null;
  let minLat = Infinity, maxLat = -Infinity, minLng = Infinity, maxLng = -Infinity;
  for (const p of points) {
    if (p.lat < minLat) minLat = p.lat;
    if (p.lat > maxLat) maxLat = p.lat;
    if (p.lng < minLng) minLng = p.lng;
    if (p.lng > maxLng) maxLng = p.lng;
  }
  const latPad = Math.max(0.01, (maxLat - minLat) * 0.15);
  const lngPad = Math.max(0.01, (maxLng - minLng) * 0.15);
  return [
    [Math.max(-180, minLng - lngPad), Math.max(-85, minLat - latPad)],
    [Math.min(180, maxLng + lngPad),  Math.min(85,  maxLat + latPad)],
  ];
}

// ── Layer data + style update ─────────────────────────────────────────────

function applyPoints(
  layer: PointLayer,
  points: Array<{ lat: number; lng: number; color: string; size: number }>,
  config: GeoChartConfig
) {
  layer.setData(
    points.map((p) => ({ lng: p.lng, lat: p.lat, color: p.color, size: p.size })),
    { parser: { type: 'json', x: 'lng', y: 'lat' } }
  );

  if (config.color) {
    // categorical coloring — values already resolved to hex in useGeoPoints
    layer.color('color');
  } else {
    layer.color(config.pointColor ?? '#3B82F6');
  }

  if (config.size?.key) {
    layer.size('size');
  } else {
    layer.size(6);
  }

  layer.style({ opacity: config.pointOpacity ?? 0.8 });
}
