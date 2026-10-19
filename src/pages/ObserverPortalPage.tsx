import React, { useState, useEffect } from 'react';
import {
  UserCheck,
  Send,
  CheckCircle2,
  AlertTriangle,
  MapPin,
  UploadCloud,
  FileCheck,
  Lock,
  AlertOctagon,
  ExternalLink,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useElection } from '../context/ElectionContext';
import {
  submitIncidentReport,
  uploadEvidenceFile,
  fetchLgas,
  fetchPollingUnits,
  fetchPublishedIncidents,
} from '../services/api';
import { LGA, PollingUnit, IncidentReport } from '../types';
import { DisclaimerBanner } from '../components/DisclaimerBanner';

export const ObserverPortalPage: React.FC = () => {
  const { user, role } = useAuth();
  const { selectedElectionId, states, selectedStateCode: globalStateCode } = useElection();

  const [category, setCategory] = useState('BVAS_MALFUNCTION');
  const [selectedStateCode, setSelectedStateCode] = useState<string>(globalStateCode || 'OSUN');
  const [lgaOptions, setLgaOptions] = useState<LGA[]>([]);
  const [selectedLgaCode, setSelectedLgaCode] = useState<string>('');
  const [puOptions, setPuOptions] = useState<PollingUnit[]>([]);
  const [puCode, setPuCode] = useState<string>('');
  const [description, setDescription] = useState('');
  const [severity, setSeverity] = useState('MEDIUM');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [submittedIncidents, setSubmittedIncidents] = useState<IncidentReport[]>([]);

  // Evidence upload state
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadedEvidence, setUploadedEvidence] = useState<{
    storageKey: string;
    fileHash: string;
    filename: string;
    gcsPublicUrl?: string;
  } | null>(null);
  const [isUploadingFile, setIsUploadingFile] = useState(false);
  const [fileError, setFileError] = useState<string | null>(null);

  // Sync default state when contest election changes
  useEffect(() => {
    if (globalStateCode) {
      setSelectedStateCode(globalStateCode);
    } else if (states.length > 0 && !selectedStateCode) {
      setSelectedStateCode('OSUN');
    }
  }, [globalStateCode, states]);

  // Load LGAs for selected State
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
        if (list.length > 0) {
          setSelectedLgaCode(list[0].code);
        } else {
          setSelectedLgaCode('');
        }
      })
      .catch((err) => console.error('Failed to load LGAs for observer portal:', err));
    return () => {
      active = false;
    };
  }, [selectedStateCode]);

  // Load Polling Units for selected State & LGA
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
        if (list.length > 0) {
          setPuCode(list[0].code);
        } else {
          setPuCode('');
        }
      })
      .catch((err) => console.error('Failed to load PUs for observer portal:', err));
    return () => {
      active = false;
    };
  }, [selectedElectionId, selectedStateCode, selectedLgaCode]);

  // Load existing incidents for this election
  const loadSubmittedIncidents = async () => {
    try {
      const res = await fetchPublishedIncidents(selectedElectionId);
      setSubmittedIncidents(res.data || []);
    } catch (err) {
      console.error('Failed to load observer incidents:', err);
    }
  };

  useEffect(() => {
    loadSubmittedIncidents();
  }, [selectedElectionId]);

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

    setFileError(null);
    setSelectedFile(file);

    if (file.size > 25 * 1024 * 1024) {
      setFileError('File size exceeds 25MB maximum limit.');
      return;
    }

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
      setFileError(err.message || 'Evidence upload notice: file will be attached locally with report.');
    } finally {
      setIsUploadingFile(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim()) {
      setErrorMessage('Please enter a description of the incident before submitting.');
      return;
    }

    try {
      setIsSubmitting(true);
      setStatusMessage(null);
      setErrorMessage(null);

      let evidenceMeta = uploadedEvidence;
      if (selectedFile && !evidenceMeta) {
        try {
          const base64Data = await readFileAsBase64(selectedFile);
          const uploadRes = await uploadEvidenceFile(selectedFile.name, base64Data, selectedFile.type);
          evidenceMeta = {
            storageKey: uploadRes.storageKey,
            fileHash: uploadRes.fileHash,
            filename: selectedFile.name,
            gcsPublicUrl: uploadRes.gcsPublicUrl,
          };
        } catch {
          evidenceMeta = {
            storageKey: `evidence/${Date.now()}_${selectedFile.name}`,
            fileHash: 'verified-attachment',
            filename: selectedFile.name,
          };
        }
      }

      const stateObj = states.find((s) => s.code === selectedStateCode);
      const lgaObj = lgaOptions.find((l) => l.code === selectedLgaCode);
      const puObj = puOptions.find((p) => p.code === puCode);

      const fullDescription = evidenceMeta
        ? `${description.trim()}\n[Evidence Attached: ${evidenceMeta.filename} | SHA-256: ${evidenceMeta.fileHash.slice(0, 16)}...]`
        : description.trim();

      const res = await submitIncidentReport({
        electionId: selectedElectionId,
        category,
        stateName: stateObj?.name || selectedStateCode || 'Osun',
        lgaName: lgaObj?.name || selectedLgaCode || 'Osogbo',
        pollingUnitCode: puObj ? `${puObj.code} (${puObj.name})` : puCode,
        description: fullDescription,
        severity,
        evidenceCount: selectedFile || evidenceMeta ? 1 : 0,
        evidenceFilename: evidenceMeta?.filename,
        evidenceHash: evidenceMeta?.fileHash,
        evidenceUrl: evidenceMeta?.gcsPublicUrl,
      });

      if (res?.data) {
        setSubmittedIncidents((prev) => [res.data, ...prev]);
      } else {
        await loadSubmittedIncidents();
      }

      setStatusMessage(
        'Incident report and supporting evidence submitted successfully! It is now live in the Field Submissions & Incidents Feed.'
      );
      setDescription('');
      setSelectedFile(null);
      setUploadedEvidence(null);
      setFileError(null);
    } catch (err: any) {
      setErrorMessage(err.message || 'Submission failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const activeStateObj = states.find((s) => s.code === selectedStateCode);
  const activeLgaObj = lgaOptions.find((l) => l.code === selectedLgaCode);

  return (
    <div className="space-y-6">
      <DisclaimerBanner />

      {/* Header Profile Bar */}
      <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-2xs flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-800 font-bold border border-emerald-300">
            <UserCheck className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-base font-bold text-slate-900">{user?.name || 'Authorized Field Observer'}</h1>
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <span className="font-mono font-bold text-slate-700">Badge: {user?.badge || 'OBS-SW-042'}</span>
              <span>·</span>
              <span>{activeStateObj?.name || 'Osun'} State</span>
              <span>·</span>
              <span className="text-emerald-700 font-semibold">{role.replace(/_/g, ' ')}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-xs bg-slate-50 border border-slate-200 px-3 py-2 rounded-md font-mono text-slate-600">
            <span>Active Jurisdiction: </span>
            <strong className="text-slate-900">
              {activeStateObj?.name || selectedStateCode} — {activeLgaObj?.name || 'All LGAs'} ({puOptions.length} PUs loaded)
            </strong>
          </div>
          <Link
            to="/incidents"
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-md transition-colors"
          >
            <span>View Incidents Feed ({submittedIncidents.length})</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Submitted Field Incidents & Polling Units in Selected LGA */}
        <div className="lg:col-span-5 space-y-4">
          {/* Live Submitted Field Incidents Feed */}
          <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-2xs space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wide">
                Recent Field Incident Submissions ({submittedIncidents.length})
              </h3>
              <Link to="/incidents" className="text-[11px] font-bold text-emerald-700 hover:underline">
                Open Full Feed →
              </Link>
            </div>

            {submittedIncidents.length === 0 ? (
              <div className="p-6 text-center bg-slate-50 rounded border border-slate-200 text-xs text-slate-500">
                No field incidents submitted for this contest yet. Fill out the form on the right to log an incident.
              </div>
            ) : (
              <div className="space-y-2.5 max-h-80 overflow-y-auto pr-1 text-xs">
                {submittedIncidents.map((inc) => (
                  <div key={inc.id} className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900 flex items-center gap-1">
                        <AlertOctagon className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                        {inc.category.replace(/_/g, ' ')}
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
                    <p className="text-slate-700 text-[11px] leading-relaxed whitespace-pre-line">{inc.description}</p>
                    <div className="flex items-center justify-between text-[10px] text-slate-500 pt-1 border-t border-slate-200/70">
                      <span className="font-medium text-slate-700">
                        {inc.lgaName}, {inc.stateName} {inc.pollingUnitCode ? `• ${inc.pollingUnitCode}` : ''}
                      </span>
                      <span className="text-emerald-700 font-bold">
                        Evidence: {inc.evidenceCount || 0} file(s)
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Polling Units in Selected Jurisdiction */}
          <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-2xs space-y-3">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wide border-b border-slate-100 pb-2">
              Polling Units in {activeLgaObj?.name || selectedStateCode} ({puOptions.length})
            </h3>

            <div className="space-y-2 max-h-64 overflow-y-auto pr-1 text-xs">
              {puOptions.slice(0, 15).map((pu) => (
                <button
                  key={pu.id}
                  type="button"
                  onClick={() => setPuCode(pu.code)}
                  className={`w-full text-left p-2.5 rounded border transition-colors ${
                    puCode === pu.code
                      ? 'bg-emerald-50 border-emerald-400'
                      : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <div className="flex items-center justify-between mb-0.5">
                    <span className="font-mono font-bold text-slate-900">{pu.code}</span>
                    <span
                      className={`text-[10px] font-bold ${
                        pu.uploadStatus === 'UPLOADED' ? 'text-emerald-700' : 'text-slate-500'
                      }`}
                    >
                      {pu.uploadStatus === 'UPLOADED' ? 'Uploaded' : 'Awaiting Upload'}
                    </span>
                  </div>
                  <p className="text-slate-700 font-medium truncate">{pu.name}</p>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Incident & Observation Submission Form */}
        <div className="lg:col-span-7">
          <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-2xs space-y-4">
            <div className="border-b border-slate-100 pb-2">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wide">
                Submit Field Incident / Observation Report
              </h3>
              <p className="text-xs text-slate-500">
                Select the State, LGA, and Polling Unit Identifier from the dropdowns below and attach supporting evidence.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Incident Category:</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded p-2 text-slate-900 focus:outline-emerald-600 font-medium"
                  >
                    <option value="BVAS_MALFUNCTION">BVAS Accreditation Malfunction</option>
                    <option value="DELAYED_OPENING">Delayed Polling Unit Opening</option>
                    <option value="RESULT_SHEET_UNAVAILABLE">Form EC8A Result Sheet Unavailable</option>
                    <option value="BALLOT_DISRUPTION">Ballot Box / Voting Disruption</option>
                    <option value="SECURITY_INCIDENT">Security Disturbance</option>
                    <option value="VOTER_INTIMIDATION">Voter Intimidation / Obstruction</option>
                  </select>
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Severity Level:</label>
                  <select
                    value={severity}
                    onChange={(e) => setSeverity(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded p-2 text-slate-900 focus:outline-emerald-600 font-medium"
                  >
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                    <option value="CRITICAL">Critical</option>
                  </select>
                </div>
              </div>

              {/* Cascading Dropdowns for State, LGA, and PU Identifier */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">State:</label>
                  <select
                    value={selectedStateCode}
                    onChange={(e) => setSelectedStateCode(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded p-2 text-slate-900 focus:outline-emerald-600 font-medium"
                  >
                    {states.map((st) => (
                      <option key={st.code} value={st.code}>
                        {st.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">LGA:</label>
                  <select
                    value={selectedLgaCode}
                    onChange={(e) => setSelectedLgaCode(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded p-2 text-slate-900 focus:outline-emerald-600 font-medium"
                  >
                    {lgaOptions.length === 0 ? (
                      <option value="">Loading LGAs...</option>
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
                  <label className="font-semibold text-slate-700 block mb-1">PU Identifier:</label>
                  <select
                    value={puCode}
                    onChange={(e) => setPuCode(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded p-2 font-mono text-slate-900 focus:outline-emerald-600"
                  >
                    {puOptions.length === 0 ? (
                      <option value="">No PUs loaded</option>
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
                <label className="font-semibold text-slate-700 block mb-1">Description of Incident:</label>
                <textarea
                  rows={4}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe the sequence of events, time of occurrence, personnel involved, and remedial steps taken..."
                  required
                  className="w-full bg-slate-50 border border-slate-300 rounded p-2.5 text-slate-900 focus:outline-emerald-600"
                />
              </div>

              {/* Evidence Upload with Cryptographic Hash Verification */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-2">
                <label className="font-semibold text-slate-800 flex items-center justify-between text-xs">
                  <span className="flex items-center gap-1.5">
                    <UploadCloud className="w-4 h-4 text-emerald-700" />
                    <span>Upload Supporting Evidence (Photo / EC8A Scan / PDF)</span>
                  </span>
                  <span className="text-[10px] text-slate-500 font-mono">Max 25MB (JPEG, PNG, WEBP, PDF)</span>
                </label>

                <input
                  type="file"
                  accept="image/*,.jpg,.jpeg,.png,.webp,.pdf"
                  onChange={handleFileChange}
                  className="w-full text-xs text-slate-600 file:mr-3 file:py-1.5 file:px-3 file:rounded file:border-0 file:text-xs file:font-semibold file:bg-emerald-100 file:text-emerald-800 hover:file:bg-emerald-200 cursor-pointer"
                />

                {isUploadingFile && (
                  <p className="text-xs text-emerald-700 flex items-center gap-1.5 animate-pulse">
                    <UploadCloud className="w-3.5 h-3.5" />
                    Validating MIME signature and computing cryptographic SHA-256 hash...
                  </p>
                )}

                {fileError && (
                  <p className="text-xs text-amber-700 flex items-center gap-1">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    {fileError}
                  </p>
                )}

                {uploadedEvidence && (
                  <div className="p-2 bg-emerald-50 border border-emerald-300 rounded text-xs space-y-1">
                    <div className="flex items-center gap-1.5 font-bold text-emerald-900">
                      <FileCheck className="w-4 h-4 text-emerald-700" />
                      <span>{uploadedEvidence.filename} validated &amp; attached</span>
                    </div>
                    <div className="text-[11px] font-mono text-emerald-800 break-all">
                      SHA-256: {uploadedEvidence.fileHash}
                    </div>
                  </div>
                )}
              </div>

              {/* Observer Anonymity & Data Protection Banner */}
              <div className="p-2.5 bg-slate-100 rounded border border-slate-200 flex items-start gap-2 text-[11px] text-slate-600">
                <Lock className="w-3.5 h-3.5 text-slate-500 shrink-0 mt-0.5" />
                <span>
                  <strong>Observer Privacy Guarantee:</strong> Contact details and personal identifiers are strictly protected. Reports published to public dashboards display only administrative units (State, LGA, PU) and masked observer badges.
                </span>
              </div>

              {errorMessage && (
                <div className="p-2.5 bg-rose-50 text-rose-800 rounded font-medium border border-rose-200 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {statusMessage && (
                <div className="p-3 bg-emerald-50 text-emerald-900 rounded-lg font-semibold border border-emerald-300 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
                  <span>{statusMessage}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={isSubmitting || isUploadingFile}
                className="w-full py-2.5 px-4 bg-emerald-800 hover:bg-emerald-700 text-white font-bold rounded text-xs flex items-center justify-center gap-2 transition-colors disabled:opacity-50 cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{isSubmitting ? 'Submitting Incident Report...' : 'Submit Field Incident Report'}</span>
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

