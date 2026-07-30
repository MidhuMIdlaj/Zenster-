import { Navigate, useLocation } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { ReactNode, useEffect } from 'react';
import { selectAdminAuthData, selectEmployeeAuthData } from '../store/selectors';
import { clearEmployeeSession } from '../utils/authUtils';

interface PublicOnlyRouteProps {
  children: ReactNode;
}

const PublicOnlyRoute = ({ children }: PublicOnlyRouteProps) => {
  const location = useLocation();
  const dispatch = useDispatch();
  const { isAuthenticated: isAdminAuthenticated, isLoading: isLoadingAdmin } = 
    useSelector(selectAdminAuthData);
  const { isAuthenticated: isEmployeeAuthenticated, employeeData } = 
    useSelector(selectEmployeeAuthData);
 let isLoadingEmployee = false;
  if (isLoadingAdmin || isLoadingEmployee) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  const isEmployeeResetPasswordPage = location.pathname.startsWith('/reset-password');

  useEffect(() => {
    if (isEmployeeResetPasswordPage) {
      clearEmployeeSession();
    }
  }, [isEmployeeResetPasswordPage]);

  if (isAdminAuthenticated && !isEmployeeResetPasswordPage) {
    return <Navigate to="/admin/dashboard" replace />;
  }
  
  if (isEmployeeAuthenticated && employeeData?.token && !isEmployeeResetPasswordPage) {
    const redirectPath = employeeData?.position === 'mechanic' 
      ? '/mechanic/dashboard' 
      : '/coordinator/dashboard';
    return <Navigate to={redirectPath} replace />;
  }

  return <>{children}</>;
};

export default PublicOnlyRoute;
