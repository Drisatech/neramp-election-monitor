import React, { useEffect, useState } from 'react';
import { Shield, MapPin, Clock, CheckCircle2, AlertOctagon } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useElection } from '../context/ElectionContext';
import { fetchPublishedIncidents } from '../services/api';
import { IncidentReport } from '../types';
import { DisclaimerBanner } from '../components/DisclaimerBanner';

import { useAuth } from '../context/AuthContext';

export const IncidentsPage: React.FC = () => {
  const { selectedElectionId } = useElection();
  const { role, isSuperOrProjectAdmin } = useAuth();
  const canReport = isSuperOrProjectAdmin || role === 'REGISTERED_OBSERVER' || role === 'STATE_COORDINATOR' || role === 'LGA_COORDINATOR' || role === 'MONITORING_COORDINATOR';

  const [incidents, setIncidents] = useState<IncidentReport[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadIncidents() {
      try {
        setIsLoading(true);
        const res = await fetchPublishedIncidents(selectedElectionId);
        setIncidents(res.data);
      } catch (err) {
        console.error('Failed to load incidents:', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadIncidents();
  }, [selectedElectionId]);

  return (
    <div className="space-y-6">
      <DisclaimerBanner />

      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            Verified Election Incident Reports
          </h1>
          <p className="text-xs text-slate-500">
            Field reports submitted by authorized observers and certified by monitoring coordinators.
          </p>
        </div>
        {canReport && (
          <Link
            to="/observer-portal"
            className="px-3 py-1.5 bg-emerald-800 hover:bg-emerald-700 text-white rounded text-xs font-bold transition-colors"
          >
            Submit Observer Field Incident
          </Link>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {incidents.map((inc) => (
          <div key={inc.id} className="bg-white p-5 rounded-lg border border-slate-200 shadow-2xs space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <span className="font-bold text-xs uppercase tracking-wider text-slate-900 flex items-center gap-1.5">
                <AlertOctagon className="w-3.5 h-3.5 text-amber-600" />
                <span>{inc.category.replace(/_/g, ' ')}</span>
              </span>
              <span
                className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                  inc.severity === 'HIGH' || inc.severity === 'CRITICAL'
                    ? 'bg-rose-100 text-rose-800'
                    : 'bg-amber-100 text-amber-800'
                }`}
              >
                {inc.severity}
              </span>
            </div>

            <p className="text-xs text-slate-700 leading-relaxed min-h-[48px]">{inc.description}</p>

            <div className="pt-2 border-t border-slate-100 text-[11px] text-slate-500 space-y-1">
              <div className="flex items-center gap-1 text-slate-700 font-medium">
                <MapPin className="w-3 h-3 text-slate-400" />
                <span>
                  {inc.lgaName}, {inc.stateName} State {inc.pollingUnitCode ? `(${inc.pollingUnitCode})` : ''}
                </span>
              </div>
              <div className="flex items-center justify-between text-slate-400 font-mono">
                <span>Reported: {new Date(inc.reportedAt).toLocaleTimeString()} WAT</span>
                <span>Badge: {inc.observerBadge}</span>
              </div>
            </div>

            <div className="bg-slate-50 p-2 rounded text-[11px] flex items-center justify-between text-emerald-800 font-semibold border border-slate-200">
              <span className="flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>Status: {inc.status.replace(/_/g, ' ')}</span>
              </span>
              <span className="text-slate-400 font-normal">Evidence: {inc.evidenceCount} file</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
