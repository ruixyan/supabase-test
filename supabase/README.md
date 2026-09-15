# Database update

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
