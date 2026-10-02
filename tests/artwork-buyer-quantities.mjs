// Uses the same local PGlite installation as multiple-artwork-buyers.mjs.
import { PGlite } from '../node_modules/.buyer-sql-test/node_modules/@electric-sql/pglite/dist/index.js';
import { readFileSync } from 'node:fs';
import assert from 'node:assert/strict';

const db = new PGlite();
let checks = 0;
async function expect(sql, expected) {
  assert.deepEqual((await db.query(sql)).rows, expected);
  checks++;
}
async function rejects(sql, pattern) {
  await assert.rejects(db.exec(sql), pattern);
  checks++;
}
try {
  await db.exec(`
    create table customers (id bigint primary key, name text);
    create table artworks (id bigint primary key, buyer_id bigint references customers(id),
      is_unique boolean, is_sold boolean, is_unavailable boolean default false);
    insert into customers values (1,'Alice'),(2,'Bob'),(3,'Carol');
    insert into artworks values (10,1,false,true,false),(20,1,true,true,false),
      (30,null,false,false,true),(40,null,null,false,false);
  `);
  await db.exec(readFileSync('supabase/migrations/202610020001_multiple_artwork_buyers.sql', 'utf8'));
  await db.exec('select change_artwork_buyer(array[10]::bigint[],2,true)');
  await db.exec(readFileSync('supabase/migrations/202610020002_artwork_buyer_quantities.sql', 'utf8'));
  await expect('select id,buyer_quantities from artworks order by id', [
    { id: 10, buyer_quantities: { 1: 1, 2: 1 } },
    { id: 20, buyer_quantities: { 1: 1 } },
    { id: 30, buyer_quantities: {} },
    { id: 40, buyer_quantities: {} },
  ]);
  await db.exec(`select set_artwork_buyer_quantities(1, '{"10":3,"30":2}')`);
  // Both page relationships retain quantities without duplicating client links.
  await expect('select id,buyer_quantities from purchased_artworks((select c from customers c where id=1)) order by id', [
    { id: 10, buyer_quantities: { 1: 3, 2: 1 } },
    { id: 20, buyer_quantities: { 1: 1 } },
    { id: 30, buyer_quantities: { 1: 2 } },
  ]);
  await expect('select id from artwork_buyers((select a from artworks a where id=10)) order by id', [{ id: 1 }, { id: 2 }]);
  await expect('select is_sold,is_unavailable from artworks where id=30', [{ is_sold: true, is_unavailable: false }]);
  await db.exec(`update artworks set buyer_quantities='{"1":4,"2":2}' where id=10`);
  await db.exec(`select set_artwork_buyer_quantities(1, '{"10":5}')`);
  await expect('select buyer_quantities from artworks where id=10', [{ buyer_quantities: { 1: 5, 2: 2 } }]);
  await rejects(`select set_artwork_buyer_quantities(1, '{"10":6,"20":2}')`, /Only Multiple/);
  await expect('select buyer_quantities from artworks where id=10', [{ buyer_quantities: { 1: 5, 2: 2 } }]);
  await rejects(`update artworks set buyer_quantities='{"1":2}' where id=20`, /Only Multiple/);
  await rejects(`select set_artwork_buyer_quantities(2, '{"20":1}')`, /Unique artworks/);
  await rejects(`select set_artwork_buyer_quantities(1, '{"40":2}')`, /Only Multiple/);
  await rejects('update artworks set is_unique=true where id=30', /Only Multiple/);
  for (const invalid of ['0', '-1', '1.5', 'null', '"2"', 'true', '2147483648']) {
    await rejects(`update artworks set buyer_quantities='{"1":${invalid}}' where id=30`, /positive whole number/);
  }
  for (const invalid of ['null', '[]', '"bad"']) {
    await rejects(`update artworks set buyer_quantities='${invalid}' where id=30`, /must be an object/);
  }
  for (const invalid of ['-1', '1.5', 'null', '"2"', 'true', '2147483648']) {
    await rejects(`select set_artwork_buyer_quantities(1, '{"30":${invalid}}')`, /whole.number/);
  }
  await rejects(`select set_artwork_buyer_quantities(1, '{"bad":1}')`, /Artwork IDs/);
  await rejects(`select set_artwork_buyer_quantities(null, '{"30":1}')`, /required/);
  await rejects(`select set_artwork_buyer_quantities(1, '[]')`, /required/);
  await rejects(`select set_artwork_buyer_quantities(999, '{"30":1}')`, /does not exist/);
  await rejects(`select set_artwork_buyer_quantities(1, '{"999":1}')`, /does not exist/);
  // Legacy additions preserve quantities; removals clean up only that buyer.
  await db.exec('select change_artwork_buyer(array[10]::bigint[],1,true)');
  await expect('select buyer_quantities from artworks where id=10', [{ buyer_quantities: { 1: 5, 2: 2 } }]);
  await db.exec('select change_artwork_buyer(array[10]::bigint[],2,false)');
  await expect('select buyer_quantities,buyer_ids,buyer_id,is_sold from artworks where id=10', [
    { buyer_quantities: { 1: 5 }, buyer_ids: [1], buyer_id: 1, is_sold: true },
  ]);
  await db.exec(`select set_artwork_buyer_quantities(1, '{"10":0}')`);
  await expect('select buyer_quantities,buyer_ids,buyer_id,is_sold from artworks where id=10', [
    { buyer_quantities: {}, buyer_ids: [], buyer_id: null, is_sold: false },
  ]);
  await db.exec(`select set_artwork_buyer_quantities(1, '{"30":1.0}'); update artworks set is_unique=true where id=30`);
  await expect('select buyer_quantities,is_unique from artworks where id=30', [{ buyer_quantities: { 1: 1 }, is_unique: true }]);
  await db.exec(`insert into artworks(id,buyer_ids,buyer_quantities,is_unique,is_sold)
    values (50,array[1,2],'{"1":2,"2":4}',false,true)`);
  await expect('select buyer_quantities from artworks where id=50', [{ buyer_quantities: { 1: 2, 2: 4 } }]);
  await rejects(`insert into artworks(id,buyer_ids,buyer_quantities,is_unique,is_sold)
    values (60,array[1],'{"1":2}',true,true)`, /Only Multiple/);
  await db.exec(`
    create role quantity_test;
    grant usage on schema public to quantity_test;
    grant select,insert,update,delete on artworks,customers to quantity_test;
    alter table artworks enable row level security;
    alter table customers enable row level security;
    create policy read_artworks on artworks for select to quantity_test using (id<>50);
    create policy update_artworks on artworks for update to quantity_test using (id=10) with check(id=10);
    create policy read_customers on customers for select to quantity_test using (id<>3);
    create policy update_customers on customers for update to quantity_test using (true) with check(true);
    create policy delete_customers on customers for delete to quantity_test using (true);
    set role quantity_test;
  `);
  await rejects(`select set_artwork_buyer_quantities(1, '{"50":8}')`, /not accessible/);
  await rejects(`select set_artwork_buyer_quantities(1, '{"30":0}')`, /not accessible|could not be updated/);
  await rejects(`select set_artwork_buyer_quantities(3, '{"10":2}')`, /not accessible/);
  await db.exec(`select set_artwork_buyer_quantities(2, '{"10":3}')`);
  await expect('select buyer_quantities from artworks where id=10', [{ buyer_quantities: { 2: 3 } }]);
  await rejects('delete from customers where id=2', /Remove this client/);
  await expect('select id from purchased_artworks((select c from customers c where id=2))', [{ id: 10 }]);
  console.log(`${checks} quantity SQL checks passed (backfill, page relationships, Multiple-only counts, validation, rollback, legacy compatibility, RLS).`);
} finally {
  await db.close();
}
