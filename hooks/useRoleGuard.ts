// hooks/useRoleGuard.ts
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export const useRoleGuard = (allowedRoles: string[]) => {
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const checkAuth = () => {
      const token = localStorage.getItem('token');
      const userStr = localStorage.getItem('user');

      if (!token || !userStr) {
        setIsAuthorized(false);
        setLoading(false);
        // Redirect to landing page instead of login
        router.replace('/');
        return;
      }

      try {
        const user = JSON.parse(userStr);
        
        if (allowedRoles.includes(user.role)) {
          setIsAuthorized(true);
        } else {
          setIsAuthorized(false);
          // Redirect to appropriate dashboard based on role
          const roleRoutes: Record<string, string> = {
            'admin': '/admin/dashboard',
            'hospital': '/hospital/dashboard',
            'donor': '/donors/dashboard' // ← FIX: Changed from '/donor/dashboard' to '/donors/dashboard'
          };
          router.replace(roleRoutes[user.role] || '/');
        }
      } catch (error) {
        console.error('Error parsing user data:', error);
        setIsAuthorized(false);
        router.replace('/');
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, [router, allowedRoles]);

  return { isAuthorized, loading };
};