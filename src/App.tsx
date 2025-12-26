import React, { useState } from 'react'
import { Routes, Route, Link } from 'react-router-dom'
import {
  FileText,
  ShieldCheck,
  LayoutDashboard,
  ClipboardList,
  Settings,
  ChevronRight,
  Menu,
  Bell,
  Search,
  Link2
} from 'lucide-react'
import RequirementsPage from './pages/RequirementsPage'
import TestCasesPage from './pages/TestCasesPage'
import CompliancePage from './pages/CompliancePage'
import TraceabilityPage from './pages/TraceabilityPage'
import DashboardPage from './pages/DashboardPage'

function App() {
  const [isSidebarOpen, setSidebarOpen] = useState(true)

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Sidebar */}
      <aside className={`bg-slate-900 text-white transition-all duration-300 flex-shrink-0 ${isSidebarOpen ? 'w-64' : 'w-20'}`}>
        <div className="p-6 flex items-center gap-3">
          <div className="bg-primary-500 p-2 rounded-lg">
            <ShieldCheck className="w-6 h-6 text-white" />
          </div>
          {isSidebarOpen && <span className="font-bold text-xl tracking-tight">MedTest AI</span>}
        </div>

        <nav className="mt-6 px-4 space-y-2">
          <NavItem icon={<LayoutDashboard />} label="Dashboard" to="/" isOpen={isSidebarOpen} />
          <NavItem icon={<FileText />} label="Requirements" to="/requirements" isOpen={isSidebarOpen} />
          <NavItem icon={<ClipboardList />} label="Test Cases" to="/test-cases" isOpen={isSidebarOpen} />
          <NavItem icon={<Link2 />} label="Traceability" to="/traceability" isOpen={isSidebarOpen} />
          <NavItem icon={<ShieldCheck />} label="Compliance" to="/compliance" isOpen={isSidebarOpen} />
          <div className="pt-4 border-t border-slate-800 mt-4">
            <NavItem icon={<Settings />} label="Settings" to="/settings" isOpen={isSidebarOpen} />
          </div>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Header */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-8 sticky top-0 z-10">
          <button
            onClick={() => setSidebarOpen(!isSidebarOpen)}
            className="p-2 hover:bg-slate-100 rounded-lg text-slate-600 transition-colors"
          >
            {isSidebarOpen ? <Menu className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
          </button>

          <div className="flex items-center gap-6">
            <div className="relative hidden md:block">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search requirements..."
                className="pl-10 pr-4 py-2 bg-slate-100 border-none rounded-full text-sm w-64 focus:ring-2 focus:ring-primary-500 transition-all"
              />
            </div>
            <button className="relative p-2 text-slate-600 hover:bg-slate-100 rounded-full transition-colors">
              <Bell className="w-5 h-5" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
            </button>
            <div className="flex items-center gap-3 pl-4 border-l border-slate-200">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-semibold text-slate-900">QA Engineer</p>
                <p className="text-xs text-slate-500">Premium Account</p>
              </div>
              <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center text-primary-700 font-bold">
                QA
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <div className="flex-1 overflow-auto p-8">
          <Routes>
            <Route path="/" element={<DashboardPage />} />
            <Route path="/requirements" element={<RequirementsPage />} />
            <Route path="/test-cases" element={<TestCasesPage />} />
            <Route path="/compliance" element={<CompliancePage />} />
            <Route path="/traceability" element={<TraceabilityPage />} />
            <Route path="/settings" element={<SettingsPage />} />
          </Routes>
        </div>
      </main>
    </div>
  )
}

function NavItem({ icon, label, to, isOpen }: { icon: React.ReactNode, label: string, to: string, isOpen: boolean }) {
  return (
    <Link
      to={to}
      className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-all group"
    >
      <span className="w-6 h-6 flex items-center justify-center group-hover:scale-110 transition-transform">
        {React.isValidElement(icon) ? React.cloneElement(icon as React.ReactElement<any>, { size: 20 }) : icon}
      </span>
      {isOpen && <span className="text-sm font-medium">{label}</span>}
    </Link>
  )
}



function SettingsPage() { return <div className="p-8"><h1 className="text-2xl font-bold">Settings and API configurations.</h1></div> }

export default App
