import ExcelJS from "exceljs";
import { FastifyReply } from "fastify";

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

const buildFilename = (title: string): string => {
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  const date = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}`;
  const time = `${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
  return `${title}_${date}${time}.xlsx`;
};

export const generateExcel = async <T>(
  config: ExcelConfig<T>,
): Promise<{ buffer: Buffer; filename: string }> => {
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
      i === 0 ? `작성일: ${today}` : "",
    ),
  );
  sheet.mergeCells(2, 1, 2, colCount);
  dateRow.getCell(1).alignment = { horizontal: "right" };
  dateRow.getCell(1).font = { size: 10, color: { argb: "FF666666" } };

  const thinBorder = { style: "thin" as const };
  const allBorders = {
    top: thinBorder,
    left: thinBorder,
    bottom: thinBorder,
    right: thinBorder,
  };

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
  headerRow.eachCell({ includeEmpty: true }, (cell, colNumber) => {
    if (colNumber <= colCount) cell.border = allBorders;
  });

  // Row 4+: 데이터
  for (const item of config.data) {
    const mapped = config.rowMapper(item);
    const dataRow = sheet.addRow(
      config.columns.map((col) => mapped[col.key] ?? ""),
    );
    dataRow.eachCell({ includeEmpty: true }, (cell, colNumber) => {
      if (colNumber <= colCount) cell.border = allBorders;
    });
  }

  const buffer = (await workbook.xlsx.writeBuffer()) as unknown as Buffer;
  return { buffer, filename: buildFilename(config.title) };
};

export const sendExcelReply = (
  reply: FastifyReply,
  buffer: Buffer,
  filename: string,
): void => {
  reply
    .header(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    )
    .header(
      "Content-Disposition",
      `attachment; filename*=UTF-8''${encodeURIComponent(filename)}`,
    )
    .send(buffer);
};
