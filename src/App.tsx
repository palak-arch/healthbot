import React, { Suspense, lazy } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import ErrorBoundary from "@/components/ErrorBoundary";

// Lazy-load pages for code splitting
const Index = lazy(() => import("@/pages/Index"));
const Chat = lazy(() => import("@/pages/Chat"));
const Vaccinations = lazy(() => import("@/pages/Vaccinations"));
const HealthCenters = lazy(() => import("@/pages/HealthCenters"));
const Admin = lazy(() => import("@/pages/Admin"));
const Diseases = lazy(() => import("@/pages/Diseases"));
const Patient = lazy(() => import("@/pages/Patient"));

function LoadingSpinner() {
  return (
    <div className="flex h-screen items-center justify-center">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
    </div>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <Router>
        <Suspense fallback={<LoadingSpinner />}>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/chat" element={<Chat />} />
            <Route path="/vaccinations" element={<Vaccinations />} />
            <Route path="/health-centers" element={<HealthCenters />} />
            <Route path="/admin" element={<Admin />} />
            <Route path="/diseases" element={<Diseases />} />
            <Route path="/patient" element={<Patient />} />
          </Routes>
        </Suspense>
      </Router>
    </ErrorBoundary>
  );
}

export default App;
