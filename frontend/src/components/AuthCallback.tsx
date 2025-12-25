import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useUserStore } from '../store';

const AuthCallback = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const setUser = useUserStore((state) => state.setUser);

  useEffect(() => {
    const token = searchParams.get('token');

    if (token) {

      localStorage.setItem('token', token);

      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        setUser({
          id: payload.id,
          username: payload.username,
          email: payload.email,
          profilePicture: payload.profilePicture
        });

        navigate('/');

      } catch (e) {
        console.error("Failed to decode token or set user:", e);
        navigate('/login?error=invalid_token');
      }

    } else {
      navigate('/login?error=authentication_failed');
    }
  }, [navigate, searchParams, setUser]);

  return (
    <div className="w-full min-h-screen flex items-center justify-center">
      <p className="text-lg animate-pulse">Please wait, logging you in...</p>
    </div>
  );
};

export default AuthCallback;
