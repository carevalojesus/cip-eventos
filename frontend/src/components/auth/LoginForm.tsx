import { useState } from 'react';
import api from '@/lib/api';
import { useAuthStore } from '@/store/auth.store';
import { Button } from '@/components/ui/button'; // Shadcn

export default function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const login = useAuthStore((state) => state.login);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { data } = await api.post('/auth/login', { email, password });
      login(data.access_token, data.user);
      alert('¡Login exitoso! Token guardado.');
      window.location.href = '/dashboard'; // Redirigir al dashboard
    } catch (error) {
      alert('Error al iniciar sesión');
      console.error(error);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4 p-4 border rounded max-w-sm mx-auto mt-10">
      <h2 className="text-xl font-bold">Ingreso CIP</h2>
      <input
        type="email"
        placeholder="Email"
        className="p-2 border rounded"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      <input
        type="password"
        placeholder="Contraseña"
        className="p-2 border rounded"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />
      <Button type="submit">Ingresar</Button>
    </form>
  );
}