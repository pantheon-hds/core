import React, { useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import LandingLayout from '../layout/LandingLayout';
import StatueSVG from '../ui/StatueSVG';
import { getPublicProfile } from '../../services/profileService';
import { RANK_TIER_COLORS, getRankOrder } from '../../constants/ranks';
import './PublicProfile.css';

const PublicProfile: React.FC = () => {
  const { username } = useParams<{ username: string }>();

  const { data: profile, isLoading, isError } = useQuery({
    queryKey: ['publicProfile', username],
    queryFn: () => getPublicProfile(username!),
    enabled: !!username,
    retry: false,
  });

  // profile is null when user not found, undefined while loading
  const notFound = !isLoading && !isError && profile === null;

  const sortedRanks = useMemo(
    () => profile?.ranks.slice().sort((a, b) => getRankOrder(a.tier) - getRankOrder(b.tier)) ?? [],
    [profile]
  );
  const topRank = sortedRanks[0];

  return (
    <LandingLayout>
      <div className="pubprofile">
        {isLoading && (
          <div className="pubprofile__state">
            <div className="pubprofile__state-text">Loading profile...</div>
          </div>
        )}

        {(notFound || isError) && (
          <div className="pubprofile__state">
            <div className="pubprofile__state-title">Player Not Found</div>
            <div className="pubprofile__state-text">
              No player with the username <strong>{username}</strong> exists in Pantheon.
            </div>
            <Link to="/" className="pubprofile__state-link">← Back to home</Link>
          </div>
        )}

        {!isLoading && profile && (
          <>
            {/* Header */}
            <div className="pubprofile__header">
              <div className="pubprofile__header-inner">
                <div className="pubprofile__avatar-wrap">
                  {profile.avatarUrl
                    ? <img src={profile.avatarUrl} alt={profile.username} className="pubprofile__avatar" />
                    : <div className="pubprofile__avatar pubprofile__avatar--empty" />
                  }
                </div>
                <div className="pubprofile__identity">
                  <div className="pubprofile__username">{profile.username}</div>
                  {topRank && (
                    <div className="pubprofile__top-rank"
                      style={{ color: RANK_TIER_COLORS[topRank.tier] || '#c9922a' }}>
                      {topRank.tier} · {topRank.gameTitle}
                    </div>
                  )}
                  <div className="pubprofile__joined">
                    Member since {new Date(profile.createdAt).toLocaleDateString('en-US', {
                      month: 'long', year: 'numeric'
                    })}
                  </div>
                </div>
                {topRank && (
                  <div className="pubprofile__header-statue">
                    <StatueSVG tier={topRank.tier} size={80} />
                  </div>
                )}
              </div>
            </div>

            {/* Stats */}
            <div className="pubprofile__stats">
              <div className="pubprofile__stat">
                <div className="pubprofile__stat-value">{profile.ranks.length}</div>
                <div className="pubprofile__stat-label">Ranks</div>
              </div>
              <div className="pubprofile__stat">
                <div className="pubprofile__stat-value">{profile.statues.length}</div>
                <div className="pubprofile__stat-label">Statues</div>
              </div>
              <div className="pubprofile__stat">
                <div className="pubprofile__stat-value">
                  {profile.statues.filter(s => s.isUnique).length}
                </div>
                <div className="pubprofile__stat-label">Unique</div>
              </div>
            </div>

            {/* Ranks */}
            {profile.ranks.length > 0 && (
              <div className="pubprofile__section">
                <div className="pubprofile__section-title">Ranks</div>
                <div className="pubprofile__ranks">
                  {sortedRanks.map((r) => (
                    <div key={r.tier + r.gameTitle} className="pubprofile__rank-row">
                      <span className="pubprofile__rank-game">{r.gameTitle}</span>
                      <span className="pubprofile__rank-tier"
                        style={{ color: RANK_TIER_COLORS[r.tier] || '#c9922a' }}>
                        {r.tier}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Statues */}
            {profile.statues.length > 0 && (
              <div className="pubprofile__section">
                <div className="pubprofile__section-title">Hall of Statues</div>
                <div className="pubprofile__statues">
                  {profile.statues.map(s => (
                    <div key={s.id}
                      className={`pubprofile__statue-card${s.isUnique ? ' pubprofile__statue-card--unique' : ''}`}>
                      <StatueSVG tier={s.tier} size={64} unique={s.isUnique} />
                      <div className="pubprofile__statue-tier"
                        style={{ color: RANK_TIER_COLORS[s.tier] || '#c9922a' }}>
                        {s.tier}
                      </div>
                      <div className="pubprofile__statue-game">{s.gameTitle}</div>
                      {s.isUnique && (
                        <div className="pubprofile__statue-unique">Unique</div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </LandingLayout>
  );
};

export default PublicProfile;
