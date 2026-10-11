import { test } from "node:test";
import assert from "node:assert/strict";
import { syncRetailPrice } from "../lib/artwork-copy.ts";

test("saved retail price removes the duplicate standalone price and preserves custom copy", () => {
  assert.equal(
    syncRetailPrice('**Artist**\n*Jar “Laulan”*\n$1,000\nRetail Price: $1,000\nCost: ￥500\nCustom description', "2500"),
    '**Artist**\n*Jar “Laulan”*\nRetail Price: $2,500\nCost: ￥500\nCustom description'
  );
});

test("adding a previously missing retail price retains the description", () => {
  assert.equal(syncRetailPrice("Handcrafted jar", "1200"), "Handcrafted jar\nRetail Price: $1,200");
});

test("duplicate retail labels collapse to one price", () => {
  assert.equal(
    syncRetailPrice("Jar\nRetail Price: $100\nRetail Price: $200", "300"),
    "Jar\nRetail Price: $300"
  );
});

test("clearing the retail price removes stale generated prices", () => {
  const updated = syncRetailPrice("Jar\n$1,200\nRetail Price: $1,200\nCost: ￥500", "");
  assert.ok(!updated.includes("$1,200"));
  assert.ok(!updated.includes("Retail Price:"));
  assert.ok(updated.includes("Cost: ￥500"));
});

test("zero is a price and repeated saves do not duplicate it", () => {
  const updated = syncRetailPrice("Jar", "0");
  assert.equal(updated, "Jar\nRetail Price: $0");
  assert.equal(syncRetailPrice(updated, "0"), updated);
});
