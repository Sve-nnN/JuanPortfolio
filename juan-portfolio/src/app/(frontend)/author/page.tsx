import { notFound } from 'next/navigation'

export default function AuthorIndexPage() {
  // Redirigir o mostrar 404 si alguien accede a /author directamente
  notFound()
  return null
}
