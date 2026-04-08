import { getOptimizedCloudinaryUrl } from '@/utilities/cloudinaryUrl';

export const FALLBACK_IMAGES = [
  "https://res.cloudinary.com/dmufha3qv/image/upload/v1770675677/portfolio/fallback-image-1.avif",
  "https://res.cloudinary.com/dmufha3qv/image/upload/v1770675678/portfolio/fallback-image-2.avif",
  "https://res.cloudinary.com/dmufha3qv/image/upload/v1770675679/portfolio/fallback-image-3.avif",
  "https://res.cloudinary.com/dmufha3qv/image/upload/v1770675680/portfolio/fallback-image-4.avif",
  "https://res.cloudinary.com/dmufha3qv/image/upload/v1770675683/portfolio/fallback-image-5.avif",
  "https://res.cloudinary.com/dmufha3qv/image/upload/v1770675684/portfolio/fallback-image-6.avif",
  "https://res.cloudinary.com/dmufha3qv/image/upload/v1770675685/portfolio/fallback-image-7.avif",
  "https://res.cloudinary.com/dmufha3qv/image/upload/v1770675686/portfolio/fallback-image-8.avif",
  "https://res.cloudinary.com/dmufha3qv/image/upload/v1770675687/portfolio/fallback-image-9.avif",
  "https://res.cloudinary.com/dmufha3qv/image/upload/v1770675688/portfolio/fallback-image-10.avif",
  "https://res.cloudinary.com/dmufha3qv/image/upload/v1770675689/portfolio/fallback-image-11.avif",
  "https://res.cloudinary.com/dmufha3qv/image/upload/v1770675691/portfolio/fallback-image-12.avif",
  "https://res.cloudinary.com/dmufha3qv/image/upload/v1770675692/portfolio/fallback-image-13.avif",
  "https://res.cloudinary.com/dmufha3qv/image/upload/v1770675694/portfolio/fallback-image-14.avif",
  "https://res.cloudinary.com/dmufha3qv/image/upload/v1770675695/portfolio/fallback-image-15.avif",
  "https://res.cloudinary.com/dmufha3qv/image/upload/v1770675696/portfolio/fallback-image-16.avif",
  "https://res.cloudinary.com/dmufha3qv/image/upload/v1770675698/portfolio/fallback-image-17.avif",
  "https://res.cloudinary.com/dmufha3qv/image/upload/v1770675698/portfolio/fallback-image-18.avif",
  "https://res.cloudinary.com/dmufha3qv/image/upload/v1770675700/portfolio/fallback-image-19.avif",
  "https://res.cloudinary.com/dmufha3qv/image/upload/v1770675701/portfolio/fallback-image-20.avif",
  "https://res.cloudinary.com/dmufha3qv/image/upload/v1770675702/portfolio/fallback-image-21.avif",
  "https://res.cloudinary.com/dmufha3qv/image/upload/v1770675703/portfolio/fallback-image-22.avif",
  "https://res.cloudinary.com/dmufha3qv/image/upload/v1770675704/portfolio/fallback-image-23.avif",
  "https://res.cloudinary.com/dmufha3qv/image/upload/v1770675706/portfolio/fallback-image-24.avif",
  "https://res.cloudinary.com/dmufha3qv/image/upload/v1770675707/portfolio/fallback-image-25.avif",
  "https://res.cloudinary.com/dmufha3qv/image/upload/v1770675709/portfolio/fallback-image-26.avif",
  "https://res.cloudinary.com/dmufha3qv/image/upload/v1770675710/portfolio/fallback-image-27.avif",
  "https://res.cloudinary.com/dmufha3qv/image/upload/v1770675711/portfolio/fallback-image-28.avif",
  "https://res.cloudinary.com/dmufha3qv/image/upload/v1770675712/portfolio/fallback-image-29.avif",
  "https://res.cloudinary.com/dmufha3qv/image/upload/v1770675714/portfolio/fallback-image-30.avif",
  "https://res.cloudinary.com/dmufha3qv/image/upload/v1770675716/portfolio/fallback-image-31.avif",
  "https://res.cloudinary.com/dmufha3qv/image/upload/v1770675718/portfolio/fallback-image-32.avif",
  "https://res.cloudinary.com/dmufha3qv/image/upload/v1770675719/portfolio/fallback-image-33.avif",
  "https://res.cloudinary.com/dmufha3qv/image/upload/v1770675722/portfolio/fallback-image-34.avif",
  "https://res.cloudinary.com/dmufha3qv/image/upload/v1770675723/portfolio/fallback-image-35.avif",
  "https://res.cloudinary.com/dmufha3qv/image/upload/v1770675725/portfolio/fallback-image-36.avif",
  "https://res.cloudinary.com/dmufha3qv/image/upload/v1770675730/portfolio/fallback-image-37.avif",
  "https://res.cloudinary.com/dmufha3qv/image/upload/v1770675735/portfolio/fallback-image-38.avif",
  "https://res.cloudinary.com/dmufha3qv/image/upload/v1770675736/portfolio/fallback-image-39.avif",
  "https://res.cloudinary.com/dmufha3qv/image/upload/v1770675738/portfolio/fallback-image-40.avif",
  "https://res.cloudinary.com/dmufha3qv/image/upload/v1770675740/portfolio/fallback-image-41.avif",
  "https://res.cloudinary.com/dmufha3qv/image/upload/v1770675741/portfolio/fallback-image-42.avif",
  "https://res.cloudinary.com/dmufha3qv/image/upload/v1770675742/portfolio/fallback-image-43.avif",
  "https://res.cloudinary.com/dmufha3qv/image/upload/v1770675743/portfolio/fallback-image-44.avif",
  "https://res.cloudinary.com/dmufha3qv/image/upload/v1770675744/portfolio/fallback-image-45.avif",
  "https://res.cloudinary.com/dmufha3qv/image/upload/v1770675747/portfolio/fallback-image-46.avif",
  "https://res.cloudinary.com/dmufha3qv/image/upload/v1770675758/portfolio/fallback-image-47.avif",
  "https://res.cloudinary.com/dmufha3qv/image/upload/v1770675767/portfolio/fallback-image-48.avif",
  "https://res.cloudinary.com/dmufha3qv/image/upload/v1770675768/portfolio/fallback-image-49.avif",
  "https://res.cloudinary.com/dmufha3qv/image/upload/v1770675772/portfolio/fallback-image-50.avif",
  "https://res.cloudinary.com/dmufha3qv/image/upload/v1770675777/portfolio/fallback-image-51.avif",
  "https://res.cloudinary.com/dmufha3qv/image/upload/v1770675778/portfolio/fallback-image-52.avif",
  "https://res.cloudinary.com/dmufha3qv/image/upload/v1770675779/portfolio/fallback-image-53.avif"
] as const;

export const getRandomFallback = () => {
  const randomIndex = Math.floor(Math.random() * FALLBACK_IMAGES.length);
  return getOptimizedCloudinaryUrl(FALLBACK_IMAGES[randomIndex]);
};

export const getFallbackBySlug = (slug: string = '') => {
  if (!slug) return getRandomFallback();

  let hash = 0;
  for (let i = 0; i < slug.length; i++) {
    hash = slug.charCodeAt(i) + ((hash << 5) - hash);
  }

  const index = Math.abs(hash % FALLBACK_IMAGES.length);
  return getOptimizedCloudinaryUrl(FALLBACK_IMAGES[index]);
};


export const FALLBACK_COLORS: Record<string, string> = {
  "https://res.cloudinary.com/dmufha3qv/image/upload/v1770675677/portfolio/fallback-image-1.avif": "rgb(79, 101, 143)",
  "https://res.cloudinary.com/dmufha3qv/image/upload/v1770675678/portfolio/fallback-image-2.avif": "rgb(248, 211, 189)",
  "https://res.cloudinary.com/dmufha3qv/image/upload/v1770675679/portfolio/fallback-image-3.avif": "rgb(43, 24, 39)",
  "https://res.cloudinary.com/dmufha3qv/image/upload/v1770675680/portfolio/fallback-image-4.avif": "rgb(64, 96, 129)",
  "https://res.cloudinary.com/dmufha3qv/image/upload/v1770675683/portfolio/fallback-image-5.avif": "rgb(7, 32, 49)",
  "https://res.cloudinary.com/dmufha3qv/image/upload/v1770675684/portfolio/fallback-image-6.avif": "rgb(204, 192, 193)",
  "https://res.cloudinary.com/dmufha3qv/image/upload/v1770675685/portfolio/fallback-image-7.avif": "rgb(125, 136, 22)",
  "https://res.cloudinary.com/dmufha3qv/image/upload/v1770675686/portfolio/fallback-image-8.avif": "rgb(95, 65, 6)",
  "https://res.cloudinary.com/dmufha3qv/image/upload/v1770675687/portfolio/fallback-image-9.avif": "rgb(230, 204, 213)",
  "https://res.cloudinary.com/dmufha3qv/image/upload/v1770675688/portfolio/fallback-image-10.avif": "rgb(154, 212, 254)",
  "https://res.cloudinary.com/dmufha3qv/image/upload/v1770675689/portfolio/fallback-image-11.avif": "rgb(6, 25, 51)",
  "https://res.cloudinary.com/dmufha3qv/image/upload/v1770675691/portfolio/fallback-image-12.avif": "rgb(18, 25, 86)",
  "https://res.cloudinary.com/dmufha3qv/image/upload/v1770675692/portfolio/fallback-image-13.avif": "rgb(202, 208, 236)",
  "https://res.cloudinary.com/dmufha3qv/image/upload/v1770675694/portfolio/fallback-image-14.avif": "rgb(32, 22, 36)",
  "https://res.cloudinary.com/dmufha3qv/image/upload/v1770675695/portfolio/fallback-image-15.avif": "rgb(17, 50, 90)",
  "https://res.cloudinary.com/dmufha3qv/image/upload/v1770675696/portfolio/fallback-image-16.avif": "rgb(17, 15, 42)",
  "https://res.cloudinary.com/dmufha3qv/image/upload/v1770675698/portfolio/fallback-image-17.avif": "rgb(56, 46, 133)",
  "https://res.cloudinary.com/dmufha3qv/image/upload/v1770675698/portfolio/fallback-image-18.avif": "rgb(37, 39, 44)",
  "https://res.cloudinary.com/dmufha3qv/image/upload/v1770675700/portfolio/fallback-image-19.avif": "rgb(34, 20, 59)",
  "https://res.cloudinary.com/dmufha3qv/image/upload/v1770675701/portfolio/fallback-image-20.avif": "rgb(21, 29, 40)",
  "https://res.cloudinary.com/dmufha3qv/image/upload/v1770675702/portfolio/fallback-image-21.avif": "rgb(144, 75, 96)",
  "https://res.cloudinary.com/dmufha3qv/image/upload/v1770675703/portfolio/fallback-image-22.avif": "rgb(12, 12, 21)",
  "https://res.cloudinary.com/dmufha3qv/image/upload/v1770675704/portfolio/fallback-image-23.avif": "rgb(20, 5, 7)",
  "https://res.cloudinary.com/dmufha3qv/image/upload/v1770675706/portfolio/fallback-image-24.avif": "rgb(39, 33, 52)",
  "https://res.cloudinary.com/dmufha3qv/image/upload/v1770675707/portfolio/fallback-image-25.avif": "rgb(213, 221, 231)",
  "https://res.cloudinary.com/dmufha3qv/image/upload/v1770675709/portfolio/fallback-image-26.avif": "rgb(57, 58, 84)",
  "https://res.cloudinary.com/dmufha3qv/image/upload/v1770675710/portfolio/fallback-image-27.avif": "rgb(42, 44, 50)",
  "https://res.cloudinary.com/dmufha3qv/image/upload/v1770675711/portfolio/fallback-image-28.avif": "rgb(67, 118, 131)",
  "https://res.cloudinary.com/dmufha3qv/image/upload/v1770675712/portfolio/fallback-image-29.avif": "rgb(139, 109, 94)",
  "https://res.cloudinary.com/dmufha3qv/image/upload/v1770675714/portfolio/fallback-image-30.avif": "rgb(196, 173, 110)",
  "https://res.cloudinary.com/dmufha3qv/image/upload/v1770675716/portfolio/fallback-image-31.avif": "rgb(46, 18, 87)",
  "https://res.cloudinary.com/dmufha3qv/image/upload/v1770675718/portfolio/fallback-image-32.avif": "rgb(196, 196, 205)",
  "https://res.cloudinary.com/dmufha3qv/image/upload/v1770675719/portfolio/fallback-image-33.avif": "rgb(45, 41, 36)",
  "https://res.cloudinary.com/dmufha3qv/image/upload/v1770675722/portfolio/fallback-image-34.avif": "rgb(203, 155, 108)",
  "https://res.cloudinary.com/dmufha3qv/image/upload/v1770675723/portfolio/fallback-image-35.avif": "rgb(53, 68, 47)",
  "https://res.cloudinary.com/dmufha3qv/image/upload/v1770675725/portfolio/fallback-image-36.avif": "rgb(81, 56, 57)",
  "https://res.cloudinary.com/dmufha3qv/image/upload/v1770675730/portfolio/fallback-image-37.avif": "rgb(35, 35, 36)",
  "https://res.cloudinary.com/dmufha3qv/image/upload/v1770675735/portfolio/fallback-image-38.avif": "rgb(168, 135, 134)",
  "https://res.cloudinary.com/dmufha3qv/image/upload/v1770675736/portfolio/fallback-image-39.avif": "rgb(218, 220, 189)",
  "https://res.cloudinary.com/dmufha3qv/image/upload/v1770675738/portfolio/fallback-image-40.avif": "rgb(45, 61, 58)",
  "https://res.cloudinary.com/dmufha3qv/image/upload/v1770675740/portfolio/fallback-image-41.avif": "rgb(224, 115, 82)",
  "https://res.cloudinary.com/dmufha3qv/image/upload/v1770675741/portfolio/fallback-image-42.avif": "rgb(193, 194, 214)",
  "https://res.cloudinary.com/dmufha3qv/image/upload/v1770675742/portfolio/fallback-image-43.avif": "rgb(149, 89, 77)",
  "https://res.cloudinary.com/dmufha3qv/image/upload/v1770675743/portfolio/fallback-image-44.avif": "rgb(21, 16, 24)",
  "https://res.cloudinary.com/dmufha3qv/image/upload/v1770675744/portfolio/fallback-image-45.avif": "rgb(147, 180, 213)",
  "https://res.cloudinary.com/dmufha3qv/image/upload/v1770675747/portfolio/fallback-image-46.avif": "rgb(163, 128, 199)",
  "https://res.cloudinary.com/dmufha3qv/image/upload/v1770675758/portfolio/fallback-image-47.avif": "rgb(193, 176, 131)",
  "https://res.cloudinary.com/dmufha3qv/image/upload/v1770675767/portfolio/fallback-image-48.avif": "rgb(177, 203, 116)",
  "https://res.cloudinary.com/dmufha3qv/image/upload/v1770675768/portfolio/fallback-image-49.avif": "rgb(215, 164, 194)",
  "https://res.cloudinary.com/dmufha3qv/image/upload/v1770675772/portfolio/fallback-image-50.avif": "rgb(13, 11, 21)",
  "https://res.cloudinary.com/dmufha3qv/image/upload/v1770675777/portfolio/fallback-image-51.avif": "rgb(39, 23, 26)",
  "https://res.cloudinary.com/dmufha3qv/image/upload/v1770675778/portfolio/fallback-image-52.avif": "rgb(22, 22, 24)",
  "https://res.cloudinary.com/dmufha3qv/image/upload/v1770675779/portfolio/fallback-image-53.avif": "rgb(186, 113, 131)"
};

export const getFallbackColorBySlug = (slug: string = '') => {
  if (!slug) return FALLBACK_COLORS[FALLBACK_IMAGES[0]];

  let hash = 0;
  for (let i = 0; i < slug.length; i++) {
    hash = slug.charCodeAt(i) + ((hash << 5) - hash);
  }

  const index = Math.abs(hash % FALLBACK_IMAGES.length);
  const imageUrl = FALLBACK_IMAGES[index];
  return FALLBACK_COLORS[imageUrl] || 'rgb(var(--primary))';
};