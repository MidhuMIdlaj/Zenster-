import { Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { ReactNode } from 'react';
import { selectEmployeeAuthData } from '../store/selectors';

interface EmployeeProtectedRouteProps {
  children: ReactNode;
  allowedPositions?: string[]; 
}

const EmployeeProtectedRoute = ({ children, allowedPositions }: EmployeeProtectedRouteProps) => {
  const { isAuthenticated, employeeData, loading } = useSelector(selectEmployeeAuthData);

 

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !employeeData || !employeeData.position) {
    console.warn('[EmployeeProtectedRoute] redirecting to login because auth is missing or invalid', {
      isAuthenticated,
      employeeData,
    });
    return <Navigate to="/employee-login" replace />;
  }

  const position = employeeData.position?.toLowerCase();
  if (allowedPositions && position && !allowedPositions.some(pos => 
    position.includes(pos.toLowerCase()))) {
    console.warn('[EmployeeProtectedRoute] unauthorized role for route', {
      position,
      allowedPositions,
    });
    return <Navigate to="/unauthorized" replace />;
  }

  return <>{children}</>;
};

export default EmployeeProtectedRoute;