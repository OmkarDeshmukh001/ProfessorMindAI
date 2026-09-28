import { FileText } from 'lucide-react';
import type { ChatSource } from '../../types/chat';

interface SourceReferencesProps {
  sources: ChatSource[];
}

function SourceReferences({ sources }: SourceReferencesProps) {
  const documents = new Map<string, { label: string; pages: number[] }>();

  for (const source of sources) {
    const filename = source.filename?.trim();
    const fileId = source.file_id?.trim();
    const page = source.page_number;

    if ((!filename && !fileId) || page == null || !Number.isFinite(page)) {
      continue;
    }

    const key = fileId || filename || 'unknown';
    const document = documents.get(key) || {
      label: filename || fileId || 'Unknown document',
      pages: [],
    };

    if (!document.pages.includes(page)) {
      document.pages.push(page);
    }

    documents.set(key, document);
  }

  const groupedSources = Array.from(documents.entries()).map(([key, document]) => ({
    key,
    ...document,
    pages: [...document.pages].sort((left, right) => left - right),
  }));

  if (groupedSources.length === 0) {
    return null;
  }

  return (
    <section className="pl-1" aria-label="Sources">
      <div className="flex items-center gap-2 mb-2 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
        <FileText size={14} className="text-amber-600" aria-hidden="true" />
        <span>Sources</span>
      </div>

      <div className="space-y-2">
        {groupedSources.map((document) => (
          <div key={document.key} className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2">
            <p className="text-xs font-semibold text-amber-900 break-words">
              {document.label}
            </p>
            <div className="flex flex-wrap gap-1.5 mt-1.5">
              {document.pages.map((page) => (
                <span
                  key={`${document.key}-${page}`}
                  className="px-2 py-0.5 rounded border border-amber-200 bg-white text-xs text-amber-800"
                >
                  Page {page}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

export default SourceReferences;
