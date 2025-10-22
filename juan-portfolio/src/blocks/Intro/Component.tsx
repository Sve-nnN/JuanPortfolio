import React from 'react'

export const IntroBlock: React.FC<{ heading?: string; body?: string }> = ({ heading, body }) => {
  return (
    <section>
      {heading && <h2 className="text-3xl font-display font-bold mb-4">{heading}</h2>}
      {body && <p className="text-muted">{body}</p>}
    </section>
  )
}

export default IntroBlock
