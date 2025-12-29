import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import {
  Mail,
  Calendar,
  Shield,
  Edit3,
  Camera,
  FileText,
  TestTube,
  ClipboardCheck,
  Loader2,
} from 'lucide-react';

interface UserStats {
  projectsAnalyzed: number;
  testCasesGenerated: number;
  complianceReports: number;
}

const ProfilePage = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<UserStats>({
    projectsAnalyzed: 0,
    testCasesGenerated: 0,
    complianceReports: 0,
  });
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [displayName, setDisplayName] = useState(user?.displayName || '');

  useEffect(() => {
    fetchUserStats();
  }, [user]);

  const fetchUserStats = async () => {
    if (!user) return;
    
    try {
      const [projectsRes, testCasesRes, complianceRes] = await Promise.all([
        supabase.from('projects').select('id', { count: 'exact' }),
        supabase.from('test_cases').select('id', { count: 'exact' }),
        supabase.from('compliance_issues').select('id', { count: 'exact' }),
      ]);

      setStats({
        projectsAnalyzed: projectsRes.count || 0,
        testCasesGenerated: testCasesRes.count || 0,
        complianceReports: complianceRes.count || 0,
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const getProviderInfo = () => {
    const providerId = user?.providerData[0]?.providerId;
    switch (providerId) {
      case 'google.com':
        return { name: 'Google', color: 'text-red-500', bg: 'bg-red-50' };
      case 'github.com':
        return { name: 'GitHub', color: 'text-slate-900', bg: 'bg-slate-100' };
      default:
        return { name: 'Email', color: 'text-blue-500', bg: 'bg-blue-50' };
    }
  };

  const provider = getProviderInfo();

  const formatDate = (date: string | undefined) => {
    if (!date) return 'Unknown';
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const handleAvatarUpload = () => {
    // Placeholder for avatar upload functionality
    alert('Avatar upload functionality coming soon!');
  };

  const handleSaveProfile = async () => {
    // Placeholder for profile update
    setEditing(false);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Profile</h1>
        <p className="text-slate-500 mt-1">Manage your account information</p>
      </div>

      {/* Profile Card */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {/* Header Banner */}
        <div className="h-24 bg-gradient-to-r from-[#2563eb] to-blue-400" />

        <div className="px-8 pb-8">
          {/* Avatar Section */}
          <div className="flex items-end gap-6 -mt-12">
            <div className="relative group">
              {user?.photoURL ? (
                <img
                  src={user.photoURL}
                  alt={user.displayName || 'User'}
                  className="w-24 h-24 rounded-2xl object-cover border-4 border-white shadow-lg"
                />
              ) : (
                <div className="w-24 h-24 rounded-2xl bg-[#2563eb] flex items-center justify-center text-white text-3xl font-bold border-4 border-white shadow-lg">
                  {user?.displayName?.charAt(0) || user?.email?.charAt(0) || 'U'}
                </div>
              )}
              <button
                onClick={handleAvatarUpload}
                className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 rounded-2xl transition-opacity"
              >
                <Camera className="w-6 h-6 text-white" />
              </button>
            </div>

            <div className="flex-1 pb-2">
              {editing ? (
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="text-2xl font-bold text-slate-900 bg-slate-50 px-3 py-1 rounded-lg border border-slate-200 focus:ring-2 focus:ring-[#2563eb] focus:border-transparent outline-none"
                />
              ) : (
                <h2 className="text-2xl font-bold text-slate-900">
                  {user?.displayName || 'User'}
                </h2>
              )}
              <p className="text-slate-500">{user?.email}</p>
            </div>

            {editing ? (
              <div className="flex gap-2">
                <button
                  onClick={() => setEditing(false)}
                  className="px-4 py-2 text-slate-600 hover:text-slate-900 font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveProfile}
                  className="px-4 py-2 bg-[#2563eb] text-white rounded-xl font-medium hover:bg-blue-600 transition-colors"
                >
                  Save
                </button>
              </div>
            ) : (
              <button
                onClick={() => setEditing(true)}
                className="flex items-center gap-2 px-4 py-2 border border-slate-200 rounded-xl text-slate-600 hover:text-slate-900 hover:border-slate-300 transition-colors"
              >
                <Edit3 className="w-4 h-4" />
                Edit Profile
              </button>
            )}
          </div>

          {/* Info Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
            <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-xl">
              <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center shadow-sm">
                <Mail className="w-5 h-5 text-[#2563eb]" />
              </div>
              <div>
                <p className="text-xs text-slate-500 uppercase font-semibold">Email</p>
                <p className="text-sm font-medium text-slate-900 truncate max-w-[180px]">
                  {user?.email}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-xl">
              <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center shadow-sm">
                <Calendar className="w-5 h-5 text-[#2563eb]" />
              </div>
              <div>
                <p className="text-xs text-slate-500 uppercase font-semibold">Member Since</p>
                <p className="text-sm font-medium text-slate-900">
                  {formatDate(user?.metadata?.creationTime)}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-xl">
              <div className={`w-10 h-10 ${provider.bg} rounded-lg flex items-center justify-center`}>
                <Shield className={`w-5 h-5 ${provider.color}`} />
              </div>
              <div>
                <p className="text-xs text-slate-500 uppercase font-semibold">Provider</p>
                <p className="text-sm font-medium text-slate-900">{provider.name}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Section */}
      <div>
        <h3 className="text-lg font-semibold text-slate-900 mb-4">Activity Overview</h3>
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-[#2563eb]" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <StatCard
              icon={<FileText className="w-6 h-6 text-[#2563eb]" />}
              label="Projects Analyzed"
              value={stats.projectsAnalyzed}
              color="bg-blue-50"
            />
            <StatCard
              icon={<TestTube className="w-6 h-6 text-emerald-500" />}
              label="Test Cases Generated"
              value={stats.testCasesGenerated}
              color="bg-emerald-50"
            />
            <StatCard
              icon={<ClipboardCheck className="w-6 h-6 text-purple-500" />}
              label="Compliance Issues"
              value={stats.complianceReports}
              color="bg-purple-50"
            />
          </div>
        )}
      </div>
    </div>
  );
};

const StatCard = ({
  icon,
  label,
  value,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  color: string;
}) => (
  <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition-shadow">
    <div className={`w-12 h-12 ${color} rounded-xl flex items-center justify-center mb-4`}>
      {icon}
    </div>
    <p className="text-3xl font-bold text-slate-900">{value}</p>
    <p className="text-sm text-slate-500 mt-1">{label}</p>
  </div>
);

export default ProfilePage;
