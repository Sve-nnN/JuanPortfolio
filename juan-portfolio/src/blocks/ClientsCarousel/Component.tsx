import { Media } from '@/components/Media'

import type { Media as MediaType } from '@/payload-types'

type Client = { logo?: MediaType | null; href?: string }

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
                {c.logo ? (
                  <Media
                    resource={c.logo}
                    imgClassName="h-10 opacity-70 hover:opacity-100 transition-opacity dark:invert"
                    loading="lazy"
                    size="200px"
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
