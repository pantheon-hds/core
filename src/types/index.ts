import type { RankTier } from '../constants/ranks';

export interface Game {
  id: number;
  title: string;
  steam_app_id: string;
}

export interface Challenge {
  id: string;
  title: string;
  description: string;
  tier: string;
  game_id: number;
  attempts: number;
  game: Pick<Game, 'id' | 'title'> | null;
}

export type SubmissionStatus =
  | 'pending'
  | 'in_review'
  | 'approved'
  | 'rejected'
  | 'withdrawn';

export interface Submission {
  id: string;
  video_url: string;
  comment: string;
  status: SubmissionStatus;
  submitted_at: string;
  admin_note: string | null;
  challenge_id: string;
  user_id: string;
  cooldown_until: string | null;
  user: Pick<DBUser, 'username' | 'steam_id'> | null;
  challenge: Pick<Challenge, 'title' | 'tier'> | null;
}

export interface DBUser {
  id: string;
  username: string;
  steam_id: string;
  is_admin: boolean;
  is_judge: boolean;
  is_test: boolean;
  created_at: string;
}

export interface JudgeApplication {
  id: string;
  user_id: string;
  game_id: number;
  motivation: string;
  status: 'pending' | 'approved' | 'rejected';
  applied_at: string;
  user: Pick<DBUser, 'username' | 'steam_id'> | null;
  game: Pick<Game, 'title'> | null;
}

export interface JudgeEligibility {
  hasPlatinumRank: boolean;
  accountAgeOk: boolean;
  isAlreadyJudge: boolean;
  existingApplication: Pick<JudgeApplication, 'id' | 'status'> | null;
  meetsRequirements: boolean;
}

export interface JudgeAssignment {
  id: string;
  assigned_at: string;
  vote: 'approved' | 'rejected' | null;
  timestamp_note: string | null;
  submission: {
    id: string;
    video_url: string;
    comment: string;
    submitted_at: string;
    user: Pick<DBUser, 'username'>;
    challenge: Pick<Challenge, 'title' | 'tier' | 'description'>;
  };
}

export interface UserRank {
  id: string;
  tier: RankTier;
  method: string;
  granted_at: string;
  game: Pick<Game, 'id' | 'title' | 'steam_app_id'> | null;
}

export interface UserStatue {
  id: string;
  tier: RankTier;
  challenge: string;
  is_unique: boolean;
  granted_at: string;
  game: Pick<Game, 'title'> | null;
}
