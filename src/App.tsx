import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './context/AuthContext';
import { ElectionProvider } from './context/ElectionContext';
import { DevelopmentBanner } from './components/DevelopmentBanner';
import { Navbar } from './components/Navbar';

// Pages
import { PublicDashboardPage } from './pages/PublicDashboardPage';
import { ElectionResultsPage } from './pages/ElectionResultsPage';
import { InteractiveMapPage } from './pages/InteractiveMapPage';
import { PollingUnitsPage } from './pages/PollingUnitsPage';
import { PollingUnitDetailPage } from './pages/PollingUnitDetailPage';
import { DiscrepanciesPage } from './pages/DiscrepanciesPage';
import { IncidentsPage } from './pages/IncidentsPage';
import { ObserverPortalPage } from './pages/ObserverPortalPage';
import { VerificationQueuePage } from './pages/VerificationQueuePage';
import { AdminCommandCentrePage } from './pages/AdminCommandCentrePage';
import { AdminIngestionPage } from './pages/AdminIngestionPage';
import { MethodologyPage } from './pages/MethodologyPage';
import { AdvancedAnalyticsPage } from './pages/AdvancedAnalyticsPage';
import { ReadinessTestingPage } from './pages/ReadinessTestingPage';

const queryClient = new QueryClient();

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <ElectionProvider>
          <BrowserRouter>
            <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-900">
              {/* Persistent Development Mode Banner */}
              <DevelopmentBanner />

              {/* Main App Navigation */}
              <Navbar />

              {/* Page Content Body */}
              <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
                <Routes>
                  <Route path="/" element={<PublicDashboardPage />} />
                  <Route path="/analytics" element={<AdvancedAnalyticsPage />} />
                  <Route path="/results" element={<ElectionResultsPage />} />
                  <Route path="/map" element={<InteractiveMapPage />} />
                  <Route path="/polling-units" element={<PollingUnitsPage />} />
                  <Route path="/polling-units/:id" element={<PollingUnitDetailPage />} />
                  <Route path="/discrepancies" element={<DiscrepanciesPage />} />
                  <Route path="/incidents" element={<IncidentsPage />} />
                  <Route path="/observer-portal" element={<ObserverPortalPage />} />
                  <Route path="/verification-queue" element={<VerificationQueuePage />} />
                  <Route path="/admin" element={<AdminCommandCentrePage />} />
                  <Route path="/admin-command-centre" element={<AdminCommandCentrePage />} />
                  <Route path="/admin-ingestion" element={<AdminIngestionPage />} />
                  <Route path="/readiness-testing" element={<ReadinessTestingPage />} />
                  <Route path="/methodology" element={<MethodologyPage />} />
                </Routes>
              </main>

              {/* Footer with Legal Notice */}
              <footer className="bg-white border-t border-slate-200 mt-12 py-8 text-xs text-slate-500">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-4">
                  <div>
                    <p className="font-bold text-slate-800">
                      NERAMP · Nigeria Election Results Analysis and Monitoring Platform
                    </p>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Independent election results analysis, polling-unit monitoring, and verification platform. Not an official INEC website.
                    </p>
                  </div>
                  <div className="flex items-center gap-4 text-xs font-medium">
                    <a
                      href="https://inecelectionresults.ng"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-emerald-800 hover:text-emerald-950 underline"
                    >
                      INEC Official Portal Reference
                    </a>
                    <span>·</span>
                    <a href="/methodology" className="hover:text-slate-800 underline">
                      Methodology
                    </a>
                    <span>·</span>
                    <span className="font-mono text-[10px]">v1.0.0 (Phase 1)</span>
                  </div>
                </div>
              </footer>
            </div>
          </BrowserRouter>
        </ElectionProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
