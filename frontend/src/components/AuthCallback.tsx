import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useUserStore } from '../store';

/**
 * This component is a callback handler for the OAuth redirect flow.
 * It runs on the client-side after the backend redirects the user back from Google.
 */
const AuthCallback = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const setUser = useUserStore((state) => state.setUser);

  useEffect(() => {
    const token = searchParams.get('token');

    if (token) {
      // 1. Save the token to local storage for future authenticated requests
      localStorage.setItem('token', token);

      try {
        // 2. Decode the user payload from the JWT.
        // The payload is the middle part of the token, Base64 encoded.
        const payload = JSON.parse(atob(token.split('.')[1]));
        
        // 3. Set the user in the global store
        // Note: This assumes the backend is putting the user object in the token.
        setUser({
          id: payload.id,
          username: payload.username,
          email: payload.email,
          profilePicture: payload.profilePicture
        });

        // 4. Redirect to the homepage, now logged in.
        navigate('/');

      } catch (e) {
        console.error("Failed to decode token or set user:", e);
        navigate('/login?error=invalid_token');
      }

    } else {
      // If no token is found, redirect to the login page with an error.
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
