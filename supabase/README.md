# Database update

## Copies per client for Multiple artworks

Apply `migrations/202610020002_artwork_buyer_quantities.sql` once, after the multiple-buyers migration below. If the first migration is already applied, run only this new migration. It has not been applied to the live database by the coding agent.

Existing buyer links start at quantity 1. Multiple artworks support a positive whole-number quantity per client, editable when creating or editing an artwork or client. Artwork detail pages show the quantity beside each buyer; client detail pages show that client's quantity beside each purchased Multiple artwork. Unique artworks remain limited to one buyer and one copy. Switching to Unique requires reducing quantities and removing extra buyers first.

The new `set_artwork_buyer_quantities` function updates only the specified client's purchases under artwork row locks, preserving other buyers and their quantities. One request is atomic across all changed artworks. Zero removes the purchase; removing the last buyer makes the artwork Available. Existing buyer functions remain compatible. Table access policies are unchanged. Artwork sale status still applies to the whole record; edition inventory and individual sale prices are not tracked.

Run local checks with the PGlite dependency described below:

```sh
node tests/artwork-buyer-quantities.mjs
```

After applying, save quantity 3 for a client on a Multiple artwork and reload both detail pages. Change it to 2 from the client page and confirm it on the artwork page. Add another buyer and confirm their count is independent. Confirm Unique artworks reject quantity 2 and that removing one buyer preserves other buyers' quantities.

## Multiple artwork buyers

Run `migrations/202610020001_multiple_artwork_buyers.sql` once, in full, in the Supabase SQL editor before using this app version. Apply the existing artwork/client fields migration first if it has not already been applied. This migration has not been applied to the live database by the coding agent.

The migration backfills `artworks.buyer_ids` from existing `buyer_id` values without changing sale status. Unique artworks allow at most one buyer; Multiple artworks allow several distinct buyers. The legacy `buyer_id` remains the first buyer for compatibility. Old single-buyer writes are rejected when they would erase a multiple-buyer relationship. Buyer references are checked under customer row locks; customer deletion and ID changes are blocked while any artwork references that client.

Buyer searches, artwork details, and client lists use computed relationships with existing table access policies. Client-profile additions/removals use an atomic database function that preserves other buyers. Removing one buyer leaves the artwork Sold while other buyers remain; removing the last buyer makes it Available, matching the previous client-profile workflow. Sold artworks can still have unknown purchasers. The artwork's sale status remains a single status for the whole record; this change does not track edition quantities or individual sale prices.

Buyer assignment requires access to update the artwork and to select/lock the referenced customers under the existing RLS policies (PostgreSQL row locks also require customer UPDATE access). This migration does not broaden any policies.

Local SQL regression checks use an isolated in-memory PostgreSQL engine and never connect to Supabase:

```sh
npm install --prefix node_modules/.buyer-sql-test --no-save --package-lock=false @electric-sql/pglite
node tests/multiple-artwork-buyers.mjs
```

Verify after applying:

1. Mark an artwork Multiple and Sold, select two buyers, save, and reload.
2. Confirm both client profiles list it and artwork/artist searches find either buyer.
3. Add a third buyer through their client profile. Remove one buyer and confirm the others remain.
4. Switch a work with several buyers to Unique: saving must fail until extra buyers are explicitly removed.
5. Delete one associated client and confirm the other buyers and Sold status remain.
6. Confirm existing single-buyer works and Sold works with unknown purchasers still load correctly.

## Artist additional materials

Run `migrations/202609140002_artist_additional_materials.sql` before saving Additional Materials on artist profiles. This separate migration only adds the nullable `artists.additional_materials` text column; it does not alter existing data or constraints. Do not rerun the older migration for this change. Existing artist profiles remain readable before this new migration is applied.

## Artwork and client fields

Apply `migrations/202609140001_artwork_and_client_fields.sql` in the Supabase SQL editor before deploying these application changes, or use your existing Supabase migration workflow.

The transaction adds artwork notes, a Not Available flag, and independent VIP/interior designer flags. Existing records get null notes and false flags; their existing values remain unchanged. It removes only the confirmed `sold_requires_buyer` check so sold records can have an unknown purchaser. It does not impose a new buyer/sold rule on historical records. Foreign keys, the primary key, the category check, and access policies are preserved.

The project owner supplied the live artwork constraint definitions, and the migration targets the exact reported constraint. It has not been executed against the live database. Run it once, in full. If any statement fails, the transaction rolls back rather than leaving a partial schema change. Inspect any reported error before retrying; do not remove unrelated constraints.

After applying, verify in the connected app:

1. Create a client and confirm the redirect opens `/clients/<id>`.
2. Set both profile highlights, save, reload, and check badges in the client list.
3. Create and edit artwork with a multiline Note. Save Sold with no client, then select a client using search.
4. Save Not Available, reload, and check its listing badge and status filter.
5. Change or clear retail price and confirm Copy Information follows the price while retaining other text.
6. Search artworks, visit a later page, open a work, then use Back to artworks. Confirm filters, page, and scroll are restored.
7. At desktop width, check four artwork columns and up to ten numbered page buttons.
