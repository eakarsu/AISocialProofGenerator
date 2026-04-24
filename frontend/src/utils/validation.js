export const validators = {
  required: (value) => {
    if (!value || (typeof value === 'string' && !value.trim())) {
      return 'This field is required'
    }
    return null
  },

  email: (value) => {
    if (!value) return null
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(value)) return 'Invalid email address'
    return null
  },

  minLength: (min) => (value) => {
    if (!value) return null
    if (value.length < min) return `Must be at least ${min} characters`
    return null
  },

  maxLength: (max) => (value) => {
    if (!value) return null
    if (value.length > max) return `Must be no more than ${max} characters`
    return null
  },

  url: (value) => {
    if (!value) return null
    try {
      new URL(value)
      return null
    } catch {
      return 'Invalid URL'
    }
  },

  passwordStrength: (value) => {
    if (!value) return null
    const errors = []
    if (value.length < 8) errors.push('at least 8 characters')
    if (!/[A-Z]/.test(value)) errors.push('an uppercase letter')
    if (!/[a-z]/.test(value)) errors.push('a lowercase letter')
    if (!/[0-9]/.test(value)) errors.push('a number')
    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(value)) errors.push('a special character')
    if (errors.length > 0) return `Password must contain ${errors.join(', ')}`
    return null
  },
}

export const validateForm = (data, rules) => {
  const errors = {}
  for (const [field, fieldRules] of Object.entries(rules)) {
    for (const rule of fieldRules) {
      const error = rule(data[field])
      if (error) {
        errors[field] = error
        break
      }
    }
  }
  return { isValid: Object.keys(errors).length === 0, errors }
}

export const getPasswordStrengthLevel = (password) => {
  if (!password) return { level: 0, label: '', color: '' }
  let score = 0
  if (password.length >= 8) score++
  if (/[A-Z]/.test(password)) score++
  if (/[a-z]/.test(password)) score++
  if (/[0-9]/.test(password)) score++
  if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) score++

  if (score <= 2) return { level: score, label: 'Weak', color: 'bg-red-500' }
  if (score <= 3) return { level: score, label: 'Fair', color: 'bg-yellow-500' }
  if (score <= 4) return { level: score, label: 'Good', color: 'bg-blue-500' }
  return { level: score, label: 'Strong', color: 'bg-green-500' }
}
