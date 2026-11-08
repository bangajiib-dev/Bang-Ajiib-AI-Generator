import React, { useState, useEffect } from 'react';
import { Code2, X, Check, RotateCcw, RefreshCw, CheckCircle2, AlertCircle } from 'lucide-react';
import { TRIAL_AI_GENERATOR_HTML } from '../constants/config.ts';

interface TrialHtmlEditorModalProps {
  isOpen: boolean;
  initialHtml: string;
  onClose: () => void;
  onSaveHtml: (newHtml: string) => Promise<void>;
}

export const TrialHtmlEditorModal: React.FC<TrialHtmlEditorModalProps> = ({
  isOpen,
  initialHtml,
  onClose,
  onSaveHtml,
}) => {
  const [htmlCode, setHtmlCode] = useState(initialHtml || TRIAL_AI_GENERATOR_HTML);
  const [isSaving, setIsSaving] = useState(false);
  const [feedback, setFeedback] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  useEffect(() => {
    if (isOpen) {
      setHtmlCode(initialHtml || TRIAL_AI_GENERATOR_HTML);
      setFeedback(null);
    }
  }, [isOpen, initialHtml]);

  if (!isOpen) return null;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!htmlCode.trim()) {
      setFeedback({
        type: 'error',
        message: 'Kode HTML tidak boleh kosong.',
      });
      return;
    }

    setFeedback(null);
    setIsSaving(true);
    try {
      await onSaveHtml(htmlCode);
      setFeedback({
        type: 'success',
        message: 'Kode HTML Trial AI Generator berhasil disimpan dan disinkronkan.',
      });
      setTimeout(() => {
        onClose();
      }, 900);
    } catch (err: unknown) {
      setFeedback({
        type: 'error',
        message: err instanceof Error ? err.message : 'Gagal menyimpan perubahan kode HTML.',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleRestoreDefault = () => {
    setHtmlCode(TRIAL_AI_GENERATOR_HTML);
    setFeedback({
      type: 'success',
      message: 'Kode HTML dikembalikan ke versi default. Klik "Simpan HTML" untuk menerapkan.',
    });
  };

  return (
    <div className="fixed inset-0 z-[60] bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white border border-slate-200 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Modal Header */}
        <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between gap-3 bg-slate-50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-violet-100 text-violet-700 flex items-center justify-center shrink-0">
              <Code2 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Edit Kode HTML — Trial AI Generator
              </h3>
              <p className="text-[11px] text-slate-500">
                Ubah atau tempelkan kode HTML baru untuk menu Trial AI Generator sewaktu-waktu.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={isSaving}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-lg transition-colors cursor-pointer"
            title="Tutup"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSave} className="flex-1 flex flex-col p-5 space-y-4 overflow-y-auto">
          {feedback && (
            <div
              className={`p-3 rounded-lg border text-xs flex items-center gap-2 ${
                feedback.type === 'success'
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                  : 'bg-red-50 border-red-200 text-red-700'
              }`}
            >
              {feedback.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
              )}
              <span>{feedback.message}</span>
            </div>
          )}

          <div className="flex items-center justify-between gap-2">
            <label className="text-xs font-semibold text-slate-700">
              Kode Sumber HTML (&lt;!DOCTYPE html&gt; ... &lt;/html&gt;)
            </label>
            <button
              type="button"
              onClick={handleRestoreDefault}
              disabled={isSaving}
              className="px-2.5 py-1 text-[11px] font-semibold text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-md inline-flex items-center gap-1 cursor-pointer transition-colors"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Kembalikan HTML Default</span>
            </button>
          </div>

          <textarea
            value={htmlCode}
            onChange={(e) => setHtmlCode(e.target.value)}
            spellCheck={false}
            placeholder="Tempelkan kode <!DOCTYPE html>...</html> di sini"
            className="w-full flex-1 min-h-[360px] p-3.5 text-xs font-mono bg-slate-950 text-slate-100 border border-slate-800 rounded-xl focus:outline-none focus:border-violet-500 resize-y leading-relaxed"
          />

          {/* Modal Footer */}
          <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isSaving}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg cursor-pointer transition-colors"
            >
              Batal
            </button>

            <button
              type="submit"
              disabled={isSaving}
              className="px-4 py-2 text-xs font-semibold text-white bg-violet-600 hover:bg-violet-700 rounded-lg inline-flex items-center gap-1.5 cursor-pointer transition-colors disabled:opacity-60"
            >
              {isSaving ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Menyimpan HTML...</span>
                </>
              ) : (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>Simpan HTML</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
