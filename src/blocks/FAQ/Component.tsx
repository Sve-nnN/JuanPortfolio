import React from 'react'
import RichText from '@/components/RichText'
import { HelpCircle } from 'lucide-react'
import type { DefaultTypedEditorState } from '@payloadcms/richtext-lexical'

interface FAQProps {
  title?: string | null
  faqs?: {
    question: string
    answer: string | DefaultTypedEditorState
  }[] | null
}

export const FAQBlock: React.FC<FAQProps> = ({ title, faqs }) => {
  if (!faqs || faqs.length === 0) return null

  return (
    <div className="my-32 scroll-mt-32 max-w-4xl mx-auto px-4" id="faq">
      <div className="flex flex-col items-center mb-20 text-center">
        <span className="inline-block px-4 py-1.5 mb-6 text-sm font-bold tracking-widest uppercase text-primary bg-primary/10 rounded-full">
          FAQ
        </span>
        <h2 className="text-4xl md:text-6xl font-display font-bold tracking-tight text-foreground">
          {title || 'Preguntas Frecuentes'}
        </h2>
        <div className="w-24 h-1.5 bg-primary/20 rounded-full mt-8" />
      </div>
      
      <div className="grid gap-12">
        {faqs.map((faq, i) => (
          <div 
            key={i} 
            className="relative pl-16 group"
          >
            <div className="absolute left-0 top-0 w-12 h-12 rounded-2xl bg-primary/5 flex items-center justify-center group-hover:bg-primary/10 transition-colors duration-300">
              <HelpCircle className="w-6 h-6 text-primary" />
            </div>
            
            <div className="space-y-4">
              <h3 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground leading-tight m-0">
                {faq.question}
              </h3>
              <div className="text-muted-foreground text-lg md:text-xl leading-relaxed font-medium prose prose-neutral dark:prose-invert max-w-none">
                {typeof faq.answer === 'string' ? (
                  <p className="whitespace-pre-wrap m-0">{faq.answer}</p>
                ) : (
                  <RichText data={faq.answer} enableGutter={false} />
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default FAQBlock
