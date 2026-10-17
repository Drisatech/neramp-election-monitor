import React from 'react';
import { MapContainer, TileLayer, CircleMarker, Popup } from 'react-leaflet';
import { State } from '../types';
import { useElection } from '../context/ElectionContext';

interface Props {
  states: State[];
  selectedStateCode?: string;
  onSelectState?: (stateCode: string) => void;
}

export const InteractiveElectionMap: React.FC<Props> = ({ states, selectedStateCode, onSelectState }) => {
  // Center of Nigeria
  const defaultCenter: [number, number] = [9.082, 8.6753];
  const defaultZoom = 6;

  // Selected state center if available
  const activeState = states.find((s) => s.code === selectedStateCode);
  const center: [number, number] = activeState && activeState.latitude && activeState.longitude
    ? [Number(activeState.latitude), Number(activeState.longitude)]
    : defaultCenter;

  return (
    <div className="bg-white rounded-lg border border-slate-200 overflow-hidden shadow-2xs">
      <div className="p-3 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
        <div>
          <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wide">
            Electoral Geographic Coverage (Nigeria - 36 States & FCT)
          </h3>
          <p className="text-[11px] text-slate-500">
            Click on any state marker to inspect local polling unit progress and filter the platform.
          </p>
        </div>
        {selectedStateCode && (
          <button
            onClick={() => onSelectState && onSelectState('')}
            className="text-xs text-emerald-800 hover:text-emerald-950 font-semibold underline"
          >
            Clear State Filter
          </button>
        )}
      </div>

      <div className="h-[420px] w-full relative z-0">
        <MapContainer
          center={center}
          zoom={defaultZoom}
          scrollWheelZoom={false}
          style={{ height: '100%', width: '100%' }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          {states.map((st) => {
            if (!st.latitude || !st.longitude) return null;
            const isSelected = st.code === selectedStateCode;
            return (
              <CircleMarker
                key={st.code}
                center={[Number(st.latitude), Number(st.longitude)]}
                radius={isSelected ? 14 : 9}
                pathOptions={{
                  fillColor: isSelected ? '#047857' : '#10b981',
                  fillOpacity: isSelected ? 0.9 : 0.6,
                  color: isSelected ? '#064e3b' : '#059669',
                  weight: isSelected ? 3 : 1.5,
                }}
                eventHandlers={{
                  click: () => {
                    if (onSelectState) onSelectState(st.code);
                  },
                }}
              >
                <Popup>
                  <div className="text-xs p-1 font-sans">
                    <div className="font-bold text-slate-900 text-sm mb-1">{st.name} State</div>
                    <div className="text-slate-600 mb-0.5">Zone: {st.zone}</div>
                    <div className="text-slate-600 mb-0.5">LGAs: {st.totalLgas} | Expected PUs: {st.totalPus.toLocaleString()}</div>
                    <div className="text-slate-600 mb-2">Registered Voters: {st.registeredVoters.toLocaleString()}</div>
                    <button
                      onClick={() => onSelectState && onSelectState(st.code)}
                      className="w-full bg-emerald-800 text-white font-medium py-1 px-2 rounded text-[11px] hover:bg-emerald-700 transition-colors"
                    >
                      Filter Platform to {st.name}
                    </button>
                  </div>
                </Popup>
              </CircleMarker>
            );
          })}
        </MapContainer>
      </div>
    </div>
  );
};
