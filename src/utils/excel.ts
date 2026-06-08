import ExcelJS from "exceljs";

export interface ExcelColumn {
  header: string;
  key: string;
  width?: number;
}

export interface ExcelConfig<T> {
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

  sheet.columns = config.columns.map((col) => ({
    header: col.header,
    key: col.key,
    width: col.width ?? 20,
  }));

  sheet.getRow(1).font = { bold: true };
  sheet.getRow(1).fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FFD9E1F2" },
  };

  for (const item of config.data) {
    sheet.addRow(config.rowMapper(item));
  }

  return (await workbook.xlsx.writeBuffer()) as unknown as Buffer;
};
