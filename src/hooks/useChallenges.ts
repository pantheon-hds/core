import { useQuery } from '@tanstack/react-query';
import { fetchChallenges, fetchGames } from '../services/challengeService';

export function useChallenges() {
  const { data: challenges = [] } = useQuery({ queryKey: ['challenges'], queryFn: fetchChallenges });
  const { data: games = [] } = useQuery({ queryKey: ['games'], queryFn: fetchGames });
  return { challenges, games };
}
