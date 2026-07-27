const FINISHED = new Set(['FINISHED', 'AWARDED']);
const LIVE = new Set(['IN_PLAY', 'PAUSED']);

export const isFinished = (status: string): boolean => FINISHED.has(status);
export const isLive = (status: string): boolean => LIVE.has(status);
