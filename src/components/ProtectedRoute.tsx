import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldAlert, Lock, ArrowLeft } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { UserRole } from '../types';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles: UserRole[];
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, allowedRoles }) => {
  const { role, isAuthenticated } = useAuth();

  const isAllowed = allowedRoles.includes(role);

  if (!isAllowed) {
    return (
      <div className="max-w-xl mx-auto py-16 px-4 text-center">
        <div className="bg-white p-8 rounded-xl border border-slate-200 shadow-sm space-y-4">
          <div className="w-12 h-12 bg-amber-100 text-amber-800 rounded-full flex items-center justify-center mx-auto">
            <Lock className="w-6 h-6" />
          </div>

          <h2 className="text-lg font-bold text-slate-900 tracking-tight">
            Restricted Operational Section
          </h2>

          <p className="text-xs text-slate-600 leading-relaxed">
            This module is reserved exclusively for authorized electoral personnel. Your current profile (
            <span className="font-semibold text-slate-900 font-mono text-[11px]">
              {role.replace(/_/g, ' ')}
            </span>
            ) does not have access permissions for this section.
          </p>

          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-2">
            <Link
              to="/"
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md text-xs font-semibold transition-colors flex items-center gap-1.5"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Return to Public Dashboard</span>
            </Link>

            {!isAuthenticated && (
              <Link
                to="/sys-auth/login"
                className="px-4 py-2 bg-emerald-800 hover:bg-emerald-700 text-white rounded-md text-xs font-semibold transition-colors shadow-2xs"
              >
                Sign In with Authorized Credentials
              </Link>
            )}
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};
