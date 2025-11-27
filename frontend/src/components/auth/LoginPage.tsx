import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { HardHat, ChevronRight, AlertCircle, Loader2 } from "lucide-react";

// Componentes Shadcn (Usando alias @)
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

// Lógica del Proyecto
import api from "@/lib/api";
import { useAuthStore } from "@/store/auth.store";
import { cn } from "@/lib/utils";

// --- Schema Definition (Igual a tu DTO) ---
const loginSchema = z.object({
  email: z
    .string()
    .email({ message: "Ingresa un correo institucional válido" }),
  password: z
    .string()
    .min(6, { message: "La contraseña debe tener al menos 6 caracteres" }),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export const LoginPage: React.FC = () => {
  const [globalError, setGlobalError] = useState<string | null>(null);
  const login = useAuthStore((state) => state.login);

  // Hook del formulario
  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const { isSubmitting } = form.formState;

  const onSubmit = async (data: LoginFormValues) => {
    setGlobalError(null);
    try {
      // 1. Llamada al Backend
      const response = await api.post("/auth/login", data);

      // 2. Guardar en Zustand (Orden: Token, luego User)
      // Nota: Tu backend devuelve 'access_token', no 'token'
      login(response.data.access_token, response.data.user);

      // 3. Redirección (Astro maneja rutas como archivos)
      window.location.href = "/admin";
    } catch (err: any) {
      console.error(err);
      // Manejo de errores del Backend
      const msg =
        err.response?.data?.message || "Error de conexión con el servidor";
      setGlobalError(Array.isArray(msg) ? msg[0] : msg);
    }
  };

  return (
    <div className="container relative h-screen flex-col items-center justify-center md:grid lg:max-w-none lg:grid-cols-2 lg:px-0">
      {/* Panel Izquierdo - Imagen Institucional */}
      <div className="relative hidden h-full flex-col bg-muted p-10 text-white dark:border-r lg:flex">
        {/* Imagen de fondo (Capa Base) */}
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage:
              'url("http://localhost:9000/avatars/background-cip.webp")',
          }}
        />

        {/* Overlay Oscuro (Capa Superior) */}
        <div className="absolute inset-0 bg-neutral-900/80" />

        {/* Logo y Marca */}
        <div className="relative z-20 flex items-center gap-4">
          <img
            src="http://localhost:9000/avatars/cip.svg"
            alt="Logo CIP"
            className="h-16 w-auto drop-shadow-2xl"
          />
          {/* Separador Vertical */}
          <div className="h-12 w-px bg-white/80" />

          <div
            className="flex flex-col justify-center text-white tracking-widest uppercase"
            style={{ fontFamily: "Arial, sans-serif" }}
          >
            <span className="text-lg font-semibold leading-none drop-shadow-md">
              Consejo Departamental
            </span>
            <span className="text-lg font-semibold leading-none mt-1 text-primary-foreground drop-shadow-md">
              De Loreto
            </span>
          </div>
        </div>

        {/* Cita o Mensaje Institucional */}
        <div className="relative z-20 mt-auto">
          <blockquote className="space-y-2 border-l-4 border-primary pl-4">
            <p className="text-lg italic text-gray-200">
              &ldquo;La ingeniería no es solo saber y conocer, sino hacer saber
              y hacer conocer.&rdquo;
            </p>
            <footer className="text-sm font-bold text-primary">
              Colegio de Ingenieros del Perú
            </footer>
          </blockquote>
        </div>
      </div>

      {/* Panel Derecho - Formulario */}
      <div className="relative flex h-full items-center p-4 lg:p-8 bg-background">
        <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px]">
          <div className="flex flex-col space-y-2 text-center">
            <h1 className="text-3xl font-bold tracking-tight text-foreground">
              Bienvenido
            </h1>
            <p className="text-sm text-muted-foreground">
              Ingresa tus credenciales para acceder al panel.
            </p>
          </div>

          {/* Formulario con Shadcn */}
          <div className="grid gap-6">
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-4"
              >
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Correo Electrónico</FormLabel>
                      <FormControl>
                        <Input placeholder="admin@cip.org.pe" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Contraseña</FormLabel>
                      <FormControl>
                        <Input
                          type="password"
                          placeholder="••••••••"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Mensaje de Error Global del Backend */}
                {globalError && (
                  <div className="flex items-center gap-2 rounded-md bg-destructive/10 p-3 text-sm text-destructive animate-in fade-in slide-in-from-top-2">
                    <AlertCircle className="h-4 w-4" />
                    <span className="font-medium">{globalError}</span>
                  </div>
                )}

                <Button
                  disabled={isSubmitting}
                  type="submit"
                  className="w-full font-bold"
                  size="lg"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Ingresando...
                    </>
                  ) : (
                    <>
                      Ingresar al Sistema
                      <ChevronRight className="ml-2 h-4 w-4" />
                    </>
                  )}
                </Button>

                <div className="relative my-6">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-background px-2 text-muted-foreground">
                      ¿Problemas de acceso?
                    </span>
                  </div>
                </div>

                <div className="text-center text-sm text-muted-foreground space-y-4">
                  <p>
                    Contacta a{" "}
                    <strong className="text-foreground">Soporte TI</strong> si
                    olvidaste tu contraseña.
                  </p>
                </div>
              </form>
            </Form>
          </div>
        </div>

        <div className="absolute bottom-6 left-0 right-0 text-center text-xs text-muted-foreground">
          <p>
            Plataforma oficial del{" "}
            <span className="font-semibold text-foreground">
              Consejo Departamental
            </span>
          </p>
          <p className="mt-2">
            Desarrollado con ❤️ por{" "}
            <span className="font-bold text-primary">Devcloud</span>
          </p>
        </div>
      </div>
    </div>
  );
};
