import { useState } from 'react'
import { Link } from 'react-router-dom'
import axios from 'axios'

const API_URL = 'http://localhost:5001/api'

function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await axios.post(`${API_URL}/auth/forgot-password`, { email })
      setSent(true)
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to send reset email')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="w-14 h-14 bg-gradient-to-br from-violet-400 to-indigo-500 rounded-xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-indigo-500/20">
            <span className="text-white font-bold text-xl">AI</span>
          </div>
          <h2 className="text-2xl font-bold text-slate-900">Reset Password</h2>
          <p className="text-slate-500 mt-1.5 text-sm">Enter your email to receive a reset link</p>
        </div>

        {sent ? (
          <div className="text-center">
            <div className="w-16 h-16 bg-green-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <p className="text-slate-600 mb-6">If an account with that email exists, a password reset link has been sent. Check your console for the mock email.</p>
            <Link to="/login" className="text-indigo-600 hover:text-indigo-700 text-sm font-medium">
              Back to Login
            </Link>
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
                <label className="label">Email address</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                  className="input-field"
                />
              </div>
              <button type="submit" disabled={loading} className="btn-primary w-full !py-3 disabled:opacity-50">
                {loading ? 'Sending...' : 'Send Reset Link'}
              </button>
            </form>
            <p className="text-center mt-6">
              <Link to="/login" className="text-indigo-600 hover:text-indigo-700 text-sm font-medium">
                Back to Login
              </Link>
            </p>
          </>
        )}
      </div>
    </div>
  )
}

export default ForgotPassword
