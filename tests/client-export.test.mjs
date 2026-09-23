import { test } from "node:test";
import assert from "node:assert/strict";
import ExcelJS from "exceljs";
import { createClientWorkbook } from "../lib/client-export.ts";

test("Excel round trip preserves profile text, Unicode, phone numbers and flags", async () => {
  const workbook = createClientWorkbook([{
    id: 42, name: "山田 Ōmura", email: "client@example.com", phone: "+81 001234",
    address: "Tokyo\nJapan", notes: '=HYPERLINK("https://example.com")',
    is_vip: true, is_interior_designer: false, artworks: [{ id: 1 }, { id: 2 }],
  }, {
    id: 43, name: "Other", email: null, phone: null, address: null, notes: null,
    is_vip: false, is_interior_designer: true, artworks: null,
  }]);
  const reopened = new ExcelJS.Workbook();
  await reopened.xlsx.load(await workbook.xlsx.writeBuffer());
  const sheet = reopened.getWorksheet("Client Profiles");
  assert.equal(sheet.rowCount, 3);
  assert.equal(sheet.getCell("B2").value, "山田 Ōmura");
  assert.equal(sheet.getCell("D2").value, "+81 001234");
  assert.equal(sheet.getCell("E2").value, "Tokyo\nJapan");
  assert.equal(sheet.getCell("F2").value, '=HYPERLINK("https://example.com")');
  assert.equal(sheet.getCell("F2").type, ExcelJS.ValueType.String);
  assert.equal(sheet.getCell("G2").value, "Yes");
  assert.equal(sheet.getCell("H2").value, "No");
  assert.equal(sheet.getCell("I2").value, 2);
  assert.equal(sheet.getCell("I3").value, 0);
});
