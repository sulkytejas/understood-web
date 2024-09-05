import { Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';

const ProtectedRoute = ({ children }) => {
  const user = useSelector((state) => state.user); // Assuming user data is stored in Redux

  if (!user?.username) {
    // User is not logged in, redirect to login
    return <Navigate to="/login" />;
  }

  // User is logged in, allow access to the page
  return children;
};

export default ProtectedRoute;
