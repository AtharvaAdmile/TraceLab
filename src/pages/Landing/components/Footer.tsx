import { FlaskConical, Twitter, Linkedin, Github, Youtube, Instagram } from 'lucide-react';

const Footer = () => {
  const footerLinks = {
    Product: [
      { label: 'Features', href: '#features' },
      { label: 'Pricing', href: '#pricing' },
      { label: 'Integrations', href: '#integrations' },
      { label: 'Changelog', href: '#changelog' },
      { label: 'Roadmap', href: '#roadmap' },
    ],
    Company: [
      { label: 'About Us', href: '#about' },
      { label: 'Careers', href: '#careers' },
      { label: 'Blog', href: '#blog' },
      { label: 'Press', href: '#press' },
      { label: 'Contact', href: '#contact' },
    ],
    Resources: [
      { label: 'Documentation', href: '#docs' },
      { label: 'API Reference', href: '#api' },
      { label: 'Guides', href: '#guides' },
      { label: 'Webinars', href: '#webinars' },
      { label: 'Support', href: '#support' },
    ],
    Legal: [
      { label: 'Privacy Policy', href: '#privacy' },
      { label: 'Terms of Service', href: '#terms' },
      { label: 'Security', href: '#security' },
      { label: 'HIPAA', href: '#hipaa' },
      { label: 'Cookies', href: '#cookies' },
    ],
  };

  const socialLinks = [
    { icon: Twitter, href: 'https://x.com/atharva_admile', label: 'Twitter' },
    { icon: Instagram, href: 'https://www.instagram.com/zenith_atharva/', label: 'Instagram' },
    { icon: Linkedin, href: 'https://www.linkedin.com/in/atharvaadmile261/', label: 'LinkedIn' },
    { icon: Github, href: 'https://github.com/AtharvaAdmile', label: 'GitHub' },
  ];

  return (
    <footer className="bg-slate-900 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid lg:grid-cols-6 gap-12 mb-12">
          <div className="lg:col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <FlaskConical className="h-8 w-8 text-[#2563eb]" />
              <span className="text-xl font-bold">TraceLab</span>
            </div>
            <p className="text-gray-400 mb-6 max-w-sm">
              Automating healthcare software compliance. Turn your GitHub repos into 
              FDA-compliant test suites in seconds.
            </p>
            <div className="flex items-center gap-4">
              {socialLinks.map((social, index) => (
                <a
                  key={index}
                  href={social.href}
                  aria-label={social.label}
                  className="w-10 h-10 bg-slate-800 rounded-lg flex items-center justify-center hover:bg-[#2563eb] transition-colors"
                >
                  <social.icon className="h-5 w-5" />
                </a>
              ))}
            </div>
          </div>

          {Object.entries(footerLinks).map(([category, links]) => (
            <div key={category}>
              <h3 className="font-semibold text-white mb-4">{category}</h3>
              <ul className="space-y-3">
                {links.map((link, index) => (
                  <li key={index}>
                    <a
                      href={link.href}
                      className="text-gray-400 hover:text-white transition-colors text-sm"
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="border-t border-slate-800 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-gray-400 text-sm">
            © {new Date().getFullYear()} TraceLab, Inc. All rights reserved.
          </p>
          <div className="flex items-center gap-6">
            <span className="text-gray-500 text-sm">SOC 2 Type II Certified</span>
            <span className="text-gray-500 text-sm">HIPAA Compliant</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
