// src/components/ProtectedRoute.tsx
// COMPLETE ROLE-BASED ACCESS CONTROL COMPONENT
// This component protects routes based on authentication and role
import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';

interface ProtectedRouteProps {
  requireAdmin?: boolean;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ requireAdmin = false }) => {
  // Check authentication
  const token = localStorage.getItem('authToken');
  const userStr = localStorage.getItem('currentUser');

  if (!token || !userStr) {
    // Not logged in → redirect to login
    return <Navigate to="/login" replace />;
  }

  let user;
  try {
    user = JSON.parse(userStr);
  } catch {
    // Invalid user data → redirect to login
    localStorage.removeItem('authToken');
    localStorage.removeItem('currentUser');
    return <Navigate to="/login" replace />;
  }

  // Check if account is pending approval
  if (user.verificationStatus === 'pending') {
    return (
      <div style={{ 
        padding: '40px', 
        textAlign: 'center',
        maxWidth: '600px',
        margin: '100px auto',
        background: '#fef3c7',
        borderRadius: '12px',
        border: '1px solid #f59e0b'
      }}>
        <h2 style={{ color: '#92400e', marginBottom: '16px' }}>⏳ Account Pending Approval</h2>
        <p style={{ color: '#92400e', lineHeight: '1.6' }}>
          Your account is awaiting admin approval. You'll be able to access the system once approved.
        </p>
        <button
          onClick={() => {
            localStorage.removeItem('authToken');
            localStorage.removeItem('currentUser');
            window.location.href = '/login';
          }}
          style={{
            marginTop: '20px',
            padding: '10px 20px',
            background: '#6366f1',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontWeight: 600
          }}
        >
          Back to Login
        </button>
      </div>
    );
  }

  // Check if account is rejected
  if (user.verificationStatus === 'rejected') {
    return (
      <div style={{ 
        padding: '40px', 
        textAlign: 'center',
        maxWidth: '600px',
        margin: '100px auto',
        background: '#fee2e2',
        borderRadius: '12px',
        border: '1px solid #ef4444'
      }}>
        <h2 style={{ color: '#b91c1c', marginBottom: '16px' }}>❌ Account Rejected</h2>
        <p style={{ color: '#b91c1c', lineHeight: '1.6' }}>
          Your account application was not approved. Please contact the administrator for more information.
        </p>
        <button
          onClick={() => {
            localStorage.removeItem('authToken');
            localStorage.removeItem('currentUser');
            window.location.href = '/login';
          }}
          style={{
            marginTop: '20px',
            padding: '10px 20px',
            background: '#6366f1',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontWeight: 600
          }}
        >
          Back to Login
        </button>
      </div>
    );
  }

  // Check admin requirement
  if (requireAdmin && user.role !== 'admin') {
    // Non-admin trying to access admin route → 403
    return (
      <div style={{ 
        padding: '40px', 
        textAlign: 'center',
        maxWidth: '600px',
        margin: '100px auto',
        background: '#fee2e2',
        borderRadius: '12px',
        border: '1px solid #ef4444'
      }}>
        <h2 style={{ color: '#b91c1c', marginBottom: '16px' }}>🚫 Access Denied</h2>
        <p style={{ color: '#b91c1c', lineHeight: '1.6', marginBottom: '8px' }}>
          You don't have permission to access this page.
        </p>
        <p style={{ color: '#b91c1c', lineHeight: '1.6' }}>
          This area is restricted to administrators only.
        </p>
        <button
          onClick={() => window.history.back()}
          style={{
            marginTop: '20px',
            padding: '10px 20px',
            background: '#6366f1',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontWeight: 600
          }}
        >
          Go Back
        </button>
      </div>
    );
  }

  // All checks passed → render children
  return <Outlet />;
};

export default ProtectedRoute;