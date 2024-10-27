import { Navigate, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';

const ProtectedRoute = ({ children }) => {
  const username = useSelector((state) => state.user.username); // Assuming user data is stored in Redux
  const location = useLocation();

  if (!username) {
    // User is not logged in, redirect to login
    const redirectURL = encodeURIComponent(location.search);
    return <Navigate to={`/login?redirect=${redirectURL}`} />;
  }

  // User is logged in, allow access to the page
  return children;
};

export default ProtectedRoute;
