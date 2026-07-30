import { useSelector } from 'react-redux';
import { useMemo } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';

const AdminProtectedRoute = () => {
  const location = useLocation();
  
  // Select individual values to avoid object recreation on every render
  const isAuthenticated = useSelector((state: any) => state.adminAuth?.isAuthenticated || false);
  const isLoading = useSelector((state: any) => state.adminAuth?.isLoading || false);
  const adminData = useSelector((state: any) => state.adminAuth?.adminData || null);

  if (!isLoading && !isAuthenticated && !adminData) {
    return <Navigate to="/admin-login" state={{ from: location }} replace />;
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Verifying authentication...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/admin-login" state={{ from: location }} replace />;
  }
  
  return <Outlet />;
};

export default AdminProtectedRoute;