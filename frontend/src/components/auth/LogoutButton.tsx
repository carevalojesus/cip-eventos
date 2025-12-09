import { useAuthStore } from '@/store/auth.store';
import { Button } from '@/components/ui/button';
import { getCurrentLocale, routes } from '@/lib/routes';

export default function LogoutButton() {
  const logout = useAuthStore((state) => state.logout);

  const handleLogout = async () => {
    await logout();
    const locale = getCurrentLocale();
    window.location.href = routes[locale].login;
  };

  return (
    <Button variant="destructive" onClick={handleLogout}>
      Cerrar Sesión
    </Button>
  );
}
