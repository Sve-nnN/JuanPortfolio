'use client'

import React from 'react'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'

interface FAQProps {
  title?: string | null
  faqs?: {
    question: string
    answer: string
  }[] | null
}

export const FAQBlock: React.FC<FAQProps> = ({ title, faqs }) => {
  if (!faqs || faqs.length === 0) return null

  return (
    <div className="my-24 scroll-mt-32 max-w-4xl mx-auto" id="faq">
      <h2 className="text-4xl md:text-6xl font-display font-bold mb-16 tracking-tight text-center">
        {title || 'Preguntas Frecuentes'}
      </h2>
      
      <Accordion type="single" collapsible className="w-full space-y-6">
        {faqs.map((faq, i) => (
          <AccordionItem key={i} value={`item-${i}`} className="card-elevated border-none px-8 py-2 overflow-hidden bg-card/50">
            <AccordionTrigger className="text-left hover:no-underline py-6 group">
              <h3 className="text-xl md:text-2xl font-bold group-hover:text-primary transition-colors duration-300 pr-4 leading-tight m-0">
                {faq.question}
              </h3>
            </AccordionTrigger>
            <AccordionContent className="text-muted-foreground text-lg md:text-xl leading-relaxed pb-8 font-medium whitespace-pre-wrap">
              {faq.answer}
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  )
}

export default FAQBlock
