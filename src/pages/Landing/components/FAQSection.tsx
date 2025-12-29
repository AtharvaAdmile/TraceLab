import { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

const FAQSection = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const faqs = [
    {
      question: 'Do you store our code?',
      answer: 'No. TraceLab processes your code in real-time to extract requirements and generate test cases, but we never store your source code. All analysis is done in-memory and discarded after processing. We only store the generated documentation and metadata you choose to save.',
    },
    {
      question: 'Does this work with private repositories?',
      answer: 'Yes! TraceLab supports both public and private GitHub repositories. For private repos, we use secure OAuth authentication to access your code with read-only permissions. You can revoke access at any time from your GitHub settings.',
    },
    {
      question: 'What languages do you support?',
      answer: 'TraceLab currently supports Python, JavaScript, TypeScript, Java, C#, C++, Go, and Rust. Our AI is trained on healthcare software patterns across all these languages. We\'re continuously adding support for more languages based on customer needs.',
    },
    {
      question: 'How accurate is the AI?',
      answer: 'Our AI achieves 94% accuracy in requirement extraction and test case generation based on customer validation studies. However, we always recommend human review of generated documentation. TraceLab is designed to accelerate your workflow, not replace human judgment in safety-critical systems.',
    },
    {
      question: 'Can I customize the generated documentation?',
      answer: 'Absolutely. TraceLab provides full editing capabilities for all generated content. You can modify test cases, add custom requirements, adjust traceability links, and customize export templates to match your organization\'s specific documentation standards.',
    },
    {
      question: 'Is TraceLab itself FDA validated?',
      answer: 'TraceLab is designed to help you create FDA-compliant documentation, but like any software tool, it should be validated for your specific intended use as part of your quality management system. We provide validation support packages and IQ/OQ/PQ protocols to assist with this process.',
    },
  ];

  return (
    <section className="py-20 bg-white">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Frequently Asked Questions
          </h2>
          <p className="text-xl text-gray-600">
            Everything you need to know about TraceLab.
          </p>
        </div>

        <div className="space-y-4">
          {faqs.map((faq, index) => (
            <div
              key={index}
              className="bg-[#f8fafc] rounded-xl border border-gray-200 overflow-hidden"
            >
              <button
                className="w-full px-6 py-4 flex items-center justify-between text-left hover:bg-gray-100 transition-colors"
                onClick={() => setOpenIndex(openIndex === index ? null : index)}
              >
                <span className="font-semibold text-gray-900 pr-4">{faq.question}</span>
                {openIndex === index ? (
                  <ChevronUp className="h-5 w-5 text-[#2563eb] flex-shrink-0" />
                ) : (
                  <ChevronDown className="h-5 w-5 text-gray-400 flex-shrink-0" />
                )}
              </button>
              {openIndex === index && (
                <div className="px-6 pb-4">
                  <p className="text-gray-600 leading-relaxed">{faq.answer}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FAQSection;
