// Run from the project root after:
// npm install --prefix node_modules/.buyer-sql-test --no-save --package-lock=false @electric-sql/pglite
// node tests/multiple-artwork-buyers.mjs
import { PGlite } from '../node_modules/.buyer-sql-test/node_modules/@electric-sql/pglite/dist/index.js';
import { readFileSync } from 'node:fs';
import assert from 'node:assert/strict';
const db = new PGlite();
await db.exec(`
create table public.customers (id bigint primary key, name text);
create table public.artworks (id bigint primary key, buyer_id bigint references customers(id), is_unique boolean, is_sold boolean, is_unavailable boolean default false);
insert into customers values (1,'Alice'),(2,'Bob'),(3,'Carol'),(4,'Unused');
insert into artworks values (10,1,false,true,false),(20,1,true,true,false),(30,null,false,true,false),(40,null,false,false,false);
`);
await db.exec(readFileSync('supabase/migrations/202610020001_multiple_artwork_buyers.sql','utf8'));
let checks=0;
async function expect(sql, expected) { const result=await db.query(sql); assert.deepEqual(result.rows,expected); checks++; }
async function rejects(sql, pattern) { await assert.rejects(db.exec(sql),pattern); checks++; }
await expect('select buyer_ids from artworks where id=10',[{buyer_ids:[1]}]);
await expect('select is_sold,buyer_ids from artworks where id=30',[{is_sold:true,buyer_ids:[]}]);
await db.exec('select change_artwork_buyer(array[10]::bigint[],2,true); select change_artwork_buyer(array[10]::bigint[],2,true);');
await expect('select buyer_ids,buyer_id,is_sold from artworks where id=10',[{buyer_ids:[1,2],buyer_id:1,is_sold:true}]);
await expect('select name from artwork_buyers((select a from artworks a where id=10)) order by name',[{name:'Alice'},{name:'Bob'}]);
await expect('select id from purchased_artworks((select c from customers c where id=2))',[{id:10}]);
await rejects('update artworks set is_unique=true where id=10',/Unique artworks/);
await rejects('update artworks set buyer_id=null where id=10',/multiple buyers/);
await rejects('update artworks set buyer_ids=array[1,1] where id=10',/distinct client/);
await rejects('update artworks set buyer_ids=array[999] where id=10',/does not exist/);
await rejects('update artworks set buyer_ids=array[null]::bigint[] where id=10',/distinct client/);
await rejects('update artworks set buyer_ids=array[[1,2]] where id=10',/one-dimensional/);
await rejects('delete from customers where id=2',/Remove this client/);
await rejects('update customers set id=22 where id=2',/Remove this client/);
await rejects('select change_artwork_buyer(array[10,20]::bigint[],3,true)',/Unique artworks/);
await expect('select buyer_ids from artworks where id=10',[{buyer_ids:[1,2]}]);
await db.exec('select change_artwork_buyer(array[10]::bigint[],1,false)');
await expect('select buyer_ids,buyer_id,is_sold from artworks where id=10',[{buyer_ids:[2],buyer_id:2,is_sold:true}]);
await db.exec('select change_artwork_buyer(array[10]::bigint[],2,false); delete from customers where id=2;');
await expect('select buyer_ids,buyer_id,is_sold from artworks where id=10',[{buyer_ids:[],buyer_id:null,is_sold:false}]);
await db.exec('update artworks set buyer_id=3,is_sold=true where id=10');
await expect('select buyer_ids from artworks where id=10',[{buyer_ids:[3]}]);
await db.exec('insert into artworks(id,buyer_ids,is_unique,is_sold) values(50,array[1,3],false,true)');
await expect('select buyer_id from artworks where id=50',[{buyer_id:1}]);
await db.exec(`create role buyer_test; grant usage on schema public to buyer_test; grant select, insert, update, delete on artworks,customers to buyer_test;
alter table artworks enable row level security; alter table customers enable row level security;
create policy read_artworks on artworks for select to buyer_test using (id<>50);
create policy update_artworks on artworks for update to buyer_test using (id=40) with check(id=40);
create policy read_customers on customers for select to buyer_test using (true);
create policy update_customers on customers for update to buyer_test using (true) with check(true);
create policy delete_customers on customers for delete to buyer_test using (true);
set role buyer_test;`);
await expect('select id from purchased_artworks((select c from customers c where id=3))',[{id:10}]);
await rejects('select change_artwork_buyer(array[50]::bigint[],1,false)',/not accessible/);
await rejects('select change_artwork_buyer(array[10]::bigint[],1,true)',/not accessible|could not be updated/);
await rejects('delete from customers where id=3',/Remove this client/);
await db.exec('select change_artwork_buyer(array[40]::bigint[],1,true)');
await expect('select buyer_ids from artworks where id=40',[{buyer_ids:[1]}]);
console.log(`${checks} SQL checks passed (backfill, multiple/unique buyers, reference integrity, atomic rollback, RLS).`);
await db.close();
