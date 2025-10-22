import React from 'react'

type Client = { logo?: { url?: string }; href?: string }

export const ClientsCarousel: React.FC<{ title?: string; clients?: Client[] }> = ({
  title,
  clients = [],
}) => {
  return (
    <section>
      {title && <h3 className="text-xl font-bold mb-4">{title}</h3>}
      <div className="flex gap-4 items-center">
        {clients.map((c, i) => (
          <div key={i} className="w-24 h-12 flex items-center justify-center bg-white border border-default rounded">
            {c.logo && c.logo.url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={c.logo.url} alt={`client-${i}`} style={{ maxWidth: '100%', maxHeight: '100%' }} />
            ) : (
              <div className="text-muted">Logo</div>
            )}
          </div>
        ))}
      </div>
    </section>
  )
}

export default ClientsCarousel
