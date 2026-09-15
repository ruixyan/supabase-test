import { test } from "node:test";
import assert from "node:assert/strict";
import { normalizeSearch, matchesSearch, loadAllRows } from "../lib/search.ts";

test("plain letters match macrons, accents, umlauts and case", () => {
  for (const [text, query] of [["Ōmurasaki", "omurasaki"], ["Café", "CAFE"], ["Müller", "muller"], ["OMURASAKI", "ōmurasaki"]]) {
    assert.equal(matchesSearch(text, query), true);
  }
  assert.equal(matchesSearch("O\u0304murasaki", "omurasaki"), true);
});

test("Japanese voiced marks and meaningful punctuation stay distinct", () => {
  assert.equal(normalizeSearch("ガラス"), "ガラス");
  assert.equal(matchesSearch("ガラス", "カラス"), false);
  assert.equal(matchesSearch("Jar (Blue), 50%", "(blue), 50%"), true);
  assert.equal(matchesSearch("Jar", "%"), false);
  assert.equal(matchesSearch("Ōmurasaki", "oomurasaki"), false);
});

test("empty or missing fields are safe", () => {
  assert.equal(normalizeSearch(null), "");
  assert.equal(normalizeSearch(undefined), "");
  assert.equal(matchesSearch(null, "name"), false);
  assert.equal(matchesSearch("Title", "  "), true);
});

test("search finds records beyond both the first page and database response limit", async () => {
  const source = Array.from({ length: 1201 }, (_, id) => ({ id, title: id >= 1100 ? "Ōmurasaki" : "Other" }));
  let requests = 0;
  const rows = await loadAllRows(async (from, to) => {
    requests++;
    return { data: source.slice(from, Math.min(to + 1, from + 200)), error: null, count: source.length };
  });
  const matches = rows.filter((row) => matchesSearch(row.title, "omurasaki"));
  assert.equal(requests, 7);
  assert.equal(rows.length, 1201);
  assert.equal(matches.length, 101);
  assert.equal(matches.slice(12, 24)[0].id, 1112);
});

test("batch failures do not return misleading partial search results", async () => {
  await assert.rejects(loadAllRows(async (from) => from === 0
    ? { data: [{ id: 1 }], error: null, count: 2 }
    : { data: null, error: { message: "Permission denied" }, count: null }), /Permission denied/);
  await assert.rejects(loadAllRows(async () => ({ data: [], error: null, count: 2 })), /complete search list/);
});
