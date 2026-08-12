import { useAuthStore } from '../store/authStore';
import { authService } from '../services/authService';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

export const useAuth = () => {
  const { user, accessToken, setAuth, clearAuth, isAuthenticated, isAdmin } = useAuthStore();
  const navigate = useNavigate();

  const login = async (username: string, password: string, rememberMe = false) => {
    const res = await authService.login({ username, password, rememberMe });
    setAuth(res.data.user as any, res.data.accessToken);
    navigate('/dashboard');
  };

  const logout = async () => {
    try { await authService.logout(); } catch {}
    clearAuth();
    navigate('/login');
    toast.success('Logged out successfully');
  };

  return { user, accessToken, login, logout, isAuthenticated, isAdmin };
};