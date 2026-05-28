import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { useForm } from '@/hooks/useForm'
import { validateRegister } from '@/utils/validators'

/**
 * RegisterPage — creates a new inspector account.
 */
export default function RegisterPage() {
  const { register,loading } = useAuth()
  const navigate = useNavigate()
  const [serverError, setServerError] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  const { values, errors, handleChange, setError } = useForm({
    name: '',
    email: '',
    password: '',
    role: 'staff',
    confirmPassword: '',
  })

  async function handleSubmit(e) {
    e.preventDefault()
    setServerError('')

    const validationErrors = validateRegister(values)
    if (Object.keys(validationErrors).length > 0) {
      Object.entries(validationErrors).forEach(([field, message]) => {
        setError(field, message)
      })
      return
    }

    const { email, password, name, role } = values
    const result = await register({ email, password, name, role })
    if (!result.success) {
      setServerError(result.message)
      return
    }
    navigate('/login')
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
          <form onSubmit={handleSubmit} noValidate className="space-y-5">
            {/* Full Name */}
            <div>
              <input
                id="name"
                name="name"
                type="text"
                autoComplete="name"
                placeholder="Full Name"
                value={values.name}
                onChange={handleChange}
                className="w-full border-0 border-b-2 border-gray-300 bg-transparent px-0 py-2 text-sm text-gray-900 placeholder:text-gray-400 outline-none transition focus:border-[#FB7D00] focus:ring-0"
              />

              {errors.name && (
                <p className="mt-2 text-xs text-red-500">{errors.name}</p>
              )}
            </div>

            {/* Email */}
            <div>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                placeholder="Email"
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
                autoComplete="new-password"
                placeholder="Password"
                value={values.password}
                onChange={handleChange}
                className="w-full border-0 border-b-2 border-gray-300 bg-transparent px-0 py-2 text-sm text-gray-900 placeholder:text-gray-400 outline-none transition focus:border-[#FB7D00] focus:ring-0"
              />

              {errors.password && (
                <p className="mt-2 text-xs text-red-500">{errors.password}</p>
              )}
            </div>

            {/* Confirm Password */}
            <div>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type={showPassword ? 'text' : 'password'}
                autoComplete="new-password"
                placeholder="Confirm Password"
                value={values.confirmPassword}
                onChange={handleChange}
                className="w-full border-0 border-b-2 border-gray-300 bg-transparent px-0 py-2 text-sm text-gray-900 placeholder:text-gray-400 outline-none transition focus:border-[#FB7D00] focus:ring-0"
              />

              {errors.confirmPassword && (
                <p className="mt-2 text-xs text-red-500">{errors.confirmPassword}</p>
              )}
            </div>

            {/* Server error */}
            {serverError && (
              <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-center text-xs text-red-600 font-medium">
                {serverError}
              </div>
            )}

            {/* Register Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#FB7D00] hover:bg-[#E26C00] text-white font-semibold py-3 rounded-md transition disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? 'Creating account...' : 'Register'}
            </button>

            {/* Login Link */}
            <p className="text-center text-sm text-gray-700">
              Already have an account?{' '}
              <Link
                to="/login"
                className="font-semibold text-[#FB7D00] hover:opacity-80 transition"
              >
                Sign in
              </Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  )
}
