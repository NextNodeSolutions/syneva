-- The list is the launch list: one email when Syneva can be installed. Two
-- optional details a signup may leave, both NULL when left out: the name to
-- greet (as typed, trimmed) and the agents ticked, a JSON array of the form's
-- ids (src/features/subscribe/model/agents.ts), e.g. ["claude-code","pi"].
ALTER TABLE subscribers ADD COLUMN name TEXT;
ALTER TABLE subscribers ADD COLUMN agents TEXT;
