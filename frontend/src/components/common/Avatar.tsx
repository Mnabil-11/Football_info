import { useState } from 'react';

interface AvatarProps {
  src?: string | null;
  alt: string;
  /** Shown as an initial letter when there's no photo, or it fails to load. */
  fallbackText: string;
  /** Tailwind size classes, e.g. "h-20 w-20". */
  size: string;
  /** Tailwind text-size class for the fallback letter. Defaults to text-2xl. */
  textSize?: string;
  /** Extra classes for the photo variant only (e.g. a ring). */
  imgClassName?: string;
}

/**
 * A photo with a letter-avatar fallback — used whenever a photo fails to
 * load (broken/expired provider URLs are common) as well as when there's no
 * photo at all, so a dead link never surfaces the browser's broken-image icon.
 */
const Avatar = ({ src, alt, fallbackText, size, textSize = 'text-2xl', imgClassName = '' }: AvatarProps) => {
  const [errored, setErrored] = useState(false);

  if (src && !errored) {
    return (
      <img
        src={src}
        alt={alt}
        className={`${size} rounded-full object-cover ${imgClassName}`}
        onError={() => setErrored(true)}
      />
    );
  }

  return (
    <div
      className={`flex ${size} items-center justify-center rounded-full bg-blue-100 font-bold text-blue-700 dark:bg-blue-950 dark:text-blue-300 ${textSize}`}
    >
      {fallbackText.charAt(0).toUpperCase()}
    </div>
  );
};

export default Avatar;
