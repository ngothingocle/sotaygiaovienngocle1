import React, { useState } from 'react';
import { 
  Award, 
  BookOpen, 
  FileSpreadsheet, 
  FileText, 
  Printer, 
  CheckCircle2, 
  AlertTriangle, 
  XCircle, 
  Search, 
  Plus,
  Settings,
  Trash2,
  Edit2,
  Sparkles,
  RefreshCw,
  X,
  SlidersHorizontal,
  HelpCircle,
  UploadCloud,
  FileUp,
  Download
} from 'lucide-react';
import { 
  Subject, 
  Student, 
  ClassGroup, 
  AttendanceRecord, 
  MakeupRecord, 
  StudentGrade,
  GradeWeightConfig
} from '../types';
import { evaluateStudentSubjectStatus, formatScore, getDefaultGradeConfigs } from '../utils/calculations';
import { exportGradesToExcel, exportToWordDoc } from '../utils/exportImport';
import { ImportGradesModal } from './ImportGradesModal';
import { downloadGradeImportTemplate } from '../utils/gradeImportParser';

interface GradesViewProps {
  subjects: Subject[];
  classes: ClassGroup[];
  students: Student[];
  grades: Record<string, Record<string, Record<string, number | null>>>; // [subjectId][studentId][gradeConfigId]
  attendanceRecords: AttendanceRecord[];
  makeupRecords: MakeupRecord[];
  onSaveGrades: (grades: Record<string, Record<string, Record<string, number | null>>>) => void;
  onSaveSubjects?: (subjects: Subject[]) => void;
  onSelectStudentProfile: (studentId: string) => void;
}

export const GradesView: React.FC<GradesViewProps> = ({
  subjects,
  classes,
  students,
  grades,
  attendanceRecords,
  makeupRecords,
  onSaveGrades,
  onSaveSubjects,
  onSelectStudentProfile
}) => {
  const [selectedClassId, setSelectedClassId] = useState<string>(classes[0]?.id || '');
  const classSubjects = subjects.filter(s => s.classId === selectedClassId);
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>(classSubjects[0]?.id || '');
  const [searchKeyword, setSearchKeyword] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'qualified' | 'disqualified'>('all');
  
  // State modal cấu hình cột điểm & nhập điểm từ file
  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [newColName, setNewColName] = useState('');
  const [newColWeight, setNewColWeight] = useState<number>(1);
  const [newColType, setNewColType] = useState<'Lý thuyết' | 'Thực hành' | 'Chung'>('Lý thuyết');
  const [feedbackToast, setFeedbackToast] = useState('');

  const showToast = (msg: string) => {
    setFeedbackToast(msg);
    setTimeout(() => setFeedbackToast(''), 3000);
  };

  const currentClass = classes.find(c => c.id === selectedClassId) || classes[0];
  const currentSubject = subjects.find(s => s.id === selectedSubjectId) || classSubjects[0];

  // Đảm bảo môn học luôn có cấu hình cột điểm hợp lệ
  const activeGradeConfigs: GradeWeightConfig[] = (currentSubject?.gradeConfigs && currentSubject.gradeConfigs.length > 0)
    ? currentSubject.gradeConfigs
    : (currentSubject ? getDefaultGradeConfigs(currentSubject.credits, currentSubject.type) : []);

  const classStudents = students.filter(s => s.classId === selectedClassId);

  // Tính toán điểm và trạng thái KĐĐKDT cho từng sinh viên
  const studentGradesMap: Record<string, StudentGrade> = {};
  if (currentSubject) {
    const subjectWithConfigs = {
      ...currentSubject,
      gradeConfigs: activeGradeConfigs
    };
    classStudents.forEach(s => {
      const studentScores = grades[currentSubject.id]?.[s.id] || {};
      studentGradesMap[s.id] = evaluateStudentSubjectStatus(
        s,
        subjectWithConfigs,
        studentScores,
        attendanceRecords,
        makeupRecords
      );
    });
  }

  // Cập nhật điểm cho một sinh viên
  const handleScoreChange = (studentId: string, gradeConfigId: string, value: string) => {
    if (!currentSubject) return;

    let scoreNum: number | null = null;
    if (value.trim() !== '') {
      const parsed = parseFloat(value.replace(',', '.'));
      if (!isNaN(parsed) && parsed >= 0 && parsed <= 10) {
        scoreNum = parsed;
      } else if (isNaN(parsed)) {
        return;
      }
    }

    const currentSubjectGrades = grades[currentSubject.id] || {};
    const currentStudentScores = currentSubjectGrades[studentId] || {};

    const updated = {
      ...grades,
      [currentSubject.id]: {
        ...currentSubjectGrades,
        [studentId]: {
          ...currentStudentScores,
          [gradeConfigId]: scoreNum
        }
      }
    };

    onSaveGrades(updated);
  };

  // Thêm cột điểm mới cho môn học hiện tại
  const handleAddGradeColumn = (name: string, weight: number, type: 'Lý thuyết' | 'Thực hành' | 'Chung') => {
    if (!currentSubject || !onSaveSubjects) return;
    const newConfig: GradeWeightConfig = {
      id: `kt_${Date.now()}_hs${weight}`,
      name: name.trim() || `Bài KT mới (HS${weight})`,
      weight,
      type
    };

    const updatedConfigs = [...activeGradeConfigs, newConfig];
    const updatedSubjects = subjects.map(s => s.id === currentSubject.id ? { ...s, gradeConfigs: updatedConfigs } : s);
    onSaveSubjects(updatedSubjects);
    setNewColName('');
    showToast(`Đã thêm cột điểm "${newConfig.name}" thành công!`);
  };

  // Xóa một cột điểm
  const handleDeleteGradeColumn = (configId: string) => {
    if (!currentSubject || !onSaveSubjects) return;
    if (activeGradeConfigs.length <= 1) {
      alert('Môn học cần có ít nhất một cột điểm kiểm tra để đánh giá kết quả.');
      return;
    }
    const updatedConfigs = activeGradeConfigs.filter(c => c.id !== configId);
    const updatedSubjects = subjects.map(s => s.id === currentSubject.id ? { ...s, gradeConfigs: updatedConfigs } : s);
    onSaveSubjects(updatedSubjects);
    showToast('Đã xóa cột điểm.');
  };

  // Cập nhật tên/hệ số cột điểm
  const handleUpdateGradeColumn = (configId: string, newName: string, newWeight: number) => {
    if (!currentSubject || !onSaveSubjects) return;
    const updatedConfigs = activeGradeConfigs.map(c => 
      c.id === configId ? { ...c, name: newName, weight: newWeight } : c
    );
    const updatedSubjects = subjects.map(s => s.id === currentSubject.id ? { ...s, gradeConfigs: updatedConfigs } : s);
    onSaveSubjects(updatedSubjects);
  };

  // Áp dụng bộ cột điểm chuẩn theo Tín chỉ
  const handleApplyPreset = (creditPreset: number) => {
    if (!currentSubject || !onSaveSubjects) return;
    const defaultConfigs = getDefaultGradeConfigs(creditPreset, currentSubject.type);
    const updatedSubjects = subjects.map(s => s.id === currentSubject.id ? { ...s, credits: creditPreset, gradeConfigs: defaultConfigs } : s);
    onSaveSubjects(updatedSubjects);
    showToast(`Đã áp dụng mẫu chuẩn cột điểm cho môn ${creditPreset} Tín chỉ.`);
  };

  // Nạp điểm mẫu ngẫu nhiên cho lớp
  const handleFillSampleGrades = () => {
    if (!currentSubject) return;
    const currentSubjectGrades = { ...(grades[currentSubject.id] || {}) };

    classStudents.forEach(s => {
      if (!currentSubjectGrades[s.id]) {
        currentSubjectGrades[s.id] = {};
      }
      activeGradeConfigs.forEach(col => {
        if (currentSubjectGrades[s.id][col.id] === undefined || currentSubjectGrades[s.id][col.id] === null) {
          // Sinh điểm từ 5.5 đến 9.5
          const randomScore = Math.round((5.5 + Math.random() * 4) * 10) / 10;
          currentSubjectGrades[s.id][col.id] = randomScore;
        }
      });
    });

    onSaveGrades({
      ...grades,
      [currentSubject.id]: currentSubjectGrades
    });
    showToast('Đã điền điểm mẫu nhanh cho toàn bộ sinh viên!');
  };

  // Áp dụng điểm nhập từ file Excel, Word, PDF
  const handleApplyImportedGrades = (importedGrades: Record<string, Record<string, number | null>>) => {
    if (!currentSubject) return;
    const currentSubjectScores = grades[currentSubject.id] || {};
    const newSubjectScores = importedGrades[currentSubject.id] || {};

    const merged = {
      ...currentSubjectScores,
      ...newSubjectScores
    };

    onSaveGrades({
      ...grades,
      [currentSubject.id]: merged
    });
    showToast(`Đã nhập và cập nhật điểm thành công cho môn ${currentSubject.name}!`);
  };

  // Tải file mẫu Excel chuẩn cho môn học hiện tại
  const handleDownloadSampleExcel = () => {
    if (!currentSubject || !currentClass) return;
    const subjectWithConfigs = {
      ...currentSubject,
      gradeConfigs: activeGradeConfigs
    };
    downloadGradeImportTemplate(subjectWithConfigs, currentClass, classStudents);
    showToast('Đã tải xuống file mẫu Excel nhập điểm!');
  };

  // Lọc sinh viên hiển thị
  const filteredStudents = classStudents.filter(s => {
    const studentGrade = studentGradesMap[s.id];
    const matchesSearch = 
      s.fullName.toLowerCase().includes(searchKeyword.toLowerCase()) ||
      s.studentCode.toLowerCase().includes(searchKeyword.toLowerCase());
    
    if (!matchesSearch) return false;

    if (statusFilter === 'qualified') return !studentGrade?.isDisqualified;
    if (statusFilter === 'disqualified') return studentGrade?.isDisqualified;
    return true;
  });

  // Thống kê nhanh
  const totalCount = classStudents.length;
  const disqualifiedCount = classStudents.filter(s => studentGradesMap[s.id]?.isDisqualified).length;
  const qualifiedCount = totalCount - disqualifiedCount;

  // Xuất file Excel
  const handleExportExcel = () => {
    if (!currentSubject) return;
    const subjectWithConfigs = {
      ...currentSubject,
      gradeConfigs: activeGradeConfigs
    };
    exportGradesToExcel(subjectWithConfigs, classStudents, studentGradesMap, currentClass);
  };

  // Xuất file Word
  const handleExportWord = () => {
    if (!currentSubject || !currentClass) return;

    const content = `
      <div class="header-box">
        <h3>BẢNG ĐIỂM KIỂM TRA & DANH SÁCH XÉT ĐIỀU KIỆN DỰ THI</h3>
        <p><strong>Môn học:</strong> ${currentSubject.name} (${currentSubject.credits} Tín chỉ - ${currentSubject.type})</p>
        <p><strong>Lớp:</strong> ${currentClass.name} | <strong>Khóa:</strong> ${currentClass.cohort} | <strong>Ngành:</strong> ${currentClass.majorName}</p>
        <p><strong>Giáo viên giảng dạy:</strong> ${currentClass.homeroomTeacher?.fullName || 'Cô Ngọc Lê'} - <strong>SĐT:</strong> ${currentClass.homeroomTeacher?.phone || '0948090287'}</p>
      </div>

      <table>
        <thead>
          <tr>
            <th>STT</th>
            <th>Mã SV</th>
            <th>Họ và tên</th>
            <th>Tổ</th>
            ${activeGradeConfigs.map(c => `<th>${c.name} (HS${c.weight})</th>`).join('')}
            <th>Điểm TB môn</th>
            <th>Vắng LT</th>
            <th>Vắng TH</th>
            <th>Học bù</th>
            <th>Kết quả ĐKDT</th>
            <th>Lý do KĐĐKDT</th>
          </tr>
        </thead>
        <tbody>
          ${classStudents.map((s, i) => {
            const sg = studentGradesMap[s.id];
            return `
              <tr>
                <td class="center">${i + 1}</td>
                <td class="center"><strong>${s.studentCode}</strong></td>
                <td>${s.fullName}</td>
                <td class="center">${s.team || 'Tổ 1'}</td>
                ${activeGradeConfigs.map(c => {
                  const sc = sg?.scores[c.id];
                  return `<td class="center">${sc !== null && sc !== undefined ? sc : '-'}</td>`;
                }).join('')}
                <td class="center"><strong>${formatScore(sg?.averageScore)}</strong></td>
                <td class="center">${sg?.totalAbsencePeriods || 0}t</td>
                <td class="center">${sg?.totalAbsencePracticeLessons || 0}b</td>
                <td class="center">${sg?.makeupCount || 0}</td>
                <td class="center ${sg?.isDisqualified ? 'text-red' : 'text-green'}">
                  <strong>${sg?.isDisqualified ? 'KĐĐKDT' : 'Đủ ĐKDT'}</strong>
                </td>
                <td style="font-size: 10pt; color: #666;">${sg?.disqualificationReasons?.join('; ') || ''}</td>
              </tr>
            `;
          }).join('')}
        </tbody>
      </table>

      <table class="signature-box">
        <tr>
          <td>
            <p><strong>Tổng số SV:</strong> ${totalCount}</p>
            <p><strong>Đủ điều kiện dự thi:</strong> ${qualifiedCount} SV</p>
            <p><strong>Không đủ điều kiện (KĐĐKDT):</strong> ${disqualifiedCount} SV</p>
          </td>
          <td>
            <p><em>Ngày ..... tháng ..... năm 2026</em></p>
            <p><strong>GIÁO VIÊN GIẢNG DẠY</strong></p>
            <br/><br/><br/>
            <p><strong>${currentClass.homeroomTeacher?.fullName || 'Cô Ngọc Lê'}</strong></p>
          </td>
        </tr>
      </table>
    `;

    exportToWordDoc(`Bang_Diem_${currentSubject.name}_${currentClass.name}`, content);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      
      {/* Toast thông báo */}
      {feedbackToast && (
        <div className="fixed top-5 right-5 z-50 bg-slate-900 text-white px-4 py-2.5 rounded-xl shadow-xl border border-slate-700 text-xs font-semibold flex items-center gap-2 animate-bounce">
          <Sparkles className="w-4 h-4 text-amber-300" />
          <span>{feedbackToast}</span>
        </div>
      )}

      {/* Top Selector: Chọn Lớp & Môn học */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-4">
        
        {/* Hàng chọn Lớp */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-bold text-slate-700 uppercase">Lớp học:</span>
            <div className="flex flex-wrap gap-1.5">
              {classes.map(c => (
                <button
                  key={c.id}
                  onClick={() => {
                    setSelectedClassId(c.id);
                    const subList = subjects.filter(s => s.classId === c.id);
                    if (subList.length > 0) setSelectedSubjectId(subList[0].id);
                  }}
                  className={`px-3.5 py-1.5 text-xs font-bold rounded-xl transition ${
                    selectedClassId === c.id
                      ? 'bg-gradient-to-r from-red-600 to-orange-600 text-white shadow-md'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  {c.name}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-3 text-xs">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-emerald-500"></span>
              <span>Đủ ĐKDT: <strong className="text-emerald-700 font-bold">{qualifiedCount}</strong> SV</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-red-500"></span>
              <span>KĐĐKDT: <strong className="text-red-700 font-bold">{disqualifiedCount}</strong> SV</span>
            </div>
          </div>
        </div>

        {/* Hàng chọn Môn học */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 flex-wrap">
            <BookOpen className="w-5 h-5 text-orange-600" />
            <span className="text-xs font-bold text-slate-700 uppercase">Môn học đang nhập điểm:</span>
            <div className="flex flex-wrap gap-2">
              {classSubjects.map(s => {
                const isSelected = s.id === currentSubject?.id;
                return (
                  <button
                    key={s.id}
                    onClick={() => setSelectedSubjectId(s.id)}
                    className={`px-3.5 py-2 text-xs font-bold rounded-xl transition flex items-center gap-1.5 ${
                      isSelected
                        ? 'bg-orange-600 text-white shadow-md'
                        : 'bg-orange-50 text-orange-800 hover:bg-orange-100 border border-orange-200'
                    }`}
                  >
                    <span>{s.name}</span>
                    <span className={`px-1.5 py-0.2 rounded text-[10px] ${
                      isSelected ? 'bg-white/20 text-white' : 'bg-orange-200 text-orange-900'
                    }`}>
                      {s.credits} TC
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

      </div>

      {currentSubject ? (
        <div className="space-y-4">
          
          {/* Card Hướng dẫn & Cấu hình Cột điểm */}
          <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white rounded-2xl p-5 shadow-md border border-slate-700">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="space-y-1.5 flex-1 min-w-[300px]">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="px-2.5 py-0.5 bg-red-600 text-white text-xs font-black rounded-md shadow-xs">
                    {currentSubject.credits} TÍN CHỈ
                  </span>
                  <span className="text-sm font-bold text-orange-300">
                    {currentSubject.name}
                  </span>
                  <span className="text-xs text-slate-300">({currentSubject.type})</span>
                </div>
                
                {/* Hiển thị các cột điểm hiện có */}
                <div className="flex items-center gap-1.5 flex-wrap pt-1">
                  <span className="text-xs font-bold text-slate-300">Cột điểm kiểm tra:</span>
                  {activeGradeConfigs.map((c) => (
                    <span 
                      key={c.id} 
                      className="inline-flex items-center gap-1 px-2.5 py-1 bg-amber-500/20 text-amber-300 border border-amber-400/30 rounded-lg text-xs font-bold"
                    >
                      <span>{c.name}</span>
                      <span className="px-1.5 py-0.2 bg-amber-400 text-slate-900 text-[10px] font-black rounded">
                        HS{c.weight}
                      </span>
                    </span>
                  ))}
                </div>

                <p className="text-[11px] text-slate-400">
                  ⚡ <strong>Thuật toán ĐTB môn:</strong> Tổng (Điểm × Hệ số) / Tổng hệ số. <span className="text-amber-300 font-semibold">Sinh viên có ĐTB môn &lt; 5.0 sẽ bị KĐĐKDT</span>.
                </p>
              </div>

              {/* Nút thao tác nhanh Cột điểm & Nhập điểm */}
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  onClick={() => setIsImportModalOpen(true)}
                  className="px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-bold text-xs rounded-xl shadow-lg transition flex items-center gap-1.5 ring-2 ring-emerald-400/30 animate-pulse hover:animate-none"
                  title="Nhập điểm từ file Excel (.xlsx), Word (.docx), PDF hoặc Dán văn bản"
                >
                  <UploadCloud className="w-4 h-4" />
                  <span>Nhập điểm (Excel / Word / PDF)</span>
                </button>

                <button
                  onClick={() => setIsConfigModalOpen(true)}
                  className="px-3.5 py-2 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white font-bold text-xs rounded-xl shadow-md transition flex items-center gap-1.5"
                >
                  <Settings className="w-4 h-4" />
                  <span>Cấu hình cột điểm ({activeGradeConfigs.length})</span>
                </button>

                <button
                  onClick={handleFillSampleGrades}
                  className="px-3 py-2 bg-white/10 hover:bg-white/20 text-slate-200 font-semibold text-xs rounded-xl border border-white/20 transition flex items-center gap-1.5"
                  title="Tự động điền điểm mẫu cho các ô còn trống"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                  <span>Điền nhanh điểm mẫu</span>
                </button>
              </div>
            </div>
          </div>

          {/* Bảng Điểm & Xét ĐKDT */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            
            {/* Toolbar */}
            <div className="p-4 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 bg-slate-50/70">
              
              <div className="flex flex-wrap items-center gap-2.5 flex-1 min-w-[280px]">
                <div className="relative flex-1 max-w-xs">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={searchKeyword}
                    onChange={(e) => setSearchKeyword(e.target.value)}
                    placeholder="Tìm theo tên, Mã SV..."
                    className="w-full pl-9 pr-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>

                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as any)}
                  className="px-2.5 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-700"
                >
                  <option value="all">Tất cả trạng thái ({totalCount})</option>
                  <option value="qualified">Đủ điều kiện dự thi ({qualifiedCount})</option>
                  <option value="disqualified">Không đủ điều kiện (KĐĐKDT) ({disqualifiedCount})</option>
                </select>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  onClick={() => setIsImportModalOpen(true)}
                  className="px-3.5 py-1.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold text-xs rounded-xl shadow-xs transition flex items-center gap-1.5"
                  title="Tải lên file Excel, Word, PDF hoặc dán bảng điểm để nhập tự động"
                >
                  <UploadCloud className="w-3.5 h-3.5 text-emerald-200" />
                  <span>Nhập điểm từ File</span>
                </button>

                <button
                  onClick={handleDownloadSampleExcel}
                  className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-semibold text-xs rounded-xl border border-emerald-200 transition flex items-center gap-1.5 shadow-2xs"
                  title="Tải file mẫu Excel chuẩn theo danh sách sinh viên lớp hiện tại"
                >
                  <Download className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Tải file mẫu</span>
                </button>

                <button
                  onClick={() => setIsConfigModalOpen(true)}
                  className="px-3 py-1.5 bg-orange-50 hover:bg-orange-100 text-orange-700 font-semibold text-xs rounded-xl border border-orange-200 transition flex items-center gap-1.5 shadow-2xs"
                >
                  <Plus className="w-3.5 h-3.5 text-orange-600" />
                  <span>Thêm/Sửa Cột điểm</span>
                </button>

                <button
                  onClick={handleExportExcel}
                  className="px-3.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-semibold text-xs rounded-xl border border-emerald-200 transition flex items-center gap-1.5 shadow-2xs"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Xuất Excel</span>
                </button>

                <button
                  onClick={handleExportWord}
                  className="px-3.5 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-semibold text-xs rounded-xl border border-indigo-200 transition flex items-center gap-1.5 shadow-2xs"
                >
                  <FileText className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Xuất Word</span>
                </button>

                <button
                  onClick={handlePrint}
                  className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl transition flex items-center gap-1"
                >
                  <Printer className="w-3.5 h-3.5" />
                </button>
              </div>

            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-700">
                <thead className="bg-slate-100 text-slate-700 font-bold uppercase tracking-wider text-[11px]">
                  <tr>
                    <th className="p-3 w-10 text-center">STT</th>
                    <th className="p-3 w-24">Mã SV</th>
                    <th className="p-3 min-w-[170px]">Họ và Tên Sinh viên</th>
                    <th className="p-3 text-center w-16">Tổ</th>
                    
                    {/* Các cột điểm kiểm tra */}
                    {activeGradeConfigs.map(col => (
                      <th key={col.id} className="p-3 text-center min-w-[120px] bg-amber-50 border-x border-amber-200/80">
                        <div className="text-amber-900 font-bold text-xs">{col.name}</div>
                        <div className="text-[10px] text-amber-700 font-black tracking-wide">
                          (Hệ số {col.weight})
                        </div>
                      </th>
                    ))}

                    <th className="p-3 text-center min-w-[90px] bg-orange-100/80 text-orange-900 font-black">
                      Điểm TB môn
                    </th>
                    <th className="p-3 text-center w-20">Vắng LT</th>
                    <th className="p-3 text-center w-20">Vắng TH</th>
                    <th className="p-3 text-center w-16">Học bù</th>
                    <th className="p-3 text-center min-w-[130px]">Xét ĐKDT</th>
                    <th className="p-3 min-w-[200px]">Lý do KĐĐKDT</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {filteredStudents.length > 0 ? (
                    filteredStudents.map((student, idx) => {
                      const sg = studentGradesMap[student.id];
                      const isDisqualified = sg?.isDisqualified;

                      return (
                        <tr key={student.id} className={`hover:bg-slate-50 transition ${isDisqualified ? 'bg-red-50/40' : ''}`}>
                          <td className="p-3 text-center text-slate-400 font-medium">{idx + 1}</td>
                          <td className="p-3 font-mono font-bold text-orange-700">
                            <button
                              onClick={() => onSelectStudentProfile(student.id)}
                              className="hover:underline"
                            >
                              {student.studentCode}
                            </button>
                          </td>
                          <td className="p-3 font-bold text-slate-900">
                            <button
                              onClick={() => onSelectStudentProfile(student.id)}
                              className="hover:underline hover:text-orange-600 text-left"
                            >
                              {student.fullName}
                            </button>
                          </td>
                          <td className="p-3 text-center">
                            <span className="px-1.5 py-0.5 bg-slate-100 rounded text-[10px] font-bold text-slate-600">
                              {student.team || 'Tổ 1'}
                            </span>
                          </td>

                          {/* Ô nhập điểm các bài kiểm tra */}
                          {activeGradeConfigs.map(col => {
                            const score = sg?.scores[col.id];
                            return (
                              <td key={col.id} className="p-2 text-center bg-amber-50/20 border-x border-amber-100">
                                <input
                                  type="number"
                                  step="0.1"
                                  min="0"
                                  max="10"
                                  value={score !== null && score !== undefined ? score : ''}
                                  onChange={(e) => handleScoreChange(student.id, col.id, e.target.value)}
                                  placeholder="-"
                                  className="w-16 p-1.5 text-center font-bold text-slate-900 bg-white border border-slate-300 focus:border-orange-500 focus:ring-2 focus:ring-orange-500 rounded-lg text-xs"
                                />
                              </td>
                            );
                          })}

                          {/* Điểm Trung Bình Môn */}
                          <td className="p-3 text-center bg-orange-50/40 font-black text-sm">
                            <span className={sg?.averageScore !== null && sg?.averageScore !== undefined && sg.averageScore < 5.0 ? 'text-red-700 font-black underline' : 'text-slate-900'}>
                              {formatScore(sg?.averageScore)}
                            </span>
                          </td>

                          {/* Vắng Lý thuyết */}
                          <td className="p-3 text-center font-semibold">
                            <span className={sg?.totalAbsencePeriods && sg.totalAbsencePeriods > currentSubject.maxAllowedAbsencePeriods ? 'text-red-600 font-bold' : 'text-slate-600'}>
                              {sg?.totalAbsencePeriods || 0}t
                            </span>
                          </td>

                          {/* Vắng Thực hành */}
                          <td className="p-3 text-center font-semibold">
                            <span className={sg?.totalAbsencePracticeLessons && sg.totalAbsencePracticeLessons > 0 ? 'text-amber-600 font-bold' : 'text-slate-600'}>
                              {sg?.totalAbsencePracticeLessons || 0}b
                            </span>
                          </td>

                          {/* Số buổi học bù */}
                          <td className="p-3 text-center">
                            {sg?.makeupCount ? (
                              <span className="px-1.5 py-0.5 bg-emerald-100 text-emerald-800 rounded font-bold text-[10px]">
                                +{sg.makeupCount}b
                              </span>
                            ) : (
                              <span className="text-slate-300">-</span>
                            )}
                          </td>

                          {/* Xét ĐKDT */}
                          <td className="p-3 text-center">
                            {isDisqualified ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-red-100 text-red-700 border border-red-200 rounded-full font-bold text-[11px]">
                                <XCircle className="w-3.5 h-3.5 shrink-0" />
                                <span>KĐĐKDT</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-full font-bold text-[11px]">
                                <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                                <span>Đủ ĐKDT</span>
                              </span>
                            )}
                          </td>

                          {/* Lý do KĐĐKDT */}
                          <td className="p-3">
                            {sg?.disqualificationReasons && sg.disqualificationReasons.length > 0 ? (
                              <div className="space-y-0.5 text-[11px] text-red-600 font-medium">
                                {sg.disqualificationReasons.map((r, i) => (
                                  <div key={i} className="flex items-start gap-1">
                                    <span className="text-red-500">•</span>
                                    <span>{r}</span>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <span className="text-slate-400 text-[11px]">Đạt yêu cầu</span>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={10 + activeGradeConfigs.length} className="p-8 text-center text-slate-400">
                        Không tìm thấy sinh viên nào phù hợp bộ lọc.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Chú thích & Hướng dẫn */}
            <div className="p-3 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-600">
              <div className="flex items-center gap-4 flex-wrap">
                <span className="font-bold text-slate-700">Quy chuẩn đánh giá:</span>
                <span className="flex items-center gap-1 text-red-600 font-semibold">
                  <XCircle className="w-3.5 h-3.5" /> ĐTB &lt; 5.0 = KĐĐKDT
                </span>
                <span className="flex items-center gap-1 text-slate-600">
                  • Vắng quá {currentSubject.maxAllowedAbsencePeriods} tiết LT = KĐĐKDT
                </span>
                <span className="flex items-center gap-1 text-slate-600">
                  • Vắng bài TH chưa học bù = KĐĐKDT
                </span>
              </div>

              <div className="text-slate-500 text-[11px]">
                Tổng số sinh viên: <strong>{totalCount}</strong>
              </div>
            </div>

          </div>

        </div>
      ) : (
        <div className="p-12 text-center bg-white rounded-2xl border border-slate-200 text-slate-400">
          <BookOpen className="w-10 h-10 mx-auto text-slate-300 mb-2" />
          <p className="font-semibold text-slate-600">Lớp học này chưa có môn học nào.</p>
          <p className="text-xs mt-1">Vui lòng chuyển sang tab <strong>"Môn học & Tín chỉ"</strong> để thêm môn học cho lớp.</p>
        </div>
      )}

      {/* Modal Cấu hình Cột Điểm Kiểm tra */}
      {isConfigModalOpen && currentSubject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="w-full max-w-xl bg-white rounded-2xl shadow-2xl p-6 border border-slate-100 max-h-[90vh] overflow-y-auto space-y-5">
            
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Award className="w-5 h-5 text-orange-600" />
                <h3 className="text-lg font-bold text-slate-900">
                  Cấu hình Cột điểm kiểm tra môn học
                </h3>
              </div>
              <button
                onClick={() => setIsConfigModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-1">
              <p className="text-sm font-bold text-slate-800">
                Môn: <span className="text-orange-600">{currentSubject.name}</span> ({currentSubject.credits} Tín chỉ - {currentSubject.type})
              </p>
              <p className="text-xs text-slate-500">
                Thay đổi tên bài kiểm tra, hệ số điểm (HS1, HS2, HS3) hoặc thêm/xóa cột điểm tùy theo đề cương môn học.
              </p>
            </div>

            {/* Presets chuẩn theo Tín chỉ */}
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
              <span className="text-xs font-bold text-slate-700 block uppercase">
                ⚡ Áp dụng nhanh mẫu cột điểm chuẩn theo Tín chỉ:
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <button
                  type="button"
                  onClick={() => handleApplyPreset(1)}
                  className="p-2 bg-white hover:bg-orange-50 border border-slate-200 hover:border-orange-300 rounded-lg text-xs font-semibold text-slate-800 transition text-center"
                >
                  <div className="font-bold text-orange-600">1 Tín chỉ</div>
                  <div className="text-[10px] text-slate-500">2 bài: HS1, HS2</div>
                </button>

                <button
                  type="button"
                  onClick={() => handleApplyPreset(2)}
                  className="p-2 bg-white hover:bg-orange-50 border border-slate-200 hover:border-orange-300 rounded-lg text-xs font-semibold text-slate-800 transition text-center"
                >
                  <div className="font-bold text-orange-600">2 Tín chỉ</div>
                  <div className="text-[10px] text-slate-500">2 bài: HS1, HS2</div>
                </button>

                <button
                  type="button"
                  onClick={() => handleApplyPreset(2.5)}
                  className="p-2 bg-white hover:bg-orange-50 border border-slate-200 hover:border-orange-300 rounded-lg text-xs font-semibold text-slate-800 transition text-center"
                >
                  <div className="font-bold text-orange-600">2.5 Tín chỉ</div>
                  <div className="text-[10px] text-slate-500">1 TH HS1, 1 LT HS2</div>
                </button>

                <button
                  type="button"
                  onClick={() => handleApplyPreset(3.5)}
                  className="p-2 bg-white hover:bg-orange-50 border border-slate-200 hover:border-orange-300 rounded-lg text-xs font-semibold text-slate-800 transition text-center"
                >
                  <div className="font-bold text-orange-600">3.5 Tín chỉ</div>
                  <div className="text-[10px] text-slate-500">2 TH HS1, 1 LT HS2</div>
                </button>
              </div>
            </div>

            {/* Danh sách các cột điểm hiện có */}
            <div className="space-y-2">
              <span className="text-xs font-bold text-slate-700 block uppercase">
                Danh sách cột điểm hiện tại ({activeGradeConfigs.length} cột):
              </span>
              <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                {activeGradeConfigs.map((col, idx) => (
                  <div key={col.id} className="flex items-center gap-2 p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs">
                    <span className="w-6 text-center font-bold text-slate-400">{idx + 1}</span>
                    <input
                      type="text"
                      value={col.name}
                      onChange={(e) => handleUpdateGradeColumn(col.id, e.target.value, col.weight)}
                      className="flex-1 p-1.5 bg-white border border-slate-300 rounded-lg font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                    <select
                      value={col.weight}
                      onChange={(e) => handleUpdateGradeColumn(col.id, col.name, Number(e.target.value))}
                      className="p-1.5 bg-white border border-slate-300 rounded-lg font-bold text-orange-700 focus:outline-none focus:ring-2 focus:ring-orange-500"
                    >
                      <option value={1}>Hệ số 1</option>
                      <option value={2}>Hệ số 2</option>
                      <option value={3}>Hệ số 3</option>
                    </select>
                    <button
                      onClick={() => handleDeleteGradeColumn(col.id)}
                      className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg transition"
                      title="Xóa cột điểm này"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Thêm cột điểm mới */}
            <div className="p-3.5 bg-orange-50/70 border border-orange-200 rounded-xl space-y-2.5">
              <span className="text-xs font-bold text-orange-900 block uppercase">
                + Thêm cột điểm kiểm tra mới:
              </span>
              <div className="flex flex-wrap items-center gap-2">
                <input
                  type="text"
                  placeholder="Tên bài KT (VD: Bài KT 15 phút, KT Giữa kỳ...)"
                  value={newColName}
                  onChange={(e) => setNewColName(e.target.value)}
                  className="flex-1 min-w-[180px] p-2 bg-white border border-orange-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
                <select
                  value={newColWeight}
                  onChange={(e) => setNewColWeight(Number(e.target.value))}
                  className="p-2 bg-white border border-orange-200 rounded-xl text-xs font-bold text-orange-700"
                >
                  <option value={1}>Hệ số 1</option>
                  <option value={2}>Hệ số 2</option>
                  <option value={3}>Hệ số 3</option>
                </select>
                <select
                  value={newColType}
                  onChange={(e) => setNewColType(e.target.value as any)}
                  className="p-2 bg-white border border-orange-200 rounded-xl text-xs font-semibold text-slate-700"
                >
                  <option value="Lý thuyết">Lý thuyết</option>
                  <option value="Thực hành">Thực hành</option>
                  <option value="Chung">Chung</option>
                </select>
                <button
                  type="button"
                  onClick={() => handleAddGradeColumn(newColName, newColWeight, newColType)}
                  className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs rounded-xl shadow-xs transition flex items-center gap-1"
                >
                  <Plus className="w-4 h-4" />
                  <span>Thêm cột</span>
                </button>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex justify-end">
              <button
                type="button"
                onClick={() => setIsConfigModalOpen(false)}
                className="px-5 py-2.5 bg-slate-900 text-white font-bold text-xs rounded-xl hover:bg-slate-800 transition"
              >
                Đóng & Áp dụng
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Modal Nhập điểm từ File (Excel, Word, PDF) */}
      {isImportModalOpen && currentSubject && currentClass && (
        <ImportGradesModal
          isOpen={isImportModalOpen}
          onClose={() => setIsImportModalOpen(false)}
          subject={{
            ...currentSubject,
            gradeConfigs: activeGradeConfigs
          }}
          classGroup={currentClass}
          students={students}
          currentGrades={(grades[currentSubject.id] || {}) as any}
          onApplyGrades={handleApplyImportedGrades}
        />
      )}

    </div>
  );
};
