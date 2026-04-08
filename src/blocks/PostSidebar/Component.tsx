import React from 'react'
import type { PostSidebarBlock } from '@/payload-types'

export const PostSidebar: React.FC<PostSidebarBlock & { locale?: 'en' | 'es' }> = ({
  locale
}) => {
  return (
    <aside className="p-6 bg-card border border-border rounded-2xl">
      <h3 className="font-bold mb-4">{locale === 'es' ? 'Recursos Relacionados' : 'Related Resources'}</h3>
      <p className="text-sm text-muted-foreground">
        {locale === 'es' 
          ? 'Explora más contenido diseñado para potenciar tu presencia digital.' 
          : 'Explore more content designed to boost your digital presence.'}
      </p>
    </aside>
  )
}
