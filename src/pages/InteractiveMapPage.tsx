import React, { useState } from 'react';
import { useElection } from '../context/ElectionContext';
import { InteractiveElectionMap } from '../components/InteractiveElectionMap';
import { DisclaimerBanner } from '../components/DisclaimerBanner';
import { MapPin, Filter, Layers } from 'lucide-react';

export const InteractiveMapPage: React.FC = () => {
  const { states, selectedStateCode, setSelectedStateCode } = useElection();
  const [selectedZone, setSelectedZone] = useState<string>('');

  const zones = ['North Central', 'North East', 'North West', 'South East', 'South South', 'South West'];

  const filteredStates = selectedZone
    ? states.filter((s) => s.zone === selectedZone)
    : states;

  const activeState = states.find((s) => s.code === selectedStateCode);

  return (
    <div className="space-y-6">
      <DisclaimerBanner />

      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            Interactive Electoral Map Explorer
          </h1>
          <p className="text-xs text-slate-500">
            Geographic inspection across Nigeria's 6 geopolitical zones, 36 states, and FCT.
          </p>
        </div>

        {/* Zone Filter */}
        <div className="flex items-center gap-2 text-xs">
          <span className="text-slate-500 font-semibold">Zone:</span>
          <select
            value={selectedZone}
            onChange={(e) => setSelectedZone(e.target.value)}
            className="bg-white border border-slate-300 rounded px-2.5 py-1.5 text-slate-900 focus:outline-emerald-600"
          >
            <option value="">All 6 Geopolitical Zones</option>
            {zones.map((z) => (
              <option key={z} value={z}>
                {z}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8">
          <InteractiveElectionMap
            states={filteredStates}
            selectedStateCode={selectedStateCode}
            onSelectState={(code) => setSelectedStateCode(code)}
          />
        </div>

        {/* State Information Panel */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-2xs">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wide border-b border-slate-100 pb-2 mb-3">
              Geographic State Profile
            </h3>

            {activeState ? (
              <div className="space-y-3 text-xs">
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">State Name</span>
                  <span className="text-base font-bold text-slate-900">{activeState.name} State</span>
                </div>
                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100">
                  <div>
                    <span className="text-slate-400 text-[10px] uppercase font-bold block">Geopolitical Zone</span>
                    <span className="font-semibold text-slate-800">{activeState.zone}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[10px] uppercase font-bold block">Total LGAs</span>
                    <span className="font-semibold text-slate-800">{activeState.totalLgas}</span>
                  </div>
                </div>
                <div className="pt-2 border-t border-slate-100">
                  <span className="text-slate-400 text-[10px] uppercase font-bold block">Registered Voters</span>
                  <span className="text-sm font-bold font-mono text-emerald-900">
                    {activeState.registeredVoters.toLocaleString()}
                  </span>
                </div>
                <div className="pt-2 border-t border-slate-100">
                  <span className="text-slate-400 text-[10px] uppercase font-bold block">Expected Polling Units</span>
                  <span className="text-sm font-bold font-mono text-slate-900">
                    {activeState.totalPus.toLocaleString()}
                  </span>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-slate-500 text-xs">
                <MapPin className="w-6 h-6 text-slate-300 mx-auto mb-2" />
                <p>Click on any marker on the map to view state-specific metrics.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
