import ExcelJS from "exceljs";

export interface ExcelColumn {
  header: string;
  key: string;
  width?: number;
}

export interface ExcelConfig<T> {
  title: string;
  sheetName: string;
  columns: ExcelColumn[];
  data: T[];
  rowMapper: (item: T) => Record<string, unknown>;
}

export const generateExcel = async <T>(
  config: ExcelConfig<T>,
): Promise<Buffer> => {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet(config.sheetName);
  const colCount = config.columns.length;

  sheet.columns = config.columns.map((col) => ({
    key: col.key,
    width: col.width ?? 20,
  }));

  // Row 1: 제목 (병합 + 가운데 정렬)
  const titleRow = sheet.addRow([config.title]);
  sheet.mergeCells(1, 1, 1, colCount);
  titleRow.getCell(1).font = { bold: true, size: 14 };
  titleRow.getCell(1).alignment = { horizontal: "center", vertical: "middle" };
  titleRow.height = 28;

  // Row 2: 작성일자 (우측 정렬)
  const today = new Date().toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  const dateRow = sheet.addRow(
    Array.from({ length: colCount }, (_, i) =>
      i === colCount - 1 ? `작성일: ${today}` : "",
    ),
  );
  sheet.mergeCells(2, 1, 2, colCount);
  dateRow.getCell(1).alignment = { horizontal: "right" };
  dateRow.getCell(1).font = { size: 10, color: { argb: "FF666666" } };

  // Row 3: 컬럼 헤더
  const headerRow = sheet.addRow(config.columns.map((col) => col.header));
  headerRow.font = { bold: true };
  headerRow.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FFD9E1F2" },
  };
  headerRow.alignment = { horizontal: "center" };
  headerRow.height = 20;

  // Row 4+: 데이터
  for (const item of config.data) {
    const mapped = config.rowMapper(item);
    sheet.addRow(config.columns.map((col) => mapped[col.key] ?? ""));
  }

  return (await workbook.xlsx.writeBuffer()) as unknown as Buffer;
};
