/**
 * validators.js — form validation helpers
 */

export const isEmail = (value) =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)

export const isRequired = (value) =>
  value !== null && value !== undefined && String(value).trim().length > 0

export const minLength = (value, min) =>
  String(value).trim().length >= min

/**
 * Validate a login form values object.
 * Returns an object with field-level error messages (empty string = no error).
 */
export function validateLogin({ email, password }) {
  const errors = {}
  if (!isRequired(email))       errors.email    = 'Email is required'
  else if (!isEmail(email))     errors.email    = 'Enter a valid email'
  if (!isRequired(password))    errors.password = 'Password is required'
  else if (!minLength(password, 6)) errors.password = 'Minimum 6 characters'
  return errors
}

/**
 * Validate a register form values object.
 */
export function validateRegister({ name, email, password, confirmPassword }) {
  const errors = validateLogin({ email, password })
  if (!isRequired(name))               errors.name            = 'Name is required'
  if (!isRequired(confirmPassword)) {
    errors.confirmPassword = 'Please confirm your password'
  } else if (password !== confirmPassword) {
    errors.confirmPassword = 'Passwords do not match'
  }
  return errors
}
