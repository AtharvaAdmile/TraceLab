import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Mail, Loader2, CheckCircle2, ArrowLeft } from 'lucide-react';
import AuthLayout from './AuthLayout';
import { auth } from '../../lib/firebase';
import { sendEmailVerification } from 'firebase/auth';

const VerifyEmailPage = () => {
  const location = useLocation();
  const email = location.state?.email || 'your email';
  const [loading, setLoading] = useState(false);
  const [resent, setResent] = useState(false);
  const [error, setError] = useState('');

  const handleResend = async () => {
    setLoading(true);
    setError('');
    setResent(false);

    try {
      const user = auth?.currentUser;
      if (user) {
        await sendEmailVerification(user);
        setResent(true);
      } else {
        setError('No user session found. Please sign up again.');
      }
    } catch (err: any) {
      if (err.code === 'auth/too-many-requests') {
        setError('Too many requests. Please wait before trying again.');
      } else {
        setError(err.message || 'Failed to resend email');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout>
      <div className="space-y-6 text-center">
        {/* Icon */}
        <div className="flex justify-center">
          <div className="w-20 h-20 bg-[#2563eb]/10 rounded-full flex items-center justify-center">
            <Mail className="w-10 h-10 text-[#2563eb]" />
          </div>
        </div>

        {/* Header */}
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Check your email</h2>
          <p className="mt-3 text-sm text-slate-500 leading-relaxed">
            We've sent a verification link to
            <br />
            <span className="font-medium text-slate-700">{email}</span>
          </p>
        </div>

        {/* Instructions */}
        <div className="bg-slate-50 rounded-xl p-4 text-left">
          <p className="text-sm text-slate-600 leading-relaxed">
            Click the link in your email to verify your account. If you don't see it, check your spam folder.
          </p>
        </div>

        {/* Success Message */}
        {resent && (
          <div className="flex items-center justify-center gap-2 p-3 bg-green-50 border border-green-100 rounded-xl text-green-700 text-sm">
            <CheckCircle2 className="w-4 h-4" />
            Verification email sent successfully
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="p-3 bg-red-50 border border-red-100 rounded-xl text-red-700 text-sm">
            {error}
          </div>
        )}

        {/* Resend Button */}
        <button
          onClick={handleResend}
          disabled={loading || resent}
          className="w-full py-2.5 bg-[#2563eb] hover:bg-[#1d4ed8] disabled:bg-[#2563eb]/50 text-white rounded-xl font-medium transition-all flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Sending...
            </>
          ) : resent ? (
            'Email Sent'
          ) : (
            'Resend Email'
          )}
        </button>

        {/* Back to Login */}
        <Link
          to="/auth/login"
          className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-[#2563eb] transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to login
        </Link>
      </div>
    </AuthLayout>
  );
};

export default VerifyEmailPage;
