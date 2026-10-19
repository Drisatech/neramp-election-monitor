import React, { useMemo, useState, useEffect } from 'react';
import { ZoomIn, ZoomOut, RotateCcw, MapPin } from 'lucide-react';
import { State, ElectionSummary } from '../types';
import { useElection } from '../context/ElectionContext';
import { fetchElectionSummary } from '../services/api';

interface Props {
  states: State[];
  selectedStateCode?: string;
  onSelectState?: (stateCode: string) => void;
}

// Accurate sovereign boundary of Nigeria [longitude, latitude]
// Strictly isolates the Nigeria map with zero external countries or locations
const NIGERIA_BOUNDARY_LON_LAT: [number, number][] = [
  [2.691, 6.259], [2.749, 6.535], [2.695, 7.121], [2.724, 7.641], [2.777, 8.212],
  [2.912, 8.781], [3.085, 9.172], [3.332, 9.615], [3.601, 10.151], [3.702, 10.662],
  [3.611, 11.231], [3.572, 11.695], [3.621, 12.152], [3.891, 12.692], [4.162, 13.181],
  [4.391, 13.562], [4.862, 13.751], [5.441, 13.865], [6.021, 13.762], [6.561, 13.591],
  [7.041, 13.342], [7.521, 13.125], [8.051, 13.251], [8.562, 13.112], [9.141, 12.872],
  [9.642, 13.081], [10.152, 13.261], [10.721, 13.341], [11.312, 13.362], [11.891, 13.421],
  [12.512, 13.481], [13.082, 13.592], [13.481, 13.841], [13.892, 13.621], [14.181, 13.142],
  [14.482, 12.681], [14.651, 12.212], [14.521, 11.821], [14.221, 11.452], [13.921, 11.112],
  [13.682, 10.741], [13.521, 10.312], [13.281, 9.912], [13.112, 9.481], [12.881, 9.052],
  [12.612, 8.681], [12.281, 8.312], [12.012, 7.951], [11.821, 7.562], [11.651, 7.181],
  [11.381, 6.892], [11.052, 6.681], [10.681, 6.792], [10.221, 6.941], [9.812, 6.651],
  [9.481, 6.312], [9.212, 5.912], [8.941, 5.481], [8.712, 4.981], [8.481, 4.592],
  [8.021, 4.492], [7.521, 4.441], [7.081, 4.381], [6.541, 4.312], [6.051, 4.281],
  [5.681, 4.521], [5.412, 5.012], [5.081, 5.581], [4.621, 6.121], [4.112, 6.361],
  [3.481, 6.412], [2.691, 6.259],
];

// River Niger & River Benue geographic paths inside Nigeria [lon, lat]
const RIVER_NIGER_LON_LAT: [number, number][] = [
  [3.62, 11.68], [4.15, 11.15], [4.55, 10.45], [4.65, 9.65], [5.15, 9.15],
  [5.85, 8.75], [6.45, 8.25], [6.75, 7.80], [6.68, 7.15], [6.65, 6.35],
  [6.35, 5.55], [6.05, 4.35],
];

const RIVER_BENUE_LON_LAT: [number, number][] = [
  [13.15, 9.35], [12.45, 9.28], [11.65, 9.05], [10.85, 8.65], [9.85, 8.18],
  [8.85, 7.78], [7.85, 7.75], [6.75, 7.80],
];

const ZONE_PALETTE: Record<string, { fill: string; stroke: string; badge: string; label: string }> = {
  'North West': { fill: '#dcfce7', stroke: '#86efac', badge: '#15803d', label: 'North West' },
  'North East': { fill: '#e0f2fe', stroke: '#7dd3fc', badge: '#0369a1', label: 'North East' },
  'North Central': { fill: '#fef3c7', stroke: '#fcd34d', badge: '#b45309', label: 'North Central' },
  'South West': { fill: '#ede9fe', stroke: '#c4b5fd', badge: '#6d28d9', label: 'South West' },
  'South East': { fill: '#ffe4e6', stroke: '#fda4af', badge: '#be123c', label: 'South East' },
  'South South': { fill: '#ccfbf1', stroke: '#5eead4', badge: '#0f766e', label: 'South South' },
};

// Project [lon, lat] into a 800 x 650 SVG coordinate frame tightly fitted to Nigeria
function projectLonLat(lon: number, lat: number): [number, number] {
  const minLon = 2.55;
  const maxLon = 14.80;
  const minLat = 4.15;
  const maxLat = 14.00;
  const paddingX = 36;
  const paddingY = 28;
  const width = 800 - paddingX * 2;
  const height = 650 - paddingY * 2;

  const x = paddingX + ((lon - minLon) / (maxLon - minLon)) * width;
  const y = paddingY + ((maxLat - lat) / (maxLat - minLat)) * height;
  return [Number(x.toFixed(1)), Number(y.toFixed(1))];
}

// Sutherland-Hodgman half-plane clipping to compute Voronoi state polygons inside Nigeria
function clipPolygonHalfPlane(
  poly: [number, number][],
  px: number,
  py: number,
  nx: number,
  ny: number
): [number, number][] {
  if (poly.length === 0) return [];
  const out: [number, number][] = [];
  for (let i = 0; i < poly.length; i++) {
    const cur = poly[i];
    const prev = poly[(i + poly.length - 1) % poly.length];
    const dCur = (cur[0] - px) * nx + (cur[1] - py) * ny;
    const dPrev = (prev[0] - px) * nx + (prev[1] - py) * ny;

    if (dCur <= 0) {
      if (dPrev > 0) {
        const t = dPrev / (dPrev - dCur);
        out.push([prev[0] + t * (cur[0] - prev[0]), prev[1] + t * (cur[1] - prev[1])]);
      }
      out.push(cur);
    } else if (dPrev <= 0) {
      const t = dPrev / (dPrev - dCur);
      out.push([prev[0] + t * (cur[0] - prev[0]), prev[1] + t * (cur[1] - prev[1])]);
    }
  }
  return out;
}

function pointsToSvgPath(pts: [number, number][], close = true): string {
  if (pts.length === 0) return '';
  const d = pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(' ');
  return close ? `${d} Z` : d;
}

export const InteractiveElectionMap: React.FC<Props> = ({ states, selectedStateCode, onSelectState }) => {
  const { states: allCanonicalStates, selectedElectionId } = useElection();
  const [hoveredStateCode, setHoveredStateCode] = useState<string | null>(null);
  const [zoom, setZoom] = useState<number>(1);
  const [stateSummary, setStateSummary] = useState<ElectionSummary | null>(null);

  // Always use all 37 states of Nigeria to construct the complete Nigeria map,
  // while highlighting the subset passed in `states` if a zone filter is active
  const fullStates = allCanonicalStates.length >= 36 ? allCanonicalStates : states;
  const visibleCodes = useMemo(() => new Set(states.map((s) => s.code)), [states]);

  const nigeriaOutlinePath = useMemo(() => {
    const projected = NIGERIA_BOUNDARY_LON_LAT.map(([lon, lat]) => projectLonLat(lon, lat));
    return pointsToSvgPath(projected, true);
  }, []);

  const riverNigerPath = useMemo(() => {
    const projected = RIVER_NIGER_LON_LAT.map(([lon, lat]) => projectLonLat(lon, lat));
    return pointsToSvgPath(projected, false);
  }, []);

  const riverBenuePath = useMemo(() => {
    const projected = RIVER_BENUE_LON_LAT.map(([lon, lat]) => projectLonLat(lon, lat));
    return pointsToSvgPath(projected, false);
  }, []);

  // Compute projected state centroids and Voronoi state polygons clipped to Nigeria
  const stateGeometries = useMemo(() => {
    const valid = fullStates.filter((s) => s.latitude && s.longitude);
    const pts = valid.map((s) => {
      const [x, y] = projectLonLat(Number(s.longitude), Number(s.latitude));
      return { state: s, x, y };
    });

    const bbox: [number, number][] = [
      [0, 0],
      [800, 0],
      [800, 650],
      [0, 650],
    ];

    return pts.map((item, i) => {
      let cell = bbox;
      for (let j = 0; j < pts.length; j++) {
        if (i === j) continue;
        const other = pts[j];
        const mx = (item.x + other.x) / 2;
        const my = (item.y + other.y) / 2;
        const nx = other.x - item.x;
        const ny = other.y - item.y;
        cell = clipPolygonHalfPlane(cell, mx, my, nx, ny);
      }
      return {
        state: item.state,
        x: item.x,
        y: item.y,
        path: pointsToSvgPath(cell, true),
      };
    });
  }, [fullStates]);

  const activeState =
    fullStates.find((s) => s.code === selectedStateCode) ||
    fullStates.find((s) => s.code === hoveredStateCode) ||
    null;

  useEffect(() => {
    if (!activeState || !selectedElectionId) {
      setStateSummary(null);
      return;
    }
    let isMounted = true;
    fetchElectionSummary(selectedElectionId, activeState.code)
      .then((res) => {
        if (isMounted) setStateSummary(res.data);
      })
      .catch(() => {
        if (isMounted) setStateSummary(null);
      });
    return () => {
      isMounted = false;
    };
  }, [activeState?.code, selectedElectionId]);

  const activePartyBreakdown = useMemo(() => {
    return (stateSummary?.candidateRankings || []).filter((p) => p.votes > 0);
  }, [stateSummary]);

  // Dynamic viewBox centered on selected state when zoomed in, or full Nigeria frame
  const viewBox = useMemo(() => {
    const selectedGeom = stateGeometries.find((g) => g.state.code === selectedStateCode);
    const effZoom = selectedGeom && zoom === 1 ? 1.35 : zoom;
    if (effZoom <= 1) return '0 0 800 650';

    const cx = selectedGeom ? selectedGeom.x : 400;
    const cy = selectedGeom ? selectedGeom.y : 325;
    const w = 800 / effZoom;
    const h = 650 / effZoom;
    const minX = Math.max(0, Math.min(800 - w, cx - w / 2));
    const minY = Math.max(0, Math.min(650 - h, cy - h / 2));
    return `${minX.toFixed(1)} ${minY.toFixed(1)} ${w.toFixed(1)} ${h.toFixed(1)}`;
  }, [zoom, selectedStateCode, stateGeometries]);

  return (
    <div className="bg-white rounded-lg border border-slate-200 overflow-hidden shadow-2xs">
      <div className="p-3 border-b border-slate-200 bg-slate-50 flex flex-wrap items-center justify-between gap-2">
        <div>
          <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wide">
            Electoral Geographic Coverage (Nigeria - 36 States &amp; FCT)
          </h3>
          <p className="text-[11px] text-slate-500">
            Click on any state jurisdiction inside Nigeria to inspect local polling unit progress and party votes.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {selectedStateCode && (
            <button
              onClick={() => {
                setZoom(1);
                if (onSelectState) onSelectState('');
              }}
              className="text-xs text-emerald-800 hover:text-emerald-950 font-semibold underline mr-2"
            >
              Clear State Filter
            </button>
          )}
          <div className="inline-flex items-center rounded border border-slate-200 bg-white p-0.5">
            <button
              type="button"
              onClick={() => setZoom((z) => Math.min(2.2, Number((z + 0.3).toFixed(2))))}
              className="p-1 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded"
              title="Zoom In"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setZoom((z) => Math.max(1, Number((z - 0.3).toFixed(2))))}
              className="p-1 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded"
              title="Zoom Out"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => {
                setZoom(1);
                if (onSelectState) onSelectState('');
              }}
              className="p-1 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded"
              title="Reset Nigeria View"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Isolated Nigeria Map Frame — Zero locations outside Nigeria */}
      <div className="h-[440px] w-full relative bg-slate-50/70 select-none overflow-hidden flex items-center justify-center">
        <svg
          viewBox={viewBox}
          className="w-full h-full max-h-[440px] transition-all duration-300"
          preserveAspectRatio="xMidYMid meet"
          role="img"
          aria-label="Map of Nigeria with 36 States and FCT Abuja"
        >
          <defs>
            <clipPath id="nigeria-sovereign-boundary">
              <path d={nigeriaOutlinePath} />
            </clipPath>
            <filter id="nigeria-drop-shadow" x="-5%" y="-5%" width="110%" height="110%">
              <feDropShadow dx="0" dy="3" stdDeviation="5" floodColor="#0f172a" floodOpacity="0.12" />
            </filter>
          </defs>

          {/* Sovereign Nigeria Exterior Silhouette Shadow */}
          <path
            d={nigeriaOutlinePath}
            fill="#ffffff"
            stroke="#065f46"
            strokeWidth="3"
            filter="url(#nigeria-drop-shadow)"
          />

          {/* Clipped State Jurisdictions Inside Nigeria Only */}
          <g clipPath="url(#nigeria-sovereign-boundary)">
            {stateGeometries.map(({ state: st, path }) => {
              const isSelected = st.code === selectedStateCode;
              const isHovered = st.code === hoveredStateCode;
              const isInZoneFilter = visibleCodes.has(st.code);
              const zoneStyle = ZONE_PALETTE[st.zone] || ZONE_PALETTE['North Central'];

              let fill = zoneStyle.fill;
              if (!isInZoneFilter) fill = '#f1f5f9';
              if (isHovered && isInZoneFilter) fill = '#a7f3d0';
              if (isSelected) fill = '#047857';

              return (
                <path
                  key={st.code}
                  d={path}
                  fill={fill}
                  fillOpacity={!isInZoneFilter ? 0.45 : 0.92}
                  stroke="#ffffff"
                  strokeWidth={isSelected ? 2.2 : 1.3}
                  className="cursor-pointer transition-colors duration-150"
                  onMouseEnter={() => setHoveredStateCode(st.code)}
                  onMouseLeave={() => setHoveredStateCode(null)}
                  onClick={() => {
                    if (onSelectState) {
                      onSelectState(st.code === selectedStateCode ? '' : st.code);
                    }
                  }}
                />
              );
            })}

            {/* River Niger & River Benue Natural Landmarks */}
            <path
              d={riverNigerPath}
              fill="none"
              stroke="#38bdf8"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeOpacity="0.55"
              className="pointer-events-none"
            />
            <path
              d={riverBenuePath}
              fill="none"
              stroke="#38bdf8"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeOpacity="0.55"
              className="pointer-events-none"
            />
          </g>

          {/* Sovereign Nigeria Border Outline */}
          <path
            d={nigeriaOutlinePath}
            fill="none"
            stroke="#064e3b"
            strokeWidth="2.5"
            strokeLinejoin="round"
            className="pointer-events-none"
          />

          {/* State Markers & Labels (Strictly inside Nigeria) */}
          {stateGeometries.map(({ state: st, x, y }) => {
            const isSelected = st.code === selectedStateCode;
            const isHovered = st.code === hoveredStateCode;
            const isInZoneFilter = visibleCodes.has(st.code);
            if (!isInZoneFilter) return null;

            return (
              <g
                key={`marker-${st.code}`}
                className="cursor-pointer"
                onMouseEnter={() => setHoveredStateCode(st.code)}
                onMouseLeave={() => setHoveredStateCode(null)}
                onClick={() => {
                  if (onSelectState) {
                    onSelectState(st.code === selectedStateCode ? '' : st.code);
                  }
                }}
              >
                <circle
                  cx={x}
                  cy={y}
                  r={isSelected ? 6.5 : isHovered ? 5.5 : 4}
                  fill={isSelected ? '#ffffff' : '#047857'}
                  stroke={isSelected ? '#064e3b' : '#ffffff'}
                  strokeWidth={isSelected ? 2.5 : 1.5}
                />
                <text
                  x={x}
                  y={y - (isSelected ? 9 : 7)}
                  textAnchor="middle"
                  fill={isSelected ? '#ffffff' : '#0f172a'}
                  stroke={isSelected ? '#064e3b' : '#ffffff'}
                  strokeWidth={isSelected ? 2.5 : 2.2}
                  paintOrder="stroke"
                  fontSize={isSelected || isHovered ? '10.5' : '9'}
                  fontWeight="700"
                  fontFamily="sans-serif"
                >
                  {st.name}
                </text>
              </g>
            );
          })}
        </svg>

        {/* Geopolitical Zone Legend (Bottom Left inside frame) */}
        <div className="absolute bottom-2.5 left-2.5 bg-white/95 backdrop-blur-xs border border-slate-200 rounded-md p-2 shadow-2xs text-[10px]">
          <div className="font-bold text-slate-800 uppercase tracking-wider mb-1">
            Nigeria 6 Geopolitical Zones
          </div>
          <div className="grid grid-cols-2 gap-x-3 gap-y-1">
            {Object.entries(ZONE_PALETTE).map(([zone, style]) => (
              <div key={zone} className="flex items-center gap-1.5">
                <span
                  className="w-2.5 h-2.5 rounded-xs border"
                  style={{ backgroundColor: style.fill, borderColor: style.stroke }}
                />
                <span className="text-slate-700 font-medium">{style.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Active / Hovered State Detail Card (Top Right inside frame) */}
        {activeState && (
          <div className="absolute top-2.5 right-2.5 bg-white/95 backdrop-blur-xs border border-slate-200 rounded-md p-3 shadow-md w-68 max-h-[415px] overflow-y-auto text-xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-1.5 mb-1.5">
              <span className="font-bold text-slate-900 text-sm flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                {activeState.name}
              </span>
              <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200">
                {activeState.code}
              </span>
            </div>
            <div className="space-y-1 text-[11px] text-slate-600">
              <div className="flex justify-between">
                <span>Zone:</span>
                <strong className="text-slate-800">{activeState.zone}</strong>
              </div>
              <div className="flex justify-between">
                <span>LGAs / Area Councils:</span>
                <strong className="text-slate-800 font-mono">{activeState.totalLgas}</strong>
              </div>
              <div className="flex justify-between">
                <span>Electoral Wards (RAs):</span>
                <strong className="text-slate-800 font-mono">{(activeState.totalWards ?? 0).toLocaleString()}</strong>
              </div>
              <div className="flex justify-between">
                <span>Expected Result Sheets (PUs):</span>
                <strong className="text-emerald-900 font-mono">{activeState.totalPus.toLocaleString()}</strong>
              </div>
              <div className="flex justify-between">
                <span>Sheets Uploaded:</span>
                <strong className="text-emerald-700 font-mono">
                  {(stateSummary?.pusUploaded ?? 0).toLocaleString()} ({stateSummary?.uploadCompletionPercentage ?? 0}%)
                </strong>
              </div>
              <div className="flex justify-between">
                <span>Registered Voters:</span>
                <strong className="text-slate-900 font-mono">{activeState.registeredVoters.toLocaleString()}</strong>
              </div>
              <div className="flex justify-between">
                <span>PVCs Collected ({(activeState.pvcCollectionRate ?? 0).toFixed(2)}%):</span>
                <strong className="text-emerald-800 font-mono">
                  {(activeState.pvcsCollected ?? 0).toLocaleString()}
                </strong>
              </div>
            </div>

            {/* Party Vote Breakdown in Selected State for Contest Election */}
            <div className="mt-2.5 pt-2 border-t border-slate-200">
              <div className="flex items-center justify-between text-[10px] font-bold uppercase text-slate-700 mb-1.5">
                <span>Party Votes ({activeState.name})</span>
                <span className="font-mono text-emerald-800">
                  {(stateSummary?.totalValidVotes ?? 0).toLocaleString()} Valid
                </span>
              </div>
              {activePartyBreakdown.length === 0 ? (
                <p className="text-[10px] text-slate-400 italic">
                  No party votes uploaded for {activeState.name} in this contest yet.
                </p>
              ) : (
                <div className="space-y-1.5 max-h-36 overflow-y-auto pr-0.5">
                  {activePartyBreakdown.map((pty) => (
                    <div key={pty.partyCode} className="text-[11px]">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <span
                            className="px-1.5 py-0.2 rounded text-[9px] font-bold text-white shrink-0"
                            style={{ backgroundColor: pty.color }}
                          >
                            {pty.partyCode}
                          </span>
                          <span className="text-slate-700 truncate font-medium">{pty.partyName}</span>
                        </div>
                        <span className="font-mono font-bold text-slate-900 ml-1 shrink-0">
                          {pty.votes.toLocaleString()} ({pty.percentage}%)
                        </span>
                      </div>
                      <div className="w-full bg-slate-100 h-1 rounded-full overflow-hidden mt-0.5">
                        <div
                          className="h-full rounded-full"
                          style={{ width: `${Math.max(pty.percentage, 2)}%`, backgroundColor: pty.color }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

