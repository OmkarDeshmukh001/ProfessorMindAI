import type { ReactNode } from 'react';
import { FolderOpen } from 'lucide-react';

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description: string;
  action?: ReactNode;
  className?: string;
}

const EmptyState = ({ 
  icon, 
  title, 
  description, 
  action, 
  className = '' 
}: EmptyStateProps) => {
  return (
    <div 
      className={`flex flex-col items-center justify-center text-center py-12 md:py-16 px-6 bg-white rounded-xl border-2 border-dashed border-slate-200 hover:border-teal-300/60 transition-all duration-200 ${className}`}
    >
      {/* Icon Container */}
      <div className="w-16 h-16 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-center mb-5 text-slate-400">
        {icon || <FolderOpen size={28} />}
      </div>

      {/* Text Content */}
      <h3 className="text-lg font-semibold text-slate-900 mb-2 tracking-tight">
        {title}
      </h3>
      <p className="text-sm text-slate-500 max-w-sm mb-6 leading-relaxed">
        {description}
      </p>

      {/* Optional Action (CTA) */}
      {action && (
        <div className="mt-1">
          {action}
        </div>
      )}
    </div>
  );
};

export default EmptyState;