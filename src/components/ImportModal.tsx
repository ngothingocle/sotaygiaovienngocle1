import React, { useState } from 'react';
import { X, UploadCloud, FileSpreadsheet, FileText, CheckCircle2, AlertCircle, RefreshCw } from 'lucide-react';
import { Student, ClassGroup, Gender, StudentRole, PracticeTeam } from '../types';
import { parseExcelFile, parseRawStudentText } from '../utils/exportImport';

interface ImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportStudents: (students: Partial<Student>[]) => void;
  selectedClass: ClassGroup;
}

export const ImportModal: React.FC<ImportModalProps> = ({
  isOpen,
  onClose,
  onImportStudents,
  selectedClass
}) => {
  const [importType, setImportType] = useState<'excel' | 'text'>('excel');
  const [rawText, setRawText] = useState('');
  const [parsedData, setParsedData] = useState<Partial<Student>[]>([]);
  const [fileName, setFileName] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError('');
    setFileName(file.name);
    setIsProcessing(true);

    try {
      const rows = await parseExcelFile(file);
      if (!rows || rows.length === 0) {
        setError('File Excel không có dữ liệu!');
        setIsProcessing(false);
        return;
      }

      // Chuẩn hóa dữ liệu từ Excel
      const students: Partial<Student>[] = rows.map((row: any, idx: number) => {
        // Tìm các trường dựa theo tên cột phổ biến
        const studentCode = row['Mã Sinh viên'] || row['Mã SV'] || row['MaSV'] || row['MSSV'] || `SV${100 + idx}`;
        const fullName = row['Họ và tên'] || row['Họ tên'] || row['HoTen'] || row['Tên'] || '';
        const birthYear = Number(row['Năm sinh'] || row['NamSinh'] || 2004);
        const gender: Gender = (row['Giới tính'] || row['GioiTinh'] || '').toString().toLowerCase().includes('nữ') ? 'Nữ' : 'Nam';
        const phone = (row['Số điện thoại'] || row['SĐT'] || row['SDT'] || row['Phone'] || '').toString();
        const role: StudentRole = row['Chức vụ'] || row['Cán bộ lớp'] || row['Chức vụ cán bộ'] || 'Sinh viên';
        const team: PracticeTeam = (row['Tổ'] || row['Tổ thực hành'] || '').toString().includes('2') ? 'Tổ 2' : 'Tổ 1';

        return {
          studentCode: studentCode.toString().trim(),
          fullName: fullName.toString().trim(),
          classId: selectedClass.id,
          className: selectedClass.name,
          birthYear: isNaN(birthYear) ? 2004 : birthYear,
          gender,
          phone: phone.trim(),
          role,
          team
        };
      }).filter(s => s.fullName && s.fullName.length > 0);

      setParsedData(students);
      if (students.length === 0) {
        setError('Không nhận diện được danh sách sinh viên hợp lệ trong file!');
      }
    } catch (err: any) {
      setError('Lỗi khi đọc file: ' + (err.message || 'Định dạng file chưa chuẩn'));
    } finally {
      setIsProcessing(false);
    }
  };

  const handleParseText = () => {
    if (!rawText.trim()) {
      setError('Vui lòng dán nội dung văn bản từ Word hoặc PDF vào ô bên dưới!');
      return;
    }
    setError('');
    const parsed = parseRawStudentText(rawText, selectedClass.id, selectedClass.name);
    setParsedData(parsed);
    if (parsed.length === 0) {
      setError('Không thể tự động phân tách dữ liệu. Hãy kiểm tra định dạng dòng hoặc tab!');
    }
  };

  const handleConfirmImport = () => {
    if (parsedData.length === 0) return;
    onImportStudents(parsedData);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="w-full max-w-3xl bg-white rounded-2xl shadow-2xl overflow-hidden border border-slate-100 animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-white/20 rounded-xl">
              <UploadCloud className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-lg">
                Nhập danh sách Sinh viên tự động (Excel / Word / PDF)
              </h3>
              <p className="text-xs text-blue-100">
                Thêm dữ liệu vào lớp: <span className="font-bold text-white underline">{selectedClass.name}</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/20 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
          {/* Method selector */}
          <div className="flex gap-3 border-b border-slate-200 pb-3">
            <button
              type="button"
              onClick={() => { setImportType('excel'); setError(''); }}
              className={`flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-xl transition ${
                importType === 'excel'
                  ? 'bg-blue-50 text-blue-700 border border-blue-200'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
              Tải file Excel (.xlsx, .xls, .csv)
            </button>
            <button
              type="button"
              onClick={() => { setImportType('text'); setError(''); }}
              className={`flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-xl transition ${
                importType === 'text'
                  ? 'bg-blue-50 text-blue-700 border border-blue-200'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <FileText className="w-4 h-4 text-blue-600" />
              Dán nội dung từ Word / PDF
            </button>
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {importType === 'excel' ? (
            <div className="space-y-3">
              <div className="border-2 border-dashed border-slate-300 hover:border-blue-500 rounded-2xl p-8 text-center transition bg-slate-50 hover:bg-blue-50/50">
                <input
                  type="file"
                  id="excel-file-input"
                  accept=".xlsx, .xls, .csv"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <label
                  htmlFor="excel-file-input"
                  className="cursor-pointer flex flex-col items-center justify-center gap-2"
                >
                  <div className="w-14 h-14 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mb-1 shadow-inner">
                    <UploadCloud className="w-7 h-7" />
                  </div>
                  <span className="font-bold text-slate-800 text-sm">
                    {fileName ? fileName : 'Bấm để chọn file Excel hoặc kéo thả vào đây'}
                  </span>
                  <span className="text-xs text-slate-500 max-w-md">
                    Hệ thống tự động nhận diện các cột: Mã SV, Họ tên, Lớp, Năm sinh, Giới tính, SĐT, Cán bộ lớp, Tổ thực hành
                  </span>
                </label>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-xs text-slate-600">
                Bạn có thể sao chép bảng từ <strong>file Word hoặc PDF</strong> (hoặc danh sách text) rồi dán trực tiếp vào khung dưới:
              </p>
              <textarea
                rows={6}
                value={rawText}
                onChange={(e) => setRawText(e.target.value)}
                placeholder={`VD:
YK2301	Nguyễn Văn An	2004	Nam	0981112233	Lớp trưởng
YK2302	Trần Thị Bích Ngọc	2004	Nữ	0982223344	Bí thư
YK2303	Lê Hoàng Cường	2003	Nam	0983334455	Sinh viên`}
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={handleParseText}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-xl shadow transition flex items-center gap-1.5"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  Phân tích & Xem trước
                </button>
              </div>
            </div>
          )}

          {/* Preview Parsed Data */}
          {parsedData.length > 0 && (
            <div className="space-y-2 pt-2 border-t border-slate-100">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  Xem trước dữ liệu nhận diện ({parsedData.length} sinh viên)
                </h4>
                <span className="text-[11px] text-slate-500">Kiểm tra thông tin trước khi lưu</span>
              </div>

              <div className="max-h-56 overflow-y-auto border border-slate-200 rounded-xl overflow-hidden">
                <table className="w-full text-left text-xs text-slate-700">
                  <thead className="bg-slate-100 text-slate-700 font-bold sticky top-0">
                    <tr>
                      <th className="p-2 w-10 text-center">STT</th>
                      <th className="p-2">Mã SV</th>
                      <th className="p-2">Họ và tên</th>
                      <th className="p-2 text-center">Năm sinh</th>
                      <th className="p-2 text-center">Phái</th>
                      <th className="p-2">SĐT</th>
                      <th className="p-2">Cán bộ</th>
                      <th className="p-2 text-center">Tổ</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {parsedData.map((s, i) => (
                      <tr key={i} className="hover:bg-slate-50">
                        <td className="p-2 text-center text-slate-400">{i + 1}</td>
                        <td className="p-2 font-mono font-bold text-blue-700">{s.studentCode}</td>
                        <td className="p-2 font-medium text-slate-900">{s.fullName}</td>
                        <td className="p-2 text-center">{s.birthYear}</td>
                        <td className="p-2 text-center">
                          <span className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${
                            s.gender === 'Nữ' ? 'bg-pink-100 text-pink-700' : 'bg-blue-100 text-blue-700'
                          }`}>
                            {s.gender}
                          </span>
                        </td>
                        <td className="p-2 text-slate-600">{s.phone || '-'}</td>
                        <td className="p-2">
                          <span className="text-orange-700 font-medium">{s.role}</span>
                        </td>
                        <td className="p-2 text-center">
                          <span className="px-1.5 py-0.5 bg-slate-100 text-slate-700 rounded text-[10px]">
                            {s.team || 'Tổ 1'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-xl transition"
            >
              Hủy bỏ
            </button>
            <button
              type="button"
              disabled={parsedData.length === 0 || isProcessing}
              onClick={handleConfirmImport}
              className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 text-white font-semibold text-sm rounded-xl shadow-md transition flex items-center gap-2"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Nhập {parsedData.length} Sinh viên vào lớp</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
