import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Mail, Lock, User, Loader2, AlertCircle } from 'lucide-react';
import AuthLayout from './AuthLayout';
import OAuthButtons from './components/OAuthButtons';
import PasswordStrength from './components/PasswordStrength';
import { signUpWithEmail } from '../../lib/firebase';

const SignupPage = () => {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [agreeToTerms, setAgreeToTerms] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!name || !email || !password || !confirmPassword) {
      setError('Please fill in all fields');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    if (!agreeToTerms) {
      setError('Please agree to the Terms and Privacy Policy');
      return;
    }

    setLoading(true);
    try {
      await signUpWithEmail(email, password);
      navigate('/auth/verify-email', { state: { email } });
    } catch (err: any) {
      const errorCode = err.code;
      if (errorCode === 'auth/email-already-in-use') {
        setError('An account with this email already exists');
      } else if (errorCode === 'auth/invalid-email') {
        setError('Invalid email address');
      } else if (errorCode === 'auth/weak-password') {
        setError('Password is too weak');
      } else {
        setError(err.message || 'Failed to create account');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleOAuthSuccess = () => {
    navigate('/dashboard');
  };

  const handleOAuthError = (errorMessage: string) => {
    setError(errorMessage);
  };

  return (
    <AuthLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="text-center">
          <h2 className="text-2xl font-bold text-slate-900">Create an account</h2>
          <p className="mt-2 text-sm text-slate-500">Start your compliance journey with TraceLab</p>
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
          {/* Name */}
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-slate-700 mb-1.5">
              Full Name
            </label>
            <div className="relative">
              <User className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="John Doe"
                className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#2563eb]/20 focus:border-[#2563eb] transition-all outline-none"
              />
            </div>
          </div>

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

          {/* Password */}
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-slate-700 mb-1.5">
              Password
            </label>
            <div className="relative">
              <Lock className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Create a strong password"
                className="w-full pl-10 pr-12 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#2563eb]/20 focus:border-[#2563eb] transition-all outline-none"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
            <PasswordStrength password={password} />
          </div>

          {/* Confirm Password */}
          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-slate-700 mb-1.5">
              Confirm Password
            </label>
            <div className="relative">
              <Lock className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                id="confirmPassword"
                type={showConfirmPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm your password"
                className={`w-full pl-10 pr-12 py-2.5 bg-white border rounded-xl focus:ring-2 focus:ring-[#2563eb]/20 focus:border-[#2563eb] transition-all outline-none ${
                  confirmPassword && password !== confirmPassword
                    ? 'border-red-300'
                    : 'border-slate-200'
                }`}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
              >
                {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
            {confirmPassword && password !== confirmPassword && (
              <p className="mt-1 text-xs text-red-500">Passwords do not match</p>
            )}
          </div>

          {/* Terms */}
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={agreeToTerms}
              onChange={(e) => setAgreeToTerms(e.target.checked)}
              className="mt-0.5 w-4 h-4 rounded border-slate-300 text-[#2563eb] focus:ring-[#2563eb]/20"
            />
            <span className="text-sm text-slate-600">
              I agree to the{' '}
              <a href="#" className="font-medium text-[#2563eb] hover:text-[#1d4ed8]">
                Terms of Service
              </a>{' '}
              and{' '}
              <a href="#" className="font-medium text-[#2563eb] hover:text-[#1d4ed8]">
                Privacy Policy
              </a>
            </span>
          </label>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 bg-[#2563eb] hover:bg-[#1d4ed8] disabled:bg-[#2563eb]/50 text-white rounded-xl font-medium transition-all flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Creating account...
              </>
            ) : (
              'Create Account'
            )}
          </button>
        </form>

        {/* Divider */}
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-slate-200" />
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-4 bg-white text-slate-500">or continue with</span>
          </div>
        </div>

        {/* OAuth */}
        <OAuthButtons onSuccess={handleOAuthSuccess} onError={handleOAuthError} />

        {/* Login Link */}
        <p className="text-center text-sm text-slate-600">
          Already have an account?{' '}
          <Link
            to="/auth/login"
            className="font-medium text-[#2563eb] hover:text-[#1d4ed8] transition-colors"
          >
            Log in
          </Link>
        </p>
      </div>
    </AuthLayout>
  );
};

export default SignupPage;
