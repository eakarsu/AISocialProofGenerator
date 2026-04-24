import { useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import axios from 'axios'
import { getPasswordStrengthLevel } from '../utils/validation'

const API_URL = 'http://localhost:5001/api'

function ResetPassword() {
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const strength = getPasswordStrengthLevel(password)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    if (password !== confirm) {
      setError('Passwords do not match')
      return
    }
    setLoading(true)
    try {
      await axios.post(`${API_URL}/auth/reset-password`, { token, password })
      setSuccess(true)
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to reset password')
    } finally {
      setLoading(false)
    }
  }

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6">
        <div className="text-center">
          <h2 className="text-xl font-bold text-slate-900 mb-2">Invalid Reset Link</h2>
          <p className="text-slate-500 mb-4">This password reset link is invalid or has expired.</p>
          <Link to="/forgot-password" className="text-indigo-600 hover:text-indigo-700 font-medium">Request a new link</Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-slate-900">Set New Password</h2>
          <p className="text-slate-500 mt-1.5 text-sm">Enter your new password below</p>
        </div>

        {success ? (
          <div className="text-center">
            <div className="w-16 h-16 bg-green-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <p className="text-slate-600 mb-6">Password has been reset successfully.</p>
            <Link to="/login" className="btn-primary inline-block">Go to Login</Link>
          </div>
        ) : (
          <>
            {error && (
              <div className="mb-5 flex items-center gap-3 p-3.5 bg-red-50 border border-red-100 text-red-700 rounded-xl text-sm">
                <svg className="w-5 h-5 text-red-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {error}
              </div>
            )}
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="label">New Password</label>
                <input type="password" value={password} onChange={e => setPassword(e.target.value)} required className="input-field" placeholder="Enter new password" />
                {password && (
                  <div className="mt-2">
                    <div className="flex gap-1 mb-1">
                      {[1,2,3,4,5].map(i => (
                        <div key={i} className={`h-1.5 flex-1 rounded-full ${i <= strength.level ? strength.color : 'bg-slate-200'}`} />
                      ))}
                    </div>
                    <p className={`text-xs ${strength.level <= 2 ? 'text-red-500' : strength.level <= 3 ? 'text-yellow-500' : 'text-green-500'}`}>{strength.label}</p>
                  </div>
                )}
              </div>
              <div>
                <label className="label">Confirm Password</label>
                <input type="password" value={confirm} onChange={e => setConfirm(e.target.value)} required className="input-field" placeholder="Confirm new password" />
              </div>
              <button type="submit" disabled={loading} className="btn-primary w-full !py-3 disabled:opacity-50">
                {loading ? 'Resetting...' : 'Reset Password'}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  )
}

export default ResetPassword
