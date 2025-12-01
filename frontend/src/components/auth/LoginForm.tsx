import { useTranslation } from 'react-i18next'
import { Mail, Lock } from 'lucide-react'

import { Button } from '@/components/ui/rui-button'
import { Input } from '@/components/ui/rui-input'
import { Checkbox } from '@/components/ui/rui-checkbox'
import { Link } from '@/components/ui/rui-link'

import { useAuthStore } from '@/store/auth.store'
import { getCurrentLocale, routes } from '@/lib/routes'
import { useLoginForm } from '@/hooks/useLoginForm'

interface LoginFormProps {
  onSuccess?: () => void
}

export function LoginForm({ onSuccess }: LoginFormProps) {
  const { t } = useTranslation()
  const login = useAuthStore((state) => state.login)

  const {
    email,
    setEmail,
    password,
    setPassword,
    rememberMe,
    setRememberMe,
    isLoading,
    errors,
    handleSubmit,
  } = useLoginForm({ t, login, onSuccess })

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
          inputSize="lg"
          leftIcon={<Mail size={16} />}
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
          inputSize="lg"
          leftIcon={<Lock size={16} />}
          showPasswordToggle
          showPasswordLabel={t('login.show_password')}
          hidePasswordLabel={t('login.hide_password')}
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
          <div style={errorStyles} role="alert">
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              aria-label="Error"
            >
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
            size="lg"
            isLoading={isLoading}
            loadingText={t('login.loading')}
            loadingAriaLabel={t('login.loading_aria')}
          >
            {t('login.btn')}
          </Button>
        </div>
      </form>

      {/* Footer */}
      <div style={footerStyles}>
        <p style={{ margin: 0 }}>
          © {new Date().getFullYear()} <Link href="https://devcloud.pe" target="_blank" rel="noopener noreferrer">{t('login.footer.company')}</Link>
        </p>
      </div>
    </div>
  )
}
