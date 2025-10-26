import React from 'react'

type Client = { logo?: { url?: string }; href?: string }

export const ClientsCarousel: React.FC<{ title?: string; clients?: Client[] }> = ({
  title,
  clients = [],
}) => {
  // Duplicate clients array for seamless infinite scroll
  const duplicatedClients = [...clients, ...clients]

  return (
    <section className="py-16 bg-gray-50 dark:bg-card-dark overflow-hidden">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {title && (
          <h3 className="text-center text-2xl font-display font-bold text-current mb-12">
            {title}
          </h3>
        )}
        <div className="relative">
          <div className="flex animate-marquee-infinite space-x-16">
            {duplicatedClients.map((c, i) => (
              <div key={i} className="flex justify-center items-center flex-shrink-0 w-40">
                {c.logo && c.logo.url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={c.logo.url}
                    alt={`Cliente ${i + 1}`}
                    className="h-10 opacity-70 hover:opacity-100 transition-opacity dark:invert"
                  />
                ) : (
                  <div className="text-muted text-sm">Logo Cliente</div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

export default ClientsCarousel
