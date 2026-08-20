import * as XLSX from 'xlsx';
import { Student, Subject, StudentGrade, ClassGroup, TeacherAccount } from '../types';
import { formatScore } from './calculations';

/**
 * Xuất danh sách sinh viên ra file Excel (.xlsx)
 */
export function exportStudentsToExcel(
  students: Student[],
  classGroup?: ClassGroup,
  fileName?: string
): void {
  const data = students.map((s, index) => ({
    'STT': index + 1,
    'Mã Sinh viên': s.studentCode,
    'Họ và tên': s.fullName,
    'Lớp': s.className,
    'Năm sinh': s.birthYear,
    'Giới tính': s.gender,
    'Số điện thoại': s.phone,
    'Chức vụ cán bộ': s.role,
    'Tổ thực hành': s.team || 'Chưa phân tổ',
    'Email': s.email || '',
    'Ghi chú': s.notes || ''
  }));

  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Danh sách SV');

  // Auto-fit column width
  const colWidths = [
    { wch: 6 },  // STT
    { wch: 14 }, // Mã SV
    { wch: 24 }, // Họ tên
    { wch: 12 }, // Lớp
    { wch: 10 }, // Năm sinh
    { wch: 10 }, // Giới tính
    { wch: 14 }, // SĐT
    { wch: 18 }, // Chức vụ
    { wch: 14 }, // Tổ
    { wch: 25 }, // Email
    { wch: 20 }  // Ghi chú
  ];
  worksheet['!cols'] = colWidths;

  const defaultName = classGroup 
    ? `Danh_Sach_Sinh_Vien_${classGroup.name}.xlsx` 
    : 'Danh_Sach_Sinh_Vien.xlsx';
  
  XLSX.writeFile(workbook, fileName || defaultName);
}

/**
 * Xuất bảng điểm và xét điều kiện dự thi môn học ra file Excel
 */
export function exportGradesToExcel(
  subject: Subject,
  students: Student[],
  gradesMap: Record<string, StudentGrade>,
  classGroup?: ClassGroup,
  fileName?: string
): void {
  const data = students.map((s, index) => {
    const studentGrade = gradesMap[s.id];
    const row: Record<string, string | number> = {
      'STT': index + 1,
      'Mã SV': s.studentCode,
      'Họ và tên': s.fullName,
      'Lớp': s.className,
      'Tổ': s.team || 'Tổ 1'
    };

    // Điền các cột điểm
    subject.gradeConfigs.forEach(col => {
      const score = studentGrade?.scores[col.id];
      row[`${col.name}`] = score !== null && score !== undefined ? score : '-';
    });

    row['Điểm TB'] = formatScore(studentGrade?.averageScore);
    row['Vắng LT (Tiết)'] = studentGrade?.totalAbsencePeriods || 0;
    row['Vắng TH (Bài)'] = studentGrade?.totalAbsencePracticeLessons || 0;
    row['Học bù (Lần)'] = studentGrade?.makeupCount || 0;
    row['Kết quả ĐKDT'] = studentGrade?.isDisqualified ? 'KĐĐKDT' : 'Đủ ĐKDT';
    row['Lý do KĐĐKDT'] = studentGrade?.disqualificationReasons?.join('; ') || '';

    return row;
  });

  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Bảng Điểm & ĐKDT');

  const defaultName = `Bang_Diem_${subject.name.replace(/\s+/g, '_')}_${classGroup?.name || 'Lop'}.xlsx`;
  XLSX.writeFile(workbook, fileName || defaultName);
}

/**
 * Xuất văn bản Word (.doc) tương thích Microsoft Word
 */
export function exportToWordDoc(
  title: string,
  contentHtml: string,
  fileName: string = 'So_Tay_Giao_Vien.doc'
): void {
  const header = `
    <html xmlns:o='urn:schemas-microsoft-com:office:office' 
          xmlns:w='urn:schemas-microsoft-com:office:word' 
          xmlns='http://www.w3.org/TR/REC-html40'>
    <head>
      <meta charset='utf-8'>
      <title>${title}</title>
      <style>
        body { font-family: 'Times New Roman', serif; font-size: 13pt; line-height: 1.4; color: #111; }
        h1, h2, h3 { color: #b91c1c; text-align: center; }
        table { width: 100%; border-collapse: collapse; margin-top: 15px; margin-bottom: 20px; }
        th, td { border: 1px solid #333; padding: 6px 8px; text-align: left; font-size: 11pt; }
        th { background-color: #f3f4f6; font-weight: bold; text-align: center; }
        .center { text-align: center; }
        .text-red { color: #dc2626; font-weight: bold; }
        .text-green { color: #16a34a; font-weight: bold; }
        .header-box { text-align: center; margin-bottom: 20px; }
        .signature-box { width: 100%; margin-top: 40px; }
        .signature-box td { border: none; text-align: center; padding: 10px; }
      </style>
    </head>
    <body>
  `;
  const footer = `</body></html>`;
  const fullHtml = header + contentHtml + footer;

  const blob = new Blob(['\ufeff', fullHtml], {
    type: 'application/msword;charset=utf-8'
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Đọc file Excel từ người dùng tải lên
 */
export async function parseExcelFile(file: File): Promise<any[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet);
        resolve(jsonData);
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = (err) => reject(err);
    reader.readAsArrayBuffer(file);
  });
}

/**
 * Tự động phân tích văn bản thô (từ Word/PDF hoặc dán text) thành danh sách sinh viên
 */
export function parseRawStudentText(text: string, classId: string, className: string): Partial<Student>[] {
  const lines = text.split(/\r?\n/).map(l => l.trim()).filter(l => l.length > 0);
  const results: Partial<Student>[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    // Bỏ qua dòng tiêu đề nếu có
    if (
      line.toLowerCase().includes('mã sv') || 
      line.toLowerCase().includes('họ và tên') || 
      line.toLowerCase().includes('họ tên') ||
      line.toLowerCase().includes('stt')
    ) {
      continue;
    }

    // Thử tách theo tab hoặc dấu phẩy hoặc dấu gạch đứng |
    let parts = line.split(/\t/);
    if (parts.length < 2) parts = line.split(/[;,|]/);
    
    // Nếu vẫn là 1 dòng đơn, thử tách theo nhiều dấu cách liên tiếp
    if (parts.length < 2) {
      parts = line.split(/\s{2,}/);
    }

    parts = parts.map(p => p.trim()).filter(p => p.length > 0);

    if (parts.length >= 2) {
      // Tìm mã sinh viên (thường chứa chữ số hoặc tiền tố)
      let studentCode = '';
      let fullName = '';
      let birthYear = 2004;
      let gender: 'Nam' | 'Nữ' = 'Nam';
      let phone = '';
      let role: any = 'Sinh viên';

      // Phỏng đoán cột
      if (/^[A-Za-z0-9_-]{4,15}$/.test(parts[0]) && isNaN(Number(parts[0]))) {
        studentCode = parts[0];
        fullName = parts[1] || '';
      } else if (parts[0].length < 4 && !isNaN(Number(parts[0])) && parts.length >= 3) {
        // parts[0] là STT
        studentCode = parts[1];
        fullName = parts[2];
      } else {
        studentCode = `SV${Math.floor(1000 + Math.random() * 9000)}`;
        fullName = parts[0];
      }

      // Quét các phần còn lại để tìm năm sinh, giới tính, SĐT, chức vụ
      for (let j = 1; j < parts.length; j++) {
        const p = parts[j];
        if (/^(199\d|200\d|201\d)$/.test(p)) {
          birthYear = parseInt(p, 10);
        } else if (p.toLowerCase() === 'nữ' || p.toLowerCase() === 'nu') {
          gender = 'Nữ';
        } else if (p.toLowerCase() === 'nam') {
          gender = 'Nam';
        } else if (/^0\d{8,10}$/.test(p.replace(/[\s.-]/g, ''))) {
          phone = p.replace(/[\s.-]/g, '');
        } else if (
          p.includes('Lớp trưởng') || 
          p.includes('Bí thư') || 
          p.includes('Lớp phó') || 
          p.includes('Tổ trưởng')
        ) {
          role = p;
        }
      }

      if (fullName && fullName.length > 1) {
        results.push({
          studentCode: studentCode || `SV${100 + results.length}`,
          fullName,
          classId,
          className,
          birthYear,
          gender,
          phone: phone || '098' + Math.floor(1000000 + Math.random() * 9000000),
          role: role || 'Sinh viên',
          team: results.length % 2 === 0 ? 'Tổ 1' : 'Tổ 2'
        });
      }
    }
  }

  return results;
}
