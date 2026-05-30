import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { useForm } from '../hooks/useForm'
import { validateLogin } from '../utils/validators'

/**
 * LoginPage — authenticates an existing user.
 */
export default function LoginPage() {
  const { login, loading } = useAuth()
  const navigate = useNavigate()
  const [serverError, setServerError] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  const { values, errors, handleChange, setError, reset } = useForm({
    email: '',
    password: '',
  })

  // Bersihkan form setiap kali halaman login di-mount (misal setelah logout)
  useEffect(() => {
    reset()
  }, [])

  async function handleSubmit(e) {
    e.preventDefault()
    setServerError('')

    const { email, password } = values
    const result = await login({ email, password })
    if (!result.success) {
      setServerError(result.message)
      return
    }
    navigate('/')
  }
  const handleAdminLogin = () => {
    localStorage.setItem('isAdmin', 'true');
    navigate('/dashboard', { state: { isAdmin: true } });
  }

  return (
    <div className="min-h-screen flex flex-col bg-white">
      {/* Hero Section with Background Image */}
      <div className="relative h-[280px] sm:h-[320px] md:h-[360px] w-full overflow-hidden">
        {/* Background Image */}
        <img
          src="/fish.jpg"
          alt="Fish background"
          className="h-full w-full object-cover"
        />

        {/* Overlay Gradient */}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-white/40 to-white" />

        {/* Branding */}
        <div className="absolute inset-0 flex flex-col items-center justify-center px-4 text-center">
          <div className="mb-3 flex items-center gap-3">
            <div className="flex h-16 w-16 items-center justify-center rounded-full border-2 border-[#FB7D00] bg-[#FB7D00]/10 text-2xl font-bold text-[#FB7D00]">
              ♞
            </div>

            <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight text-[#FB7D00]">
              GLP
            </h1>
          </div>

          <p className="text-sm sm:text-base md:text-lg font-medium text-[#FB7D00] tracking-wide">
            Smartfish Quality Control
          </p>
        </div>
      </div>

      {/* Form Section */}
      <div className="flex-1 flex justify-center px-4 py-8 sm:py-10 md:py-12">
        <div className="w-full max-w-[420px]">
          <form onSubmit={handleSubmit} noValidate className="space-y-6">
            {/* Email */}
            <div>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                placeholder="Email or Username"
                value={values.email}
                onChange={handleChange}
                className="w-full border-0 border-b-2 border-gray-300 bg-transparent px-0 py-2 text-sm text-gray-900 placeholder:text-gray-400 outline-none transition focus:border-[#FB7D00] focus:ring-0"
              />

              {errors.email && (
                <p className="mt-2 text-xs text-red-500">{errors.email}</p>
              )}
            </div>

            {/* Password */}
            <div>
              <input
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                placeholder="Password"
                value={values.password}
                onChange={handleChange}
                className="w-full border-0 border-b-2 border-gray-300 bg-transparent px-0 py-2 text-sm text-gray-900 placeholder:text-gray-400 outline-none transition focus:border-[#FB7D00] focus:ring-0"
              />

              {errors.password && (
                <p className="mt-2 text-xs text-red-500">{errors.password}</p>
              )}
            </div>

            {/* Forgot Password Link */}
            <div className="text-right">
              <Link
                to="/forgot-password"
                className="text-xs font-medium text-[#FB7D00] hover:opacity-80 transition"
              >
                Forgot Password?
              </Link>
            </div>

            {/* Server error */}
            {serverError && (
              <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-center text-xs text-red-600 font-medium">
                {serverError}
              </div>
            )}

            {/* Login Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#FB7D00] hover:bg-[#E26C00] text-white font-semibold py-3 rounded-md transition disabled:opacity-60 disabled:cursor-not-allowed disabled:opacity-80 disabled:cursor-not-allowed"
            >
              {loading ? 'Signing in...' : 'Login'}
            </button>

            {/* Register Link */}
            <p className="text-center text-sm text-gray-700">
              Don&apos;t have an account?{' '}
              <Link
                to="/register"
                className="font-semibold text-[#FB7D00] hover:opacity-80 transition"
              >
                Register now
              </Link>
            </p>

            {/* Admin Login Button */}
            <button
              type="button"
              onClick={handleAdminLogin}
              className="w-full border-2 border-[#FB7D00] text-[#FB7D00] font-semibold py-3 rounded-md hover:bg-[#FB7D00]/5 transition"
            >
              Login as Admin
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}

function EyeIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  )
}

function EyeOffIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
      <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
  )
}