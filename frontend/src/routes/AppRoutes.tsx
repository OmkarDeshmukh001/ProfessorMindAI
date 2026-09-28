import { lazy, Suspense } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import MainLayout from "../components/layout/MainLayout";

const Dashboard = lazy(() => import("../pages/Dashboard"));
const Notebooks = lazy(() => import("../pages/Notebooks"));
const NotebookDetails = lazy(() => import("../pages/NotebookDetails"));
const Documents = lazy(() => import("../pages/Documents"));
const DocumentDetails = lazy(() => import("../pages/DocumentDetails"));
const NotFound = lazy(() => import("../pages/NotFound"));

const PageLoader = () => (
  <div className="fixed inset-0 flex items-center justify-center bg-[#212121]">
    <div className="flex items-center gap-3 text-white">
      <div className="h-5 w-5 animate-spin rounded-full border-2 border-white/20 border-t-white" />
      <span className="text-sm text-white/70">Loading...</span>
    </div>
  </div>
);

function AppRoutes() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        <Route element={<MainLayout />}>
          {/* Default */}
          <Route index element={<Navigate to="/dashboard" replace />} />

          {/* Main application */}
          <Route path="dashboard" element={<Dashboard />} />

          <Route path="notebooks" element={<Notebooks />} />

          <Route path="notebooks/:notebookId" element={<NotebookDetails />} />

          <Route path="documents" element={<Documents />} />

          <Route path="documents/:documentId" element={<DocumentDetails />} />

          {/* 404 */}
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </Suspense>
  );
}

export default AppRoutes;
