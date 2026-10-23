import React, { useState } from 'react';
import {
  ZoomIn,
  ZoomOut,
  RotateCw,
  Copy,
  Check,
  FileCheck,
  ShieldAlert,
  Sparkles,
  RefreshCw,
  ExternalLink,
  Layers,
  UserCheck,
} from 'lucide-react';
import { ResultSheet } from '../types';
import { triggerOcrTranscription } from '../services/api';

interface Props {
  resultSheet: ResultSheet;
  pollingUnitCode: string;
  onRefreshOcr?: () => void;
}

export const SourceDocumentViewer: React.FC<Props> = ({ resultSheet, pollingUnitCode, onRefreshOcr }) => {
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [copiedHash, setCopiedHash] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [ocrMessage, setOcrMessage] = useState<string | null>(null);

  const handleCopyHash = () => {
    navigator.clipboard.writeText(resultSheet.fileHash);
    setCopiedHash(true);
    setTimeout(() => setCopiedHash(false), 2000);
  };

  const handleRunOcr = async () => {
    try {
      setIsTranscribing(true);
      setOcrMessage(null);
      await triggerOcrTranscription(resultSheet.id, true);
      setOcrMessage('Transcribed successfully via AI OCR!');
      if (onRefreshOcr) onRefreshOcr();
    } catch (err: any) {
      const msg = err.message || 'OCR transcription failed';
      setOcrMessage(msg.startsWith('OCR') || msg.startsWith('Gemini') ? msg : `OCR error: ${msg}`);
    } finally {
      setIsTranscribing(false);
    }
  };

  const [hasImgError, setHasImgError] = useState(false);

  // Prioritize direct base64 data URL if available, then local API endpoint, then proxy
  const displayImgUrl = (() => {
    if (resultSheet.imageDataUrl) return resultSheet.imageDataUrl;
    if (!resultSheet.imageUrl) return `/api/v1/result-sheets/${resultSheet.id}/image`;
    if (resultSheet.imageUrl.startsWith('data:')) return resultSheet.imageUrl;
    if (resultSheet.imageUrl.startsWith('/api/')) return resultSheet.imageUrl;
    if (resultSheet.imageUrl.startsWith('http')) {
      return `/api/v1/proxy-ec8a-image?url=${encodeURIComponent(resultSheet.imageUrl)}`;
    }
    return `/api/v1/result-sheets/${resultSheet.id}/image`;
  })();

  const isPdf = resultSheet.imageUrl?.toLowerCase().includes('.pdf') || resultSheet.sourceUrl?.toLowerCase().includes('.pdf');
  const bStats = resultSheet.ballotStatistics;

  return (
    <div className="bg-white rounded-lg border border-slate-200 overflow-hidden shadow-2xs space-y-0">
      {/* Header Bar */}
      <div className="p-3 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
              <FileCheck className="w-4 h-4 text-emerald-700" />
              <span>Official Form EC8A (PU Result Sheet)</span>
            </span>
            <span className="text-[11px] font-mono bg-slate-200 text-slate-800 px-1.5 py-0.5 rounded">
              v{resultSheet.version} ({resultSheet.sourceStatus})
            </span>
            {resultSheet.isConfidential && (
              <span className="text-[10px] font-mono bg-rose-100 text-rose-800 border border-rose-200 px-1.5 py-0.5 rounded flex items-center gap-1 font-bold">
                <ShieldAlert className="w-3 h-3 text-rose-600" />
                RESTRICTED EVIDENCE · AUTHORISED ONLY
              </span>
            )}
          </div>
          <div className="text-xs text-slate-500 font-mono mt-0.5">
            PU Code: <strong>{pollingUnitCode}</strong> · Form ID: {resultSheet.id}
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* AI OCR Transcription Trigger */}
          <button
            onClick={handleRunOcr}
            disabled={isTranscribing}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-gradient-to-r from-emerald-700 to-teal-800 hover:from-emerald-800 hover:to-teal-900 text-white rounded text-xs font-bold transition-all shadow-2xs disabled:opacity-50 cursor-pointer"
            title="Transcribe handwritten numbers and party scores with AI OCR"
          >
            {isTranscribing ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            )}
            <span>{isTranscribing ? 'Transcribing...' : 'Run AI OCR'}</span>
          </button>

          {/* View Zoom & Rotate Controls */}
          <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-md p-1">
            <button
              onClick={() => setZoom((z) => Math.min(z + 0.25, 2.5))}
              className="p-1 hover:bg-slate-100 rounded text-slate-700 cursor-pointer"
              title="Zoom In"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
            <button
              onClick={() => setZoom((z) => Math.max(z - 0.25, 0.75))}
              className="p-1 hover:bg-slate-100 rounded text-slate-700 cursor-pointer"
              title="Zoom Out"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <button
              onClick={() => setRotation((r) => (r + 90) % 360)}
              className="p-1 hover:bg-slate-100 rounded text-slate-700 cursor-pointer"
              title="Rotate 90deg"
            >
              <RotateCw className="w-4 h-4" />
            </button>
            <button
              onClick={() => {
                setZoom(1);
                setRotation(0);
              }}
              className="px-2 py-0.5 text-[11px] font-semibold text-slate-600 hover:bg-slate-100 rounded cursor-pointer"
            >
              Reset
            </button>
          </div>
        </div>
      </div>

      {/* OCR Status Notification Banner if triggered */}
      {ocrMessage && (
        <div className={`p-2 px-3 text-xs font-semibold flex flex-wrap items-center justify-between gap-2 ${
          ocrMessage.includes('error') || ocrMessage.includes('limit') || ocrMessage.includes('quota')
            ? 'bg-rose-50 text-rose-800 border-b border-rose-200'
            : 'bg-emerald-50 text-emerald-800 border-b border-emerald-200'
        }`}>
          <div className="flex items-center gap-2 flex-wrap">
            <span>{ocrMessage}</span>
            {(ocrMessage.includes('error') || ocrMessage.includes('limit') || ocrMessage.includes('quota')) && (
              <button
                type="button"
                onClick={() => window.dispatchEvent(new CustomEvent('open-ai-ocr-settings'))}
                className="underline font-bold text-rose-900 hover:text-rose-950 ml-1 cursor-pointer"
              >
                Configure OCR / API Key &rarr;
              </button>
            )}
          </div>
          <button onClick={() => setOcrMessage(null)} className="text-slate-400 hover:text-slate-600 text-sm cursor-pointer">×</button>
        </div>
      )}

      {/* Document View Canvas */}
      <div className="relative bg-slate-900 overflow-hidden min-h-[460px] h-[520px] flex items-center justify-center p-3 select-none">
        {isPdf ? (
          <iframe
            src={displayImgUrl}
            title={`PDF Result Sheet ${pollingUnitCode}`}
            className="w-full h-full rounded border border-slate-700 bg-white"
          />
        ) : (
          <div
            className="transition-transform duration-200 origin-center cursor-grab active:cursor-grabbing max-h-full max-w-full flex items-center justify-center"
            style={{
              transform: `scale(${zoom}) rotate(${rotation}deg)`,
            }}
          >
            <img
              src={hasImgError ? `/api/v1/result-sheets/${resultSheet.id}/image` : displayImgUrl}
              alt={`EC8A Result Sheet for PU ${pollingUnitCode}`}
              className="max-h-[480px] max-w-full object-contain rounded shadow-lg border border-slate-700"
              loading="eager"
              onError={() => {
                if (!hasImgError) {
                  setHasImgError(true);
                }
              }}
            />
          </div>
        )}

        {/* Floating Confidence Badge & External Link */}
        <div className="absolute bottom-3 left-3 flex items-center gap-2">
          <div className="bg-slate-900/90 backdrop-blur-xs text-white border border-slate-700 rounded px-2.5 py-1 text-xs font-mono flex items-center gap-2 shadow-md">
            <span>OCR Confidence:</span>
            <span
              className={`font-bold ${
                resultSheet.ocrConfidence >= 90
                  ? 'text-emerald-400'
                  : resultSheet.ocrConfidence >= 75
                  ? 'text-amber-400'
                  : 'text-rose-400'
              }`}
            >
              {resultSheet.ocrConfidence}%
            </span>
          </div>

          {resultSheet.imageUrl?.startsWith('http') && (
            <a
              href={resultSheet.imageUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-slate-900/90 hover:bg-slate-800 text-slate-200 border border-slate-700 rounded px-2 py-1 text-xs font-sans flex items-center gap-1 shadow-md transition-colors"
              title="Open raw scan in new window"
            >
              <span>Full Screen</span>
              <ExternalLink className="w-3 h-3 text-slate-400" />
            </a>
          )}
        </div>
      </div>

      {/* Extracted Form EC8A Header Metadata if available */}
      {bStats && (
        <div className="p-3 bg-emerald-50/70 border-t border-emerald-200 text-xs text-emerald-950 grid grid-cols-2 sm:grid-cols-4 gap-2">
          <div>
            <span className="text-[10px] uppercase font-bold text-emerald-800 block">Form S/N</span>
            <span className="font-mono font-bold">{bStats.serialNumber || 'Recorded on Form'}</span>
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-emerald-800 block">Election Date</span>
            <span className="font-semibold">{bStats.electionDateOnForm || '2026-08-15'}</span>
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-emerald-800 block">Presiding Officer</span>
            <span className="font-semibold truncate block">{bStats.presidingOfficerName || 'Certified on EC8A'}</span>
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-emerald-800 block">Used Ballots (#8)</span>
            <span className="font-mono font-bold">{bStats.totalUsedBallots ?? (bStats.validVotes + bStats.rejectedVotes)}</span>
          </div>
        </div>
      )}

      {/* Metadata & Cryptographic Provenance Footer */}
      <div className="p-4 bg-slate-50 border-t border-slate-200 text-xs space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 pb-2">
          <div className="flex items-center gap-2 text-slate-600 flex-wrap">
            <span className="font-semibold text-slate-800">Document Checksum (SHA-256):</span>
            <code className="font-mono text-[11px] text-slate-700 bg-white px-1.5 py-0.5 rounded border border-slate-200">
              {resultSheet.fileHash?.substring(0, 24)}...
            </code>
            <button
              onClick={handleCopyHash}
              className="p-1 hover:text-emerald-800 text-slate-500 transition-colors"
              title="Copy full SHA-256 hash"
            >
              {copiedHash ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          </div>
          <div className="text-slate-500 font-mono text-[11px]">
            Portal Source Upload: {new Date(resultSheet.uploadTimestamp).toUTCString()}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-slate-600 text-[11px]">
          <div>
            <span className="font-semibold text-slate-800">Platform Ingestion Timestamp:</span>{' '}
            {new Date(resultSheet.retrievalTimestamp).toUTCString()}
          </div>
          <div>
            <span className="font-semibold text-slate-800">Source Document Link:</span>{' '}
            <span className="underline truncate block max-w-xs">{resultSheet.sourceUrl}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
