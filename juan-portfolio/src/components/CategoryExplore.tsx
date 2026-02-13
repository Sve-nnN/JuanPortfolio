import { Category } from '@/payload-types'
import Link from 'next/link'

export const CategoryExplore = ({
  categories,
  currentId,
  locale = 'es',
}: {
  categories: Category[]
  currentId: string
  locale?: 'en' | 'es'
}) => {
  const localePrefix = locale === 'es' ? '' : '/en'

  return (
    <div className="mt-12">
      <h3 className="text-2xl font-bold mb-4">
        {locale === 'es' ? 'Explora otras categorías' : 'Explore Other Categories'}
      </h3>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {categories.map((category) => (
          <Link
            key={category.id}
            href={`${localePrefix}/blog/${category.slug}`}
            className={`p-4 border rounded-lg text-center ${category.id === currentId ? 'bg-muted' : ''}`}
          >
            {category.title}
          </Link>
        ))}
      </div>
    </div>
  )
}
