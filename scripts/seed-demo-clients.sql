-- Local demo seed: wipe app data (keep internal_users + migration starter records),
-- then create Pokemon and Howard Homes with buildings, areas, and inspection plans.
-- Run: docker exec -i supabase_db_ecs-qc psql -U postgres -d postgres -f - < scripts/seed-demo-clients.sql

BEGIN;

-- Operational / evidence data
DELETE FROM correction_notes;
DELETE FROM ticket_after_photo_evidence;
DELETE FROM tickets;
DELETE FROM inspection_item_evidence;
DELETE FROM inspection_items;
DELETE FROM inspection_area_inspections;
DELETE FROM inspections;

-- Setup hierarchy
DELETE FROM building_inspection_plan_entries;
DELETE FROM building_inspection_plans;
DELETE FROM areas;
DELETE FROM buildings;
DELETE FROM clients;
DELETE FROM company_branding;

-- Clients
INSERT INTO clients (name) VALUES
  ('Pokemon'),
  ('Howard Homes');

-- Buildings
WITH pokemon_client AS (SELECT id FROM clients WHERE name = 'Pokemon'),
     howard_client AS (SELECT id FROM clients WHERE name = 'Howard Homes')
INSERT INTO buildings (client_id, name)
SELECT pokemon_client.id, 'Pokemon HQ' FROM pokemon_client
UNION ALL
SELECT howard_client.id, 'Howard Homes Corporate Office' FROM howard_client;

-- Areas
WITH
  lobby AS (SELECT id FROM area_types WHERE name = 'Lobby'),
  restroom AS (SELECT id FROM area_types WHERE name = 'Restroom'),
  elevator AS (SELECT id FROM area_types WHERE name = 'Elevator'),
  office AS (SELECT id FROM area_types WHERE name = 'Office'),
  hallway AS (SELECT id FROM area_types WHERE name = 'Hallway'),
  pokemon_bldg AS (
    SELECT b.id
    FROM buildings b
    JOIN clients c ON c.id = b.client_id
    WHERE c.name = 'Pokemon' AND b.name = 'Pokemon HQ'
  ),
  howard_bldg AS (
    SELECT b.id
    FROM buildings b
    JOIN clients c ON c.id = b.client_id
    WHERE c.name = 'Howard Homes' AND b.name = 'Howard Homes Corporate Office'
  )
INSERT INTO areas (building_id, area_type_id, name)
SELECT pokemon_bldg.id, lobby.id, 'Main Lobby' FROM pokemon_bldg, lobby
UNION ALL
SELECT pokemon_bldg.id, restroom.id, '2nd Floor Women''s Restroom' FROM pokemon_bldg, restroom
UNION ALL
SELECT pokemon_bldg.id, elevator.id, 'Freight Elevator' FROM pokemon_bldg, elevator
UNION ALL
SELECT howard_bldg.id, lobby.id, 'Front Lobby' FROM howard_bldg, lobby
UNION ALL
SELECT howard_bldg.id, office.id, 'Leasing Office' FROM howard_bldg, office
UNION ALL
SELECT howard_bldg.id, hallway.id, 'East Wing Hallway' FROM howard_bldg, hallway
UNION ALL
SELECT howard_bldg.id, restroom.id, '1st Floor Men''s Restroom' FROM howard_bldg, restroom;

-- Building inspection plans
WITH
  pokemon_bldg AS (
    SELECT b.id AS building_id
    FROM buildings b
    JOIN clients c ON c.id = b.client_id
    WHERE c.name = 'Pokemon' AND b.name = 'Pokemon HQ'
  ),
  howard_bldg AS (
    SELECT b.id AS building_id
    FROM buildings b
    JOIN clients c ON c.id = b.client_id
    WHERE c.name = 'Howard Homes' AND b.name = 'Howard Homes Corporate Office'
  ),
  inserted_plans AS (
    INSERT INTO building_inspection_plans (building_id)
    SELECT building_id FROM pokemon_bldg
    UNION ALL
    SELECT building_id FROM howard_bldg
    RETURNING id, building_id
  ),
  lobby_tpl AS (
    SELECT id
    FROM inspection_templates
    WHERE name IN ('Lobby', 'Main Lobby Pokemon')
    ORDER BY CASE name WHEN 'Lobby' THEN 0 ELSE 1 END
    LIMIT 1
  ),
  restroom_tpl AS (SELECT id FROM inspection_templates WHERE name = 'Restroom' LIMIT 1),
  office_tpl AS (SELECT id FROM inspection_templates WHERE name = 'Office' LIMIT 1),
  hallway_tpl AS (SELECT id FROM inspection_templates WHERE name = 'Hallway' LIMIT 1),
  pokemon_plan AS (
    SELECT ip.id
    FROM inserted_plans ip
    JOIN pokemon_bldg pb ON pb.building_id = ip.building_id
  ),
  howard_plan AS (
    SELECT ip.id
    FROM inserted_plans ip
    JOIN howard_bldg hb ON hb.building_id = ip.building_id
  ),
  pokemon_areas AS (
    SELECT a.id, a.name
    FROM areas a
    JOIN buildings b ON b.id = a.building_id
    JOIN clients c ON c.id = b.client_id
    WHERE c.name = 'Pokemon' AND b.name = 'Pokemon HQ'
  ),
  howard_areas AS (
    SELECT a.id, a.name
    FROM areas a
    JOIN buildings b ON b.id = a.building_id
    JOIN clients c ON c.id = b.client_id
    WHERE c.name = 'Howard Homes' AND b.name = 'Howard Homes Corporate Office'
  )
INSERT INTO building_inspection_plan_entries (plan_id, area_id, inspection_template_id, position)
SELECT pokemon_plan.id, pa.id, lobby_tpl.id, 1
FROM pokemon_plan, pokemon_areas pa, lobby_tpl
WHERE pa.name = 'Main Lobby'
UNION ALL
SELECT pokemon_plan.id, pa.id, restroom_tpl.id, 2
FROM pokemon_plan, pokemon_areas pa, restroom_tpl
WHERE pa.name = '2nd Floor Women''s Restroom'
UNION ALL
SELECT pokemon_plan.id, pa.id, lobby_tpl.id, 3
FROM pokemon_plan, pokemon_areas pa, lobby_tpl
WHERE pa.name = 'Freight Elevator'
UNION ALL
SELECT howard_plan.id, ha.id, lobby_tpl.id, 1
FROM howard_plan, howard_areas ha, lobby_tpl
WHERE ha.name = 'Front Lobby'
UNION ALL
SELECT howard_plan.id, ha.id, office_tpl.id, 2
FROM howard_plan, howard_areas ha, office_tpl
WHERE ha.name = 'Leasing Office'
UNION ALL
SELECT howard_plan.id, ha.id, hallway_tpl.id, 3
FROM howard_plan, howard_areas ha, hallway_tpl
WHERE ha.name = 'East Wing Hallway'
UNION ALL
SELECT howard_plan.id, ha.id, restroom_tpl.id, 4
FROM howard_plan, howard_areas ha, restroom_tpl
WHERE ha.name = '1st Floor Men''s Restroom';

COMMIT;
