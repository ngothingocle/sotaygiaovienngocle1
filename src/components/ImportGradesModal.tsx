import React, { useState, useRef } from 'react';
import { 
  FileSpreadsheet, 
  FileText, 
  Upload, 
  Download, 
  CheckCircle2, 
  AlertCircle, 
  X, 
  ArrowRight, 
  FileUp, 
  Sparkles, 
  HelpCircle,
  RefreshCw,
  Search,
  Eye,
  SlidersHorizontal,
  FileCheck2,
  Table
} from 'lucide-react';
import { 
  Subject, 
  Student, 
  ClassGroup, 
  GradeWeightConfig 
} from '../types';
import { 
  ParseGradeResult, 
  ParsedGradeRow, 
  parseExcelGrades, 
  parseWordGrades, 
  parsePdfGrades, 
  parseRawGradeText, 
  downloadGradeImportTemplate,
  parseScoreValue
} from '../utils/gradeImportParser';
import confetti from 'canvas-confetti';

interface ImportGradesModalProps {
  isOpen: boolean;
  onClose: () => void;
  subject: Subject;
  classGroup: ClassGroup;
  students: Student[];
  currentGrades: Record<string, number | null>; // [studentId][gradeConfigId]
  onApplyGrades: (newGrades: Record<string, Record<string, number | null>>) => void;
}

export const ImportGradesModal: React.FC<ImportGradesModalProps> = ({
  isOpen,
  onClose,
  subject,
  classGroup,
  students,
  currentGrades,
  onApplyGrades
}) => {
  const [activeTab, setActiveTab] = useState<'upload' | 'paste'>('upload');
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [parseResult, setParseResult] = useState<ParseGradeResult | null>(null);
  const [rawPastedText, setRawPastedText] = useState('');
  
  // Mapping: GradeConfigId -> ColumnKey from parsed file
  const [columnMapping, setColumnMapping] = useState<Record<string, string>>({});
  
  // Import Options
  const [overwriteExisting, setOverwriteExisting] = useState(true);
  const [filterPreview, setFilterPreview] = useState<'all' | 'matched' | 'unmatched'>('all');
  const [previewSearch, setPreviewSearch] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const classStudents = students.filter(s => s.classId === classGroup.id);
  const gradeConfigs = subject.gradeConfigs || [];

  // Tự động gán cột phù hợp khi có kết quả đọc
  const initializeColumnMapping = (result: ParseGradeResult) => {
    const newMapping: Record<string, string> = {};
    const detected = result.detectedColumns;

    // Lọc ra các cột có khả năng là điểm (bỏ qua cột mã, họ tên, stt, tổ, lớp)
    const scoreCandidateCols = detected.filter(c => {
      const l = c.label.toLowerCase();
      return !l.includes('stt') && 
             !l.includes('mã') && 
             !l.includes('họ') && 
             !l.includes('tên') && 
             !l.includes('lớp') && 
             !l.includes('tổ') &&
             !l.includes('sinh viên');
    });

    gradeConfigs.forEach((cfg, idx) => {
      // 1. Tìm cột trùng tên hoặc chứa HS
      const exactMatch = scoreCandidateCols.find(c => {
        const l = c.label.toLowerCase();
        const cfgName = cfg.name.toLowerCase();
        return l.includes(cfgName) || 
               (l.includes(`hs${cfg.weight}`) || l.includes(`hệ số ${cfg.weight}`));
      });

      if (exactMatch) {
        newMapping[cfg.id] = exactMatch.key;
      } else if (scoreCandidateCols[idx]) {
        // 2. Gán theo thứ tự cột điểm
        newMapping[cfg.id] = scoreCandidateCols[idx].key;
      } else if (detected[idx + 2]) {
        // 3. Fallback
        newMapping[cfg.id] = detected[idx + 2].key;
      }
    });

    setColumnMapping(newMapping);
  };

  // Xử lý khi chọn file
  const handleFileUpload = async (file: File) => {
    setErrorMsg('');
    setIsProcessing(true);
    try {
      const ext = file.name.split('.').pop()?.toLowerCase() || '';
      let result: ParseGradeResult;

      if (['xlsx', 'xls', 'csv'].includes(ext)) {
        result = await parseExcelGrades(file, classStudents, gradeConfigs);
      } else if (['docx'].includes(ext)) {
        result = await parseWordGrades(file, classStudents, gradeConfigs);
      } else if (['pdf'].includes(ext)) {
        result = await parsePdfGrades(file, classStudents, gradeConfigs);
      } else if (['txt', 'tsv', 'doc'].includes(ext)) {
        const text = await file.text();
        result = parseRawGradeText(text, classStudents, gradeConfigs, file.name, 'text');
      } else {
        throw new Error('Định dạng file không được hỗ trợ. Vui lòng chọn file .xlsx, .xls, .docx, .pdf hoặc .txt');
      }

      if (result.rows.length === 0) {
        throw new Error('Không tìm thấy dữ liệu sinh viên hoặc bảng điểm trong file tải lên.');
      }

      setParseResult(result);
      initializeColumnMapping(result);
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'Lỗi khi đọc file. Vui lòng kiểm tra lại cấu trúc file.');
    } finally {
      setIsProcessing(false);
    }
  };

  // Xử lý khi dán văn bản
  const handleParsePastedText = () => {
    if (!rawPastedText.trim()) {
      setErrorMsg('Vui lòng dán nội dung bảng điểm trước khi tiếp tục.');
      return;
    }
    setErrorMsg('');
    setIsProcessing(true);
    try {
      const result = parseRawGradeText(rawPastedText, classStudents, gradeConfigs, 'Dữ_liệu_dán_trực_tiếp.txt', 'text');
      if (result.rows.length === 0) {
        throw new Error('Không nhận diện được danh sách sinh viên và điểm số từ văn bản dán vào.');
      }
      setParseResult(result);
      initializeColumnMapping(result);
    } catch (err: any) {
      setErrorMsg(err.message || 'Lỗi xử lý văn bản');
    } finally {
      setIsProcessing(false);
    }
  };

  // Xử lý xác nhận nhập điểm vào sổ
  const handleConfirmImport = () => {
    if (!parseResult) return;

    const updatedStudentScores: Record<string, Record<string, number | null>> = {};

    parseResult.rows.forEach(row => {
      if (!row.matchedStudent) return;
      const studentId = row.matchedStudent.id;
      
      const studentGradeObj: Record<string, number | null> = {};

      gradeConfigs.forEach(cfg => {
        const mappedColKey = columnMapping[cfg.id];
        let newScore: number | null = null;

        if (mappedColKey && row.rawRowData[mappedColKey] !== undefined) {
          newScore = parseScoreValue(row.rawRowData[mappedColKey]);
        }

        // Lấy điểm hiện tại nếu có
        const currentStudentScores = (currentGrades as any)?.[studentId] || {};
        const existingScore = currentStudentScores[cfg.id];

        if (newScore !== null) {
          if (overwriteExisting || existingScore === null || existingScore === undefined) {
            studentGradeObj[cfg.id] = newScore;
          } else {
            studentGradeObj[cfg.id] = existingScore;
          }
        } else if (existingScore !== undefined) {
          studentGradeObj[cfg.id] = existingScore;
        }
      });

      updatedStudentScores[studentId] = studentGradeObj;
    });

    onApplyGrades({
      [subject.id]: updatedStudentScores
    });

    try {
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.6 }
      });
    } catch (e) {}

    onClose();
  };

  // Lọc danh sách xem trước
  const filteredRows = parseResult?.rows.filter(row => {
    if (filterPreview === 'matched' && !row.matchedStudent) return false;
    if (filterPreview === 'unmatched' && row.matchedStudent) return false;
    
    if (previewSearch.trim()) {
      const q = previewSearch.toLowerCase();
      const name = (row.rawFullName || row.matchedStudent?.fullName || '').toLowerCase();
      const code = (row.rawStudentCode || row.matchedStudent?.studentCode || '').toLowerCase();
      return name.includes(q) || code.includes(q);
    }
    return true;
  }) || [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs overflow-y-auto">
      <div className="w-full max-w-4xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-6 flex flex-col max-h-[92vh]">
        
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white p-5 flex items-center justify-between border-b border-slate-700 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-orange-500/20 border border-orange-500/30 flex items-center justify-center text-orange-400">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <span>Nhập điểm môn học từ file Excel, Word, PDF</span>
                <span className="px-2 py-0.5 bg-orange-600 text-white text-[11px] font-black rounded-md">
                  {subject.credits} Tín chỉ
                </span>
              </h3>
              <p className="text-xs text-slate-300">
                Môn: <strong className="text-orange-300">{subject.name}</strong> | Lớp: <strong>{classGroup.name}</strong> ({classStudents.length} sinh viên)
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-white/10 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          
          {/* Thông báo lỗi nếu có */}
          {errorMsg && (
            <div className="p-3.5 bg-red-50 border border-red-200 text-red-700 text-xs font-semibold rounded-xl flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
              <span>{errorMsg}</span>
            </div>
          )}

          {!parseResult ? (
            /* BƯỚC 1: Chọn nguồn dữ liệu & Tải file mẫu */
            <div className="space-y-6">
              
              {/* Tải file mẫu Excel */}
              <div className="bg-orange-50/80 border border-orange-200 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <FileCheck2 className="w-4 h-4 text-orange-600" />
                    <span className="text-xs font-bold text-orange-950 uppercase">
                      Tải File mẫu Excel chuẩn theo danh sách lớp {classGroup.name}
                    </span>
                  </div>
                  <p className="text-xs text-orange-800">
                    File mẫu chứa sẵn đầy đủ Họ tên, Mã SV của {classStudents.length} sinh viên và các cột kiểm tra ({gradeConfigs.map(c => c.name).join(', ')}).
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => downloadGradeImportTemplate(subject, classGroup, classStudents)}
                  className="px-4 py-2 bg-white hover:bg-orange-100 text-orange-700 border border-orange-300 font-bold text-xs rounded-xl shadow-2xs transition flex items-center gap-2"
                >
                  <Download className="w-4 h-4 text-orange-600" />
                  <span>Tải File mẫu Excel</span>
                </button>
              </div>

              {/* Lựa chọn phương thức: Tải file hoặc Dán văn bản */}
              <div className="flex border-b border-slate-200">
                <button
                  onClick={() => setActiveTab('upload')}
                  className={`pb-3 px-4 text-xs font-bold transition border-b-2 flex items-center gap-2 ${
                    activeTab === 'upload'
                      ? 'border-orange-600 text-orange-600'
                      : 'border-transparent text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <Upload className="w-4 h-4" />
                  <span>Tải lên File (Excel .xlsx / Word .docx / PDF / Text)</span>
                </button>
                <button
                  onClick={() => setActiveTab('paste')}
                  className={`pb-3 px-4 text-xs font-bold transition border-b-2 flex items-center gap-2 ${
                    activeTab === 'paste'
                      ? 'border-orange-600 text-orange-600'
                      : 'border-transparent text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <FileText className="w-4 h-4" />
                  <span>Dán nội dung bảng điểm trực tiếp</span>
                </button>
              </div>

              {activeTab === 'upload' ? (
                /* Vùng tải file Drag & Drop */
                <div className="space-y-3">
                  <div
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => {
                      e.preventDefault();
                      const file = e.dataTransfer.files[0];
                      if (file) handleFileUpload(file);
                    }}
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-slate-300 hover:border-orange-500 bg-slate-50/60 hover:bg-orange-50/30 rounded-2xl p-8 text-center cursor-pointer transition flex flex-col items-center justify-center space-y-3 group"
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".xlsx,.xls,.csv,.docx,.doc,.pdf,.txt"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleFileUpload(file);
                      }}
                    />
                    <div className="w-14 h-14 rounded-2xl bg-white shadow-md border border-slate-200 flex items-center justify-center text-orange-600 group-hover:scale-110 transition">
                      <FileUp className="w-7 h-7" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-800">
                        Nhấp để chọn file hoặc kéo thả file bảng điểm vào đây
                      </p>
                      <p className="text-xs text-slate-500 mt-1">
                        Hỗ trợ định dạng: <strong className="text-emerald-700">Excel (.xlsx, .xls)</strong>, <strong className="text-blue-700">Word (.docx)</strong>, <strong className="text-red-700">PDF (.pdf)</strong>, <strong className="text-slate-700">Text (.txt)</strong>
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-[11px] text-slate-600 pt-1">
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-start gap-2">
                      <FileSpreadsheet className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                      <div>
                        <strong>File Excel:</strong> Tự động nhận diện cột Mã SV, Họ tên và các bài kiểm tra theo tiêu đề.
                      </div>
                    </div>
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-start gap-2">
                      <FileText className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                      <div>
                        <strong>File Word (.docx):</strong> Trích xuất bảng điểm nguyên vẹn từ văn bản báo cáo môn học.
                      </div>
                    </div>
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-start gap-2">
                      <FileText className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                      <div>
                        <strong>File PDF (.pdf):</strong> Tự động đọc và khớp điểm sinh viên theo số báo danh/mã SV.
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                /* Tab Dán văn bản thô */
                <div className="space-y-3">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 block">
                      Dán nội dung sao chép (Copy & Paste) từ Word, Excel, PDF hoặc biểu mẫu Web:
                    </label>
                    <textarea
                      rows={8}
                      value={rawPastedText}
                      onChange={(e) => setRawPastedText(e.target.value)}
                      placeholder={`Ví dụ sao chép từ bảng điểm:
SV101   Nguyễn Văn An   8.5   7.0
SV102   Trần Thị Bình    9.0   8.5
SV103   Lê Hoàng Cường  6.5   7.5`}
                      className="w-full p-3 font-mono text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={handleParsePastedText}
                    disabled={isProcessing || !rawPastedText.trim()}
                    className="px-5 py-2.5 bg-orange-600 hover:bg-orange-700 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-md transition flex items-center gap-2"
                  >
                    <Sparkles className="w-4 h-4" />
                    <span>Phân tích dữ liệu dán</span>
                  </button>
                </div>
              )}

            </div>
          ) : (
            /* BƯỚC 2: XEM TRƯỚC, KHỚP CỘT ĐIỂM & XÁC NHẬN */
            <div className="space-y-5">
              
              {/* Thống kê nhận diện */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-800 flex items-center gap-2">
                      <span>Đã phân tích: <strong>{parseResult.fileName}</strong></span>
                      <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-bold rounded-md">
                        {parseResult.fileType.toUpperCase()}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500">
                      Khớp thành công: <strong className="text-emerald-700 font-bold">{parseResult.matchedCount} / {parseResult.totalParsed}</strong> sinh viên trong lớp {classGroup.name}.
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => {
                    setParseResult(null);
                    setColumnMapping({});
                  }}
                  className="px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 font-semibold text-xs rounded-xl transition flex items-center gap-1.5"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Chọn file khác</span>
                </button>
              </div>

              {/* Bảng Ánh xạ Cột Điểm (Column Mapping) */}
              <div className="p-4 bg-orange-50/70 border border-orange-200 rounded-2xl space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-orange-950 uppercase flex items-center gap-1.5">
                    <SlidersHorizontal className="w-4 h-4 text-orange-600" />
                    <span>Ánh xạ các cột điểm trong môn học:</span>
                  </span>
                  <span className="text-[11px] text-orange-800 font-medium">
                    Hệ thống tự động liên kết cột trong file với bài kiểm tra môn học
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {gradeConfigs.map(cfg => (
                    <div key={cfg.id} className="bg-white p-3 rounded-xl border border-orange-200 shadow-2xs space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-slate-800">{cfg.name}</span>
                        <span className="px-1.5 py-0.2 bg-amber-100 text-amber-900 rounded font-black text-[10px]">
                          HS{cfg.weight}
                        </span>
                      </div>
                      <select
                        value={columnMapping[cfg.id] || ''}
                        onChange={(e) => {
                          setColumnMapping({
                            ...columnMapping,
                            [cfg.id]: e.target.value
                          });
                        }}
                        className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-orange-500"
                      >
                        <option value="">-- Bỏ qua cột này --</option>
                        {parseResult.detectedColumns.map(col => (
                          <option key={col.key} value={col.key}>
                            {col.label} {col.sampleValue ? `(Mẫu: ${col.sampleValue})` : ''}
                          </option>
                        ))}
                      </select>
                    </div>
                  ))}
                </div>
              </div>

              {/* Tùy chọn Nhập điểm */}
              <div className="flex flex-wrap items-center justify-between gap-3 text-xs bg-slate-50 p-3 rounded-xl border border-slate-200">
                <div className="flex items-center gap-4">
                  <span className="font-bold text-slate-700">Tùy chọn:</span>
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="radio"
                      name="importOption"
                      checked={overwriteExisting}
                      onChange={() => setOverwriteExisting(true)}
                      className="text-orange-600 focus:ring-orange-500"
                    />
                    <span>Ghi đè tất cả điểm</span>
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="radio"
                      name="importOption"
                      checked={!overwriteExisting}
                      onChange={() => setOverwriteExisting(false)}
                      className="text-orange-600 focus:ring-orange-500"
                    />
                    <span>Chỉ điền vào ô chưa có điểm</span>
                  </label>
                </div>

                {/* Bộ lọc xem trước */}
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={previewSearch}
                    onChange={(e) => setPreviewSearch(e.target.value)}
                    placeholder="Lọc tên/mã..."
                    className="px-2.5 py-1 bg-white border border-slate-200 rounded-lg text-xs"
                  />
                  <select
                    value={filterPreview}
                    onChange={(e) => setFilterPreview(e.target.value as any)}
                    className="px-2 py-1 bg-white border border-slate-200 rounded-lg text-xs font-semibold"
                  >
                    <option value="all">Tất cả ({parseResult.rows.length})</option>
                    <option value="matched">Khớp lớp ({parseResult.matchedCount})</option>
                    <option value="unmatched">Không khớp ({parseResult.rows.length - parseResult.matchedCount})</option>
                  </select>
                </div>
              </div>

              {/* Bảng Xem Trước Chi Tiết (Preview Table) */}
              <div className="border border-slate-200 rounded-xl overflow-hidden max-h-72 overflow-y-auto">
                <table className="w-full text-left text-xs text-slate-700">
                  <thead className="bg-slate-100 text-slate-700 font-bold sticky top-0 uppercase tracking-wider text-[10px]">
                    <tr>
                      <th className="p-2.5 w-10 text-center">STT</th>
                      <th className="p-2.5">Trạng thái khớp</th>
                      <th className="p-2.5">Mã SV (File)</th>
                      <th className="p-2.5">Họ tên (File)</th>
                      <th className="p-2.5">Sinh viên trong lớp</th>
                      {gradeConfigs.map(cfg => (
                        <th key={cfg.id} className="p-2.5 text-center bg-amber-50 border-x border-amber-200 text-amber-900">
                          {cfg.name} (HS{cfg.weight})
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredRows.map((row, idx) => {
                      const matched = !!row.matchedStudent;
                      return (
                        <tr key={idx} className={`hover:bg-slate-50 ${matched ? '' : 'bg-red-50/30'}`}>
                          <td className="p-2 text-center text-slate-400 font-medium">{idx + 1}</td>
                          <td className="p-2">
                            {row.matchType === 'exact_code' && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-full font-bold text-[10px]">
                                <CheckCircle2 className="w-3 h-3" /> Mã SV
                              </span>
                            )}
                            {row.matchType === 'exact_name' && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-100 text-blue-800 rounded-full font-bold text-[10px]">
                                <CheckCircle2 className="w-3 h-3" /> Họ tên
                              </span>
                            )}
                            {row.matchType === 'fuzzy_name' && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-100 text-amber-800 rounded-full font-bold text-[10px]">
                                Khớp mờ
                              </span>
                            )}
                            {row.matchType === 'unmatched' && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-red-100 text-red-700 rounded-full font-bold text-[10px]">
                                Không khớp
                              </span>
                            )}
                          </td>
                          <td className="p-2 font-mono font-bold text-slate-700">{row.rawStudentCode || '-'}</td>
                          <td className="p-2 font-semibold text-slate-800">{row.rawFullName || '-'}</td>
                          <td className="p-2 font-bold text-slate-900">
                            {row.matchedStudent ? (
                              <span className="text-emerald-700">
                                {row.matchedStudent.fullName} ({row.matchedStudent.studentCode})
                              </span>
                            ) : (
                              <span className="text-slate-400 italic">Không tìm thấy</span>
                            )}
                          </td>
                          {gradeConfigs.map(cfg => {
                            const colKey = columnMapping[cfg.id];
                            const rawVal = colKey ? row.rawRowData[colKey] : null;
                            const scoreNum = parseScoreValue(rawVal);
                            return (
                              <td key={cfg.id} className="p-2 text-center bg-amber-50/30 border-x border-amber-100 font-bold text-slate-900">
                                {scoreNum !== null ? (
                                  <span className="px-2 py-0.5 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded font-black text-xs">
                                    {scoreNum}
                                  </span>
                                ) : (
                                  <span className="text-slate-300">-</span>
                                )}
                              </td>
                            );
                          })}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-slate-600 hover:text-slate-900 font-semibold text-xs rounded-xl hover:bg-slate-200 transition"
          >
            Đóng
          </button>

          {parseResult && (
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handleConfirmImport}
                disabled={parseResult.matchedCount === 0}
                className="px-5 py-2.5 bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-md transition flex items-center gap-2"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Xác nhận nhập điểm ({parseResult.matchedCount} SV)</span>
              </button>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};
