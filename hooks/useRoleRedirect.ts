// hooks/useRoleRedirect.ts
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export const useRoleRedirect = () => {
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userStr = localStorage.getItem('user');

    if (!token || !userStr) {
      router.push('/auth/login');
      return;
    }

    try {
      const user = JSON.parse(userStr);
      
      // Redirect based on role
      const roleRoutes: Record<string, string> = {
        'admin': '/admin/dashboard',
        'hospital': '/hospital/dashboard',
        'donor': '/user/dashboard'
      };
      
      router.push(roleRoutes[user.role] || '/user/dashboard');
    } catch (error) {
      console.error('Error parsing user data:', error);
      router.push('/auth/login');
    }
  }, [router]);
};