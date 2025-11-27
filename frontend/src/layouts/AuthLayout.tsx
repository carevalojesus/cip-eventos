import React from "react";
import { HardHat } from "lucide-react";

interface AuthLayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle: string;
  backgroundImage?: string;
  quote?: string;
}

export const AuthLayout: React.FC<AuthLayoutProps> = ({
  children,
  title,
  subtitle,
  backgroundImage = "https://images.unsplash.com/photo-1503387762-592deb58ef4e?q=80&w=2831&auto=format&fit=crop",
  quote = "La ingeniería no es solo saber y conocer, sino hacer saber y hacer conocer.",
}) => {
  return (
    <div className="container relative h-screen flex-col items-center justify-center md:grid lg:max-w-none lg:grid-cols-2 lg:px-0">
      {/* 🎨 PANEL IZQUIERDO (Visual) */}
      <div className="relative hidden h-full flex-col bg-muted p-10 text-white dark:border-r lg:flex">
        <div className="absolute inset-0 bg-neutral-900" />
        <div
          className="absolute inset-0 bg-cover bg-center opacity-40 mix-blend-overlay"
          style={{ backgroundImage: `url("${backgroundImage}")` }}
        />

        <div className="relative z-20 flex items-center text-lg font-medium">
          <div className="bg-primary/90 p-2 rounded-lg mr-2">
            <HardHat className="h-6 w-6 text-white" />
          </div>
          <span>CIP Eventos</span>
        </div>

        <div className="relative z-20 mt-auto">
          <blockquote className="space-y-2 border-l-4 border-primary pl-4">
            <p className="text-lg italic text-gray-200">
              &ldquo;{quote}&rdquo;
            </p>
            <footer className="text-sm font-bold text-primary">
              Colegio de Ingenieros del Perú
            </footer>
          </blockquote>
        </div>
      </div>

      {/* 📝 PANEL DERECHO (Formulario) */}
      <div className="flex h-full items-center p-4 lg:p-8 bg-background">
        <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px]">
          <div className="flex flex-col space-y-2 text-center">
            <h1 className="text-3xl font-bold tracking-tight text-foreground">
              {title}
            </h1>
            <p className="text-sm text-muted-foreground">{subtitle}</p>
          </div>

          {/* Aquí se inyecta el formulario específico */}
          {children}

          <p className="px-8 text-center text-sm text-muted-foreground">
            Plataforma oficial del <br />
            <span className="font-semibold text-foreground">
              Consejo Departamental
            </span>
          </p>
        </div>
      </div>
    </div>
  );
};
