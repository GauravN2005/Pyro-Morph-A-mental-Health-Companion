import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './AuthContext';

export default function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();

  // Show nothing while checking session (avoids flash)
  if (loading) {
    return (
      <div className="min-h-screen bg-[#060610] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div
            className="w-12 h-12 rounded-2xl flex items-center justify-center"
            style={{
              background: 'linear-gradient(135deg, #7c3aed, #06b6d4)',
              boxShadow: '0 0 30px rgba(124,58,237,0.5)',
            }}
          >
            <span className="text-2xl">🔥</span>
          </div>
          <div className="flex gap-1">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="w-2 h-2 rounded-full bg-violet-400"
                style={{ animation: `bounce 1s ease-in-out ${i * 0.15}s infinite` }}
              />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    // Save where they were trying to go
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
}
