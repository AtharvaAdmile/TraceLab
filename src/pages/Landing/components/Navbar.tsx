import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Menu, X, FlaskConical } from 'lucide-react';

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);

  const navLinks = [
    { label: 'Features', href: '#features' },
    { label: 'How It Works', href: '#how-it-works' },
    { label: 'Pricing', href: '#pricing' },
    { label: 'About', href: '#about' },
  ];

  return (
    <nav className="fixed top-0 left-0 right-0 bg-white/95 backdrop-blur-sm z-50 border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-2">
            <FlaskConical className="h-8 w-8 text-[#2563eb]" />
            <span className="text-xl font-bold text-gray-900">TraceLab</span>
          </div>

          <div className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                className="text-gray-600 hover:text-[#2563eb] transition-colors font-medium"
              >
                {link.label}
              </a>
            ))}
          </div>

          <div className="hidden md:flex items-center gap-3">
            <Link 
              to="/auth/login" 
              className="px-4 py-2 text-[#2563eb] border border-[#2563eb] rounded-lg font-medium hover:bg-blue-50 transition-colors"
            >
              Log In
            </Link>
            <Link 
              to="/auth/signup" 
              className="px-4 py-2 bg-[#2563eb] text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
            >
              Get Started
            </Link>
          </div>

          <button
            className="md:hidden p-2"
            onClick={() => setIsOpen(!isOpen)}
          >
            {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {isOpen && (
          <div className="md:hidden py-4 border-t border-gray-100">
            <div className="flex flex-col gap-4">
              {navLinks.map((link) => (
                <a
                  key={link.label}
                  href={link.href}
                  className="text-gray-600 hover:text-[#2563eb] font-medium"
                >
                  {link.label}
                </a>
              ))}
              <div className="flex flex-col gap-2 pt-4 border-t border-gray-100">
                <Link 
                  to="/auth/login" 
                  className="px-4 py-2 text-[#2563eb] border border-[#2563eb] rounded-lg font-medium text-center"
                >
                  Log In
                </Link>
                <Link 
                  to="/auth/signup" 
                  className="px-4 py-2 bg-[#2563eb] text-white rounded-lg font-medium text-center"
                >
                  Get Started
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
