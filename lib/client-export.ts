import ExcelJS from "exceljs";

type ExportProfile = {
  id: number;
  name: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  notes: string | null;
  is_vip: boolean;
  is_interior_designer: boolean;
  artworks: { id: number }[] | null;
};

export function createClientWorkbook(profiles: ExportProfile[]) {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("Client Profiles");
  sheet.columns = [
    { header: "Client ID", key: "id", width: 12 },
    { header: "Name", key: "name", width: 30 },
    { header: "Email", key: "email", width: 35 },
    { header: "Phone", key: "phone", width: 24 },
    { header: "Address", key: "address", width: 45 },
    { header: "Notes", key: "notes", width: 60 },
    { header: "VIP", key: "vip", width: 12 },
    { header: "Interior Designer", key: "designer", width: 20 },
    { header: "Purchased Works", key: "works", width: 20 },
  ];
  for (const profile of profiles) {
    // String cell values preserve phone formatting and never become formulas.
    sheet.addRow({
      id: profile.id, name: profile.name, email: profile.email ?? "",
      phone: profile.phone ?? "", address: profile.address ?? "", notes: profile.notes ?? "",
      vip: profile.is_vip ? "Yes" : "No",
      designer: profile.is_interior_designer ? "Yes" : "No",
      works: profile.artworks?.length ?? 0,
    });
  }
  sheet.getRow(1).font = { bold: true };
  sheet.views = [{ state: "frozen", ySplit: 1 }];
  sheet.autoFilter = "A1:I1";
  sheet.getColumn("phone").numFmt = "@";
  sheet.getColumn("notes").alignment = { wrapText: true, vertical: "top" };
  sheet.getColumn("address").alignment = { wrapText: true, vertical: "top" };
  return workbook;
}
