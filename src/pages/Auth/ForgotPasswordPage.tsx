import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, Loader2, CheckCircle2, ArrowLeft, AlertCircle } from 'lucide-react';
import AuthLayout from './AuthLayout';
import { resetPassword } from '../../lib/firebase';

const ForgotPasswordPage = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email) {
      setError('Please enter your email address');
      return;
    }

    setLoading(true);
    try {
      await resetPassword(email);
      setSent(true);
    } catch (err: any) {
      const errorCode = err.code;
      if (errorCode === 'auth/user-not-found') {
        setError('No account found with this email');
      } else if (errorCode === 'auth/invalid-email') {
        setError('Invalid email address');
      } else if (errorCode === 'auth/too-many-requests') {
        setError('Too many requests. Please try again later.');
      } else {
        setError(err.message || 'Failed to send reset email');
      }
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <AuthLayout>
        <div className="space-y-6 text-center">
          {/* Success Icon */}
          <div className="flex justify-center">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center">
              <CheckCircle2 className="w-10 h-10 text-green-600" />
            </div>
          </div>

          {/* Header */}
          <div>
            <h2 className="text-2xl font-bold text-slate-900">Check your email</h2>
            <p className="mt-3 text-sm text-slate-500 leading-relaxed">
              We've sent a password reset link to
              <br />
              <span className="font-medium text-slate-700">{email}</span>
            </p>
          </div>

          {/* Instructions */}
          <div className="bg-slate-50 rounded-xl p-4 text-left">
            <p className="text-sm text-slate-600 leading-relaxed">
              Click the link in your email to reset your password. The link will expire in 1 hour.
            </p>
          </div>

          {/* Back to Login */}
          <Link
            to="/auth/login"
            className="inline-flex items-center justify-center gap-2 w-full py-2.5 bg-[#2563eb] hover:bg-[#1d4ed8] text-white rounded-xl font-medium transition-all"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to login
          </Link>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="text-center">
          <h2 className="text-2xl font-bold text-slate-900">Forgot password?</h2>
          <p className="mt-2 text-sm text-slate-500">
            No worries, we'll send you reset instructions.
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-100 rounded-xl text-red-700 text-sm">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Email */}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-1.5">
              Email
            </label>
            <div className="relative">
              <Mail className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#2563eb]/20 focus:border-[#2563eb] transition-all outline-none"
              />
            </div>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 bg-[#2563eb] hover:bg-[#1d4ed8] disabled:bg-[#2563eb]/50 text-white rounded-xl font-medium transition-all flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Sending...
              </>
            ) : (
              'Send Reset Link'
            )}
          </button>
        </form>

        {/* Back to Login */}
        <Link
          to="/auth/login"
          className="flex items-center justify-center gap-2 text-sm font-medium text-slate-600 hover:text-[#2563eb] transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to login
        </Link>
      </div>
    </AuthLayout>
  );
};

export default ForgotPasswordPage;
