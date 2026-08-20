import React, { useState } from 'react';
import { 
  FileSpreadsheet, 
  FileText, 
  Printer, 
  Download, 
  Search, 
  Filter, 
  BookOpen, 
  Users, 
  AlertTriangle, 
  CheckCircle2, 
  XCircle,
  Calendar,
  Layers,
  Sparkles
} from 'lucide-react';
import { 
  Student, 
  ClassGroup, 
  Subject, 
  AttendanceRecord, 
  MakeupRecord, 
  StudentGrade 
} from '../types';
import { evaluateStudentSubjectStatus, formatScore } from '../utils/calculations';
import { exportStudentsToExcel, exportGradesToExcel, exportToWordDoc } from '../utils/exportImport';

interface ReportsViewProps {
  students: Student[];
  classes: ClassGroup[];
  subjects: Subject[];
  grades: Record<string, Record<string, Record<string, number | null>>>;
  attendanceRecords: AttendanceRecord[];
  makeupRecords: MakeupRecord[];
  onSelectStudentProfile: (studentId: string) => void;
}

export const ReportsView: React.FC<ReportsViewProps> = ({
  students,
  classes,
  subjects,
  grades,
  attendanceRecords,
  makeupRecords,
  onSelectStudentProfile
}) => {
  const [reportType, setReportType] = useState<'disqualified' | 'studentList' | 'attendance' | 'makeup'>('disqualified');
  const [selectedClassId, setSelectedClassId] = useState<string>(classes[0]?.id || 'all');
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>(subjects[0]?.id || 'all');
  const [selectedMonth, setSelectedMonth] = useState<string>('all');

  const currentClass = classes.find(c => c.id === selectedClassId);
  const currentSubject = subjects.find(s => s.id === selectedSubjectId);

  // Tính danh sách KĐĐKDT trên toàn hệ thống hoặc theo môn
  const disqualifiedEntries: {
    student: Student;
    subject: Subject;
    classGroup?: ClassGroup;
    eval: StudentGrade;
  }[] = [];

  subjects.forEach(sub => {
    if (selectedSubjectId !== 'all' && sub.id !== selectedSubjectId) return;
    if (selectedClassId !== 'all' && sub.classId !== selectedClassId) return;

    const subClass = classes.find(c => c.id === sub.classId);
    const subStudents = students.filter(s => s.classId === sub.classId);

    subStudents.forEach(st => {
      const stScores = grades[sub.id]?.[st.id] || {};
      const evalRes = evaluateStudentSubjectStatus(st, sub, stScores, attendanceRecords, makeupRecords);
      if (evalRes.isDisqualified) {
        disqualifiedEntries.push({
          student: st,
          subject: sub,
          classGroup: subClass,
          eval: evalRes
        });
      }
    });
  });

  // Xuất Báo cáo KĐĐKDT ra Word
  const handleExportDisqualifiedWord = () => {
    const content = `
      <div class="header-box">
        <h3>DANH SÁCH SINH VIÊN KHÔNG ĐỦ ĐIỀU KIỆN DỰ THI (KĐĐKDT)</h3>
        <p><strong>Ngày xuất báo cáo:</strong> ${new Date().toLocaleDateString('vi-VN')}</p>
        <p><strong>Phạm vi:</strong> ${selectedClassId === 'all' ? 'Tất cả các lớp' : currentClass?.name} | ${selectedSubjectId === 'all' ? 'Tất cả các môn' : currentSubject?.name}</p>
      </div>

      <table>
        <thead>
          <tr>
            <th>STT</th>
            <th>Mã SV</th>
            <th>Họ và Tên</th>
            <th>Lớp</th>
            <th>Môn học</th>
            <th>Số TC</th>
            <th>ĐTB</th>
            <th>Vắng LT</th>
            <th>Vắng TH</th>
            <th>Lý do không đủ điều kiện</th>
          </tr>
        </thead>
        <tbody>
          ${disqualifiedEntries.map((item, idx) => `
            <tr>
              <td class="center">${idx + 1}</td>
              <td class="center"><strong>${item.student.studentCode}</strong></td>
              <td>${item.student.fullName}</td>
              <td class="center">${item.student.className}</td>
              <td><strong>${item.subject.name}</strong></td>
              <td class="center">${item.subject.credits}</td>
              <td class="center text-red"><strong>${formatScore(item.eval.averageScore)}</strong></td>
              <td class="center">${item.eval.totalAbsencePeriods}t</td>
              <td class="center">${item.eval.totalAbsencePracticeLessons}b</td>
              <td class="text-red">${item.eval.disqualificationReasons.join('; ')}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>

      <table class="signature-box">
        <tr>
          <td>
            <p><strong>Tổng số sinh viên KĐĐKDT:</strong> ${disqualifiedEntries.length} lượt</p>
          </td>
          <td>
            <p><em>Ngày ..... tháng ..... năm 2026</em></p>
            <p><strong>CỐ VẤN HỌC TẬP / GIÁO VIÊN</strong></p>
            <br/><br/><br/>
            <p><strong>Ngọc Lê</strong></p>
          </td>
        </tr>
      </table>
    `;

    exportToWordDoc(`Danh_Sach_KDDKDT_${new Date().toISOString().split('T')[0]}`, content);
  };

  return (
    <div className="space-y-6">
      
      {/* Selector Loại Báo cáo */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setReportType('disqualified')}
            className={`px-4 py-2 text-xs font-bold rounded-xl transition flex items-center gap-2 ${
              reportType === 'disqualified'
                ? 'bg-gradient-to-r from-red-600 to-orange-600 text-white shadow-md'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <AlertTriangle className="w-4 h-4" />
            <span>1. Danh sách SV Không đủ ĐKDT (KĐĐKDT)</span>
            <span className="px-1.5 py-0.2 bg-white/20 text-white rounded-full text-[10px] font-black">
              {disqualifiedEntries.length}
            </span>
          </button>

          <button
            onClick={() => setReportType('studentList')}
            className={`px-4 py-2 text-xs font-bold rounded-xl transition flex items-center gap-2 ${
              reportType === 'studentList'
                ? 'bg-gradient-to-r from-red-600 to-orange-600 text-white shadow-md'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>2. Báo cáo Danh sách Sinh viên theo Lớp/Tổ</span>
          </button>

          <button
            onClick={() => setReportType('attendance')}
            className={`px-4 py-2 text-xs font-bold rounded-xl transition flex items-center gap-2 ${
              reportType === 'attendance'
                ? 'bg-gradient-to-r from-red-600 to-orange-600 text-white shadow-md'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <Calendar className="w-4 h-4" />
            <span>3. Báo cáo Tổng hợp Vắng học</span>
          </button>
        </div>

        {/* Nút Xuất Báo cáo */}
        <div className="flex items-center gap-2">
          {reportType === 'disqualified' && (
            <button
              onClick={handleExportDisqualifiedWord}
              className="px-3.5 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs rounded-xl border border-indigo-200 transition flex items-center gap-1.5 shadow-2xs"
            >
              <FileText className="w-4 h-4 text-indigo-600" />
              <span>Xuất Báo cáo Word</span>
            </button>
          )}

          <button
            onClick={() => window.print()}
            className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition flex items-center gap-1.5 shadow-2xs"
          >
            <Printer className="w-4 h-4" />
            <span>In Bản PDF</span>
          </button>
        </div>
      </div>

      {/* Bộ Lọc (Filter Bar) */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex flex-wrap items-center gap-3 text-xs">
        <span className="font-bold text-slate-700 uppercase flex items-center gap-1">
          <Filter className="w-3.5 h-3.5 text-orange-600" /> Bộ lọc báo cáo:
        </span>

        {/* Chọn lớp */}
        <select
          value={selectedClassId}
          onChange={(e) => setSelectedClassId(e.target.value)}
          className="p-2 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-700"
        >
          <option value="all">Tất cả Lớp học</option>
          {classes.map(c => (
            <option key={c.id} value={c.id}>{c.name} ({c.cohort})</option>
          ))}
        </select>

        {/* Chọn môn */}
        <select
          value={selectedSubjectId}
          onChange={(e) => setSelectedSubjectId(e.target.value)}
          className="p-2 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-700"
        >
          <option value="all">Tất cả Môn học</option>
          {subjects.map(s => (
            <option key={s.id} value={s.id}>{s.name} ({s.credits} TC)</option>
          ))}
        </select>
      </div>

      {/* 1. BÁO CÁO KĐĐKDT */}
      {reportType === 'disqualified' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden space-y-4">
          <div className="p-4 bg-red-50/70 border-b border-red-200 flex items-center justify-between">
            <div className="flex items-center gap-2 text-red-900 font-bold text-sm">
              <AlertTriangle className="w-5 h-5 text-red-600" />
              <span>
                Danh sách Sinh viên Không đủ Điều kiện Dự thi (KĐĐKDT) ({disqualifiedEntries.length} trường hợp)
              </span>
            </div>
            <span className="text-xs text-red-700 font-semibold">
              Quy chế: ĐTB &lt; 5.0 | Vắng quá tiết LT | Vắng bài TH chưa học bù
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-100 text-slate-700 font-bold uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="p-3 w-10 text-center">STT</th>
                  <th className="p-3">Mã SV</th>
                  <th className="p-3">Họ và Tên</th>
                  <th className="p-3">Lớp học</th>
                  <th className="p-3">Môn học</th>
                  <th className="p-3 text-center">Tín chỉ</th>
                  <th className="p-3 text-center">ĐTB kiểm tra</th>
                  <th className="p-3 text-center">Vắng LT</th>
                  <th className="p-3 text-center">Vắng TH</th>
                  <th className="p-3">Lý do cụ thể KĐĐKDT</th>
                  <th className="p-3 text-center">Xem hồ sơ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {disqualifiedEntries.length > 0 ? (
                  disqualifiedEntries.map((item, idx) => (
                    <tr key={`${item.student.id}-${item.subject.id}`} className="hover:bg-red-50/40">
                      <td className="p-3 text-center font-medium text-slate-400">{idx + 1}</td>
                      <td className="p-3 font-mono font-bold text-orange-700">{item.student.studentCode}</td>
                      <td className="p-3 font-bold text-slate-900">{item.student.fullName}</td>
                      <td className="p-3 font-semibold text-slate-700">{item.student.className}</td>
                      <td className="p-3 font-bold text-slate-800">{item.subject.name}</td>
                      <td className="p-3 text-center font-semibold">{item.subject.credits}</td>
                      <td className="p-3 text-center font-black text-red-600">
                        {formatScore(item.eval.averageScore)}
                      </td>
                      <td className="p-3 text-center font-bold text-slate-700">{item.eval.totalAbsencePeriods}t</td>
                      <td className="p-3 text-center font-bold text-slate-700">{item.eval.totalAbsencePracticeLessons}b</td>
                      <td className="p-3 text-red-700 font-semibold text-xs">
                        {item.eval.disqualificationReasons.join('; ')}
                      </td>
                      <td className="p-3 text-center">
                        <button
                          onClick={() => onSelectStudentProfile(item.student.id)}
                          className="px-2.5 py-1 bg-orange-50 hover:bg-orange-100 text-orange-700 font-bold text-[11px] rounded-lg transition"
                        >
                          Chi tiết
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={11} className="p-8 text-center text-slate-400">
                      Không có sinh viên nào rơi vào diện KĐĐKDT theo tiêu chí đã chọn!
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 2. BÁO CÁO DANH SÁCH LỚP / TỔ */}
      {reportType === 'studentList' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-200 flex items-center justify-between">
            <h3 className="font-bold text-slate-800 text-sm">
              Danh sách Sinh viên theo Lớp & Tổ ({students.filter(s => selectedClassId === 'all' || s.classId === selectedClassId).length} SV)
            </h3>
            <button
              onClick={() => {
                const filtered = students.filter(s => selectedClassId === 'all' || s.classId === selectedClassId);
                exportStudentsToExcel(filtered, currentClass?.name || 'Tat_ca_lop');
              }}
              className="px-3.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold text-xs rounded-xl border border-emerald-200 transition flex items-center gap-1.5"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
              <span>Xuất danh sách Excel</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-100 text-slate-700 font-bold uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="p-3 w-10 text-center">STT</th>
                  <th className="p-3">Mã SV</th>
                  <th className="p-3">Họ và Tên</th>
                  <th className="p-3">Lớp</th>
                  <th className="p-3 text-center">Năm sinh</th>
                  <th className="p-3 text-center">Giới tính</th>
                  <th className="p-3">SĐT Sinh viên</th>
                  <th className="p-3">Chức vụ cán bộ</th>
                  <th className="p-3 text-center">Tổ thực hành</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {students
                  .filter(s => selectedClassId === 'all' || s.classId === selectedClassId)
                  .map((s, idx) => (
                    <tr key={s.id} className="hover:bg-slate-50">
                      <td className="p-3 text-center text-slate-400">{idx + 1}</td>
                      <td className="p-3 font-mono font-bold text-orange-700">{s.studentCode}</td>
                      <td className="p-3 font-bold text-slate-900">
                        <button
                          onClick={() => onSelectStudentProfile(s.id)}
                          className="hover:underline hover:text-orange-600"
                        >
                          {s.fullName}
                        </button>
                      </td>
                      <td className="p-3 font-semibold text-slate-700">{s.className}</td>
                      <td className="p-3 text-center">{s.birthYear}</td>
                      <td className="p-3 text-center">{s.gender}</td>
                      <td className="p-3 font-mono">{s.phone || '-'}</td>
                      <td className="p-3 font-semibold text-orange-800">{s.role}</td>
                      <td className="p-3 text-center font-bold text-blue-700">{s.team || 'Tổ 1'}</td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 3. BÁO CÁO TỔNG HỢP VẮNG HỌC */}
      {reportType === 'attendance' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-200">
            <h3 className="font-bold text-slate-800 text-sm">
              Tổng hợp lịch sử điểm danh & tình hình vắng học
            </h3>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-100 text-slate-700 font-bold uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="p-3 w-10 text-center">STT</th>
                  <th className="p-3">Ngày</th>
                  <th className="p-3">Mã SV</th>
                  <th className="p-3">Họ và Tên SV</th>
                  <th className="p-3">Môn học</th>
                  <th className="p-3">Buổi / Bài học</th>
                  <th className="p-3 text-center">Trạng thái</th>
                  <th className="p-3 text-center">Số tiết vắng</th>
                  <th className="p-3">Lý do</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {attendanceRecords
                  .filter(r => r.status === 'Vắng có phép' || r.status === 'Vắng không phép')
                  .map((r, i) => (
                    <tr key={r.id} className="hover:bg-slate-50">
                      <td className="p-3 text-center text-slate-400">{i + 1}</td>
                      <td className="p-3 font-mono font-bold text-slate-800">{r.date}</td>
                      <td className="p-3 font-mono font-bold text-orange-700">{r.studentCode}</td>
                      <td className="p-3 font-bold text-slate-900">{r.studentName}</td>
                      <td className="p-3 font-medium text-slate-700">
                        {subjects.find(s => s.id === r.subjectId)?.name || 'Môn học'}
                      </td>
                      <td className="p-3 text-slate-600">{r.lessonName}</td>
                      <td className="p-3 text-center">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          r.status === 'Vắng có phép' ? 'bg-amber-100 text-amber-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {r.status}
                        </span>
                      </td>
                      <td className="p-3 text-center font-bold text-red-600">{r.missedPeriods}</td>
                      <td className="p-3 text-slate-600 italic">{r.reason || 'Không phép'}</td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

    </div>
  );
};
