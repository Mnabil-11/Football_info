import { SyntheticEvent } from 'react';

/**
 * football-data.org's crest/logo URLs are frequently dead or expired. Hiding
 * the element on error avoids the browser's broken-image icon; there's no
 * good letter-fallback for a team crest the way there is for a person's name.
 */
export const hideOnImgError = (event: SyntheticEvent<HTMLImageElement>): void => {
  event.currentTarget.style.display = 'none';
};
