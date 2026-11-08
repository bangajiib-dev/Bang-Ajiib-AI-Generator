import React from 'react';
import { ArrowLeft, ExternalLink, Code2 } from 'lucide-react';
import { prepareTrialHtmlForExecution } from '../constants/config.ts';

interface TrialAiGeneratorViewProps {
  htmlContent: string;
  isAdmin?: boolean;
  onBack: () => void;
  onOpenEditHtml?: () => void;
}

export const TrialAiGeneratorView: React.FC<TrialAiGeneratorViewProps> = ({
  htmlContent,
  isAdmin = false,
  onBack,
  onOpenEditHtml,
}) => {
  const executableHtml = prepareTrialHtmlForExecution(htmlContent);

  const handleOpenNewTab = (e: React.MouseEvent<HTMLAnchorElement>) => {
    try {
      e.preventDefault();
      const blob = new Blob([executableHtml], { type: 'text/html;charset=utf-8' });
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = blobUrl;
      a.target = '_blank';
      a.rel = 'noopener noreferrer';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(blobUrl), 60000);
    } catch {
      // Fallback ke href="/trial-ai-generator.html"
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#0b1220] flex flex-col">
      {/* Top Navigation Bar */}
      <div className="bg-[#131e30] border-b border-[#30415e] px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 shrink-0">
        <button
          type="button"
          onClick={onBack}
          className="px-3 py-1.5 text-xs font-semibold text-white bg-[#263650] hover:bg-[#324666] border border-[#405271] rounded-lg inline-flex items-center gap-1.5 cursor-pointer transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Kembali ke Dashboard</span>
        </button>

        <div className="hidden sm:block text-xs font-bold text-[#f4f7fb] truncate">
          Trial AI Generator · AI Video Generator Builder By Bang Ajiib
        </div>

        <div className="flex items-center gap-2">
          {isAdmin && onOpenEditHtml && (
            <button
              type="button"
              onClick={onOpenEditHtml}
              className="px-3 py-1.5 text-xs font-semibold text-amber-200 bg-amber-500/20 hover:bg-amber-500/30 border border-amber-400/40 rounded-lg inline-flex items-center gap-1.5 cursor-pointer transition-colors whitespace-nowrap"
            >
              <Code2 className="w-3.5 h-3.5" />
              <span>Edit HTML</span>
            </button>
          )}

          <a
            href="/trial-ai-generator.html"
            target="_blank"
            rel="noopener noreferrer"
            onClick={handleOpenNewTab}
            className="px-3 py-1.5 text-xs font-semibold text-white bg-violet-600 hover:bg-violet-700 rounded-lg inline-flex items-center gap-1.5 whitespace-nowrap transition-colors cursor-pointer"
          >
            <span>Buka Tab Baru</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>

      {/* Dynamic HTML Renderer without restrictive sandbox */}
      <iframe
        title="Trial AI Generator HTML"
        srcDoc={executableHtml}
        allow="clipboard-read; clipboard-write"
        className="w-full flex-1 border-0 bg-[#0b1220]"
      />
    </div>
  );
};
