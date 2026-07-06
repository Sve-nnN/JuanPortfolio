# Páginas y globals del admin

Guía corta para el editor. Explica cómo crear una página nueva y qué quedó viviendo en la colección `Pages` versus en los globals.

## Cómo crear una página nueva

1. En el admin, andá a **Contenido → Pages** y hacé clic en **Create New**.
2. Completá el **Title** y dejá que el **Slug** se genere solo (o escribilo a mano). El slug es la parte final de la URL: una página con slug `servicios` vive en `/servicios`.
3. Armá el contenido en **Page Layout** agregando bloques (Hero, About, secciones, CTA, formulario, etc.).
4. Guardá como borrador para ir viendo el resultado con el **Live Preview**, y cuando esté listo **Publicá**.
5. La ruta pública queda cacheada (ISR): se regenera sola de forma periódica y cuando editás y publicás.

### Duplicar una página

Si querés partir de una página existente, abrila y usá **Duplicate** (menú de la fila o del documento). La copia se crea con:

- El slug con sufijo `-copy` (o `-copy-2`, `-copy-3`… si ya existe), así no choca con el original.
- El título con ` (copy)` al final.

La copia es independiente: editarla no toca el original.

## Qué vive en Pages

Estas superficies antes eran globals de una sola instancia y ahora son entradas editables dentro de **Pages**, cada una identificada por su slug:

| Superficie | Slug de la Page | Ruta pública |
|------------|-----------------|--------------|
| Home | `home` | `/` (es) y `/en` |
| Listado de blog | `blog` | `/blog` y `/en/blog` |
| Listado de case studies | `case-studies` | `/case-studies` y `/en/case-studies` |

Para editarlas, entrá a **Contenido → Pages** y abrí la entrada correspondiente. El contenido está localizado: cambiá el idioma del documento (es/en) para editar cada versión.

## Qué quedó como global (y para qué)

Los globals son configuraciones de una sola instancia. Quedaron agrupados en el sidebar según su función:

### Grupo "Contenido"
- **Pages**, **Posts**, **Categories**, **Media**, **Authors**: el contenido editorial del sitio.

### Grupo "Sitio"
- **Site Settings**: ajustes generales del sitio.
- **Header** / **Footer**: la cabecera y el pie de página globales.
- **Styles**: estilos globales (colores, tipografía, etc.).
- **LLM**: el contenido que se sirve en `llms.txt` (para modelos de IA).
- **Robots**: las directivas que se sirven en `robots.txt`.

Estos tres últimos (Styles, LLM, Robots) son responsabilidades distintas y se mantienen como globals separados a propósito: mezclarlos en uno solo haría el admin más confuso, no menos.

### Grupo "SEO/Métricas"
- **Keyword Metrics**, **Page Metrics**, **GSC Metrics**, **Broken Links**, **Redirects**.

### Grupo "Marketing"
- **Works**, **Case Studies**, **Clientes**, **Testimonials**, **Ad Banners**, **Forms**, **Search**.
