import { Navigate } from 'react-router-dom';
import { isAuthenticated } from '@/services/authService';

interface PrivateRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute = ({ children }: PrivateRouteProps) => {
  if (!isAuthenticated()) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
