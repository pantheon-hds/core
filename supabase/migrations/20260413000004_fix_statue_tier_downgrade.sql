-- Fix: statue upsert in award_rank_on_approval was unconditionally overwriting
-- the existing statue tier with the new challenge's tier (excluded.tier).
-- If a Diamond-ranked user completed a Platinum challenge, their statue would
-- downgrade from Diamond to Platinum.
--
-- Fix: add WHERE to ON CONFLICT DO UPDATE so it only updates when the incoming
-- tier is strictly better (lower order number = higher rank).

create or replace function award_rank_on_approval(p_user_id uuid, p_challenge_id int)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_game_id        int;
  v_title          text;
  v_tier           text;
  v_current_tier   text;
  v_current_method text;
  v_challenge_tier text;
  v_required       int;
  v_next_rank      text;
  v_approved_count bigint;
  v_next_order     int;
  v_current_order  int;
begin
  -- 1. Get challenge info
  select game_id, title, tier
  into v_game_id, v_title, v_tier
  from challenges where id = p_challenge_id;
  if not found then return; end if;

  -- 2. Upsert statue (record completion of this challenge).
  --    Only update if the incoming tier is strictly better than the existing one.
  --    Lower order number = higher rank (Legend=0, Bronze I=11).
  insert into statues (user_id, game_id, tier, challenge, is_unique)
  values (p_user_id, v_game_id, v_tier, v_title, v_tier = 'Legend')
  on conflict (user_id, game_id) do update
    set tier      = excluded.tier,
        challenge = excluded.challenge,
        is_unique = excluded.is_unique
    where (
      case excluded.tier
        when 'Legend'      then 0  when 'Grandmaster' then 1  when 'Master'     then 2
        when 'Diamond'     then 3  when 'Platinum'    then 4  when 'Gold'       then 5
        when 'Silver III'  then 6  when 'Silver II'   then 7  when 'Silver I'   then 8
        when 'Bronze III'  then 9  when 'Bronze II'   then 10 when 'Bronze I'   then 11
        else 99
      end
    ) < (
      case statues.tier
        when 'Legend'      then 0  when 'Grandmaster' then 1  when 'Master'     then 2
        when 'Diamond'     then 3  when 'Platinum'    then 4  when 'Gold'       then 5
        when 'Silver III'  then 6  when 'Silver II'   then 7  when 'Silver I'   then 8
        when 'Bronze III'  then 9  when 'Bronze II'   then 10 when 'Bronze I'   then 11
        else 99
      end
    );

  -- 3. Get current rank for this user/game (null = unranked)
  select tier, method into v_current_tier, v_current_method
  from ranks where user_id = p_user_id and game_id = v_game_id;

  -- 4. Determine progression requirements based on current tier
  case v_current_tier
    when 'Bronze I'   then v_challenge_tier := 'Platinum'; v_required := 5; v_next_rank := 'Platinum';
    when 'Bronze II'  then v_challenge_tier := 'Platinum'; v_required := 5; v_next_rank := 'Platinum';
    when 'Bronze III' then v_challenge_tier := 'Platinum'; v_required := 5; v_next_rank := 'Platinum';
    when 'Silver I'   then v_challenge_tier := 'Platinum'; v_required := 4; v_next_rank := 'Platinum';
    when 'Silver II'  then v_challenge_tier := 'Platinum'; v_required := 4; v_next_rank := 'Platinum';
    when 'Silver III' then v_challenge_tier := 'Platinum'; v_required := 4; v_next_rank := 'Platinum';
    when 'Gold'       then v_challenge_tier := 'Platinum'; v_required := 3; v_next_rank := 'Platinum';
    when 'Platinum'   then v_challenge_tier := 'Diamond';  v_required := 2; v_next_rank := 'Diamond';
    when 'Diamond'    then v_challenge_tier := 'Master';   v_required := 2; v_next_rank := 'Master';
    when 'Master'     then v_challenge_tier := 'Grandmaster'; v_required := 1; v_next_rank := 'Grandmaster';
    else -- null = unranked
      v_challenge_tier := 'Platinum'; v_required := 5; v_next_rank := 'Platinum';
  end case;

  -- 5. Only proceed if this challenge's tier is the one required for progression
  if v_tier <> v_challenge_tier then return; end if;

  -- 6. Count approved submissions in the required tier for this game
  select count(*) into v_approved_count
  from submissions s
  join challenges c on c.id = s.challenge_id
  where s.user_id  = p_user_id
    and s.status   = 'approved'
    and c.game_id  = v_game_id
    and c.tier     = v_challenge_tier;

  if v_approved_count < v_required then return; end if;

  -- 7. Never downgrade a community_verified rank (lower order = better)
  if v_current_method = 'community_verified' and v_current_tier is not null then
    v_next_order := case v_next_rank
      when 'Legend'      then 0  when 'Grandmaster' then 1  when 'Master'     then 2
      when 'Diamond'     then 3  when 'Platinum'    then 4  when 'Gold'       then 5
      when 'Silver III'  then 6  when 'Silver II'   then 7  when 'Silver I'   then 8
      when 'Bronze III'  then 9  when 'Bronze II'   then 10 when 'Bronze I'   then 11
      else 99
    end;
    v_current_order := case v_current_tier
      when 'Legend'      then 0  when 'Grandmaster' then 1  when 'Master'     then 2
      when 'Diamond'     then 3  when 'Platinum'    then 4  when 'Gold'       then 5
      when 'Silver III'  then 6  when 'Silver II'   then 7  when 'Silver I'   then 8
      when 'Bronze III'  then 9  when 'Bronze II'   then 10 when 'Bronze I'   then 11
      else 99
    end;
    if v_next_order >= v_current_order then return; end if;
  end if;

  -- 8. Award the rank
  insert into ranks (user_id, game_id, tier, method)
  values (p_user_id, v_game_id, v_next_rank, 'community_verified')
  on conflict (user_id, game_id) do update
    set tier   = excluded.tier,
        method = excluded.method;
end;
$$;
