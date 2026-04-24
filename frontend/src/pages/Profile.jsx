import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { getPasswordStrengthLevel } from '../utils/validation'
import toast from 'react-hot-toast'
import axios from 'axios'

const API_URL = 'http://localhost:5001/api'

function Profile() {
  const { user } = useAuth()
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const strength = getPasswordStrengthLevel(newPassword)

  const handleChangePassword = async (e) => {
    e.preventDefault()
    setError('')
    if (newPassword !== confirmPassword) {
      setError('New passwords do not match')
      return
    }
    setLoading(true)
    try {
      await axios.put(`${API_URL}/auth/change-password`, { currentPassword, newPassword })
      toast.success('Password changed successfully')
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to change password')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Profile</h1>
        <p className="text-slate-500 mt-1 text-sm">Manage your account settings</p>
      </div>

      <div className="card">
        <h2 className="text-lg font-semibold text-slate-900 mb-4">Account Information</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">Name</label>
            <div className="text-sm text-slate-800 bg-slate-50 rounded-xl p-3.5 border border-slate-100">{user?.name || '-'}</div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">Email</label>
            <div className="text-sm text-slate-800 bg-slate-50 rounded-xl p-3.5 border border-slate-100">{user?.email || '-'}</div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">Role</label>
            <div className="text-sm text-slate-800 bg-slate-50 rounded-xl p-3.5 border border-slate-100">
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                user?.role === 'admin' ? 'bg-purple-100 text-purple-800' :
                user?.role === 'editor' ? 'bg-blue-100 text-blue-800' :
                'bg-slate-100 text-slate-600'
              }`}>{user?.role || 'editor'}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="card">
        <h2 className="text-lg font-semibold text-slate-900 mb-4">Change Password</h2>
        {error && (
          <div className="mb-4 flex items-center gap-3 p-3.5 bg-red-50 border border-red-100 text-red-700 rounded-xl text-sm">
            <svg className="w-5 h-5 text-red-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {error}
          </div>
        )}
        <form onSubmit={handleChangePassword} className="space-y-4">
          <div>
            <label className="label">Current Password</label>
            <input type="password" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} required className="input-field" placeholder="Enter current password" />
          </div>
          <div>
            <label className="label">New Password</label>
            <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} required className="input-field" placeholder="Enter new password" />
            {newPassword && (
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
            <label className="label">Confirm New Password</label>
            <input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required className="input-field" placeholder="Confirm new password" />
          </div>
          <button type="submit" disabled={loading} className="btn-primary disabled:opacity-50">
            {loading ? 'Changing...' : 'Change Password'}
          </button>
        </form>
      </div>
    </div>
  )
}

export default Profile
