'use client';

import React, { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

interface FAQ {
  id: string;
  question: string;
  answer: string;
}

interface FAQCategory {
  id: string;
  title: string;
  icon: React.ReactNode;
  faqs: FAQ[];
}

interface FAQAccordionProps {
  categories: FAQCategory[];
}

const FAQAccordion: React.FC<FAQAccordionProps> = ({ categories }) => {
  const [openSections, setOpenSections] = useState<string[]>([]);

  const toggleSection = (sectionId: string) => {
    setOpenSections(prev => 
      prev.includes(sectionId) 
        ? prev.filter(id => id !== sectionId)
        : [...prev, sectionId]
    );
  };

  return (
    <div className="space-y-8">
      {categories.map((category) => (
        <section key={category.id} className="space-y-4">
          <div className="flex items-center gap-3 mb-6">
            <div className="text-primary-pink">{category.icon}</div>
            <h2 className="text-xl md:text-2xl font-bold text-white">{category.title}</h2>
          </div>

          <div className="space-y-3">
            {category.faqs.map((faq) => {
              const isOpen = openSections.includes(faq.id);
              return (
                <div
                  key={faq.id}
                  className="bg-card/30 border border-background-light rounded-xl overflow-hidden hover:border-primary-pink/30 transition-all duration-300"
                >
                  <button
                    onClick={() => toggleSection(faq.id)}
                    className="w-full px-6 py-4 text-left flex items-center justify-between hover:bg-card/20 transition-colors duration-200"
                  >
                    <h3 className="md:text-lg text-sm font-semibold text-white pr-4">{faq.question}</h3>
                    <div className="text-primary-pink flex-shrink-0">
                      {isOpen ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                    </div>
                  </button>
                  
                  {isOpen && (
                    <div className="px-6 pb-4">
                      <div className="border-t border-background-light pt-4">
                        <p className="text-text-light-gray leading-relaxed text-sm md:text-base">{faq.answer}</p>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      ))}
    </div>
  );
};

export default FAQAccordion;
