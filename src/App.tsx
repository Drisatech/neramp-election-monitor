import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './context/AuthContext';
import { ElectionProvider } from './context/ElectionContext';
import { Navbar } from './components/Navbar';
import { ProtectedRoute } from './components/ProtectedRoute';

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
import { LoginPage } from './pages/LoginPage';

const queryClient = new QueryClient();

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <ElectionProvider>
          <BrowserRouter>
            <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-900">
              {/* Main App Navigation */}
              <Navbar />

              {/* Page Content Body */}
              <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
                <Routes>
                  {/* Public Open Routes */}
                  <Route path="/" element={<PublicDashboardPage />} />
                  <Route path="/results" element={<ElectionResultsPage />} />
                  <Route path="/map" element={<InteractiveMapPage />} />
                  <Route path="/polling-units" element={<PollingUnitsPage />} />
                  <Route path="/polling-units/:id" element={<PollingUnitDetailPage />} />
                  <Route path="/methodology" element={<MethodologyPage />} />

                  {/* Secret Management Team Login Routes */}
                  <Route path="/sys-auth/login" element={<LoginPage />} />
                  <Route path="/portal-gateway" element={<LoginPage />} />
                  <Route path="/management-login" element={<LoginPage />} />
                  <Route path="/admin/login" element={<LoginPage />} />

                  {/* Restricted Analytics & Internal Integrity Monitoring Routes */}
                  <Route
                    path="/analytics"
                    element={
                      <ProtectedRoute
                        allowedRoles={[
                          'SUPER_ADMIN',
                          'PROJECT_ADMIN',
                          'ELECTION_ANALYST',
                          'STATE_COORDINATOR',
                          'MONITORING_COORDINATOR',
                        ]}
                      >
                        <AdvancedAnalyticsPage />
                      </ProtectedRoute>
                    }
                  />

                  <Route
                    path="/discrepancies"
                    element={
                      <ProtectedRoute
                        allowedRoles={[
                          'SUPER_ADMIN',
                          'PROJECT_ADMIN',
                          'ELECTION_ANALYST',
                          'STATE_COORDINATOR',
                          'RESULT_VERIFIER',
                          'MONITORING_COORDINATOR',
                        ]}
                      >
                        <DiscrepanciesPage />
                      </ProtectedRoute>
                    }
                  />

                  <Route
                    path="/incidents"
                    element={
                      <ProtectedRoute
                        allowedRoles={[
                          'SUPER_ADMIN',
                          'PROJECT_ADMIN',
                          'STATE_COORDINATOR',
                          'LGA_COORDINATOR',
                          'MONITORING_COORDINATOR',
                          'REGISTERED_OBSERVER',
                        ]}
                      >
                        <IncidentsPage />
                      </ProtectedRoute>
                    }
                  />

                  {/* Role Protected Personnel Routes */}
                  <Route
                    path="/observer-portal"
                    element={
                      <ProtectedRoute
                        allowedRoles={[
                          'REGISTERED_OBSERVER',
                          'STATE_COORDINATOR',
                          'LGA_COORDINATOR',
                          'MONITORING_COORDINATOR',
                          'SUPER_ADMIN',
                          'PROJECT_ADMIN',
                        ]}
                      >
                        <ObserverPortalPage />
                      </ProtectedRoute>
                    }
                  />

                  <Route
                    path="/verification-queue"
                    element={
                      <ProtectedRoute
                        allowedRoles={[
                          'RESULT_VERIFIER',
                          'ELECTION_ANALYST',
                          'STATE_COORDINATOR',
                          'LGA_COORDINATOR',
                          'MONITORING_COORDINATOR',
                          'SUPER_ADMIN',
                          'PROJECT_ADMIN',
                        ]}
                      >
                        <VerificationQueuePage />
                      </ProtectedRoute>
                    }
                  />

                  <Route
                    path="/admin"
                    element={
                      <ProtectedRoute
                        allowedRoles={[
                          'SUPER_ADMIN',
                          'PROJECT_ADMIN',
                          'STATE_COORDINATOR',
                          'LGA_COORDINATOR',
                          'MONITORING_COORDINATOR',
                        ]}
                      >
                        <AdminCommandCentrePage />
                      </ProtectedRoute>
                    }
                  />

                  <Route
                    path="/admin-command-centre"
                    element={
                      <ProtectedRoute
                        allowedRoles={[
                          'SUPER_ADMIN',
                          'PROJECT_ADMIN',
                          'STATE_COORDINATOR',
                          'LGA_COORDINATOR',
                          'MONITORING_COORDINATOR',
                        ]}
                      >
                        <AdminCommandCentrePage />
                      </ProtectedRoute>
                    }
                  />

                  <Route
                    path="/admin-ingestion"
                    element={
                      <ProtectedRoute allowedRoles={['SUPER_ADMIN', 'PROJECT_ADMIN', 'ELECTION_ANALYST']}>
                        <AdminIngestionPage />
                      </ProtectedRoute>
                    }
                  />

                  <Route
                    path="/readiness-testing"
                    element={
                      <ProtectedRoute allowedRoles={['SUPER_ADMIN', 'PROJECT_ADMIN']}>
                        <ReadinessTestingPage />
                      </ProtectedRoute>
                    }
                  />
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
