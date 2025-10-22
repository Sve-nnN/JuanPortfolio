import React from 'react'

const CTA = ({ data }: { data?: { label?: string; url?: string } }) => {
  if (!data) return null
  return (
    <section className="py-12 bg-black text-white">
      <div className="max-w-4xl mx-auto px-6 text-center">
        <a href={data.url || '#'} className="inline-block bg-white text-black px-6 py-3 rounded">
          {data.label || 'Call to action'}
        </a>
      </div>
    </section>
  )
}

export default CTA
