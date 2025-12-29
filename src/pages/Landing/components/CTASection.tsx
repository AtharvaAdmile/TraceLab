import { Link } from 'react-router-dom';
import { ArrowRight, Sparkles } from 'lucide-react';

const CTASection = () => {
  return (
    <section className="py-20 bg-gradient-to-br from-slate-900 via-slate-800 to-[#2563eb]/90">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full mb-8">
          <Sparkles className="h-4 w-4 text-yellow-400" />
          <span className="text-white/90 text-sm font-medium">Start your free trial today</span>
        </div>

        <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-6">
          Ready to Automate Your Healthcare QA Compliance?
        </h2>

        <p className="text-xl text-white/80 mb-10 max-w-2xl mx-auto">
          Join 50+ healthcare software teams who have eliminated documentation debt and 
          reduced audit preparation time by 90%.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
          <Link 
            to="/auth/signup" 
            className="px-8 py-4 bg-white text-slate-900 rounded-xl font-semibold text-lg hover:bg-gray-100 transition-colors inline-flex items-center justify-center gap-2"
          >
            Start Free Trial
            <ArrowRight className="h-5 w-5" />
          </Link>
          <button className="px-8 py-4 border-2 border-white/30 text-white rounded-xl font-semibold text-lg hover:bg-white/10 transition-colors">
            Schedule Demo
          </button>
        </div>

        <div className="flex flex-wrap justify-center gap-x-8 gap-y-4 text-white/60 text-sm">
          <span className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-400 rounded-full" />
            No credit card required
          </span>
          <span className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-400 rounded-full" />
            14-day free trial
          </span>
          <span className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-400 rounded-full" />
            Cancel anytime
          </span>
        </div>
      </div>
    </section>
  );
};

export default CTASection;
