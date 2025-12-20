'use client';

import { useState } from 'react';
import { ChevronDown, ChevronUp, HelpCircle } from 'lucide-react';
import { COMMON_FAQS } from '@/lib/seo-config';

interface FAQItemProps {
  question: string;
  answer: string;
  isOpen: boolean;
  onToggle: () => void;
}

function FAQItem({ question, answer, isOpen, onToggle }: FAQItemProps) {
  return (
    <div className="border-b border-white/10 last:border-b-0">
      <button
        className="w-full py-5 px-6 flex items-center justify-between text-left hover:bg-white/5 transition-colors"
        onClick={onToggle}
        aria-expanded={isOpen}
      >
        <span className="text-lg font-medium text-white pr-4">{question}</span>
        {isOpen ? (
          <ChevronUp className="h-5 w-5 text-blue-400 flex-shrink-0" />
        ) : (
          <ChevronDown className="h-5 w-5 text-slate-400 flex-shrink-0" />
        )}
      </button>
      <div
        className={`overflow-hidden transition-all duration-300 ease-in-out ${
          isOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
        }`}
      >
        <div className="px-6 pb-5 text-slate-300 leading-relaxed">
          {answer}
        </div>
      </div>
    </div>
  );
}

interface SEOFAQSectionProps {
  title?: string;
  subtitle?: string;
  faqs?: { question: string; answer: string }[];
  maxItems?: number;
}

/**
 * SEO-optimized FAQ section component
 * Displays FAQs with proper accessibility and smooth animations
 * FAQ schema markup is handled at the layout level
 */
export function SEOFAQSection({
  title = 'Frequently Asked Questions',
  subtitle = 'Everything you need to know about DTF printing and our services',
  faqs = COMMON_FAQS,
  maxItems = 10,
}: SEOFAQSectionProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(0); // First one open by default

  const displayFaqs = faqs.slice(0, maxItems);

  return (
    <section className="py-16 md:py-24" id="faq">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-500/10 border border-blue-500/20 mb-6">
            <HelpCircle className="h-4 w-4 text-blue-400" />
            <span className="text-sm text-blue-400 font-medium">FAQ</span>
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            {title}
          </h2>
          <p className="text-slate-400 max-w-2xl mx-auto text-lg">
            {subtitle}
          </p>
        </div>

        {/* FAQ Items */}
        <div className="max-w-3xl mx-auto">
          <div className="glass-strong rounded-2xl overflow-hidden border border-white/10">
            {displayFaqs.map((faq, index) => (
              <FAQItem
                key={index}
                question={faq.question}
                answer={faq.answer}
                isOpen={openIndex === index}
                onToggle={() => setOpenIndex(openIndex === index ? null : index)}
              />
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="text-center mt-10">
          <p className="text-slate-400 mb-4">
            Have more questions? We're here to help!
          </p>
          <a
            href="mailto:orders@dtf-wholesale.ca"
            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white font-medium rounded-lg transition-all"
          >
            Contact Us
          </a>
        </div>
      </div>
    </section>
  );
}

export default SEOFAQSection;
