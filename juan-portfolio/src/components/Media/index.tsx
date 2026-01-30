import React, { Fragment } from 'react'

import type { Props } from './types'

import { ImageMedia } from './ImageMedia'
import { VideoMedia } from './VideoMedia'

export type { Props as MediaProps }

export function Media(props: Props) {
  const { className, htmlElement = 'div', resource } = props

  const isVideo = typeof resource === 'object' && resource?.mimeType?.includes('video')
  const Tag = htmlElement || Fragment

  return (
    <Tag
      {...(htmlElement !== null
        ? {
          className,
        }
        : {})}
    >
      {isVideo ? <VideoMedia {...props} /> : <ImageMedia {...props} fill={props.fill} />}
    </Tag>
  )
}
