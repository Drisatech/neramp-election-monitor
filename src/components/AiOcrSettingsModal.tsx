import React, { useEffect, useState } from 'react';
import {
  Sparkles,
  Key,
  ShieldCheck,
  Cpu,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  X,
  RefreshCw,
  Zap,
} from 'lucide-react';
import {
  fetchOcrQuotaStatus,
  setCustomGeminiApiKey,
  testGeminiOcrConnection,
} from '../services/api';

interface AiOcrSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onKeyUpdated?: () => void;
}

export const AiOcrSettingsModal: React.FC<AiOcrSettingsModalProps> = ({
  isOpen,
  onClose,
  onKeyUpdated,
}) => {
  const [quotaData, setQuotaData] = useState<any>(null);
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{
    success: boolean;
    message: string;
    latencyMs?: number;
  } | null>(null);
  const [feedbackNotice, setFeedbackNotice] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  const loadStatus = async () => {
    try {
      setIsLoading(true);
      const res = await fetchOcrQuotaStatus();
      setQuotaData(res.data);
    } catch (err: any) {
      console.warn('Could not load OCR status:', err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadStatus();
      setFeedbackNotice(null);
      setTestResult(null);
    }
  }, [isOpen]);

  const handleSaveKey = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!apiKeyInput.trim()) return;
    try {
      setIsSaving(true);
      setFeedbackNotice(null);
      const res = await setCustomGeminiApiKey(apiKeyInput.trim());
      setFeedbackNotice({ type: 'success', text: res.message });
      setApiKeyInput('');
      await loadStatus();
      if (onKeyUpdated) onKeyUpdated();
    } catch (err: any) {
      setFeedbackNotice({ type: 'error', text: err.message });
    } finally {
      setIsSaving(false);
    }
  };

  const handleRevertToDefault = async () => {
    try {
      setIsSaving(true);
      setFeedbackNotice(null);
      const res = await setCustomGeminiApiKey('');
      setFeedbackNotice({ type: 'success', text: res.message });
      await loadStatus();
      if (onKeyUpdated) onKeyUpdated();
    } catch (err: any) {
      setFeedbackNotice({ type: 'error', text: err.message });
    } finally {
      setIsSaving(false);
    }
  };

  const handleTestConnection = async () => {
    try {
      setIsTesting(true);
      setTestResult(null);
      const res = await testGeminiOcrConnection();
      setTestResult({
        success: true,
        message: res.message,
        latencyMs: res.latencyMs,
      });
    } catch (err: any) {
      setTestResult({
        success: false,
        message: err.message,
      });
    } finally {
      setIsTesting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xl max-w-xl w-full p-6 space-y-5 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-emerald-50 text-emerald-800 rounded-lg border border-emerald-200">
              <Sparkles className="w-5 h-5 text-emerald-700" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Gemini Vision AI OCR Configuration
              </h2>
              <p className="text-xs text-slate-500">
                Manage AI models, test OCR connection, or attach a custom Google AI Studio key
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Informational Answer Card */}
        <div className="p-3.5 bg-sky-50 border border-sky-200 rounded-lg text-xs space-y-1.5 text-sky-950">
          <div className="flex items-center gap-1.5 font-bold text-sky-900">
            <Zap className="w-4 h-4 text-sky-600 shrink-0" />
            <span>Do I need a paid API key for AI OCR?</span>
          </div>
          <p className="text-slate-700 leading-relaxed">
            <strong>No, a paid key is optional:</strong> The platform is pre-configured with a built-in Gemini Vision API key operating on Google AI Studio Free Tier (up to 15 requests/minute). Single-sheet Form EC8A OCR works out of the box.
          </p>
          <p className="text-slate-700 leading-relaxed">
            <strong>When to use a Paid Key:</strong> If you are running high-speed batch transcription across hundreds of polling units simultaneously or encountering Google Free Tier rate limits, you can attach your own Paid Gemini API key below for priority throughput and zero rate limits.
          </p>
        </div>

        {/* Current Active Status */}
        <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
              <Cpu className="w-4 h-4 text-emerald-700" />
              Engine & Models Status
            </span>
            <button
              onClick={loadStatus}
              disabled={isLoading}
              className="text-[11px] text-slate-600 hover:text-slate-900 flex items-center gap-1 cursor-pointer font-medium"
            >
              <RefreshCw className={`w-3 h-3 ${isLoading ? 'animate-spin' : ''}`} />
              <span>Refresh Status</span>
            </button>
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="bg-white p-2.5 rounded border border-slate-200">
              <span className="text-slate-500 block text-[11px]">Primary Model</span>
              <span className="font-mono font-bold text-slate-900 text-sm">
                {quotaData?.primaryModel || quotaData?.activeModel || 'gemini-3.5-flash-lite'}
              </span>
            </div>
            <div className="bg-white p-2.5 rounded border border-slate-200">
              <span className="text-slate-500 block text-[11px]">Active Key Source</span>
              <span className="font-bold text-slate-900 text-xs flex items-center gap-1 mt-0.5">
                {quotaData?.customKeyAttached ? (
                  <span className="text-purple-700 flex items-center gap-1 font-mono">
                    <Key className="w-3.5 h-3.5" />
                    Custom User Key ({quotaData?.maskedKey})
                  </span>
                ) : (
                  <span className="text-emerald-700 flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    Built-in AI Studio Key
                  </span>
                )}
              </span>
            </div>
          </div>

          {/* Fallback tier info */}
          <div className="text-[11px] text-slate-500 flex items-center justify-between pt-1 border-t border-slate-200">
            <span>
              Fallback Tier:{' '}
              {(quotaData?.fallbackModels || ['gemini-3.1-flash-lite', 'gemini-3.8-flash']).map((m: string, i: number, arr: string[]) => (
                <React.Fragment key={m}>
                  <strong className="font-mono text-slate-700">{m}</strong>
                  {i < arr.length - 1 && ' → '}
                </React.Fragment>
              ))}
            </span>
            <span className="text-emerald-700 font-semibold flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" /> Ready
            </span>
          </div>
        </div>

        {/* Test Connection Button & Result */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-700">Quick Diagnostics</span>
            <button
              type="button"
              onClick={handleTestConnection}
              disabled={isTesting}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded text-xs font-semibold transition-colors disabled:opacity-50 cursor-pointer shadow-2xs"
            >
              {isTesting ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Zap className="w-3.5 h-3.5 text-amber-300" />
              )}
              <span>{isTesting ? 'Testing Connection...' : 'Test OCR Ping Now'}</span>
            </button>
          </div>

          {testResult && (
            <div
              className={`p-3 rounded-lg border text-xs flex items-start gap-2 ${
                testResult.success
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                  : 'bg-rose-50 border-rose-200 text-rose-900'
              }`}
            >
              {testResult.success ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              )}
              <div className="space-y-0.5">
                <div className="font-bold">
                  {testResult.success ? 'Gemini OCR is Operational' : 'Connection Failed'}
                  {testResult.latencyMs && (
                    <span className="ml-2 font-mono text-[11px] font-normal opacity-80">
                      ({testResult.latencyMs}ms)
                    </span>
                  )}
                </div>
                <div className="text-[11px] font-mono break-all">{testResult.message}</div>
              </div>
            </div>
          )}
        </div>

        {/* Custom API Key Input Form */}
        <form onSubmit={handleSaveKey} className="space-y-3 pt-2 border-t border-slate-200">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
              <Key className="w-4 h-4 text-emerald-700" />
              <span>Attach Custom Gemini API Key (Optional)</span>
            </label>
            <a
              href="https://aistudio.google.com/app/apikey"
              target="_blank"
              rel="noreferrer"
              className="text-[11px] text-emerald-800 hover:text-emerald-900 font-semibold flex items-center gap-1 underline"
            >
              <span>Get key from Google AI Studio</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>

          <p className="text-xs text-slate-500">
            Paste your Google AI Studio API Key (starts with <code className="bg-slate-100 px-1 py-0.5 rounded text-slate-700 font-mono">AIzaSy...</code>) to unlock higher concurrency limits.
          </p>

          <div className="flex items-center gap-2">
            <input
              type="password"
              value={apiKeyInput}
              onChange={(e) => setApiKeyInput(e.target.value)}
              placeholder={quotaData?.customKeyAttached ? 'Enter new key to update...' : 'AIzaSy...'}
              className="flex-1 px-3 py-2 border border-slate-300 rounded-lg text-xs font-mono focus:outline-none focus:ring-2 focus:ring-emerald-600"
            />
            <button
              type="submit"
              disabled={isSaving || !apiKeyInput.trim()}
              className="px-4 py-2 bg-emerald-800 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-colors disabled:opacity-50 cursor-pointer shadow-2xs"
            >
              {isSaving ? 'Saving...' : 'Apply Key'}
            </button>
          </div>

          {quotaData?.customKeyAttached && (
            <div className="flex items-center justify-between pt-1 text-xs">
              <span className="text-slate-500">
                Active custom key: <strong className="font-mono">{quotaData?.maskedKey}</strong>
              </span>
              <button
                type="button"
                onClick={handleRevertToDefault}
                disabled={isSaving}
                className="text-rose-700 hover:text-rose-900 font-bold underline cursor-pointer"
              >
                Revert to Default Environment Key
              </button>
            </div>
          )}

          {feedbackNotice && (
            <div
              className={`p-2.5 rounded-lg border text-xs flex items-center gap-2 ${
                feedbackNotice.type === 'success'
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                  : 'bg-rose-50 border-rose-200 text-rose-900'
              }`}
            >
              {feedbackNotice.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              )}
              <span>{feedbackNotice.text}</span>
            </div>
          )}
        </form>

        {/* Modal Footer */}
        <div className="pt-2 border-t border-slate-200 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
