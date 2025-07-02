// RequireAdmin.jsx
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function RequireAdmin({ children }) {
  const navigate = useNavigate();
  const [isAllowed, setIsAllowed] = useState(null); // null = checking

  useEffect(() => {
    const adminPhone = '09112233444';
    const user = JSON.parse(localStorage.getItem('user'));

    if (user && user.phone_number === adminPhone) {
      setIsAllowed(true);
    } else {
      navigate('/login', { replace: true });
    }
  }, [navigate]);

  if (isAllowed === null) {
    return null; // Render nothing while checking (no flicker!)
  }

  return children;
}
