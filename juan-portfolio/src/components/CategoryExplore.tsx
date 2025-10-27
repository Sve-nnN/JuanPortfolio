import { Category } from '@/payload-types'
import Link from 'next/link'

export const CategoryExplore = ({
  categories,
  currentId,
}: {
  categories: Category[]
  currentId: string
}) => {
  return (
    <div className="mt-12">
      <h3 className="text-2xl font-bold mb-4">Explore Other Categories</h3>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {categories.map((category) => (
          <Link
            key={category.id}
            href={`/blog/category/${category.slug}`}
            className={`p-4 border rounded-lg text-center ${category.id === currentId ? 'bg-gray-200' : ''}`}
          >
            {category.title}
          </Link>
        ))}
      </div>
    </div>
  )
}
