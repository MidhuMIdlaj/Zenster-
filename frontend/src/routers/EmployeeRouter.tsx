// src/routers/CoordinatorRouters.ts
import { Outlet, RouteObject } from 'react-router-dom';
import CoordinatorLayout from '../pages/coordinator/CoordinatorLayout';
import EmployeeDashboard from '../pages/coordinator/Dashboard';
import UserManagement from '../pages/coordinator/userManagement';
import EmployeeProtectedRoute from '../components/EmployeeProtectedRoute';
import ComplaintManagement from '../pages/coordinator/ComplaintManagement';
import ChatWithAdmin from '../pages/coordinator/ChatWithAdmin';
import CoordinatorProfilePage from '../pages/coordinator/ProfilePage'

const coordinatorRoutes: RouteObject[] = [
  {
    element: (
      <EmployeeProtectedRoute allowedPositions={['coordinator']}>
        <Outlet />
      </EmployeeProtectedRoute>
    ),
    children: [
      {
        element: <CoordinatorLayout />,
        children: [
          {
            path: '/coordinator/dashboard',
            element: <EmployeeDashboard />,
          },
          {
            path: '/employee/dashboard',
            element: <EmployeeDashboard />,
          },
          {
            path: '/user-management',
            element: <UserManagement />,
          },

          {
            path: '/complaint-management',
            element: <ComplaintManagement />,
          },
          {
            path: '/employee-chat',
            element: <ChatWithAdmin />,
          },
          // Add other coordinator routes here
          // {
          //   path: '/complaint-management',
          //   element: <ComplaintManagement />,
          // },
          // {
          //   path: '/notification',
          //   element: <NotificationPage />,
          // },
          {
            path: 'employee/profile',
            element : <CoordinatorProfilePage/>
          }
        ],
      },
    ],
  },
];

export default coordinatorRoutes;