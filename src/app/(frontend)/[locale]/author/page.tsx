/**
 * @file Defines the author index page.
 * @author Juan Carlos Angulo <juan@jcangulo.com>
 */
import { notFound } from 'next/navigation'

/**
 * The author index page component.
 * This page immediately triggers a 404 Not Found error.
 * @returns {null} Returns null.
 */
export default function AuthorIndexPage() {
  // Redirigir o mostrar 404 si alguien accede a /author directamente
  notFound()
  return null
}