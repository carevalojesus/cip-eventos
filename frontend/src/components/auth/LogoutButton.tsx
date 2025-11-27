import { useAuthStore } from '@/store/auth.store';
import { Button } from '@/components/ui/button';

export default function LogoutButton() {
  const logout = useAuthStore((state) => state.logout);

  const handleLogout = () => {
    logout();
    window.location.href = '/login';
  };

  return (
    <Button variant="destructive" onClick={handleLogout}>
      Cerrar Sesión
    </Button>
  );
}
