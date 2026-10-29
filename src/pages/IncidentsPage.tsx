import React, { useEffect, useState } from 'react';
import {
  Shield,
  MapPin,
  Clock,
  CheckCircle2,
  AlertOctagon,
  Plus,
  X,
  UploadCloud,
  FileCheck,
  Send,
  RefreshCw,
  Edit3,
  Trash2,
  Download,
  Eye,
  RotateCcw,
  ExternalLink,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useElection } from '../context/ElectionContext';
import {
  fetchPublishedIncidents,
  fetchLgas,
  fetchPollingUnits,
  uploadEvidenceFile,
  submitIncidentReport,
  updateIncidentReport,
  deleteIncidentReport,
} from '../services/api';
import { IncidentReport, LGA, PollingUnit } from '../types';
import { DisclaimerBanner } from '../components/DisclaimerBanner';
import { useAuth } from '../context/AuthContext';

export const IncidentsPage: React.FC = () => {
  const { selectedElectionId, states, selectedStateCode: globalStateCode } = useElection();
  const { user, role, isSuperOrProjectAdmin } = useAuth();
  const canReport =
    isSuperOrProjectAdmin ||
    role === 'REGISTERED_OBSERVER' ||
    role === 'STATE_COORDINATOR' ||
    role === 'LGA_COORDINATOR' ||
    role === 'MONITORING_COORDINATOR' ||
    true; // Allow field incident reporting from Incidents page

  const [incidents, setIncidents] = useState<IncidentReport[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showReportModal, setShowReportModal] = useState(false);

  // Full Incident Inspection Modal State (Management review & evidence download)
  const [viewingIncident, setViewingIncident] = useState<IncidentReport | null>(null);

  // Reopen & Edit Modal State
  const [editingIncident, setEditingIncident] = useState<IncidentReport | null>(null);
  const [editCategory, setEditCategory] = useState('');
  const [editSeverity, setEditSeverity] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editReopenedReason, setEditReopenedReason] = useState('');
  const [editStatus, setEditStatus] = useState('REOPENED');
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  const [editModalNotice, setEditModalNotice] = useState<string | null>(null);
  const [isDeletingId, setIsDeletingId] = useState<string | null>(null);

  // Modal Form State
  const [category, setCategory] = useState('BVAS_MALFUNCTION');
  const [severity, setSeverity] = useState('MEDIUM');
  const [selectedStateCode, setSelectedStateCode] = useState<string>(globalStateCode || 'OSUN');
  const [lgaOptions, setLgaOptions] = useState<LGA[]>([]);
  const [selectedLgaCode, setSelectedLgaCode] = useState<string>('');
  const [puOptions, setPuOptions] = useState<PollingUnit[]>([]);
  const [puCode, setPuCode] = useState<string>('');
  const [description, setDescription] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadedEvidence, setUploadedEvidence] = useState<{
    storageKey: string;
    fileHash: string;
    filename: string;
    gcsPublicUrl?: string;
  } | null>(null);
  const [isUploadingFile, setIsUploadingFile] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formNotice, setFormNotice] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const loadIncidents = async () => {
    try {
      setIsLoading(true);
      const res = await fetchPublishedIncidents(selectedElectionId);
      setIncidents(res.data || []);
    } catch (err) {
      console.error('Failed to load incidents:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadIncidents();
  }, [selectedElectionId]);

  useEffect(() => {
    if (globalStateCode) {
      setSelectedStateCode(globalStateCode);
    } else if (!selectedStateCode) {
      setSelectedStateCode('OSUN');
    }
  }, [globalStateCode]);

  useEffect(() => {
    if (!selectedStateCode) {
      setLgaOptions([]);
      setSelectedLgaCode('');
      return;
    }
    let active = true;
    fetchLgas(selectedStateCode)
      .then((res) => {
        if (!active) return;
        const list = res.data || [];
        setLgaOptions(list);
        setSelectedLgaCode(list.length > 0 ? list[0].code : '');
      })
      .catch((err) => console.error('Failed to load LGAs for incident modal:', err));
    return () => {
      active = false;
    };
  }, [selectedStateCode]);

  useEffect(() => {
    if (!selectedStateCode || !selectedLgaCode) {
      setPuOptions([]);
      setPuCode('');
      return;
    }
    let active = true;
    fetchPollingUnits({
      electionId: selectedElectionId,
      state: selectedStateCode,
      lga: selectedLgaCode,
      limit: 250,
    })
      .then((res) => {
        if (!active) return;
        const list = res.data || [];
        setPuOptions(list);
        setPuCode(list.length > 0 ? list[0].code : '');
      })
      .catch((err) => console.error('Failed to load PUs for incident modal:', err));
    return () => {
      active = false;
    };
  }, [selectedElectionId, selectedStateCode, selectedLgaCode]);

  const readFileAsBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const resStr = String(reader.result || '');
        resolve(resStr.includes(',') ? resStr.split(',')[1] : resStr);
      };
      reader.onerror = () => reject(new Error('Failed to read selected file'));
      reader.readAsDataURL(file);
    });
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSelectedFile(file);
    try {
      setIsUploadingFile(true);
      const base64Data = await readFileAsBase64(file);
      const uploadRes = await uploadEvidenceFile(file.name, base64Data, file.type);
      setUploadedEvidence({
        storageKey: uploadRes.storageKey,
        fileHash: uploadRes.fileHash,
        filename: file.name,
        gcsPublicUrl: uploadRes.gcsPublicUrl,
      });
    } catch (err: any) {
      setUploadedEvidence(null);
      setFormNotice({ type: 'error', text: err.message || 'Evidence upload failed. Please retry or remove the attachment.' });
    } finally {
      setIsUploadingFile(false);
    }
  };

  const handleReportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim()) {
      setFormNotice({ type: 'error', text: 'Please enter a factual description of the incident.' });
      return;
    }
    try {
      setIsSubmitting(true);
      setFormNotice(null);
      if (selectedFile && !uploadedEvidence) {
        throw new Error('Evidence upload failed. Please retry the upload or remove the attachment before submitting.');
      }

      const stateObj = states.find((s) => s.code === selectedStateCode);
      const lgaObj = lgaOptions.find((l) => l.code === selectedLgaCode);
      const puObj = puOptions.find((p) => p.code === puCode);

      await submitIncidentReport({
        electionId: selectedElectionId,
        category,
        severity,
        stateCode: selectedStateCode,
        stateName: stateObj?.name || selectedStateCode,
        lgaCode: selectedLgaCode,
        lgaName: lgaObj?.name || selectedLgaCode,
        pollingUnitCode: puCode,
        pollingUnitName: puObj?.name || '',
        description: description.trim(),
        observerBadge: user?.badge || 'OBS-NG-2026-8841',
        evidenceCount: selectedFile || uploadedEvidence ? 1 : 0,
        evidenceKey: uploadedEvidence?.storageKey,
        evidenceHash: uploadedEvidence?.fileHash,
        evidenceUrl: uploadedEvidence?.gcsPublicUrl,
      });

      await loadIncidents();
      setDescription('');
      setSelectedFile(null);
      setUploadedEvidence(null);
      setShowReportModal(false);
      setFormNotice({
        type: 'success',
        text: 'Incident report submitted for review. It will appear publicly only after approval.',
      });
    } catch (err: any) {
      setFormNotice({ type: 'error', text: err.message || 'Failed to submit incident report.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenEditModal = (inc: IncidentReport) => {
    setEditingIncident(inc);
    setEditCategory(inc.category);
    setEditSeverity(inc.severity);
    setEditDescription(inc.description);
    setEditReopenedReason(inc.reopenedReason || 'Rectifying mistake in initial incident upload');
    setEditStatus('REOPENED');
    setEditModalNotice(null);
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingIncident) return;
    if (!editDescription.trim()) {
      setEditModalNotice('Factual description cannot be empty.');
      return;
    }

    try {
      setIsSavingEdit(true);
      setEditModalNotice(null);

      const res = await updateIncidentReport(editingIncident.id, {
        category: editCategory,
        severity: editSeverity,
        description: editDescription.trim(),
        reopenedReason: editReopenedReason.trim(),
        status: editStatus,
      });

      setIncidents((prev) =>
        prev.map((i) => (i.id === editingIncident.id ? res.data : i))
      );
      if (viewingIncident?.id === editingIncident.id) {
        setViewingIncident(res.data);
      }
      setFormNotice({
        type: 'success',
        text: `Incident ${editingIncident.id} was reopened and updated successfully.`,
      });
      setEditingIncident(null);
    } catch (err: any) {
      setEditModalNotice(err.message || 'Failed to update incident report.');
    } finally {
      setIsSavingEdit(false);
    }
  };

  const handleDeleteIncident = async (id: string) => {
    if (!window.confirm(`Are you sure you want to permanently delete incident report ${id}?`)) {
      return;
    }

    try {
      setIsDeletingId(id);
      await deleteIncidentReport(id);
      setIncidents((prev) => prev.filter((i) => i.id !== id));
      if (viewingIncident?.id === id) setViewingIncident(null);
      if (editingIncident?.id === id) setEditingIncident(null);
      setFormNotice({
        type: 'success',
        text: `Incident report ${id} was deleted successfully.`,
      });
    } catch (err: any) {
      setFormNotice({
        type: 'error',
        text: err.message || 'Failed to delete incident report.',
      });
    } finally {
      setIsDeletingId(null);
    }
  };

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
        <div className="flex items-center gap-2">
          <button
            onClick={loadIncidents}
            className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
          {canReport && (
            <>
              <button
                onClick={() => setShowReportModal(true)}
                className="px-3 py-1.5 bg-emerald-800 hover:bg-emerald-700 text-white rounded text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Report Field Incident</span>
              </button>
              <Link
                to="/observer-portal"
                className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded text-xs font-bold transition-colors"
              >
                Observer Field Portal
              </Link>
            </>
          )}
        </div>
      </div>

      {formNotice && (
        <div
          className={`p-3 rounded-lg border text-xs font-semibold flex items-center justify-between ${
            formNotice.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
              : 'bg-rose-50 border-rose-200 text-rose-900'
          }`}
        >
          <span className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{formNotice.text}</span>
          </span>
          <button onClick={() => setFormNotice(null)} className="text-slate-400 hover:text-slate-700">
            ×
          </button>
        </div>
      )}

      {incidents.length === 0 && !isLoading ? (
        <div className="bg-white p-8 rounded-lg border border-slate-200 text-center space-y-2">
          <AlertOctagon className="w-8 h-8 text-slate-400 mx-auto" />
          <div className="text-sm font-bold text-slate-800">No Incident Reports Logged for This Contest</div>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            Click "Report Field Incident" or use the Observer Field Portal to log a verified field incident with photographic or video evidence.
          </p>
        </div>
      ) : (
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
                    {inc.lgaName}, {inc.stateName} {inc.pollingUnitCode ? `(${inc.pollingUnitCode})` : ''}
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
                <span className="text-slate-500 font-medium">
                  Evidence: {inc.evidenceCount || 0} {inc.evidenceCount === 1 ? 'file' : 'files'}
                </span>
              </div>

              {/* Management Actions Toolbar */}
              <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-1 text-xs">
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setViewingIncident(inc)}
                    className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 text-white rounded font-bold text-[11px] flex items-center gap-1 transition-colors cursor-pointer"
                    title="View full report and inspect attached evidence"
                  >
                    <Eye className="w-3 h-3 text-emerald-400" />
                    <span>View Full Report</span>
                  </button>

                  {(inc.evidenceCount > 0 || inc.evidenceKey || inc.evidenceUrl) && (
                    <a
                      href={`/api/v1/observer/incidents/${inc.id}/evidence?download=true`}
                      className="px-2 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 rounded font-semibold text-[11px] flex items-center gap-1 transition-colors"
                      title="Download attached evidence file"
                    >
                      <Download className="w-3 h-3" />
                      <span>Evidence</span>
                    </a>
                  )}
                </div>

                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => handleOpenEditModal(inc)}
                    className="px-2 py-1 bg-blue-50 hover:bg-blue-100 text-blue-800 border border-blue-200 rounded font-semibold text-[11px] flex items-center gap-1 transition-colors cursor-pointer"
                    title="Reopen submitted report to make edits"
                  >
                    <Edit3 className="w-3 h-3" />
                    <span>Edit / Reopen</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteIncident(inc.id)}
                    disabled={isDeletingId === inc.id}
                    className="p-1 hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded transition-colors cursor-pointer disabled:opacity-50"
                    title="Delete report"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Report Field Incident Modal */}
      {showReportModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl border border-slate-200 shadow-2xl max-w-xl w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div>
                <h2 className="text-base font-bold text-slate-900">Submit Verified Field Incident Report</h2>
                <p className="text-xs text-slate-500">
                  Select the State, LGA, and Polling Unit from official INEC registers and attach supporting evidence.
                </p>
              </div>
              <button
                onClick={() => setShowReportModal(false)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleReportSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold uppercase text-[10px] text-slate-500 mb-1">
                    Incident Category
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded px-3 py-2 font-semibold text-slate-800"
                  >
                    <option value="BVAS_MALFUNCTION">BVAS Biometric / Accreditation Failure</option>
                    <option value="LATE_OPENING">Late Arrival of Poll Officials / Materials</option>
                    <option value="LOGISTICS_ISSUE">Missing Ballot Papers / Result Sheets</option>
                    <option value="INTIMIDATION">Voter Intimidation / Security Disruption</option>
                    <option value="VOTE_BUYING">Suspected Vote Buying / Inducement</option>
                    <option value="COLLATION_DISRUPTION">Disruption of Sorting or Collation</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold uppercase text-[10px] text-slate-500 mb-1">
                    Severity Level
                  </label>
                  <select
                    value={severity}
                    onChange={(e) => setSeverity(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded px-3 py-2 font-semibold text-slate-800"
                  >
                    <option value="LOW">LOW (Minor delay, resolved)</option>
                    <option value="MEDIUM">MEDIUM (Requires coordinator follow-up)</option>
                    <option value="HIGH">HIGH (Voting disrupted / halted)</option>
                    <option value="CRITICAL">CRITICAL (Emergency security / integrity threat)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold uppercase text-[10px] text-slate-500 mb-1">
                    State
                  </label>
                  <select
                    value={selectedStateCode}
                    onChange={(e) => setSelectedStateCode(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded px-2.5 py-2 font-semibold text-slate-800"
                  >
                    {states.map((st) => (
                      <option key={st.code} value={st.code}>
                        {st.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold uppercase text-[10px] text-slate-500 mb-1">
                    Local Government Area (LGA)
                  </label>
                  <select
                    value={selectedLgaCode}
                    onChange={(e) => setSelectedLgaCode(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded px-2.5 py-2 font-semibold text-slate-800"
                  >
                    {lgaOptions.length === 0 ? (
                      <option value="">Select LGA</option>
                    ) : (
                      lgaOptions.map((lga) => (
                        <option key={lga.code} value={lga.code}>
                          {lga.name}
                        </option>
                      ))
                    )}
                  </select>
                </div>

                <div>
                  <label className="block font-bold uppercase text-[10px] text-slate-500 mb-1">
                    Polling Unit (PU Identifier)
                  </label>
                  <select
                    value={puCode}
                    onChange={(e) => setPuCode(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded px-2.5 py-2 font-mono font-semibold text-slate-800"
                  >
                    {puOptions.length === 0 ? (
                      <option value="">All / General LGA Level</option>
                    ) : (
                      puOptions.map((pu) => (
                        <option key={pu.id} value={pu.code}>
                          {pu.code} — {pu.name}
                        </option>
                      ))
                    )}
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold uppercase text-[10px] text-slate-500 mb-1">
                  Factual Field Observation & Description
                </label>
                <textarea
                  rows={3}
                  required
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Provide objective, timestamped details of what occurred at the polling unit..."
                  className="w-full bg-slate-50 border border-slate-300 rounded p-2.5 text-slate-800"
                />
              </div>

              <div>
                <label className="block font-bold uppercase text-[10px] text-slate-500 mb-1">
                  Attach Incident Evidence (Photo / Video / Signed Statement)
                </label>
                <label className="flex items-center justify-between p-3 border-2 border-dashed border-slate-300 rounded-lg bg-slate-50 hover:bg-slate-100 cursor-pointer">
                  <div className="flex items-center gap-2.5">
                    {uploadedEvidence ? (
                      <FileCheck className="w-5 h-5 text-emerald-600" />
                    ) : (
                      <UploadCloud className="w-5 h-5 text-slate-400" />
                    )}
                    <div>
                      <div className="font-semibold text-slate-800">
                        {selectedFile
                          ? selectedFile.name
                          : 'Click to select photographic or document evidence'}
                      </div>
                      <div className="text-[10px] text-slate-500">
                        {isUploadingFile
                          ? 'Validating & hashing file...'
                          : uploadedEvidence
                          ? `SHA-256 Verified: ${uploadedEvidence.fileHash.slice(0, 16)}...`
                          : 'Supports JPG, PNG, PDF, MP4 (Max 25MB)'}
                      </div>
                    </div>
                  </div>
                  <input type="file" className="hidden" onChange={handleFileChange} />
                </label>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowReportModal(false)}
                  className="px-3.5 py-2 rounded border border-slate-300 text-slate-700 font-semibold hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || isUploadingFile}
                  className="px-4 py-2 rounded bg-emerald-800 hover:bg-emerald-700 text-white font-bold flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{isSubmitting ? 'Submitting Report...' : 'Submit Incident Report'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reopen & Edit Incident Modal */}
      {editingIncident && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl border border-slate-200 shadow-2xl max-w-lg w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-blue-100 text-blue-800 rounded-lg">
                  <Edit3 className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-900">Reopen &amp; Edit Incident Report</h2>
                  <p className="text-xs text-slate-500 font-mono">Incident ID: {editingIncident.id}</p>
                </div>
              </div>
              <button
                onClick={() => setEditingIncident(null)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Incident Category:</label>
                  <select
                    value={editCategory}
                    onChange={(e) => setEditCategory(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded p-2 text-slate-900 font-medium"
                  >
                    <option value="BVAS_MALFUNCTION">BVAS Biometric / Accreditation Failure</option>
                    <option value="LATE_OPENING">Late Arrival of Poll Officials / Materials</option>
                    <option value="LOGISTICS_ISSUE">Missing Ballot Papers / Result Sheets</option>
                    <option value="INTIMIDATION">Voter Intimidation / Security Disruption</option>
                    <option value="VOTE_BUYING">Suspected Vote Buying / Inducement</option>
                    <option value="COLLATION_DISRUPTION">Disruption of Sorting or Collation</option>
                  </select>
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Severity Level:</label>
                  <select
                    value={editSeverity}
                    onChange={(e) => setEditSeverity(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded p-2 text-slate-900 font-medium"
                  >
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                    <option value="CRITICAL">Critical</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Status Classification:</label>
                <select
                  value={editStatus}
                  onChange={(e) => setEditStatus(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded p-2 text-slate-900 font-medium"
                >
                  <option value="REOPENED">REOPENED (Amended by Observer/Management)</option>
                  <option value="VERIFIED">VERIFIED (Field Verified)</option>
                  <option value="UNDER_REVIEW">UNDER_REVIEW (Investigation Active)</option>
                  <option value="APPROVED_FOR_PUBLICATION">APPROVED_FOR_PUBLICATION</option>
                  <option value="RESOLVED">RESOLVED (Remedied on Site)</option>
                </select>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Reason for Reopening / Edit:</label>
                <input
                  type="text"
                  value={editReopenedReason}
                  onChange={(e) => setEditReopenedReason(e.target.value)}
                  placeholder="e.g. Corrected polling unit name, updated factual narrative"
                  required
                  className="w-full bg-slate-50 border border-slate-300 rounded p-2 text-slate-900"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Factual Incident Description:</label>
                <textarea
                  rows={4}
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  required
                  className="w-full bg-slate-50 border border-slate-300 rounded p-2.5 text-slate-900"
                />
              </div>

              {editModalNotice && (
                <div className="p-2.5 bg-rose-50 border border-rose-200 text-rose-800 rounded font-semibold flex items-center gap-1.5">
                  <AlertOctagon className="w-4 h-4 shrink-0" />
                  <span>{editModalNotice}</span>
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setEditingIncident(null)}
                  className="px-4 py-2 border border-slate-300 hover:bg-slate-100 text-slate-700 rounded font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingEdit}
                  className="px-4 py-2 bg-blue-700 hover:bg-blue-600 text-white rounded font-bold flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>{isSavingEdit ? 'Saving Changes...' : 'Save & Reopen Report'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Full Incident Report & Attached Evidence Inspection Modal (Management View) */}
      {viewingIncident && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl border border-slate-200 shadow-2xl max-w-2xl w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-bold text-slate-900">Incident Report &amp; Evidence Dossier</h2>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                      viewingIncident.severity === 'HIGH' || viewingIncident.severity === 'CRITICAL'
                        ? 'bg-rose-100 text-rose-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    {viewingIncident.severity}
                  </span>
                  {viewingIncident.status === 'REOPENED' && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-100 text-blue-800">
                      REOPENED
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-500 font-mono mt-0.5">
                  ID: {viewingIncident.id} · Category: {viewingIncident.category.replace(/_/g, ' ')}
                </p>
              </div>
              <button
                onClick={() => setViewingIncident(null)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Geographical Hierarchy & Metadata */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
              <div className="p-2.5 bg-slate-50 rounded border border-slate-200">
                <span className="text-slate-400 uppercase text-[10px] font-bold block">State</span>
                <span className="font-bold text-slate-800">{viewingIncident.stateName}</span>
              </div>
              <div className="p-2.5 bg-slate-50 rounded border border-slate-200">
                <span className="text-slate-400 uppercase text-[10px] font-bold block">LGA</span>
                <span className="font-bold text-slate-800">{viewingIncident.lgaName}</span>
              </div>
              <div className="p-2.5 bg-slate-50 rounded border border-slate-200">
                <span className="text-slate-400 uppercase text-[10px] font-bold block">Polling Unit</span>
                <span className="font-bold text-slate-800 truncate block">
                  {viewingIncident.pollingUnitCode || 'LGA Level'}
                </span>
              </div>
              <div className="p-2.5 bg-slate-50 rounded border border-slate-200">
                <span className="text-slate-400 uppercase text-[10px] font-bold block">Reported At</span>
                <span className="font-mono text-[11px] text-slate-800">
                  {new Date(viewingIncident.reportedAt).toLocaleTimeString()} WAT
                </span>
              </div>
            </div>

            {/* Complete Narrative */}
            <div className="space-y-1.5">
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wide">Factual Incident Narrative</h4>
              <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-200 text-xs text-slate-800 whitespace-pre-line leading-relaxed">
                {viewingIncident.description}
              </div>
            </div>

            {viewingIncident.reopenedReason && (
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-xs space-y-1 text-blue-900">
                <span className="font-bold uppercase text-[10px] text-blue-700 block">Reopen / Amendment Reason:</span>
                <p>{viewingIncident.reopenedReason}</p>
                {viewingIncident.reopenedAt && (
                  <span className="text-[10px] text-blue-600 font-mono block">
                    Reopened: {new Date(viewingIncident.reopenedAt).toLocaleString()} WAT
                  </span>
                )}
              </div>
            )}

            {/* Attached Evidence File Section for Management Review & Download */}
            <div className="p-4 bg-slate-50 rounded-lg border border-slate-200 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wide flex items-center gap-1.5">
                  <FileCheck className="w-4 h-4 text-emerald-700" />
                  <span>Attached Supporting Evidence ({viewingIncident.evidenceCount || 0} file)</span>
                </h4>
                {viewingIncident.evidenceHash && (
                  <span className="text-[10px] font-mono text-slate-500">
                    SHA-256: {viewingIncident.evidenceHash.slice(0, 16)}...
                  </span>
                )}
              </div>

              {(viewingIncident.evidenceCount > 0 || viewingIncident.evidenceKey || viewingIncident.evidenceUrl) ? (
                <div className="space-y-3">
                  {/* Evidence Image Preview */}
                  <div className="bg-slate-900 rounded-lg p-2 flex items-center justify-center max-h-64 overflow-hidden">
                    <img
                      src={`/api/v1/observer/incidents/${viewingIncident.id}/evidence`}
                      alt="Incident Evidence"
                      className="max-h-60 max-w-full object-contain rounded"
                      onError={(e) => {
                        (e.target as HTMLElement).style.display = 'none';
                      }}
                    />
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-slate-200 text-xs">
                    <span className="text-slate-600 font-mono">
                      File: <strong>{viewingIncident.evidenceFilename || viewingIncident.evidenceKey || 'evidence.jpg'}</strong>
                    </span>

                    <div className="flex items-center gap-2">
                      <a
                        href={`/api/v1/observer/incidents/${viewingIncident.id}/evidence`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded font-semibold text-xs flex items-center gap-1 transition-colors"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        <span>View In Tab</span>
                      </a>
                      <a
                        href={`/api/v1/observer/incidents/${viewingIncident.id}/evidence?download=true`}
                        className="px-3.5 py-1.5 bg-emerald-800 hover:bg-emerald-700 text-white rounded font-bold text-xs flex items-center gap-1.5 shadow-xs transition-colors"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Download Evidence File</span>
                      </a>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-3 bg-white rounded border border-slate-200 text-xs text-slate-500 text-center">
                  No photographic or documentary evidence file was attached to this report.
                </div>
              )}
            </div>

            {/* Modal Footer Controls */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-slate-200">
              <button
                type="button"
                onClick={() => handleDeleteIncident(viewingIncident.id)}
                className="px-3 py-1.5 border border-rose-300 text-rose-700 hover:bg-rose-50 rounded text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete Report</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const inc = viewingIncident;
                    setViewingIncident(null);
                    handleOpenEditModal(inc);
                  }}
                  className="px-3 py-1.5 bg-blue-50 border border-blue-300 hover:bg-blue-100 text-blue-800 rounded text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>Reopen &amp; Edit Report</span>
                </button>
                <button
                  type="button"
                  onClick={() => setViewingIncident(null)}
                  className="px-4 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded text-xs font-semibold cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

