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
  Layers,
  Check,
} from 'lucide-react';
import {
  fetchOcrQuotaStatus,
  setCustomGeminiApiKey,
  testGeminiOcrConnection,
} from '../services/api';

export type AiProvider = 'gemini' | 'openai' | 'groq' | 'claude';

interface AiOcrSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onKeyUpdated?: () => void;
}

const PROVIDER_METADATA_FALLBACK: Record<
  AiProvider,
  {
    name: string;
    description: string;
    envVar: string;
    defaultModel: string;
    models: string[];
    docUrl: string;
    keyPlaceholder: string;
    badge: string;
  }
> = {
  gemini: {
    name: 'Google Gemini',
    description: 'High throughput, fast multimodal reasoning (Google AI Studio Free Tier supported)',
    envVar: 'GEMINI_API_KEY',
    defaultModel: 'gemini-3.5-flash-lite',
    models: ['gemini-3.5-flash-lite', 'gemini-3.1-flash-lite', 'gemini-3.8-flash'],
    docUrl: 'https://aistudio.google.com/app/apikey',
    keyPlaceholder: 'AQ... or AIzaSy...',
    badge: 'Built-in Free Tier',
  },
  openai: {
    name: 'OpenAI (GPT-4o)',
    description: 'Industry-standard structured outputs & reliable Form EC8A transcription',
    envVar: 'OPENAI_API_KEY',
    defaultModel: 'gpt-4o-mini',
    models: ['gpt-4o-mini', 'gpt-4o'],
    docUrl: 'https://platform.openai.com/api-keys',
    keyPlaceholder: 'sk-proj-...',
    badge: 'Standard & Fast',
  },
  groq: {
    name: 'Groq (Qwen Vision)',
    description: 'Ultra-low latency LPU inference using open-weights Qwen models (qwen/qwen3.8-27b)',
    envVar: 'GROQ_API_KEY',
    defaultModel: 'qwen/qwen3.8-27b',
    models: ['qwen/qwen3.8-27b'],
    docUrl: 'https://console.groq.com/keys',
    keyPlaceholder: 'gsk_...',
    badge: 'Ultra-Low Latency',
  },
  claude: {
    name: 'Anthropic Claude',
    description: 'Exceptional handwritten text deciphering and document layout comprehension',
    envVar: 'ANTHROPIC_API_KEY',
    defaultModel: 'claude-3-5-sonnet-20241022',
    models: ['claude-3-5-sonnet-20241022', 'claude-3-5-haiku-20241022'],
    docUrl: 'https://console.anthropic.com/settings/keys',
    keyPlaceholder: 'sk-ant-api03-...',
    badge: 'High Precision',
  },
};

export const AiOcrSettingsModal: React.FC<AiOcrSettingsModalProps> = ({
  isOpen,
  onClose,
  onKeyUpdated,
}) => {
  const [quotaData, setQuotaData] = useState<any>(null);
  const [selectedProvider, setSelectedProvider] = useState<AiProvider>('gemini');
  const [selectedModel, setSelectedModel] = useState<string>('gemini-3.5-flash-lite');
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{
    success: boolean;
    message: string;
    latencyMs?: number;
    provider?: string;
    activeModel?: string;
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
      if (res.data?.activeProvider) {
        setSelectedProvider(res.data.activeProvider);
        setSelectedModel(res.data.activeModel || 'gemini-3.5-flash-lite');
      }
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
      setApiKeyInput('');
    }
  }, [isOpen]);

  const currentProviderStatus = (quotaData?.providers || []).find(
    (p: any) => p.id === selectedProvider
  );
  const meta = PROVIDER_METADATA_FALLBACK[selectedProvider] || PROVIDER_METADATA_FALLBACK.gemini;
  const availableModels = currentProviderStatus?.models || meta.models;

  const handleProviderSelect = (prov: AiProvider) => {
    setSelectedProvider(prov);
    const pStatus = (quotaData?.providers || []).find((p: any) => p.id === prov);
    const pMeta = PROVIDER_METADATA_FALLBACK[prov];
    setSelectedModel(pStatus?.selectedModel || pMeta?.defaultModel || '');
    setApiKeyInput('');
    setTestResult(null);
    setFeedbackNotice(null);
  };

  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSaving(true);
      setFeedbackNotice(null);
      const res = await setCustomGeminiApiKey(
        apiKeyInput.trim(),
        selectedProvider,
        selectedModel
      );
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
      const res = await setCustomGeminiApiKey('', selectedProvider, selectedModel);
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
      const res = await testGeminiOcrConnection(
        selectedProvider,
        selectedModel,
        apiKeyInput.trim() || undefined
      );
      setTestResult({
        success: true,
        message: res.message,
        latencyMs: res.latencyMs,
        provider: res.provider || selectedProvider,
        activeModel: res.activeModel || selectedModel,
      });
    } catch (err: any) {
      setTestResult({
        success: false,
        message: err.message,
        provider: selectedProvider,
        activeModel: selectedModel,
      });
    } finally {
      setIsTesting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xl max-w-2xl w-full p-6 space-y-5 max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-emerald-50 text-emerald-800 rounded-lg border border-emerald-200">
              <Sparkles className="w-5 h-5 text-emerald-700" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                AI OCR Provider & Model Configuration
              </h2>
              <p className="text-xs text-slate-500">
                Choose your AI Vision provider (Google Gemini, OpenAI, Groq, Anthropic Claude), customize models, and manage API keys
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

        {/* Provider Selection Cards */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-slate-800 uppercase tracking-wide flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-emerald-700" />
              <span>Select AI Vision OCR Provider</span>
            </label>
            <button
              onClick={loadStatus}
              disabled={isLoading}
              className="text-[11px] text-slate-600 hover:text-slate-900 flex items-center gap-1 cursor-pointer font-medium"
            >
              <RefreshCw className={`w-3 h-3 ${isLoading ? 'animate-spin' : ''}`} />
              <span>Refresh Status</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {(Object.keys(PROVIDER_METADATA_FALLBACK) as AiProvider[]).map((provKey) => {
              const pMeta = PROVIDER_METADATA_FALLBACK[provKey];
              const pStatus = (quotaData?.providers || []).find((p: any) => p.id === provKey);
              const isSelected = selectedProvider === provKey;
              const isCurrentlyActiveInServer = quotaData?.activeProvider === provKey;
              const hasKey = pStatus?.isConfigured;

              return (
                <button
                  key={provKey}
                  type="button"
                  onClick={() => handleProviderSelect(provKey)}
                  className={`p-3 rounded-lg border text-left transition-all relative cursor-pointer ${
                    isSelected
                      ? 'border-emerald-700 bg-emerald-50/70 shadow-2xs ring-2 ring-emerald-600/20'
                      : 'border-slate-200 bg-white hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-start justify-between gap-1">
                    <span className="font-bold text-xs text-slate-900 flex items-center gap-1.5">
                      {pMeta.name}
                      {isCurrentlyActiveInServer && (
                        <span className="px-1.5 py-0.2 bg-emerald-100 text-emerald-800 text-[10px] font-mono rounded font-bold">
                          ACTIVE
                        </span>
                      )}
                    </span>
                    <span
                      className={`text-[10px] font-semibold px-1.5 py-0.5 rounded flex items-center gap-1 ${
                        hasKey
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${hasKey ? 'bg-emerald-600' : 'bg-amber-600'}`} />
                      {hasKey ? 'Ready' : 'Key Needed'}
                    </span>
                  </div>

                  <p className="text-[11px] text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                    {pMeta.description}
                  </p>

                  <div className="mt-2 text-[10px] font-mono text-slate-400 flex items-center justify-between">
                    <span>Default: {pMeta.defaultModel}</span>
                    <span className="text-slate-500 font-semibold">{pMeta.badge}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Selected Provider Configuration Form */}
        <form onSubmit={handleSaveConfig} className="bg-slate-50 border border-slate-200 rounded-lg p-4 space-y-3.5">
          <div className="flex items-center justify-between border-b border-slate-200 pb-2">
            <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
              <Cpu className="w-4 h-4 text-emerald-700" />
              <span>Configure {meta.name}</span>
            </span>
            <span className="text-[11px] text-slate-500 font-mono">
              Env Variable: <strong>{meta.envVar}</strong>
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            {/* Model Selector Dropdown */}
            <div>
              <label className="text-slate-700 block font-semibold mb-1">
                Vision OCR Model:
              </label>
              <select
                value={selectedModel}
                onChange={(e) => setSelectedModel(e.target.value)}
                className="w-full bg-white border border-slate-300 font-mono font-bold text-xs rounded-lg p-2 text-slate-900 focus:outline-emerald-600"
              >
                {availableModels.map((m: string) => (
                  <option key={m} value={m}>
                    {m} {m === meta.defaultModel ? '(Recommended)' : ''}
                  </option>
                ))}
              </select>
            </div>

            {/* Current Active Status Info */}
            <div>
              <label className="text-slate-700 block font-semibold mb-1">
                Active Key Source:
              </label>
              <div className="p-2 bg-white rounded-lg border border-slate-200 flex items-center justify-between text-xs min-h-[38px]">
                {currentProviderStatus?.isConfigured ? (
                  <span className="text-emerald-700 font-semibold flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>
                      {currentProviderStatus.keySource === 'custom_admin_key'
                        ? 'Custom Admin Key'
                        : selectedProvider === 'gemini'
                        ? 'Built-in AI Studio Key'
                        : `Env Var (${meta.envVar})`}
                    </span>
                    <span className="font-mono text-[11px] text-slate-500">
                      ({currentProviderStatus.maskedKey})
                    </span>
                  </span>
                ) : (
                  <span className="text-amber-700 font-semibold flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
                    <span>No API key configured for {meta.name}</span>
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* API Key Input */}
          <div className="space-y-1.5 pt-1">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <Key className="w-3.5 h-3.5 text-emerald-700" />
                <span>Custom API Key for {meta.name} (Optional if set in Env)</span>
              </label>
              <a
                href={meta.docUrl}
                target="_blank"
                rel="noreferrer"
                className="text-[11px] text-emerald-800 hover:text-emerald-900 font-semibold flex items-center gap-1 underline"
              >
                <span>Get API key from {meta.name}</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="password"
                value={apiKeyInput}
                onChange={(e) => setApiKeyInput(e.target.value)}
                placeholder={
                  currentProviderStatus?.keySource === 'custom_admin_key'
                    ? 'Enter new key to update...'
                    : `Paste ${meta.name} key (${meta.keyPlaceholder})`
                }
                className="flex-1 px-3 py-2 border border-slate-300 rounded-lg text-xs font-mono bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600"
              />
              <button
                type="submit"
                disabled={isSaving}
                className="px-4 py-2 bg-emerald-800 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-colors disabled:opacity-50 cursor-pointer shadow-2xs whitespace-nowrap"
              >
                {isSaving ? 'Applying...' : 'Save & Switch Provider'}
              </button>
            </div>

            {currentProviderStatus?.keySource === 'custom_admin_key' && (
              <div className="flex items-center justify-between pt-0.5 text-xs">
                <span className="text-slate-500 text-[11px]">
                  Custom key active: <strong className="font-mono">{currentProviderStatus.maskedKey}</strong>
                </span>
                <button
                  type="button"
                  onClick={handleRevertToDefault}
                  disabled={isSaving}
                  className="text-rose-700 hover:text-rose-900 font-semibold text-[11px] underline cursor-pointer"
                >
                  Clear Custom Key & Revert to Environment
                </button>
              </div>
            )}
          </div>

          {/* Feedback Notice */}
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

        {/* Quick Diagnostics Ping Button & Result */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-700">Live Provider Diagnostics</span>
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
              <span>{isTesting ? 'Pinging Provider...' : `Test ${meta.name} Ping Now`}</span>
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
                <div className="font-bold flex items-center gap-2">
                  <span>
                    {testResult.success ? `${meta.name} OCR is Operational` : `${meta.name} Ping Failed`}
                  </span>
                  {testResult.latencyMs && (
                    <span className="font-mono text-[11px] font-normal bg-emerald-100 text-emerald-800 px-1.5 py-0.2 rounded">
                      {testResult.latencyMs}ms latency
                    </span>
                  )}
                  {testResult.activeModel && (
                    <span className="font-mono text-[11px] text-slate-500">
                      Model: {testResult.activeModel}
                    </span>
                  )}
                </div>
                <div className="text-[11px] font-mono break-all">{testResult.message}</div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="pt-2 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
          <span>
            Active on Server: <strong>{quotaData?.activeProviderName || 'Google Gemini'}</strong> (
            <code className="font-mono">{quotaData?.activeModel || 'gemini-3.5-flash-lite'}</code>)
          </span>
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
