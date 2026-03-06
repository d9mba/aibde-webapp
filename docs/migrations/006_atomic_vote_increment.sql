-- Migration: Atomic vote increment function
-- Prevents race conditions in the vote API by using PostgreSQL-level atomic operations
-- instead of read-modify-write in JavaScript

CREATE OR REPLACE FUNCTION update_votes(
  p_tool_id UUID,
  p_action TEXT,       -- 'add', 'remove', or 'change'
  p_vote_type TEXT,    -- 'up' or 'down'
  p_previous_vote TEXT DEFAULT NULL  -- required for 'change' action
)
RETURNS TABLE(upvotes INT, downvotes INT) AS $$
BEGIN
  IF p_action = 'add' THEN
    IF p_vote_type = 'up' THEN
      UPDATE tools SET upvotes = GREATEST(0, COALESCE(tools.upvotes, 0) + 1) WHERE id = p_tool_id;
    ELSE
      UPDATE tools SET downvotes = GREATEST(0, COALESCE(tools.downvotes, 0) + 1) WHERE id = p_tool_id;
    END IF;

  ELSIF p_action = 'remove' THEN
    IF p_vote_type = 'up' THEN
      UPDATE tools SET upvotes = GREATEST(0, COALESCE(tools.upvotes, 0) - 1) WHERE id = p_tool_id;
    ELSE
      UPDATE tools SET downvotes = GREATEST(0, COALESCE(tools.downvotes, 0) - 1) WHERE id = p_tool_id;
    END IF;

  ELSIF p_action = 'change' THEN
    IF p_previous_vote = 'up' THEN
      UPDATE tools SET
        upvotes = GREATEST(0, COALESCE(tools.upvotes, 0) - 1),
        downvotes = GREATEST(0, COALESCE(tools.downvotes, 0) + 1)
      WHERE id = p_tool_id;
    ELSE
      UPDATE tools SET
        upvotes = GREATEST(0, COALESCE(tools.upvotes, 0) + 1),
        downvotes = GREATEST(0, COALESCE(tools.downvotes, 0) - 1)
      WHERE id = p_tool_id;
    END IF;
  END IF;

  RETURN QUERY SELECT tools.upvotes, tools.downvotes FROM tools WHERE id = p_tool_id;
END;
$$ LANGUAGE plpgsql;
