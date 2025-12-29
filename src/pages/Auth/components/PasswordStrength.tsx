import { Check, X } from 'lucide-react';

interface PasswordStrengthProps {
  password: string;
}

const PasswordStrength = ({ password }: PasswordStrengthProps) => {
  const requirements = [
    { label: 'At least 8 characters', met: password.length >= 8 },
    { label: 'Contains uppercase letter', met: /[A-Z]/.test(password) },
    { label: 'Contains lowercase letter', met: /[a-z]/.test(password) },
    { label: 'Contains number', met: /[0-9]/.test(password) },
    { label: 'Contains special character', met: /[!@#$%^&*(),.?":{}|<>]/.test(password) },
  ];

  const metCount = requirements.filter((r) => r.met).length;

  const getStrength = (): { label: string; color: string; barColor: string; width: string } => {
    if (metCount <= 2) return { label: 'Weak', color: 'text-red-600', barColor: 'bg-red-500', width: '33%' };
    if (metCount <= 4) return { label: 'Medium', color: 'text-yellow-600', barColor: 'bg-yellow-500', width: '66%' };
    return { label: 'Strong', color: 'text-green-600', barColor: 'bg-green-500', width: '100%' };
  };

  const strength = getStrength();

  if (!password) return null;

  return (
    <div className="mt-2 space-y-3">
      <div className="flex items-center gap-2">
        <div className="flex-1 h-2 bg-slate-200 rounded-full overflow-hidden">
          <div
            className={`h-full ${strength.barColor} transition-all duration-300`}
            style={{ width: strength.width }}
          />
        </div>
        <span className={`text-xs font-medium ${strength.color}`}>{strength.label}</span>
      </div>
      <ul className="space-y-1">
        {requirements.map((req, idx) => (
          <li key={idx} className="flex items-center gap-2 text-xs">
            {req.met ? (
              <Check className="w-3.5 h-3.5 text-green-500" />
            ) : (
              <X className="w-3.5 h-3.5 text-slate-300" />
            )}
            <span className={req.met ? 'text-slate-700' : 'text-slate-400'}>{req.label}</span>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default PasswordStrength;
