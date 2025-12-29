import { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import {
  Mail,
  Lock,
  Bell,
  Github,
  Trash2,
  AlertTriangle,
  Check,
  X,
  Loader2,
  ExternalLink,
} from 'lucide-react';

const SettingsPage = () => {
  const { user } = useAuth();
  const [saving, setSaving] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [deleteInput, setDeleteInput] = useState('');

  // Notification preferences
  const [notifications, setNotifications] = useState({
    emailAnalysis: true,
    emailCompliance: true,
    emailUpdates: false,
  });

  // GitHub connection status
  const isGitHubConnected = user?.providerData.some(
    (p) => p.providerId === 'github.com'
  );

  const handleSaveNotifications = async () => {
    setSaving(true);
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setSaving(false);
  };

  const handleDeleteAccount = async () => {
    if (deleteInput !== 'DELETE') return;
    
    // Placeholder for account deletion
    alert('Account deletion would be processed here.');
    setDeleteConfirm(false);
    setDeleteInput('');
  };

  const handlePasswordChange = () => {
    // Placeholder for password change flow
    alert('Password change functionality coming soon!');
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Settings</h1>
        <p className="text-slate-500 mt-1">Manage your account preferences</p>
      </div>

      {/* Account Settings */}
      <SettingsCard
        title="Account Settings"
        description="Update your email and password"
        icon={<Mail className="w-5 h-5 text-[#2563eb]" />}
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Email Address
            </label>
            <div className="flex items-center gap-3">
              <input
                type="email"
                value={user?.email || ''}
                disabled
                className="flex-1 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-500 cursor-not-allowed"
              />
              {user?.emailVerified && (
                <span className="flex items-center gap-1 text-sm text-emerald-600 font-medium">
                  <Check className="w-4 h-4" />
                  Verified
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 mt-2">
              Email changes require re-authentication
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Password
            </label>
            <button
              onClick={handlePasswordChange}
              className="flex items-center gap-2 px-4 py-3 border border-slate-200 rounded-xl text-slate-600 hover:text-slate-900 hover:border-slate-300 transition-colors"
            >
              <Lock className="w-4 h-4" />
              Change Password
            </button>
          </div>
        </div>
      </SettingsCard>

      {/* Notification Preferences */}
      <SettingsCard
        title="Notifications"
        description="Configure your email notification preferences"
        icon={<Bell className="w-5 h-5 text-[#2563eb]" />}
      >
        <div className="space-y-4">
          <NotificationToggle
            label="Analysis Complete"
            description="Get notified when repository analysis finishes"
            checked={notifications.emailAnalysis}
            onChange={(checked) =>
              setNotifications({ ...notifications, emailAnalysis: checked })
            }
          />
          <NotificationToggle
            label="Compliance Alerts"
            description="Receive alerts for critical compliance issues"
            checked={notifications.emailCompliance}
            onChange={(checked) =>
              setNotifications({ ...notifications, emailCompliance: checked })
            }
          />
          <NotificationToggle
            label="Product Updates"
            description="Stay informed about new features and improvements"
            checked={notifications.emailUpdates}
            onChange={(checked) =>
              setNotifications({ ...notifications, emailUpdates: checked })
            }
          />

          <button
            onClick={handleSaveNotifications}
            disabled={saving}
            className="flex items-center gap-2 px-6 py-3 bg-[#2563eb] text-white rounded-xl font-medium hover:bg-blue-600 transition-colors disabled:opacity-50"
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Saving...
              </>
            ) : (
              'Save Preferences'
            )}
          </button>
        </div>
      </SettingsCard>

      {/* Integrations */}
      <SettingsCard
        title="Integrations"
        description="Connect external services to enhance functionality"
        icon={<Github className="w-5 h-5 text-[#2563eb]" />}
      >
        <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-slate-900 rounded-xl flex items-center justify-center">
              <Github className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="font-medium text-slate-900">GitHub</p>
              <p className="text-sm text-slate-500">
                {isGitHubConnected
                  ? 'Connected for repository access'
                  : 'Connect to analyze private repositories'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {isGitHubConnected ? (
              <>
                <span className="flex items-center gap-1 text-sm text-emerald-600 font-medium">
                  <Check className="w-4 h-4" />
                  Connected
                </span>
                <button className="text-sm text-rose-600 hover:text-rose-700 font-medium">
                  Disconnect
                </button>
              </>
            ) : (
              <button className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-xl text-sm font-medium hover:bg-slate-800 transition-colors">
                <Github className="w-4 h-4" />
                Connect
                <ExternalLink className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>
      </SettingsCard>

      {/* Danger Zone */}
      <div className="bg-white rounded-2xl border-2 border-dashed border-rose-200 overflow-hidden">
        <div className="p-6 border-b border-rose-100 bg-rose-50/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-rose-100 rounded-xl flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-rose-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-rose-900">Danger Zone</h3>
              <p className="text-sm text-rose-600">
                Irreversible and destructive actions
              </p>
            </div>
          </div>
        </div>

        <div className="p-6">
          {!deleteConfirm ? (
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-slate-900">Delete Account</p>
                <p className="text-sm text-slate-500">
                  Permanently delete your account and all associated data
                </p>
              </div>
              <button
                onClick={() => setDeleteConfirm(true)}
                className="flex items-center gap-2 px-4 py-2 border-2 border-rose-200 text-rose-600 rounded-xl font-medium hover:bg-rose-50 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
                Delete Account
              </button>
            </div>
          ) : (
            <div className="space-y-4 p-4 bg-rose-50 rounded-xl">
              <p className="text-sm text-rose-700 font-medium">
                This action cannot be undone. Type{' '}
                <span className="font-mono bg-rose-100 px-2 py-0.5 rounded">DELETE</span>{' '}
                to confirm.
              </p>
              <input
                type="text"
                value={deleteInput}
                onChange={(e) => setDeleteInput(e.target.value)}
                placeholder="Type DELETE to confirm"
                className="w-full px-4 py-3 border border-rose-200 rounded-xl focus:ring-2 focus:ring-rose-500 focus:border-transparent outline-none"
              />
              <div className="flex items-center gap-3">
                <button
                  onClick={handleDeleteAccount}
                  disabled={deleteInput !== 'DELETE'}
                  className="flex items-center gap-2 px-4 py-2 bg-rose-600 text-white rounded-xl font-medium hover:bg-rose-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                  Confirm Delete
                </button>
                <button
                  onClick={() => {
                    setDeleteConfirm(false);
                    setDeleteInput('');
                  }}
                  className="flex items-center gap-2 px-4 py-2 text-slate-600 hover:text-slate-900 font-medium"
                >
                  <X className="w-4 h-4" />
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const SettingsCard = ({
  title,
  description,
  icon,
  children,
}: {
  title: string;
  description: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) => (
  <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
    <div className="p-6 border-b border-slate-100">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center">
          {icon}
        </div>
        <div>
          <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
          <p className="text-sm text-slate-500">{description}</p>
        </div>
      </div>
    </div>
    <div className="p-6">{children}</div>
  </div>
);

const NotificationToggle = ({
  label,
  description,
  checked,
  onChange,
}: {
  label: string;
  description: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) => (
  <div className="flex items-center justify-between py-3">
    <div>
      <p className="font-medium text-slate-900">{label}</p>
      <p className="text-sm text-slate-500">{description}</p>
    </div>
    <button
      onClick={() => onChange(!checked)}
      className={`relative w-12 h-6 rounded-full transition-colors ${
        checked ? 'bg-[#2563eb]' : 'bg-slate-200'
      }`}
    >
      <div
        className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow-sm transition-transform ${
          checked ? 'translate-x-7' : 'translate-x-1'
        }`}
      />
    </button>
  </div>
);

export default SettingsPage;
