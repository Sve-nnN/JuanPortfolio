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
