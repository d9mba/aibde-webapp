-- Supabase Function: tools_search_vector_update
-- Auto-generated from schema.sql

-- Name: tools_search_vector_update(); Type: FUNCTION; Schema: public; Owner: postgres
--
--
--

CREATE FUNCTION public.tools_search_vector_update() RETURNS trigger
    LANGUAGE plpgsql
    SET search_path TO 'public'
    AS $$

BEGIN

    NEW.search_vector :=

        setweight(to_tsvector('english', coalesce(NEW.name, '')), 'A') ||

        setweight(to_tsvector('english', coalesce(NEW.summary, '')), 'B') ||

        setweight(to_tsvector('english', coalesce(array_to_string(NEW.category_name, ' '), '')), 'B') ||

        setweight(to_tsvector('english', coalesce(array_to_string(NEW.task_name, ' '), '')), 'B') ||

        setweight(to_tsvector('english', coalesce(array_to_string(NEW.tags, ' '), '')), 'C') ||

        setweight(to_tsvector('english', coalesce(NEW.description, '')), 'D');

    RETURN NEW;

END;

$$;


ALTER FUNCTION public.tools_search_vector_update() OWNER TO postgres;
