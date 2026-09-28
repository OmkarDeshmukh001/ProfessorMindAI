import { Link } from 'react-router-dom';
import { Compass, ArrowLeft, FileSearch } from 'lucide-react';

function NotFound() {
  return (
    <section className="min-h-[60vh] flex flex-col items-center justify-center text-center px-4 animate-fade-in">
      
      {/* Icon Container */}
      <div className="w-20 h-20 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-center mb-6 text-slate-400 shadow-sm">
        <Compass size={36} />
      </div>

      {/* Text Content */}
      <h2 className="text-3xl md:text-4xl font-bold text-slate-900 tracking-tight mb-3">
        Page not found
      </h2>
      <p className="text-slate-500 text-sm md:text-base max-w-md mb-8 leading-relaxed">
        This route is not part of your academic workspace. The document or notebook you are looking for may have been moved or deleted.
      </p>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
        <Link
          to="/dashboard"
          className="inline-flex items-center justify-center gap-2 bg-teal-800 hover:bg-teal-900 text-white font-medium text-sm px-6 py-3 rounded-lg shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 w-full sm:w-auto"
        >
          <ArrowLeft size={16} />
          Back to Dashboard
        </Link>
        
        <Link
          to="/documents"
          className="inline-flex items-center justify-center gap-2 bg-white hover:bg-slate-50 text-slate-700 font-medium text-sm px-6 py-3 rounded-lg border border-slate-200 shadow-sm hover:border-slate-300 transition-all duration-200 w-full sm:w-auto"
        >
          <FileSearch size={16} />
          Browse Documents
        </Link>
      </div>

      {/* Decorative Subtle Footer */}
      <div className="mt-12 pt-8 border-t border-slate-100 w-full max-w-xs">
        <p className="text-[11px] text-slate-400 font-medium uppercase tracking-widest">
          ProfessorMind AI &middot; Workspace
        </p>
      </div>
    </section>
  );
}

export default NotFound;