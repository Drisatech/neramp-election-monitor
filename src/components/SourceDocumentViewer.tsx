import React, { useState } from 'react';
import { ZoomIn, ZoomOut, RotateCw, Copy, Check, FileCheck, ShieldAlert } from 'lucide-react';
import { ResultSheet } from '../types';

interface Props {
  resultSheet: ResultSheet;
  pollingUnitCode: string;
}

export const SourceDocumentViewer: React.FC<Props> = ({ resultSheet, pollingUnitCode }) => {
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [copiedHash, setCopiedHash] = useState(false);

  const handleCopyHash = () => {
    navigator.clipboard.writeText(resultSheet.fileHash);
    setCopiedHash(true);
    setTimeout(() => setCopiedHash(false), 2000);
  };

  return (
    <div className="bg-white rounded-lg border border-slate-200 overflow-hidden shadow-2xs">
      {/* Header Bar */}
      <div className="p-3 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-900 text-sm">
              Official Form EC8A (Polling Unit Result Sheet)
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
            PU Code: {pollingUnitCode} · Form ID: {resultSheet.id}
          </div>
        </div>

        {/* View Controls */}
        <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-md p-1">
          <button
            onClick={() => setZoom((z) => Math.min(z + 0.25, 2.5))}
            className="p-1 hover:bg-slate-100 rounded text-slate-700"
            title="Zoom In"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <button
            onClick={() => setZoom((z) => Math.max(z - 0.25, 0.75))}
            className="p-1 hover:bg-slate-100 rounded text-slate-700"
            title="Zoom Out"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <button
            onClick={() => setRotation((r) => (r + 90) % 360)}
            className="p-1 hover:bg-slate-100 rounded text-slate-700"
            title="Rotate 90deg"
          >
            <RotateCw className="w-4 h-4" />
          </button>
          <button
            onClick={() => {
              setZoom(1);
              setRotation(0);
            }}
            className="px-2 py-0.5 text-[11px] font-semibold text-slate-600 hover:bg-slate-100 rounded"
          >
            Reset
          </button>
        </div>
      </div>

      {/* Document View Canvas */}
      <div className="relative bg-slate-900 overflow-hidden h-[450px] flex items-center justify-center p-4">
        {resultSheet.imageUrl ? (
          <div
            className="transition-transform duration-200 origin-center cursor-grab active:cursor-grabbing max-h-full max-w-full"
            style={{
              transform: `scale(${zoom}) rotate(${rotation}deg)`,
            }}
          >
            <img
              src={resultSheet.imageUrl}
              alt={`EC8A Result Sheet for PU ${pollingUnitCode}`}
              className="max-h-[420px] object-contain rounded shadow-lg border border-slate-700"
            />
          </div>
        ) : (
          <div className="text-slate-400 text-sm text-center">
            Source document image not loaded.
          </div>
        )}

        {/* Floating Confidence Badge */}
        <div className="absolute bottom-3 left-3 bg-slate-900/90 backdrop-blur-xs text-white border border-slate-700 rounded px-2.5 py-1 text-xs font-mono flex items-center gap-2">
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
      </div>

      {/* Metadata & Provenance Footer */}
      <div className="p-4 bg-slate-50 border-t border-slate-200 text-xs space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 pb-2">
          <div className="flex items-center gap-2 text-slate-600">
            <span className="font-semibold text-slate-800">Document Checksum (SHA-256):</span>
            <code className="font-mono text-[11px] text-slate-700 bg-white px-1.5 py-0.5 rounded border border-slate-200">
              {resultSheet.fileHash.substring(0, 24)}...
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
