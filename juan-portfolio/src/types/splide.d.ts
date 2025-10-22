declare module '@splidejs/react-splide' {
  import * as React from 'react'

  export interface SplideProps extends React.HTMLAttributes<HTMLElement> {
    options?: Record<string, unknown>
    ariaLabel?: string
    children?: React.ReactNode
  }

  export const Splide: React.FC<SplideProps>
  export const SplideSlide: React.FC<React.HTMLAttributes<HTMLElement>>

  export default Splide
}

declare module '@splidejs/splide' {
  const Splide: unknown
  export default Splide
}
