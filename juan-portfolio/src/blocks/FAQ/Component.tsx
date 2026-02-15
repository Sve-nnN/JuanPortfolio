import React from 'react'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'

interface FAQProps {
  title?: string
  faqs: {
    question: string
    answer: string
  }[]
}

export const FAQBlock: React.FC<FAQProps> = ({ title, faqs }) => {
  if (!faqs || faqs.length === 0) return null

  return (
    <div className="my-12 scroll-mt-24" id="faq">
      <h2 className="text-3xl font-bold mb-8 border-b pb-4">
        {title || 'Preguntas Frecuentes'}
      </h2>
      
      <Accordion type="single" collapsible className="w-full">
        {faqs.map((faq, i) => (
          <AccordionItem key={i} value={`item-${i}`} className="border-b border-white/10 last:border-0">
            <AccordionTrigger className="text-left hover:no-underline py-4 group">
              <h3 className="text-lg font-semibold group-hover:text-primary transition-colors">
                {faq.question}
              </h3>
            </AccordionTrigger>
            <AccordionContent className="text-white/70 leading-relaxed pb-6">
              {faq.answer}
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  )
}
