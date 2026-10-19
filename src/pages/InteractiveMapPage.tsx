import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useElection } from '../context/ElectionContext';
import { InteractiveElectionMap } from '../components/InteractiveElectionMap';
import { DisclaimerBanner } from '../components/DisclaimerBanner';
import { fetchElectionSummary } from '../services/api';
import { ElectionSummary } from '../types';
import { MapPin, ArrowRight } from 'lucide-react';

export const InteractiveMapPage: React.FC = () => {
  const {
    selectedElectionId,
    states,
    selectedStateCode,
    setSelectedStateCode,
    lgas,
    selectedLgaCode,
    setSelectedLgaCode,
    wards,
    selectedWardCode,
    setSelectedWardCode,
  } = useElection();
  const [selectedZone, setSelectedZone] = useState<string>('');
  const [stateSummary, setStateSummary] = useState<ElectionSummary | null>(null);

  const zones = ['North Central', 'North East', 'North West', 'South East', 'South South', 'South West'];

  const filteredStates = selectedZone
    ? states.filter((s) => s.zone === selectedZone)
    : states;

  const activeState = states.find((s) => s.code === selectedStateCode);
  const activeLga = lgas.find((l) => l.code === selectedLgaCode);
  const activeWard = wards.find((w) => w.code === selectedWardCode);

  useEffect(() => {
    if (!selectedStateCode || !selectedElectionId) {
      setStateSummary(null);
      return;
    }
    let isMounted = true;
    fetchElectionSummary(
      selectedElectionId,
      selectedStateCode,
      selectedLgaCode || undefined,
      selectedWardCode || undefined
    )
      .then((res) => {
        if (isMounted) setStateSummary(res.data);
      })
      .catch(() => {
        if (isMounted) setStateSummary(null);
      });
    return () => {
      isMounted = false;
    };
  }, [selectedElectionId, selectedStateCode, selectedLgaCode, selectedWardCode]);

  const activeParties = useMemo(() => {
    return (stateSummary?.candidateRankings || []).filter((p) => p.votes > 0);
  }, [stateSummary]);

  return (
    <div className="space-y-6">
      <DisclaimerBanner />

      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            Interactive Electoral Map Explorer
          </h1>
          <p className="text-xs text-slate-500">
            Geographic inspection across Nigeria's 6 geopolitical zones, 36 states &amp; FCT (774 LGAs · 8,809 Wards · 176,846 Polling Units).
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

        {/* State, LGA & Ward Drill-Down Information Panel */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-2xs">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wide border-b border-slate-100 pb-2 mb-3">
              Geographic Jurisdiction Profile
            </h3>

            {activeState ? (
              <div className="space-y-3 text-xs">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Selected State</span>
                    <span className="text-base font-bold text-slate-900">{activeState.name}</span>
                  </div>
                  <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200 font-mono font-bold">
                    {activeState.code}
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-100">
                  <div>
                    <span className="text-slate-400 text-[10px] uppercase font-bold block">Zone</span>
                    <span className="font-semibold text-slate-800">{activeState.zone}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[10px] uppercase font-bold block">LGAs</span>
                    <span className="font-mono font-bold text-slate-900">{activeState.totalLgas}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[10px] uppercase font-bold block">Wards (RAs)</span>
                    <span className="font-mono font-bold text-slate-900">
                      {(activeState.totalWards ?? 0).toLocaleString()}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100">
                  <div>
                    <span className="text-slate-400 text-[10px] uppercase font-bold block">Expected PUs</span>
                    <span className="text-sm font-bold font-mono text-emerald-900">
                      {activeState.totalPus.toLocaleString()}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[10px] uppercase font-bold block">Registered Voters</span>
                    <span className="text-sm font-bold font-mono text-slate-900">
                      {activeState.registeredVoters.toLocaleString()}
                    </span>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                  <div>
                    <span className="text-slate-400 text-[10px] uppercase font-bold block">PVCs Collected</span>
                    <span className="text-sm font-bold font-mono text-emerald-800">
                      {(activeState.pvcsCollected ?? 0).toLocaleString()}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-slate-400 text-[10px] uppercase font-bold block">Collection Rate</span>
                    <span className="text-sm font-bold font-mono text-emerald-700">
                      {(activeState.pvcCollectionRate ?? 0).toFixed(2)}%
                    </span>
                  </div>
                </div>

                {/* Party Votes Gotten / Uploaded in Selected State */}
                <div className="pt-3 border-t border-slate-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-slate-700 uppercase">
                      Party Votes Uploaded ({activeWard ? activeWard.name : activeLga ? activeLga.name : activeState.name})
                    </span>
                    <span className="text-[11px] font-mono font-bold text-emerald-800">
                      {(stateSummary?.pusUploaded ?? 0).toLocaleString()} Sheets • {(stateSummary?.totalValidVotes ?? 0).toLocaleString()} Votes
                    </span>
                  </div>

                  {activeParties.length === 0 ? (
                    <div className="p-2.5 rounded bg-slate-50 border border-slate-200 text-[11px] text-slate-500 text-center">
                      No party votes uploaded for {activeState.name} in the selected contest election yet.
                    </div>
                  ) : (
                    <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200 space-y-2 max-h-56 overflow-y-auto">
                      {activeParties.map((pty, idx) => (
                        <div key={pty.partyCode} className="space-y-1">
                          <div className="flex items-center justify-between text-[11px]">
                            <div className="flex items-center gap-1.5 min-w-0">
                              <span className="font-mono text-[10px] text-slate-400 font-bold">#{idx + 1}</span>
                              <span
                                className="px-1.5 py-0.5 rounded text-[10px] font-bold text-white shrink-0"
                                style={{ backgroundColor: pty.color }}
                              >
                                {pty.partyCode}
                              </span>
                              <span className="font-semibold text-slate-800 truncate">{pty.partyName}</span>
                            </div>
                            <div className="font-mono font-bold text-slate-900 shrink-0 ml-2">
                              {pty.votes.toLocaleString()}{' '}
                              <span className="text-[10px] text-emerald-700">({pty.percentage}%)</span>
                            </div>
                          </div>
                          <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
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

                {/* Drill-Down into LGAs & Electoral Wards */}
                <div className="pt-3 border-t border-slate-200 space-y-2.5">
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">
                      Drill Down to LGA ({lgas.length} LGAs)
                    </label>
                    <select
                      value={selectedLgaCode}
                      onChange={(e) => setSelectedLgaCode(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-300 rounded px-2.5 py-1.5 text-slate-900 font-medium"
                    >
                      <option value="">All LGAs in {activeState.name}</option>
                      {lgas.map((l) => (
                        <option key={l.code} value={l.code}>
                          {l.name} ({l.totalWards} Wards · {l.totalPus.toLocaleString()} PUs)
                        </option>
                      ))}
                    </select>
                  </div>

                  {activeLga && (
                    <div className="bg-slate-50 p-2.5 rounded border border-slate-200 space-y-2">
                      <div className="flex justify-between text-[11px]">
                        <span className="text-slate-500">LGA Expected PUs:</span>
                        <strong className="font-mono text-slate-900">{activeLga.totalPus.toLocaleString()}</strong>
                      </div>
                      <div className="flex justify-between text-[11px]">
                        <span className="text-slate-500">LGA Registered Voters:</span>
                        <strong className="font-mono text-slate-900">{(activeLga.registeredVoters || 0).toLocaleString()}</strong>
                      </div>
                      <div className="flex justify-between text-[11px]">
                        <span className="text-slate-500">LGA PVCs Collected:</span>
                        <strong className="font-mono text-emerald-800">{(activeLga.pvcsCollected || 0).toLocaleString()}</strong>
                      </div>

                      <div>
                        <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">
                          Drill Down to Electoral Ward ({wards.length} Wards)
                        </label>
                        <select
                          value={selectedWardCode}
                          onChange={(e) => setSelectedWardCode(e.target.value)}
                          className="w-full bg-white border border-slate-300 rounded px-2 py-1.5 text-slate-900 font-medium"
                        >
                          <option value="">All Wards in {activeLga.name}</option>
                          {wards.map((w) => (
                            <option key={w.code} value={w.code}>
                              {w.name} ({w.totalPus} Expected PUs)
                            </option>
                          ))}
                        </select>
                      </div>

                      {activeWard && (
                        <div className="pt-1 border-t border-slate-200 text-[11px] space-y-1">
                          <div className="flex justify-between">
                            <span className="text-slate-500">Ward Expected PUs:</span>
                            <strong className="font-mono text-emerald-900">{activeWard.totalPus}</strong>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-500">Ward Registered Voters:</span>
                            <strong className="font-mono text-slate-900">{(activeWard.registeredVoters || 0).toLocaleString()}</strong>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  <Link
                    to="/polling-units"
                    className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-emerald-800 hover:bg-emerald-900 text-white font-semibold rounded transition-colors"
                  >
                    <span>Inspect Expected Polling Units</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            ) : (
              <div className="space-y-3 text-xs">
                <div className="text-center py-4 text-slate-500">
                  <MapPin className="w-6 h-6 text-emerald-600 mx-auto mb-1.5" />
                  <p className="font-semibold text-slate-800">National Summary (36 States &amp; FCT)</p>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Click any state on the Nigeria map to drill down into LGAs, Electoral Wards, and Party Votes.
                  </p>
                </div>
                <div className="bg-slate-50 p-3 rounded border border-slate-200 space-y-1.5 font-mono text-[11px]">
                  <div className="flex justify-between">
                    <span className="font-sans text-slate-500">Total States &amp; FCT:</span>
                    <strong className="text-slate-900">37 (36 + FCT)</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-sans text-slate-500">Total LGAs / Area Councils:</span>
                    <strong className="text-slate-900">774</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-sans text-slate-500">Total Electoral Wards (RAs):</span>
                    <strong className="text-slate-900">8,809</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-sans text-slate-500">Total Expected Polling Units:</span>
                    <strong className="text-emerald-900">176,846</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-sans text-slate-500">Total Registered Voters:</span>
                    <strong className="text-slate-900">
                      {(states.length > 0
                        ? states.reduce((acc, s) => acc + (s.registeredVoters || 0), 0)
                        : 93469008
                      ).toLocaleString()}
                    </strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-sans text-slate-500">Total PVCs Collected:</span>
                    <strong className="text-emerald-800">
                      {(states.length > 0
                        ? states.reduce((acc, s) => acc + (s.pvcsCollected || 0), 0)
                        : 87209007
                      ).toLocaleString()}
                    </strong>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};


