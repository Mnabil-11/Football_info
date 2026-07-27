import { Link } from 'react-router-dom';
import { Match } from '../types/football';
import { formatDate, formatTime } from '../utils/date';
import { hideOnImgError } from '../utils/img';
import { isFinished, isLive } from '../utils/matchStatus';
import LiveBadge from './common/LiveBadge';

interface MatchCardProps {
  match: Match;
  /** Hide the date, e.g. when the card is already under a per-day heading. */
  showDate?: boolean;
}

const MatchCard = ({ match, showDate = true }: MatchCardProps) => {
  const played = isFinished(match.status);
  const live = isLive(match.status);
  return (
    <Link
      to={`/match/${match.id}`}
      className="block rounded-xl border border-gray-100 bg-white p-5 shadow-sm transition-shadow hover:shadow-md dark:border-gray-800 dark:bg-gray-900"
    >
      <div className="mb-3 flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
        {live ? (
          <LiveBadge />
        ) : showDate ? (
          <span>{formatDate(match.utcDate)}</span>
        ) : (
          <span />
        )}
        {match.matchday !== null && <span>الجولة {match.matchday}</span>}
      </div>

      <div className="flex items-center justify-between gap-2">
        <div className="flex flex-1 flex-col items-center gap-1">
          {match.homeTeam.crest && (
            <img src={match.homeTeam.crest} alt={match.homeTeam.name} width={40} height={40} className="h-10 w-10 object-contain" loading="lazy" onError={hideOnImgError} />
          )}
          <span className="line-clamp-1 text-center text-xs font-medium dark:text-gray-200">
            {match.homeTeam.shortName ?? match.homeTeam.name}
          </span>
        </div>

        <div className="flex flex-col items-center px-2">
          {played || live ? (
            <span className={`text-xl font-bold ${live ? 'text-red-600 dark:text-red-400' : 'text-gray-900 dark:text-gray-100'}`}>
              {match.score.fullTime.home ?? 0} - {match.score.fullTime.away ?? 0}
            </span>
          ) : (
            <span className="text-sm font-semibold text-blue-600 dark:text-blue-400">
              {formatTime(match.utcDate)}
            </span>
          )}
        </div>

        <div className="flex flex-1 flex-col items-center gap-1">
          {match.awayTeam.crest && (
            <img src={match.awayTeam.crest} alt={match.awayTeam.name} width={40} height={40} className="h-10 w-10 object-contain" loading="lazy" onError={hideOnImgError} />
          )}
          <span className="line-clamp-1 text-center text-xs font-medium dark:text-gray-200">
            {match.awayTeam.shortName ?? match.awayTeam.name}
          </span>
        </div>
      </div>
    </Link>
  );
};

export default MatchCard;
