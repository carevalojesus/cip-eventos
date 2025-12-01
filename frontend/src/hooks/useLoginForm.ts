import { useState, useEffect, type FormEvent } from 'react'
import { type TFunction } from 'react-i18next'
import axios from 'axios'

import api from '@/lib/api'
import { getCurrentLocale, routes } from '@/lib/routes'

export interface LoginFormErrors {
  email?: string
  password?: string
  global?: string
}

export interface UseLoginFormParams {
  t: TFunction
  login: (token: string, user: any, rememberMe: boolean) => void
  onSuccess?: () => void
}

export interface UseLoginFormReturn {
  email: string
  setEmail: (value: string) => void
  password: string
  setPassword: (value: string) => void
  rememberMe: boolean
  setRememberMe: (value: boolean) => void
  isLoading: boolean
  errors: LoginFormErrors
  validationMessage: string
  handleSubmit: (e: FormEvent) => Promise<void>
}

export function useLoginForm({ t, login, onSuccess }: UseLoginFormParams): UseLoginFormReturn {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [rememberMe, setRememberMe] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [errors, setErrors] = useState<LoginFormErrors>({})
  const [validationMessage, setValidationMessage] = useState('')

  // Announce validation errors to screen readers
  useEffect(() => {
    if (errors.email || errors.password) {
      const errorFields = []
      if (errors.email) errorFields.push(t('login.email'))
      if (errors.password) errorFields.push(t('login.password'))

      const message = errorFields.length > 0
        ? `${t('errors.validation')}: ${errorFields.join(', ')}`
        : ''

      setValidationMessage(message)
    } else {
      setValidationMessage('')
    }
  }, [errors.email, errors.password, t])

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

  return {
    email,
    setEmail,
    password,
    setPassword,
    rememberMe,
    setRememberMe,
    isLoading,
    errors,
    validationMessage,
    handleSubmit,
  }
}
