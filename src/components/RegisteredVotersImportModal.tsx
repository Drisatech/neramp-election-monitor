import React, { useState } from 'react';
import { Upload, FileSpreadsheet, CheckCircle2, AlertTriangle, X } from 'lucide-react';
import * as XLSX from 'xlsx';
import { importRegisteredVotersFile } from '../services/api';
import { useElection } from '../context/ElectionContext';

interface Props {
  onSuccess?: () => void;
}

interface PreviewRow {
  state: string;
  registeredVoters: number;
  pvcsCollected?: number;
  pvcCollectionRate?: number;
  totalPus?: number;
  totalWards?: number;
  totalLgas?: number;
}

export const RegisteredVotersImportModal: React.FC<Props> = ({ onSuccess }) => {
  const { refreshGeography } = useElection();
  const [isOpen, setIsOpen] = useState(false);
  const [fileName, setFileName] = useState<string>('');
  const [fileBase64, setFileBase64] = useState<string>('');
  const [previewRows, setPreviewRows] = useState<PreviewRow[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const parseNumeric = (val: any): number | undefined => {
    if (val === null || val === undefined || val === '') return undefined;
    if (typeof val === 'number' && !Number.isNaN(val)) return val;
    const cleaned = String(val).replace(/[,%\s]/g, '').trim();
    if (!cleaned) return undefined;
    const n = Number(cleaned);
    return Number.isFinite(n) ? n : undefined;
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setErrorMessage(null);
    setSuccessMessage(null);
    setFileName(file.name);

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const arrayBuf = evt.target?.result as ArrayBuffer;
        if (!arrayBuf) return;

        // Convert to base64 for server upload
        const bytes = new Uint8Array(arrayBuf);
        let binary = '';
        for (let i = 0; i < bytes.byteLength; i++) {
          binary += String.fromCharCode(bytes[i]);
        }
        setFileBase64(btoa(binary));

        // Also parse client-side with SheetJS to show immediate preview
        const wb = XLSX.read(arrayBuf, { type: 'array' });
        const extracted: PreviewRow[] = [];

        for (const sheetName of wb.SheetNames) {
          const ws = wb.Sheets[sheetName];
          const rows2D: any[][] = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });
          if (!rows2D || rows2D.length === 0) continue;

          let stateCol = -1;
          let regCol = -1;
          let pvcCol = -1;
          let rateCol = -1;
          let puCol = -1;
          let wardCol = -1;
          let lgaCol = -1;
          let startIdx = 0;

          for (let r = 0; r < Math.min(rows2D.length, 20); r++) {
            const lower = rows2D[r].map((c) => String(c ?? '').toLowerCase().trim());
            const sIdx = lower.findIndex((c) => c === 'state' || c === 'states' || c.includes('state name'));
            const rIdx = lower.findIndex(
              (c) =>
                c.includes('registered') ||
                c.includes('voters') ||
                c === 'reg voters' ||
                c === 'total voters'
            );
            if (sIdx !== -1 && (rIdx !== -1 || lower.some((c) => c.includes('pvc') || c.includes('polling')))) {
              stateCol = sIdx;
              regCol = rIdx;
              pvcCol = lower.findIndex(
                (c) => c.includes('pvc') && !c.includes('rate') && !c.includes('%') && !c.includes('uncollected')
              );
              rateCol = lower.findIndex((c) => c.includes('rate') || c.includes('%'));
              puCol = lower.findIndex((c) => c.includes('polling unit') || c === 'pus' || c === 'pu');
              wardCol = lower.findIndex((c) => c.includes('ward') || c.includes('registration area'));
              lgaCol = lower.findIndex((c) => c.includes('lga') || c.includes('local government'));
              startIdx = r + 1;
              break;
            }
          }

          for (let r = startIdx; r < rows2D.length; r++) {
            const row = rows2D[r];
            if (!Array.isArray(row) || row.length === 0) continue;
            const stateText =
              stateCol !== -1 ? String(row[stateCol] ?? '').trim() : String(row[1] || row[0] || '').trim();
            if (!stateText || /total/i.test(stateText) || /^s\/?n$/i.test(stateText)) continue;

            let reg = regCol !== -1 ? parseNumeric(row[regCol]) : undefined;
            let pvc = pvcCol !== -1 ? parseNumeric(row[pvcCol]) : undefined;
            const rate = rateCol !== -1 ? parseNumeric(row[rateCol]) : undefined;
            const pus = puCol !== -1 ? parseNumeric(row[puCol]) : undefined;
            const wards = wardCol !== -1 ? parseNumeric(row[wardCol]) : undefined;
            const lgas = lgaCol !== -1 ? parseNumeric(row[lgaCol]) : undefined;

            if (reg === undefined) {
              const nums = row
                .map((c) => parseNumeric(c))
                .filter((n): n is number => n !== undefined && n >= 50000);
              if (nums.length >= 1) {
                reg = nums[0];
                if (nums.length >= 2 && pvc === undefined && nums[1] <= nums[0]) {
                  pvc = nums[1];
                }
              }
            }

            if (reg !== undefined && reg >= 10000) {
              extracted.push({
                state: stateText,
                registeredVoters: Math.round(reg),
                pvcsCollected: pvc !== undefined ? Math.round(pvc) : undefined,
                pvcCollectionRate: rate,
                totalPus: pus !== undefined ? Math.round(pus) : undefined,
                totalWards: wards !== undefined ? Math.round(wards) : undefined,
                totalLgas: lgas !== undefined ? Math.round(lgas) : undefined,
              });
            }
          }
        }

        setPreviewRows(extracted);
      } catch (err: any) {
        setErrorMessage('Could not preview file locally: ' + (err.message || 'Invalid Excel file'));
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const handleApplyImport = async () => {
    if (!fileBase64 && previewRows.length === 0) {
      setErrorMessage('Please select an Excel (.xlsx / .xls) or CSV file first.');
      return;
    }
    try {
      setIsSubmitting(true);
      setErrorMessage(null);
      const res = await importRegisteredVotersFile({
        fileBase64,
        fileName,
        records: previewRows.length > 0 ? previewRows : undefined,
      });
      await refreshGeography();
      setSuccessMessage(res.message || 'Registered Voters updated across all States, LGAs, Wards & Polling Units!');
      if (onSuccess) onSuccess();
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to import Excel file');
    } finally {
      setIsSubmitting(false);
    }
  };

  const previewTotalReg = previewRows.reduce((acc, r) => acc + r.registeredVoters, 0);
  const previewTotalPvc = previewRows.reduce((acc, r) => acc + (r.pvcsCollected ?? 0), 0);

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-emerald-50 text-emerald-900 border border-emerald-300 text-xs font-semibold rounded-md transition-colors shadow-2xs"
      >
        <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-700" />
        <span>Update Voters (.xlsx / .csv)</span>
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl border border-slate-200 shadow-xl max-w-2xl w-full overflow-hidden">
            <div className="px-5 py-4 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5 text-emerald-400" />
                <div>
                  <h3 className="text-sm font-bold">
                    Import Registered Voters & PVC Collection (.xlsx / .xls / .csv)
                  </h3>
                  <p className="text-[11px] text-slate-300">
                    Updates National, State, LGA, Electoral Ward, and Polling Unit voter baselines across the platform.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs">
              <label className="flex flex-col items-center justify-center border-2 border-dashed border-emerald-300 hover:border-emerald-500 bg-emerald-50/40 rounded-lg p-6 cursor-pointer transition-colors text-center">
                <Upload className="w-7 h-7 text-emerald-700 mb-2" />
                <span className="font-bold text-slate-900 text-sm">
                  {fileName ? `Selected: ${fileName}` : 'Click to select your INEC Registered Voters Excel (.xlsx) or CSV file'}
                </span>
                <span className="text-slate-500 mt-1">
                  Supports .xlsx, .xls, and .csv files with State, Registered Voters, PVCs Collected, LGAs, Wards, or Polling Units columns
                </span>
                <input
                  type="file"
                  accept=".xlsx,.xls,.csv"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </label>

              {errorMessage && (
                <div className="p-3 rounded-md bg-rose-50 border border-rose-200 text-rose-800 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {successMessage && (
                <div className="p-3 rounded-md bg-emerald-50 border border-emerald-200 text-emerald-900 flex items-center gap-2 font-semibold">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{successMessage}</span>
                </div>
              )}

              {previewRows.length > 0 && (
                <div className="border border-slate-200 rounded-lg overflow-hidden">
                  <div className="bg-slate-50 px-3.5 py-2 border-b border-slate-200 flex items-center justify-between">
                    <span className="font-bold text-slate-800">
                      Detected {previewRows.length} State / FCT Records in {fileName}
                    </span>
                    <span className="font-mono text-emerald-800 font-bold">
                      Total Voters: {previewTotalReg.toLocaleString()}
                      {previewTotalPvc > 0 ? ` · PVCs: ${previewTotalPvc.toLocaleString()}` : ''}
                    </span>
                  </div>
                  <div className="max-h-52 overflow-y-auto">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="bg-slate-50/70 border-b border-slate-200 text-slate-500 uppercase text-[10px]">
                          <th className="py-2 px-3">State</th>
                          <th className="py-2 px-3 text-right">Registered Voters</th>
                          <th className="py-2 px-3 text-right">PVCs Collected</th>
                          <th className="py-2 px-3 text-right">Polling Units</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 font-mono">
                        {previewRows.map((r, i) => (
                          <tr key={i} className="hover:bg-slate-50">
                            <td className="py-1.5 px-3 font-sans font-bold text-slate-900">{r.state}</td>
                            <td className="py-1.5 px-3 text-right text-slate-900">
                              {r.registeredVoters.toLocaleString()}
                            </td>
                            <td className="py-1.5 px-3 text-right text-emerald-800">
                              {r.pvcsCollected !== undefined ? r.pvcsCollected.toLocaleString() : '—'}
                            </td>
                            <td className="py-1.5 px-3 text-right text-slate-600">
                              {r.totalPus !== undefined ? r.totalPus.toLocaleString() : 'Default INEC'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>

            <div className="px-5 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-2 text-xs">
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="px-3.5 py-2 rounded-md border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 font-semibold"
              >
                Close
              </button>
              <button
                type="button"
                disabled={isSubmitting || (!fileBase64 && previewRows.length === 0)}
                onClick={handleApplyImport}
                className="px-4 py-2 rounded-md bg-emerald-800 hover:bg-emerald-900 disabled:opacity-40 text-white font-bold transition-colors"
              >
                {isSubmitting ? 'Applying Excel Data...' : 'Apply Registered Voters Update'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
