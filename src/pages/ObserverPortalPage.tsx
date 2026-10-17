import React, { useState } from 'react';
import { UserCheck, Shield, Send, CheckCircle2, AlertTriangle, FileText, MapPin, UploadCloud, FileCheck, Lock } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { submitIncidentReport, uploadEvidenceFile } from '../services/api';
import { DisclaimerBanner } from '../components/DisclaimerBanner';

export const ObserverPortalPage: React.FC = () => {
  const { user, role } = useAuth();

  const [category, setCategory] = useState('BVAS_MALFUNCTION');
  const [stateName, setStateName] = useState('Lagos');
  const [lgaName, setLgaName] = useState('Lagos Island');
  const [puCode, setPuCode] = useState('25-01-01-001');
  const [description, setDescription] = useState('');
  const [severity, setSeverity] = useState('MEDIUM');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  // Evidence upload state
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadedEvidence, setUploadedEvidence] = useState<{
    storageKey: string;
    fileHash: string;
    filename: string;
  } | null>(null);
  const [isUploadingFile, setIsUploadingFile] = useState(false);
  const [fileError, setFileError] = useState<string | null>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileError(null);
    setSelectedFile(file);

    // Size limit 10MB
    if (file.size > 10 * 1024 * 1024) {
      setFileError('File size exceeds 10MB limit.');
      return;
    }

    try {
      setIsUploadingFile(true);
      const reader = new FileReader();
      reader.onload = async () => {
        try {
          const base64Data = (reader.result as string).split(',')[1];
          const uploadRes = await uploadEvidenceFile(file.name, base64Data, file.type);
          setUploadedEvidence({
            storageKey: uploadRes.storageKey,
            fileHash: uploadRes.fileHash,
            filename: file.name,
          });
        } catch (err: any) {
          setFileError(err.message || 'Evidence verification failed.');
        } finally {
          setIsUploadingFile(false);
        }
      };
      reader.readAsDataURL(file);
    } catch (err: any) {
      setFileError(err.message || 'File read failed.');
      setIsUploadingFile(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim()) return;

    try {
      setIsSubmitting(true);
      setStatusMessage(null);
      const fullDescription = uploadedEvidence
        ? `${description}\n[Evidence File: ${uploadedEvidence.filename} | SHA-256: ${uploadedEvidence.fileHash} | Ref: ${uploadedEvidence.storageKey}]`
        : description;

      await submitIncidentReport({
        category,
        stateName,
        lgaName,
        pollingUnitCode: puCode,
        description: fullDescription,
        severity,
      });
      setStatusMessage('Incident and verified evidence submitted. Awaiting coordinator review.');
      setDescription('');
      setSelectedFile(null);
      setUploadedEvidence(null);
    } catch (err: any) {
      setStatusMessage(err.message || 'Submission failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

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
            <h1 className="text-base font-bold text-slate-900">{user?.name}</h1>
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <span className="font-mono font-bold text-slate-700">Badge: {user?.badge}</span>
              <span>·</span>
              <span>{user?.jurisdiction}</span>
              <span>·</span>
              <span className="text-emerald-700 font-semibold">{role.replace(/_/g, ' ')}</span>
            </div>
          </div>
        </div>

        <div className="text-xs bg-slate-50 border border-slate-200 px-3 py-2 rounded-md font-mono text-slate-600">
          <span>Active Assignment: </span>
          <strong className="text-slate-900">Lagos State (2 Polling Units Assigned)</strong>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Assigned Polling Units */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-2xs space-y-3">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wide border-b border-slate-100 pb-2">
              Assigned Field Polling Units
            </h3>

            <div className="space-y-2.5 text-xs">
              <div className="p-3 bg-slate-50 rounded border border-slate-200">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-mono font-bold text-slate-900">25-01-01-001</span>
                  <span className="text-emerald-700 font-bold">Uploaded</span>
                </div>
                <p className="text-slate-700 font-medium">Open Space by Elegbata Jetty Entrance</p>
                <div className="text-[11px] text-slate-500 mt-1">Lagos Island LGA · Olowogbowo Ward</div>
              </div>

              <div className="p-3 bg-slate-50 rounded border border-slate-200">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-mono font-bold text-slate-900">25-01-01-002</span>
                  <span className="text-rose-700 font-bold">Discrepancy Flagged</span>
                </div>
                <p className="text-slate-700 font-medium">St. Paul Primary School Compound (Unit 2)</p>
                <div className="text-[11px] text-slate-500 mt-1">Lagos Island LGA · Olowogbowo Ward</div>
              </div>
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
                Reports undergo verification before publication on the public portal.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Category:</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded p-2 text-slate-900 focus:outline-emerald-600"
                  >
                    <option value="BVAS_MALFUNCTION">BVAS Malfunction</option>
                    <option value="DELAYED_OPENING">Delayed Opening</option>
                    <option value="RESULT_SHEET_UNAVAILABLE">Form EC8A Result Sheet Unavailable</option>
                    <option value="BALLOT_DISRUPTION">Disruption / Ballot Issue</option>
                    <option value="SECURITY_INCIDENT">Security Disturbance</option>
                  </select>
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Severity:</label>
                  <select
                    value={severity}
                    onChange={(e) => setSeverity(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded p-2 text-slate-900 focus:outline-emerald-600"
                  >
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                    <option value="CRITICAL">Critical</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">State:</label>
                  <input
                    type="text"
                    value={stateName}
                    onChange={(e) => setStateName(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded p-2 text-slate-900"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">LGA:</label>
                  <input
                    type="text"
                    value={lgaName}
                    onChange={(e) => setLgaName(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded p-2 text-slate-900"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">PU Identifier:</label>
                  <input
                    type="text"
                    value={puCode}
                    onChange={(e) => setPuCode(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded p-2 font-mono text-slate-900"
                  />
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
                  <span className="text-[10px] text-slate-500 font-mono">Max 10MB (JPEG, PNG, PDF)</span>
                </label>

                <input
                  type="file"
                  accept=".jpg,.jpeg,.png,.pdf"
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
                  <p className="text-xs text-rose-700 flex items-center gap-1">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    {fileError}
                  </p>
                )}

                {uploadedEvidence && (
                  <div className="p-2 bg-emerald-50 border border-emerald-300 rounded text-xs space-y-1">
                    <div className="flex items-center gap-1.5 font-bold text-emerald-900">
                      <FileCheck className="w-4 h-4 text-emerald-700" />
                      <span>{uploadedEvidence.filename} validated & secured</span>
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
                  <strong>Observer Privacy Guarantee:</strong> Contact details and personal identifiers are strictly protected. Reports published to public dashboards display only administrative units (State, LGA) and masked observer badges.
                </span>
              </div>

              {statusMessage && (
                <div className="p-2.5 bg-emerald-50 text-emerald-800 rounded font-medium border border-emerald-200">
                  {statusMessage}
                </div>
              )}

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-2.5 px-4 bg-emerald-800 hover:bg-emerald-700 text-white font-bold rounded text-xs flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Submit Field Incident Report</span>
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};
