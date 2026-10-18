import React, { useEffect, useState } from 'react';
import {
  HardDrive,
  Database,
  Search,
  Trash2,
  Edit3,
  ExternalLink,
  Eye,
  RefreshCw,
  FileText,
  AlertTriangle,
  CheckCircle2,
  Copy,
  Check,
  Server,
  Cloud,
  FileSpreadsheet,
  X,
  Save,
} from 'lucide-react';
import {
  fetchStorageSummary,
  fetchStorageFiles,
  deleteStorageFile,
  editStorageFile,
} from '../services/api';

interface StorageMetrics {
  storageBucket: {
    bucketName: string;
    cloudProvider: string;
    cloudStorageBucketUri: string;
    cloudConsoleUrl: string;
    cloudSqlConsoleUrl: string;
    containerMountPath: string;
    publicCachePath: string;
    region: string;
    accessInstructions: string;
  };
  metrics: {
    totalFilesTracked: number;
    totalStorageUsedMb: number;
    allocatedStorageGb: number;
    usedPercentage: number;
    breakdown: Array<{
      type: string;
      count: number;
      sizeMb: number;
      location: string;
    }>;
  };
}

interface StoredFileItem {
  id: string;
  fileType: string;
  title: string;
  pollingUnitCode: string;
  pollingUnitName: string;
  stateCode: string;
  lgaCode: string;
  wardCode: string;
  fileHash: string;
  imageUrl: string;
  sourceUrl: string;
  sizeBytes: number;
  mimeType: string;
  uploadTimestamp: string;
  retrievalTimestamp: string;
  version: number;
  sourceStatus: string;
  ocrConfidence: number;
  verifiedStatus: string;
  verifiedBy?: string;
  validVotes?: number;
  partyVotes?: Record<string, number>;
  serialNumber?: string;
  presidingOfficer?: string;
  arithmeticPassed?: boolean;
}

export const StorageContentManagementTab: React.FC = () => {
  const [summary, setSummary] = useState<StorageMetrics | null>(null);
  const [files, setFiles] = useState<StoredFileItem[]>([]);
  const [totalFiles, setTotalFiles] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState('ALL');
  const [selectedStatus, setSelectedStatus] = useState('');

  // Modals
  const [previewFile, setPreviewFile] = useState<StoredFileItem | null>(null);
  const [editFile, setEditFile] = useState<StoredFileItem | null>(null);
  const [deleteCandidate, setDeleteCandidate] = useState<StoredFileItem | null>(null);
  const [copiedHash, setCopiedHash] = useState<string | null>(null);

  // Edit form state
  const [editPresidingOfficer, setEditPresidingOfficer] = useState('');
  const [editSerialNumber, setEditSerialNumber] = useState('');
  const [editVerifierNotes, setEditVerifierNotes] = useState('');
  const [editValidVotes, setEditValidVotes] = useState<number | ''>('');
  const [isSubmittingEdit, setIsSubmittingEdit] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [actionSuccessNotice, setActionSuccessNotice] = useState<string | null>(null);

  const loadData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [sumRes, filesRes] = await Promise.all([
        fetchStorageSummary(),
        fetchStorageFiles({
          search: searchQuery || undefined,
          type: selectedType !== 'ALL' ? selectedType : undefined,
          status: selectedStatus || undefined,
          limit: 100,
        }),
      ]);
      setSummary(sumRes.data);
      setFiles(filesRes.data || []);
      setTotalFiles(filesRes.pagination?.total || 0);
    } catch (err: any) {
      console.error('[STORAGE CMS] Failed to load data:', err);
      setError(err.message || 'Failed to connect to storage service.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedType, selectedStatus]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadData();
  };

  const handleCopyHash = (hash: string) => {
    navigator.clipboard.writeText(hash);
    setCopiedHash(hash);
    setTimeout(() => setCopiedHash(null), 2500);
  };

  const openEditModal = (file: StoredFileItem) => {
    setEditFile(file);
    setEditPresidingOfficer(file.presidingOfficer || '');
    setEditSerialNumber(file.serialNumber || '');
    setEditVerifierNotes('');
    setEditValidVotes(file.validVotes ?? '');
  };

  const handleSaveEdit = async () => {
    if (!editFile) return;
    try {
      setIsSubmittingEdit(true);
      await editStorageFile(editFile.id, {
        presidingOfficerName: editPresidingOfficer,
        serialNumber: editSerialNumber,
        verifierNotes: editVerifierNotes || undefined,
        validVotes: editValidVotes !== '' ? Number(editValidVotes) : undefined,
      });
      setActionSuccessNotice(`Metadata for ${editFile.pollingUnitCode} updated successfully.`);
      setEditFile(null);
      await loadData();
      setTimeout(() => setActionSuccessNotice(null), 4000);
    } catch (err: any) {
      alert(`Update failed: ${err.message}`);
    } finally {
      setIsSubmittingEdit(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteCandidate) return;
    try {
      setIsDeleting(true);
      await deleteStorageFile(deleteCandidate.id);
      setActionSuccessNotice(`Result Sheet ${deleteCandidate.id} (${deleteCandidate.pollingUnitCode}) deleted from storage.`);
      setDeleteCandidate(null);
      await loadData();
      setTimeout(() => setActionSuccessNotice(null), 4000);
    } catch (err: any) {
      alert(`Delete failed: ${err.message}`);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Refresh */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 bg-emerald-50 text-emerald-800 rounded-lg">
              <HardDrive className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Content Management & Storage Explorer</h2>
              <p className="text-xs text-slate-500">
                Track storage capacity, inspect uploaded INEC Form EC8A result sheets, manage metadata, and view Cloud SQL & GCS bucket assets.
              </p>
            </div>
          </div>
        </div>
        <button
          onClick={loadData}
          disabled={isLoading}
          className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition-colors"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          <span>Refresh Storage</span>
        </button>
      </div>

      {actionSuccessNotice && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-xs font-semibold text-emerald-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>{actionSuccessNotice}</span>
          </div>
          <button onClick={() => setActionSuccessNotice(null)}>
            <X className="w-4 h-4 text-emerald-500 hover:text-emerald-800" />
          </button>
        </div>
      )}

      {/* Storage Architecture & Access Guide Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Card 1: Cloud Storage Bucket (GCS) */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-slate-900 font-bold text-xs uppercase tracking-wider">
              <Cloud className="w-4 h-4 text-sky-600" />
              <span>Google Cloud Storage (GCS)</span>
            </div>
            <span className="text-[10px] font-mono font-bold bg-sky-50 text-sky-800 px-2 py-0.5 rounded">
              Active Bucket
            </span>
          </div>
          <div className="space-y-1.5 text-xs">
            <div className="flex justify-between py-1 border-b border-slate-100">
              <span className="text-slate-500">Bucket Name:</span>
              <span className="font-mono font-semibold text-slate-800">
                {summary?.storageBucket.bucketName || 'neramp-election-monitor-artifacts'}
              </span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-100">
              <span className="text-slate-500">URI Protocol:</span>
              <span className="font-mono text-[11px] text-emerald-700">
                {summary?.storageBucket.cloudStorageBucketUri || 'gs://neramp-election-monitor-artifacts'}
              </span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-100">
              <span className="text-slate-500">Cloud Region:</span>
              <span className="font-medium text-slate-700">europe-west1 / us-central1</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-slate-500">Container Path:</span>
              <span className="font-mono text-slate-700">/app/data & /app/public</span>
            </div>
          </div>
          <div className="pt-2">
            <a
              href="https://console.cloud.google.com/storage/browser"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-1.5 w-full py-1.5 px-3 bg-sky-50 hover:bg-sky-100 text-sky-700 text-xs font-semibold rounded-md transition-colors"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Open GCS Bucket Console</span>
            </a>
          </div>
        </div>

        {/* Card 2: Google Cloud SQL (Relational DB) */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-slate-900 font-bold text-xs uppercase tracking-wider">
              <Database className="w-4 h-4 text-indigo-600" />
              <span>Google Cloud SQL</span>
            </div>
            <span className="text-[10px] font-mono font-bold bg-indigo-50 text-indigo-800 px-2 py-0.5 rounded">
              PostgreSQL 16
            </span>
          </div>
          <div className="space-y-1.5 text-xs">
            <div className="flex justify-between py-1 border-b border-slate-100">
              <span className="text-slate-500">Engine / Schema:</span>
              <span className="font-semibold text-slate-800">PostgreSQL / Drizzle ORM</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-100">
              <span className="text-slate-500">Relational Tables:</span>
              <span className="font-mono font-semibold text-slate-800">polling_units, result_sheets</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-100">
              <span className="text-slate-500">Query Studio:</span>
              <span className="text-indigo-700 font-medium">GCP Cloud SQL Studio</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-slate-500">Audit Logs:</span>
              <span className="font-semibold text-emerald-700">Cryptographic Hash Chained</span>
            </div>
          </div>
          <div className="pt-2">
            <a
              href="https://console.cloud.google.com/sql/instances"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-1.5 w-full py-1.5 px-3 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-semibold rounded-md transition-colors"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Open Cloud SQL Studio</span>
            </a>
          </div>
        </div>

        {/* Card 3: Storage Meter & Breakdown */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-slate-900 font-bold text-xs uppercase tracking-wider">
              <Server className="w-4 h-4 text-emerald-700" />
              <span>Storage Quota & Utilization</span>
            </div>
            <span className="text-[11px] font-mono font-bold text-emerald-800">
              {summary ? `${summary.metrics.totalStorageUsedMb} MB` : 'Calculating...'}
            </span>
          </div>

          <div>
            <div className="flex justify-between text-xs text-slate-600 mb-1">
              <span>Allocated Quota: 100 GB</span>
              <span className="font-bold text-slate-900">
                {summary ? `${summary.metrics.usedPercentage}%` : '0%'}
              </span>
            </div>
            <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
              <div
                className="bg-emerald-600 h-2.5 rounded-full transition-all duration-500"
                style={{ width: `${Math.min(summary?.metrics.usedPercentage || 1, 100)}%` }}
              />
            </div>
          </div>

          <div className="text-[11px] space-y-1 text-slate-600 pt-1">
            <div className="flex justify-between">
              <span>Result Sheet Scans:</span>
              <span className="font-mono font-medium">
                {summary?.metrics.breakdown[0]?.count || files.length} files ({summary?.metrics.breakdown[0]?.sizeMb || 0} MB)
              </span>
            </div>
            <div className="flex justify-between">
              <span>Gemini OCR JSONs:</span>
              <span className="font-mono font-medium">
                {summary?.metrics.breakdown[1]?.count || 0} cached ({summary?.metrics.breakdown[1]?.sizeMb || 0} MB)
              </span>
            </div>
            <div className="flex justify-between">
              <span>Observer Evidence:</span>
              <span className="font-mono font-medium">
                {summary?.metrics.breakdown[2]?.count || 0} items ({summary?.metrics.breakdown[2]?.sizeMb || 0} MB)
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Direct Answers & Guidance Panel */}
      <div className="bg-slate-900 text-slate-200 p-5 rounded-xl border border-slate-800 shadow-sm space-y-4">
        <h3 className="text-sm font-bold text-white flex items-center gap-2">
          <FileText className="w-4 h-4 text-emerald-400" />
          <span>Storage & Cloud Infrastructure Architecture FAQ</span>
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-slate-300">
          <div className="p-3 bg-slate-800/80 rounded-lg border border-slate-700/60 space-y-1.5">
            <div className="font-semibold text-emerald-300">1. Where are the result sheet files stored?</div>
            <p className="leading-relaxed text-slate-300">
              INEC portal files are pulled from INEC’s S3/CDN cache (<code>inc-s3-cache.incportals.com</code>). 
              In NERAMP, their cryptographic SHA-256 hashes, metadata, and OCR transcriptions are saved to the persistent store 
              (<code>/app/public/ocr-transcription-cache.json</code>, <code>/app/data</code>, and Cloud SQL).
            </p>
          </div>
          <div className="p-3 bg-slate-800/80 rounded-lg border border-slate-700/60 space-y-1.5">
            <div className="font-semibold text-emerald-300">2. How to access Google Cloud Storage vs Cloud SQL?</div>
            <p className="leading-relaxed text-slate-300">
              <strong>Cloud Storage Buckets:</strong> Open{' '}
              <a href="https://console.cloud.google.com/storage/browser" target="_blank" rel="noreferrer" className="text-sky-400 underline">
                Storage Browser
              </a>{' '}
              or run <code>gcloud storage ls gs://&lt;bucket&gt;</code>.<br />
              <strong>Cloud SQL Database:</strong> Open GCP SQL &gt; Cloud SQL Studio to view relational tables and execute SQL <code>SELECT</code>/<code>UPDATE</code>.
            </p>
          </div>
          <div className="p-3 bg-slate-800/80 rounded-lg border border-slate-700/60 space-y-1.5">
            <div className="font-semibold text-emerald-300">3. How to track storage usage in the CMS?</div>
            <p className="leading-relaxed text-slate-300">
              The storage breakdown meter above dynamically aggregates EC8A photo payloads, OCR JSON caches, observer incident evidence, 
              and database records. You can also view, edit metadata, or delete files directly from the table below!
            </p>
          </div>
        </div>
      </div>

      {/* Content Management System (CMS) File Explorer */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        {/* Controls Bar */}
        <div className="p-4 border-b border-slate-200 bg-slate-50/50 flex flex-col md:flex-row items-center justify-between gap-3">
          <form onSubmit={handleSearchSubmit} className="relative w-full md:w-96">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by PU code, name, hash, serial #..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-1.5 text-xs bg-white border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-700 focus:border-transparent"
            />
          </form>

          <div className="flex items-center gap-2 w-full md:w-auto">
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-md text-slate-700 font-medium"
            >
              <option value="ALL">All File Types</option>
              <option value="EC8A_RESULT_SHEET">Form EC8A Result Sheets</option>
              <option value="OBSERVER_EVIDENCE">Observer Incident Evidence</option>
            </select>

            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-md text-slate-700 font-medium"
            >
              <option value="">All Verification States</option>
              <option value="VERIFIED">Verified</option>
              <option value="PENDING_VERIFICATION">Pending Verification</option>
              <option value="DISCREPANCY_FLAGGED">Discrepancy Flagged</option>
            </select>
          </div>
        </div>

        {/* Files Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-100 text-slate-700 uppercase font-bold text-[10px] tracking-wider border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Document / PU Code</th>
                <th className="py-3 px-4">Location</th>
                <th className="py-3 px-4">SHA-256 Hash</th>
                <th className="py-3 px-4">Size & Type</th>
                <th className="py-3 px-4">Metadata / Stats</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {files.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <FileSpreadsheet className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                    <p className="font-semibold">No files match your query in storage</p>
                    <p className="text-[11px] mt-1 text-slate-400">
                      Run the Ingestion pipeline to retrieve live Form EC8A result sheets.
                    </p>
                  </td>
                </tr>
              ) : (
                files.map((file) => (
                  <tr key={file.id} className="hover:bg-slate-50/80 transition-colors">
                    {/* Document / PU Code */}
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-900 font-mono">{file.pollingUnitCode}</div>
                      <div className="text-[11px] text-slate-500 truncate max-w-xs">{file.pollingUnitName}</div>
                      <div className="text-[10px] text-slate-400 mt-0.5 font-mono">{file.id}</div>
                    </td>

                    {/* Location */}
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-800">{file.stateCode}</div>
                      <div className="text-[11px] text-slate-500">LGA: {file.lgaCode}</div>
                      <div className="text-[10px] text-slate-400">Ward: {file.wardCode}</div>
                    </td>

                    {/* SHA-256 Hash */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1.5 font-mono text-[11px] text-slate-600 bg-slate-100 px-2 py-0.5 rounded w-fit">
                        <span>{file.fileHash ? `${file.fileHash.slice(0, 10)}...` : 'N/A'}</span>
                        <button
                          onClick={() => handleCopyHash(file.fileHash)}
                          title="Copy full SHA-256 hash"
                          className="text-slate-400 hover:text-slate-700"
                        >
                          {copiedHash === file.fileHash ? (
                            <Check className="w-3 h-3 text-emerald-600" />
                          ) : (
                            <Copy className="w-3 h-3" />
                          )}
                        </button>
                      </div>
                    </td>

                    {/* Size & Type */}
                    <td className="py-3 px-4">
                      <div className="font-medium text-slate-800">
                        {(file.sizeBytes / (1024 * 1024)).toFixed(2)} MB
                      </div>
                      <div className="text-[10px] text-slate-400 uppercase font-mono">{file.mimeType}</div>
                    </td>

                    {/* Metadata / Stats */}
                    <td className="py-3 px-4">
                      <div className="text-[11px]">
                        <span className="text-slate-400">PO:</span>{' '}
                        <span className="font-medium text-slate-700">{file.presidingOfficer || 'Not recorded'}</span>
                      </div>
                      <div className="text-[11px]">
                        <span className="text-slate-400">Serial:</span>{' '}
                        <span className="font-mono text-slate-700">{file.serialNumber || 'N/A'}</span>
                      </div>
                      <div className="text-[11px]">
                        <span className="text-slate-400">Valid Votes:</span>{' '}
                        <span className="font-semibold text-emerald-800">{file.validVotes ?? 0}</span>
                      </div>
                    </td>

                    {/* Status */}
                    <td className="py-3 px-4">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          file.verifiedStatus === 'VERIFIED'
                            ? 'bg-emerald-100 text-emerald-800'
                            : file.verifiedStatus === 'DISCREPANCY_FLAGGED'
                            ? 'bg-rose-100 text-rose-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {file.verifiedStatus.replace('_', ' ')}
                      </span>
                      {file.ocrConfidence > 0 && (
                        <div className="text-[10px] text-slate-400 mt-0.5">
                          OCR: {file.ocrConfidence.toFixed(1)}%
                        </div>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => setPreviewFile(file)}
                          title="View / Inspect Document"
                          className="p-1.5 bg-slate-100 hover:bg-emerald-50 text-slate-600 hover:text-emerald-700 rounded transition-colors"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => openEditModal(file)}
                          title="Edit Document Metadata"
                          className="p-1.5 bg-slate-100 hover:bg-sky-50 text-slate-600 hover:text-sky-700 rounded transition-colors"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setDeleteCandidate(file)}
                          title="Delete File from Storage"
                          className="p-1.5 bg-slate-100 hover:bg-rose-50 text-slate-600 hover:text-rose-700 rounded transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Footer info */}
        <div className="p-3 bg-slate-50 border-t border-slate-200 text-xs text-slate-500 flex justify-between items-center">
          <span>Showing {files.length} of {totalFiles} stored documents</span>
          <span className="font-mono text-[11px]">Audit Protected Storage Layer</span>
        </div>
      </div>

      {/* MODAL 1: Document Preview Modal */}
      {previewFile && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col overflow-hidden border border-slate-200">
            <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Form EC8A Result Sheet — {previewFile.pollingUnitCode}
                </h3>
                <p className="text-xs text-slate-500">{previewFile.pollingUnitName}</p>
              </div>
              <button
                onClick={() => setPreviewFile(null)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 overflow-y-auto flex-1 space-y-4">
              <div className="aspect-[4/3] bg-slate-900 rounded-lg overflow-hidden flex items-center justify-center border border-slate-200">
                {previewFile.imageUrl ? (
                  <img
                    src={previewFile.imageUrl.startsWith('http') ? `/api/v1/proxy/image?url=${encodeURIComponent(previewFile.imageUrl)}` : previewFile.imageUrl}
                    alt={previewFile.title}
                    className="max-h-full max-w-full object-contain"
                  />
                ) : (
                  <div className="text-slate-400 text-xs">No image scan available</div>
                )}
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                <div className="p-2.5 bg-slate-50 rounded border border-slate-200">
                  <div className="text-slate-400 text-[10px] uppercase font-bold">Presiding Officer</div>
                  <div className="font-medium text-slate-800 mt-0.5">{previewFile.presidingOfficer || 'N/A'}</div>
                </div>
                <div className="p-2.5 bg-slate-50 rounded border border-slate-200">
                  <div className="text-slate-400 text-[10px] uppercase font-bold">Serial Number</div>
                  <div className="font-mono font-medium text-slate-800 mt-0.5">{previewFile.serialNumber || 'N/A'}</div>
                </div>
                <div className="p-2.5 bg-slate-50 rounded border border-slate-200">
                  <div className="text-slate-400 text-[10px] uppercase font-bold">Valid Votes</div>
                  <div className="font-bold text-emerald-800 mt-0.5">{previewFile.validVotes ?? 0}</div>
                </div>
                <div className="p-2.5 bg-slate-50 rounded border border-slate-200">
                  <div className="text-slate-400 text-[10px] uppercase font-bold">Source URL</div>
                  <a
                    href={previewFile.sourceUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="font-mono text-emerald-700 underline truncate block mt-0.5 text-[11px]"
                  >
                    Open Source CDN
                  </a>
                </div>
              </div>
            </div>

            <div className="p-3 bg-slate-50 border-t border-slate-200 flex justify-end">
              <button
                onClick={() => setPreviewFile(null)}
                className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-semibold rounded-lg"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: Edit Metadata Modal */}
      {editFile && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-200">
            <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2">
                <Edit3 className="w-4 h-4 text-emerald-700" />
                <h3 className="text-sm font-bold text-slate-900">
                  Edit File Metadata ({editFile.pollingUnitCode})
                </h3>
              </div>
              <button onClick={() => setEditFile(null)} className="p-1 text-slate-400 hover:text-slate-700">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-700 font-bold mb-1">Presiding Officer Name</label>
                <input
                  type="text"
                  value={editPresidingOfficer}
                  onChange={(e) => setEditPresidingOfficer(e.target.value)}
                  placeholder="e.g. Adebayo Olumide"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Form EC8A Serial Number</label>
                <input
                  type="text"
                  value={editSerialNumber}
                  onChange={(e) => setEditSerialNumber(e.target.value)}
                  placeholder="e.g. SN-EC8A-2026-90412"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Total Valid Votes</label>
                <input
                  type="number"
                  value={editValidVotes}
                  onChange={(e) => setEditValidVotes(e.target.value === '' ? '' : Number(e.target.value))}
                  placeholder="e.g. 215"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Administrative Audit Reason / Notes</label>
                <textarea
                  rows={2}
                  value={editVerifierNotes}
                  onChange={(e) => setEditVerifierNotes(e.target.value)}
                  placeholder="Reason for modifying metadata in storage..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                />
              </div>
            </div>

            <div className="p-3 bg-slate-50 border-t border-slate-200 flex justify-end gap-2">
              <button
                onClick={() => setEditFile(null)}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveEdit}
                disabled={isSubmittingEdit}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-semibold rounded-lg"
              >
                <Save className="w-3.5 h-3.5" />
                <span>{isSubmittingEdit ? 'Saving...' : 'Save Updates'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: Delete Confirmation Modal */}
      {deleteCandidate && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-200">
            <div className="p-4 border-b border-slate-200 bg-rose-50 flex items-center gap-2 text-rose-800">
              <AlertTriangle className="w-5 h-5" />
              <h3 className="text-sm font-bold">Confirm Document Deletion</h3>
            </div>
            <div className="p-5 text-xs text-slate-600 space-y-2">
              <p>
                Are you sure you want to delete result sheet file{' '}
                <strong className="text-slate-900 font-mono">{deleteCandidate.id}</strong> (
                {deleteCandidate.pollingUnitCode})?
              </p>
              <p className="text-slate-500">
                This will remove the file from active storage and reset the Polling Unit's verification status. An
                audit log record will be generated.
              </p>
            </div>
            <div className="p-3 bg-slate-50 border-t border-slate-200 flex justify-end gap-2">
              <button
                onClick={() => setDeleteCandidate(null)}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDelete}
                disabled={isDeleting}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-rose-700 hover:bg-rose-800 text-white text-xs font-semibold rounded-lg"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>{isDeleting ? 'Deleting...' : 'Confirm Delete'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
