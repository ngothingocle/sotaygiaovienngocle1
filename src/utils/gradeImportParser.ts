import * as XLSX from 'xlsx';
import mammoth from 'mammoth';
import { GradeWeightConfig, Student, Subject, ClassGroup } from '../types';

export interface ParsedGradeRow {
  rawStudentCode?: string;
  rawFullName?: string;
  matchedStudent?: Student;
  matchType: 'exact_code' | 'exact_name' | 'fuzzy_name' | 'unmatched';
  scores: Record<string, number | null>; // [colKey or gradeConfigId]: score
  rawRowData: Record<string, any>;
  hasValidScore: boolean;
}

export interface ParseGradeResult {
  detectedColumns: Array<{ key: string; label: string; sampleValue?: any }>;
  rows: ParsedGradeRow[];
  totalParsed: number;
  matchedCount: number;
  fileType: 'excel' | 'word' | 'pdf' | 'text';
  fileName: string;
}

/**
 * Chuẩn hóa chuỗi tiếng Việt để so sánh tên
 */
export function normalizeVietnamese(str: string): string {
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase()
    .trim()
    .replace(/\s+/g, ' ');
}

/**
 * Kiểm tra xem một giá trị có phải là điểm số hợp lệ từ 0 đến 10
 */
export function parseScoreValue(val: any): number | null {
  if (val === null || val === undefined || val === '') return null;
  const str = String(val).trim().replace(',', '.');
  const num = parseFloat(str);
  if (!isNaN(num) && num >= 0 && num <= 10) {
    return Math.round(num * 10) / 10;
  }
  return null;
}

/**
 * Khớp một dòng dữ liệu thô với danh sách sinh viên trong lớp
 */
export function matchStudentInClass(
  codeCandidate: string | undefined,
  nameCandidate: string | undefined,
  classStudents: Student[]
): { student?: Student; matchType: 'exact_code' | 'exact_name' | 'fuzzy_name' | 'unmatched' } {
  const cleanCode = (codeCandidate || '').trim().toLowerCase();
  const cleanName = normalizeVietnamese(nameCandidate || '');

  // 1. Khớp theo Mã Sinh Viên chính xác
  if (cleanCode) {
    const byCode = classStudents.find(
      s => s.studentCode.toLowerCase() === cleanCode || 
           s.studentCode.toLowerCase().replace(/[^a-z0-9]/g, '') === cleanCode.replace(/[^a-z0-9]/g, '')
    );
    if (byCode) return { student: byCode, matchType: 'exact_code' };
  }

  // 2. Khớp theo Họ và Tên chính xác
  if (cleanName) {
    const byExactName = classStudents.find(
      s => normalizeVietnamese(s.fullName) === cleanName
    );
    if (byExactName) return { student: byExactName, matchType: 'exact_name' };

    // 3. Khớp mờ (Fuzzy) theo tên nếu không trùng mã
    const byFuzzyName = classStudents.find(s => {
      const sNorm = normalizeVietnamese(s.fullName);
      return sNorm.includes(cleanName) || cleanName.includes(sNorm);
    });
    if (byFuzzyName) return { student: byFuzzyName, matchType: 'fuzzy_name' };
  }

  return { student: undefined, matchType: 'unmatched' };
}

/**
 * Đọc điểm từ file Excel (.xlsx, .xls, .csv)
 */
export async function parseExcelGrades(
  file: File,
  classStudents: Student[],
  gradeConfigs: GradeWeightConfig[]
): Promise<ParseGradeResult> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        
        // Đọc dạng raw 2D array để linh hoạt xử lý header ở dòng bất kỳ
        const rawRows: any[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' });
        if (rawRows.length === 0) {
          throw new Error('File Excel rỗng hoặc không có dữ liệu.');
        }

        // Tìm dòng tiêu đề (Header row)
        let headerRowIndex = 0;
        let bestHeaderScore = -1;

        for (let r = 0; r < Math.min(rawRows.length, 10); r++) {
          const row = rawRows[r];
          const rowStr = row.map(c => String(c).toLowerCase()).join(' ');
          let score = 0;
          if (rowStr.includes('mã') || rowStr.includes('masv') || rowStr.includes('code')) score += 3;
          if (rowStr.includes('họ') || rowStr.includes('tên') || rowStr.includes('name')) score += 3;
          if (rowStr.includes('điểm') || rowStr.includes('kt') || rowStr.includes('hs')) score += 2;
          if (rowStr.includes('stt')) score += 1;

          if (score > bestHeaderScore) {
            bestHeaderScore = score;
            headerRowIndex = r;
          }
        }

        const headers = rawRows[headerRowIndex].map((h: any, idx: number) => {
          const label = String(h).trim();
          return label || `Cột_${idx + 1}`;
        });

        const detectedColumns = headers.map((h: string, idx: number) => ({
          key: `col_${idx}`,
          label: h,
          sampleValue: rawRows[headerRowIndex + 1]?.[idx]
        }));

        // Xác định cột mã SV và họ tên
        let codeColIdx = -1;
        let nameColIdx = -1;

        headers.forEach((h: string, idx: number) => {
          const lower = h.toLowerCase();
          if ((lower.includes('mã') && (lower.includes('sv') || lower.includes('sinh viên'))) || lower === 'masv' || lower === 'student code') {
            codeColIdx = idx;
          }
          if ((lower.includes('họ') && lower.includes('tên')) || lower === 'họ và tên' || lower === 'hoten' || lower === 'họ tên') {
            nameColIdx = idx;
          }
        });

        // Nếu chưa tìm thấy cột họ tên, tìm cột có chữ "tên"
        if (nameColIdx === -1) {
          headers.forEach((h: string, idx: number) => {
            const lower = h.toLowerCase();
            if (lower.includes('tên') || lower === 'name') nameColIdx = idx;
          });
        }

        const rows: ParsedGradeRow[] = [];

        for (let r = headerRowIndex + 1; r < rawRows.length; r++) {
          const rowData = rawRows[r];
          if (!rowData || rowData.every((c: any) => c === '' || c === null || c === undefined)) {
            continue; // Bỏ qua dòng trống
          }

          let codeVal = codeColIdx >= 0 ? String(rowData[codeColIdx]).trim() : '';
          let nameVal = nameColIdx >= 0 ? String(rowData[nameColIdx]).trim() : '';

          // Nếu không có header rõ ràng, thử đoán theo từng ô
          if (!codeVal && !nameVal) {
            for (let c = 0; c < rowData.length; c++) {
              const val = String(rowData[c]).trim();
              if (/^[A-Za-z0-9_-]{4,15}$/.test(val) && isNaN(Number(val)) && !codeVal) {
                codeVal = val;
              } else if (val.length > 3 && isNaN(Number(val)) && !nameVal && !val.toLowerCase().includes('lớp')) {
                nameVal = val;
              }
            }
          }

          const { student, matchType } = matchStudentInClass(codeVal, nameVal, classStudents);

          // Thu thập điểm các cột
          const rowScores: Record<string, number | null> = {};
          let hasScore = false;

          headers.forEach((_: string, idx: number) => {
            if (idx !== codeColIdx && idx !== nameColIdx) {
              const colKey = `col_${idx}`;
              const scoreVal = parseScoreValue(rowData[idx]);
              rowScores[colKey] = scoreVal;
              if (scoreVal !== null) hasScore = true;
            }
          });

          // Tạo raw row map
          const rawRowMap: Record<string, any> = {};
          headers.forEach((h: string, idx: number) => {
            rawRowMap[`col_${idx}`] = rowData[idx];
          });

          rows.push({
            rawStudentCode: codeVal,
            rawFullName: nameVal,
            matchedStudent: student,
            matchType,
            scores: rowScores,
            rawRowData: rawRowMap,
            hasValidScore: hasScore
          });
        }

        resolve({
          detectedColumns,
          rows,
          totalParsed: rows.length,
          matchedCount: rows.filter(r => r.matchedStudent).length,
          fileType: 'excel',
          fileName: file.name
        });
      } catch (err: any) {
        reject(new Error(`Lỗi đọc file Excel: ${err.message || err}`));
      }
    };
    reader.onerror = () => reject(new Error('Không thể đọc file'));
    reader.readAsArrayBuffer(file);
  });
}

/**
 * Đọc điểm từ file Word (.docx)
 */
export async function parseWordGrades(
  file: File,
  classStudents: Student[],
  gradeConfigs: GradeWeightConfig[]
): Promise<ParseGradeResult> {
  const arrayBuffer = await file.arrayBuffer();
  
  // Trích xuất HTML từ file docx để giữ nguyên cấu trúc bảng
  const result = await mammoth.convertToHtml({ arrayBuffer });
  const html = result.value;

  if (html.includes('<table')) {
    return parseHtmlTableGrades(html, classStudents, gradeConfigs, file.name, 'word');
  }

  // Nếu không có bảng, trích xuất text thuần
  const textResult = await mammoth.extractRawText({ arrayBuffer });
  return parseRawGradeText(textResult.value, classStudents, gradeConfigs, file.name, 'word');
}

/**
 * Phân tích bảng HTML (từ Word hoặc clipboard)
 */
export function parseHtmlTableGrades(
  html: string,
  classStudents: Student[],
  gradeConfigs: GradeWeightConfig[],
  fileName: string = 'Word_Document.docx',
  fileType: 'word' | 'text' = 'word'
): ParseGradeResult {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');
  const tables = doc.querySelectorAll('table');

  if (tables.length === 0) {
    const bodyText = doc.body.textContent || '';
    return parseRawGradeText(bodyText, classStudents, gradeConfigs, fileName, fileType);
  }

  // Chọn bảng có nhiều dòng nhất
  let mainTable = tables[0];
  let maxRows = 0;
  tables.forEach(t => {
    const rowCount = t.querySelectorAll('tr').length;
    if (rowCount > maxRows) {
      maxRows = rowCount;
      mainTable = t;
    }
  });

  const trs = Array.from(mainTable.querySelectorAll('tr'));
  if (trs.length === 0) {
    return parseRawGradeText(doc.body.textContent || '', classStudents, gradeConfigs, fileName, fileType);
  }

  // Header row
  const headerTr = trs[0];
  const ths = Array.from(headerTr.querySelectorAll('th, td')).map((el, idx) => {
    return el.textContent?.trim() || `Cột_${idx + 1}`;
  });

  const detectedColumns = ths.map((h, idx) => ({
    key: `col_${idx}`,
    label: h,
    sampleValue: trs[1]?.querySelectorAll('th, td')[idx]?.textContent?.trim()
  }));

  let codeColIdx = -1;
  let nameColIdx = -1;

  ths.forEach((h, idx) => {
    const lower = h.toLowerCase();
    if ((lower.includes('mã') && (lower.includes('sv') || lower.includes('sinh viên'))) || lower === 'masv') {
      codeColIdx = idx;
    }
    if ((lower.includes('họ') && lower.includes('tên')) || lower === 'họ và tên' || lower === 'hoten') {
      nameColIdx = idx;
    }
  });

  if (nameColIdx === -1) {
    ths.forEach((h, idx) => {
      const lower = h.toLowerCase();
      if (lower.includes('tên') || lower === 'name') nameColIdx = idx;
    });
  }

  const rows: ParsedGradeRow[] = [];

  for (let r = 1; r < trs.length; r++) {
    const cells = Array.from(trs[r].querySelectorAll('th, td')).map(c => c.textContent?.trim() || '');
    if (cells.length === 0 || cells.every(c => !c)) continue;

    let codeVal = codeColIdx >= 0 ? cells[codeColIdx] : '';
    let nameVal = nameColIdx >= 0 ? cells[nameColIdx] : '';

    if (!codeVal && !nameVal) {
      for (let c = 0; c < cells.length; c++) {
        const val = cells[c];
        if (/^[A-Za-z0-9_-]{4,15}$/.test(val) && isNaN(Number(val)) && !codeVal) {
          codeVal = val;
        } else if (val.length > 3 && isNaN(Number(val)) && !nameVal && !val.toLowerCase().includes('lớp')) {
          nameVal = val;
        }
      }
    }

    const { student, matchType } = matchStudentInClass(codeVal, nameVal, classStudents);

    const rowScores: Record<string, number | null> = {};
    let hasScore = false;

    ths.forEach((_, idx) => {
      if (idx !== codeColIdx && idx !== nameColIdx) {
        const colKey = `col_${idx}`;
        const scoreVal = parseScoreValue(cells[idx]);
        rowScores[colKey] = scoreVal;
        if (scoreVal !== null) hasScore = true;
      }
    });

    const rawRowMap: Record<string, any> = {};
    ths.forEach((_, idx) => {
      rawRowMap[`col_${idx}`] = cells[idx];
    });

    rows.push({
      rawStudentCode: codeVal,
      rawFullName: nameVal,
      matchedStudent: student,
      matchType,
      scores: rowScores,
      rawRowData: rawRowMap,
      hasValidScore: hasScore
    });
  }

  return {
    detectedColumns,
    rows,
    totalParsed: rows.length,
    matchedCount: rows.filter(r => r.matchedStudent).length,
    fileType,
    fileName
  };
}

/**
 * Đọc điểm từ file PDF (.pdf)
 */
export async function parsePdfGrades(
  file: File,
  classStudents: Student[],
  gradeConfigs: GradeWeightConfig[]
): Promise<ParseGradeResult> {
  const arrayBuffer = await file.arrayBuffer();

  try {
    const pdfjsLib = await import('pdfjs-dist');
    // Cài đặt worker nếu cần
    if (pdfjsLib.GlobalWorkerOptions && !pdfjsLib.GlobalWorkerOptions.workerSrc) {
      pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version || '3.11.174'}/pdf.worker.min.mjs`;
    }

    const loadingTask = pdfjsLib.getDocument({ data: new Uint8Array(arrayBuffer) });
    const pdf = await loadingTask.promise;

    let fullText = '';
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      const pageText = textContent.items
        .map((item: any) => item.str || '')
        .join(' \t ');
      fullText += pageText + '\n';
    }

    return parseRawGradeText(fullText, classStudents, gradeConfigs, file.name, 'pdf');
  } catch (err: any) {
    // Fallback nếu worker không sẵn sàng: đọc dạng text thô
    console.warn('PDF parser worker fallback:', err);
    throw new Error(`Không thể giải mã file PDF này: ${err.message || 'Lỗi định dạng'}. Vui lòng dán trực tiếp nội dung văn bản bảng điểm.`);
  }
}

/**
 * Đọc văn bản thô (Dán từ PDF, Word, Web hoặc file .txt)
 */
export function parseRawGradeText(
  text: string,
  classStudents: Student[],
  gradeConfigs: GradeWeightConfig[],
  fileName: string = 'Van_ban_bang_diem.txt',
  fileType: 'excel' | 'word' | 'pdf' | 'text' = 'text'
): ParseGradeResult {
  const lines = text.split(/\r?\n/).map(l => l.trim()).filter(l => l.length > 0);
  const rows: ParsedGradeRow[] = [];

  // Tạo các cột điểm phát hiện dựa theo số lượng cấu hình cột của môn
  const detectedColumns = [
    { key: 'col_code', label: 'Mã SV' },
    { key: 'col_name', label: 'Họ và tên' },
    ...gradeConfigs.map((cfg, i) => ({
      key: `col_kt_${i}`,
      label: `${cfg.name} (HS${cfg.weight})`
    }))
  ];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Bỏ qua dòng tiêu đề
    const lowerLine = line.toLowerCase();
    if (
      (lowerLine.includes('họ và tên') || lowerLine.includes('mã sv') || lowerLine.includes('điểm tb')) &&
      !/\d+\.\d+/.test(line) && !/\d+,\d+/.test(line)
    ) {
      continue;
    }

    // Thử tách theo tab, phẩy, gạch đứng hoặc nhiều khoảng trắng
    let parts = line.split(/\t/);
    if (parts.length < 2) parts = line.split(/[;|]/);
    if (parts.length < 2) parts = line.split(/\s{2,}/);

    parts = parts.map(p => p.trim()).filter(p => p.length > 0);

    if (parts.length >= 2) {
      let codeVal = '';
      let nameVal = '';
      const numbersFound: number[] = [];

      // Phân tích các phần tử trong dòng
      parts.forEach((p, pIdx) => {
        // Kiểm tra xem có phải điểm số không (ví dụ: 7.5, 8, 9.0)
        const score = parseScoreValue(p);
        if (score !== null && !isNaN(score) && (pIdx > 1 || /^\d+(\.\d+)?$/.test(p.replace(',', '.')))) {
          // Tránh nhầm STT thành điểm số nếu là phần tử đầu tiên và là số nguyên nhỏ
          if (pIdx === 0 && Number.isInteger(score) && score < 100 && parts.length >= 3) {
            // Đây có thể là STT
          } else {
            numbersFound.push(score);
          }
        } else if (/^[A-Za-z0-9_-]{4,15}$/.test(p) && isNaN(Number(p)) && !codeVal) {
          codeVal = p;
        } else if (p.length > 2 && isNaN(Number(p)) && !nameVal && !p.toLowerCase().includes('tổ') && !p.toLowerCase().includes('lớp')) {
          nameVal = p;
        }
      });

      // Nếu chưa có mã sinh viên, thử kiểm tra student code mẫu SV...
      if (!codeVal) {
        const matchCode = line.match(/\b([A-Za-z]{1,4}\d{3,8}|\d{6,10})\b/);
        if (matchCode) codeVal = matchCode[1];
      }

      const { student, matchType } = matchStudentInClass(codeVal, nameVal, classStudents);

      const rowScores: Record<string, number | null> = {};
      let hasScore = false;

      gradeConfigs.forEach((cfg, cIdx) => {
        const key = `col_kt_${cIdx}`;
        const score = numbersFound[cIdx] !== undefined ? numbersFound[cIdx] : null;
        rowScores[key] = score;
        if (score !== null) hasScore = true;
      });

      const rawRowMap: Record<string, any> = {
        col_code: codeVal,
        col_name: nameVal
      };
      gradeConfigs.forEach((cfg, cIdx) => {
        rawRowMap[`col_kt_${cIdx}`] = numbersFound[cIdx] ?? '';
      });

      rows.push({
        rawStudentCode: codeVal,
        rawFullName: nameVal,
        matchedStudent: student,
        matchType,
        scores: rowScores,
        rawRowData: rawRowMap,
        hasValidScore: hasScore
      });
    }
  }

  return {
    detectedColumns,
    rows,
    totalParsed: rows.length,
    matchedCount: rows.filter(r => r.matchedStudent).length,
    fileType,
    fileName
  };
}

/**
 * Tải file mẫu Excel chuẩn để giáo viên chỉ việc nhập điểm và tải lên
 */
export function downloadGradeImportTemplate(
  subject: Subject,
  classGroup: ClassGroup,
  students: Student[]
): void {
  const data = students.map((s, index) => {
    const row: Record<string, any> = {
      'STT': index + 1,
      'Mã Sinh viên': s.studentCode,
      'Họ và tên': s.fullName,
      'Lớp': s.className,
      'Tổ': s.team || 'Tổ 1'
    };

    // Tạo sẵn các cột điểm kiểm tra của môn học
    subject.gradeConfigs.forEach(col => {
      row[`${col.name} (HS${col.weight})`] = '';
    });

    row['Ghi chú'] = '';
    return row;
  });

  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Nhập điểm');

  // Set column widths
  worksheet['!cols'] = [
    { wch: 6 },
    { wch: 14 },
    { wch: 24 },
    { wch: 12 },
    { wch: 10 },
    ...subject.gradeConfigs.map(() => ({ wch: 18 })),
    { wch: 20 }
  ];

  const cleanSubjectName = subject.name.replace(/[^a-zA-Z0-9_\u00C0-\u024F\u1EA0-\u1EF9]/g, '_');
  const fileName = `Mau_Nhap_Diem_${cleanSubjectName}_${classGroup.name}.xlsx`;
  XLSX.writeFile(workbook, fileName);
}
