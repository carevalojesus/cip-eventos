import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"

// Componentes de Shadcn (se asume que ya los instalaste con npx shadcn@latest add form input button)
import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import api from "@/lib/api"
import { useAuthStore } from "@/store/auth.store"

// 1. Definir el esquema (Igual que tu DTO del backend)
const loginSchema = z.object({
  email: z.string().email({ message: "Correo inválido" }),
  password: z.string().min(6, { message: "La contraseña debe tener al menos 6 caracteres" }),
})

// 2. Inferir el tipo automáticamente (No hace falta crear interface manual)
type LoginFormValues = z.infer<typeof loginSchema>

export function LoginForm() {
  const login = useAuthStore((state) => state.login)

  // 3. Hook del formulario
  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema), // Conecta Zod con el Form
    defaultValues: {
      email: "",
      password: "",
    },
  })

  // 4. Submit Handler
  async function onSubmit(data: LoginFormValues) {
    try {
      const res = await api.post('/auth/login', data)
      login(res.data.access_token, res.data.user)
      window.location.href = '/admin'
    } catch (error) {
      // Puedes setear errores generales en el formulario si falla la API
      form.setError("root", { 
        message: "Credenciales incorrectas" 
      })
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Correo Electrónico</FormLabel>
              <FormControl>
                <Input placeholder="admin@cip.org.pe" {...field} />
              </FormControl>
              <FormMessage /> {/* Aquí sale el error de Zod automático */}
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
                <Input type="password" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {form.formState.errors.root && (
            <div className="text-red-500 text-sm">
                {form.formState.errors.root.message}
            </div>
        )}

        <Button type="submit" className="w-full">
          Ingresar
        </Button>
      </form>
    </Form>
  )
}