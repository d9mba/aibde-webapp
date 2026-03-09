-- Migration: Atomic vote increment function
-- Prevents race conditions in the vote API by using PostgreSQL-level atomic operations
-- instead of read-modify-write in JavaScript

CREATE OR REPLACE FUNCTION public.update_votes(
  p_tool_id UUID,
  p_action TEXT,       -- 'add', 'remove', or 'change'
  p_vote_type TEXT,    -- 'up' or 'down'
  p_previous_vote TEXT DEFAULT NULL  -- required for 'change' action
)
RETURNS TABLE(upvotes INT, downvotes INT) AS $$
BEGIN
  -- Validate inputs
  IF p_action NOT IN ('add', 'remove', 'change') THEN
    RAISE EXCEPTION 'Invalid p_action: %. Must be add, remove, or change.', p_action;
  END IF;
  IF p_vote_type NOT IN ('up', 'down') THEN
    RAISE EXCEPTION 'Invalid p_vote_type: %. Must be up or down.', p_vote_type;
  END IF;
  IF p_action = 'change' AND (p_previous_vote IS NULL OR p_previous_vote NOT IN ('up', 'down')) THEN
    RAISE EXCEPTION 'Invalid p_previous_vote: %. Must be up or down when action is change.', p_previous_vote;
  END IF;

  IF p_action = 'add' THEN
    IF p_vote_type = 'up' THEN
      UPDATE public.tools SET upvotes = GREATEST(0, COALESCE(public.tools.upvotes, 0) + 1) WHERE id = p_tool_id;
    ELSE
      UPDATE public.tools SET downvotes = GREATEST(0, COALESCE(public.tools.downvotes, 0) + 1) WHERE id = p_tool_id;
    END IF;

  ELSIF p_action = 'remove' THEN
    IF p_vote_type = 'up' THEN
      UPDATE public.tools SET upvotes = GREATEST(0, COALESCE(public.tools.upvotes, 0) - 1) WHERE id = p_tool_id;
    ELSE
      UPDATE public.tools SET downvotes = GREATEST(0, COALESCE(public.tools.downvotes, 0) - 1) WHERE id = p_tool_id;
    END IF;

  ELSIF p_action = 'change' THEN
    IF p_vote_type = p_previous_vote THEN
      RAISE EXCEPTION 'change action requires different p_vote_type and p_previous_vote, got both = %', p_vote_type;
    END IF;
    IF p_previous_vote = 'up' THEN
      UPDATE public.tools SET
        upvotes = GREATEST(0, COALESCE(public.tools.upvotes, 0) - 1),
        downvotes = GREATEST(0, COALESCE(public.tools.downvotes, 0) + 1)
      WHERE id = p_tool_id;
    ELSIF p_previous_vote = 'down' THEN
      UPDATE public.tools SET
        upvotes = GREATEST(0, COALESCE(public.tools.upvotes, 0) + 1),
        downvotes = GREATEST(0, COALESCE(public.tools.downvotes, 0) - 1)
      WHERE id = p_tool_id;
    END IF;
  END IF;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Tool with id % not found.', p_tool_id;
  END IF;

  RETURN QUERY SELECT public.tools.upvotes, public.tools.downvotes FROM public.tools WHERE id = p_tool_id;
END;
$$ LANGUAGE plpgsql SET search_path = '';
