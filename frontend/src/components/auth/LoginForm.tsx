import { useState, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import axios from 'axios'

import { Button } from '@/components/ui/rui-button'
import { Input } from '@/components/ui/rui-input'
import { Checkbox } from '@/components/ui/rui-checkbox'
import { Link } from '@/components/ui/rui-link'

import api from '@/lib/api'
import { useAuthStore } from '@/store/auth.store'
import { getCurrentLocale, routes } from '@/lib/routes'

interface LoginFormProps {
  onSuccess?: () => void
}

export function LoginForm({ onSuccess }: LoginFormProps) {
  const { t } = useTranslation()
  const login = useAuthStore((state) => state.login)

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [rememberMe, setRememberMe] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [errors, setErrors] = useState<{ email?: string; password?: string; global?: string }>({})

  const validate = () => {
    const newErrors: { email?: string; password?: string } = {}

    if (!email) {
      newErrors.email = t('login.validation.email_required')
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = t('login.validation.email_invalid')
    }

    if (!password) {
      newErrors.password = t('login.validation.password_required')
    } else if (password.length < 8) {
      newErrors.password = t('login.validation.password_min_length')
    } else if (!/[A-Z]/.test(password)) {
      newErrors.password = t('login.validation.password_uppercase')
    } else if (!/[0-9]/.test(password)) {
      newErrors.password = t('login.validation.password_number')
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()

    if (!validate()) return

    setIsLoading(true)
    setErrors({})

    try {
      const response = await api.post('/auth/login', { email, password })
      login(response.data.access_token, response.data.user, rememberMe)

      if (onSuccess) {
        onSuccess()
      } else {
        const locale = getCurrentLocale()
        window.location.href = routes[locale].home
      }
    } catch (err) {
      if (axios.isAxiosError(err)) {
        const msg = err.response?.data?.message || t('errors.network')
        setErrors({ global: Array.isArray(msg) ? msg[0] : msg })
      } else if (err instanceof Error) {
        setErrors({ global: err.message })
      } else {
        setErrors({ global: t('errors.unknown') })
      }
    } finally {
      setIsLoading(false)
    }
  }

  const containerStyles: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: 'var(--space-8)',
    width: '100%',
    maxWidth: '360px',
  }

  const headerStyles: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: 'var(--space-2)',
  }

  const titleStyles: React.CSSProperties = {
    fontSize: '24px',
    fontWeight: 600,
    color: 'var(--color-grey-900)',
    margin: 0,
    lineHeight: 1.3,
  }

  const subtitleStyles: React.CSSProperties = {
    fontSize: '16px',
    color: 'var(--color-grey-500)',
    margin: 0,
    lineHeight: 1.6,
  }

  const formStyles: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: 'var(--space-5)',
  }

  const rowStyles: React.CSSProperties = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  }

  const errorStyles: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: 'var(--space-2)',
    padding: 'var(--space-3)',
    backgroundColor: 'var(--color-danger-light)',
    color: 'var(--color-danger)',
    borderRadius: 'var(--radius-md)',
    fontSize: '0.875rem',
  }

  const footerStyles: React.CSSProperties = {
    textAlign: 'center',
    fontSize: '0.875rem',
    color: 'var(--color-grey-500)',
  }

  return (
    <div style={containerStyles}>
      {/* Header */}
      <div style={headerStyles}>
        <h1 style={titleStyles}>{t('login.title')}</h1>
        <p style={subtitleStyles}>{t('login.subtitle')}</p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} style={formStyles}>
        <Input
          label={t('login.email')}
          type="email"
          name="email"
          placeholder={t('login.email_placeholder')}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          error={errors.email}
          autoComplete="email"
        />

        <Input
          label={t('login.password')}
          type="password"
          name="password"
          placeholder={t('login.password_placeholder')}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          error={errors.password}
          autoComplete="current-password"
        />

        {/* Checkbox + Forgot password */}
        <div style={rowStyles}>
          <Checkbox
            label={t('login.remember_me')}
            checked={rememberMe}
            onChange={(e) => setRememberMe(e.target.checked)}
          />
          <Link href={routes[getCurrentLocale()].forgotPassword} variant="muted">
            {t('login.forgot_password')}
          </Link>
        </div>

        {/* Global Error */}
        {errors.global && (
          <div style={errorStyles}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            <span>{errors.global}</span>
          </div>
        )}

        {/* Submit Button */}
        <div style={{ marginTop: 'var(--space-2)' }}>
          <Button
            type="submit"
            fullWidth
            isLoading={isLoading}
            loadingText={t('login.loading')}
          >
            {t('login.btn')}
          </Button>
        </div>
      </form>

      {/* Footer */}
      <div style={footerStyles}>
        <p style={{ margin: 0 }}>
          © {new Date().getFullYear()} <Link href="https://devcloud.pe" target="_blank" rel="noopener noreferrer">Devcloud</Link>
        </p>
      </div>
    </div>
  )
}
