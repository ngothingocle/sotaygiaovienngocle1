import React, { useState } from 'react';
import { 
  User, 
  Search, 
  Award, 
  Calendar, 
  Phone, 
  Mail, 
  Layers, 
  BookOpen, 
  Printer, 
  FileText, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  Clock, 
  Repeat, 
  Building, 
  ArrowLeft,
  GraduationCap
} from 'lucide-react';
import { 
  Student, 
  Subject, 
  ClassGroup, 
  AttendanceRecord, 
  MakeupRecord, 
  StudentGrade 
} from '../types';
import { evaluateStudentSubjectStatus, formatScore } from '../utils/calculations';
import { exportToWordDoc } from '../utils/exportImport';

interface StudentProfileViewProps {
  students: Student[];
  classes: ClassGroup[];
  subjects: Subject[];
  grades: Record<string, Record<string, Record<string, number | null>>>;
  attendanceRecords: AttendanceRecord[];
  makeupRecords: MakeupRecord[];
  selectedStudentId?: string | null;
  onBack?: () => void;
}

export const StudentProfileView: React.FC<StudentProfileViewProps> = ({
  students,
  classes,
  subjects,
  grades,
  attendanceRecords,
  makeupRecords,
  selectedStudentId,
  onBack
}) => {
  const [activeStudentId, setActiveStudentId] = useState<string>(
    selectedStudentId || students[0]?.id || ''
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [filterClassId, setFilterClassId] = useState('all');

  const currentStudent = students.find(s => s.id === activeStudentId) || students[0];
  const studentClass = classes.find(c => c.id === currentStudent?.classId);

  // Lọc các môn học của lớp sinh viên này
  const studentSubjects = subjects.filter(s => s.classId === currentStudent?.classId);

  // Đánh giá tất cả môn học của sinh viên
  const subjectEvaluations: { subject: Subject; eval: StudentGrade }[] = currentStudent ? studentSubjects.map(sub => {
    const studentScores = grades[sub.id]?.[currentStudent.id] || {};
    const evalResult = evaluateStudentSubjectStatus(
      currentStudent,
      sub,
      studentScores,
      attendanceRecords,
      makeupRecords
    );
    return { subject: sub, eval: evalResult };
  }) : [];

  // Lịch sử vắng của sinh viên này
  const studentAbsences = attendanceRecords.filter(
    r => r.studentId === currentStudent?.id && (r.status === 'Vắng có phép' || r.status === 'Vắng không phép')
  );

  // Lịch sử học bù của sinh viên này
  const studentMakeups = makeupRecords.filter(
    m => m.studentId === currentStudent?.id
  );

  // Lọc danh sách sinh viên bên trái
  const filteredStudentsList = students.filter(s => {
    const matchesSearch = 
      s.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.studentCode.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesClass = filterClassId === 'all' || s.classId === filterClassId;
    return matchesSearch && matchesClass;
  });

  // Xuất hồ sơ ra file Word (.doc)
  const handleExportWord = () => {
    if (!currentStudent || !studentClass) return;

    const content = `
      <div class="header-box">
        <h2>PHIẾU THÔNG TIN & KẾT QUẢ HỌC TẬP SINH VIÊN</h2>
        <p><strong>Trường:</strong> ${studentClass?.homeroomTeacher?.department || 'Khoa Y - Dược'} | <strong>Niên khóa:</strong> ${studentClass?.academicYear || '2024 - 2028'}</p>
      </div>

      <table style="margin-bottom: 20px;">
        <tr>
          <td style="width: 50%;"><strong>Họ và tên:</strong> ${currentStudent.fullName}</td>
          <td style="width: 50%;"><strong>Mã Sinh viên:</strong> ${currentStudent.studentCode}</td>
        </tr>
        <tr>
          <td><strong>Lớp:</strong> ${currentStudent.className} (${studentClass?.cohort || ''})</td>
          <td><strong>Ngành đào tạo:</strong> ${studentClass?.majorName || ''}</td>
        </tr>
        <tr>
          <td><strong>Năm sinh:</strong> ${currentStudent.birthYear} | <strong>Giới tính:</strong> ${currentStudent.gender}</td>
          <td><strong>Số điện thoại:</strong> ${currentStudent.phone || 'Chưa cập nhật'}</td>
        </tr>
        <tr>
          <td><strong>Chức vụ cán bộ:</strong> ${currentStudent.role}</td>
          <td><strong>Tổ thực hành:</strong> ${currentStudent.team || 'Tổ 1'}</td>
        </tr>
        <tr>
          <td colspan="2"><strong>Giáo viên chủ nhiệm:</strong> ${studentClass?.homeroomTeacher?.fullName || 'Cô Ngọc Lê'} (${studentClass?.homeroomTeacher?.phone || '0948090287'})</td>
        </tr>
      </table>

      <h3>KẾT QUẢ CÁC MÔN HỌC & ĐIỀU KIỆN DỰ THI</h3>
      <table>
        <thead>
          <tr>
            <th>Môn học</th>
            <th>Tín chỉ</th>
            <th>Điểm TB</th>
            <th>Vắng LT</th>
            <th>Vắng TH</th>
            <th>Học bù</th>
            <th>Xét ĐKDT</th>
            <th>Chi tiết / Lý do</th>
          </tr>
        </thead>
        <tbody>
          ${subjectEvaluations.map(({ subject, eval: res }) => `
            <tr>
              <td><strong>${subject.name}</strong></td>
              <td class="center">${subject.credits}</td>
              <td class="center"><strong>${formatScore(res.averageScore)}</strong></td>
              <td class="center">${res.totalAbsencePeriods} tiết</td>
              <td class="center">${res.totalAbsencePracticeLessons} bài</td>
              <td class="center">${res.makeupCount} lần</td>
              <td class="center ${res.isDisqualified ? 'text-red' : 'text-green'}">
                <strong>${res.isDisqualified ? 'KĐĐKDT' : 'Đủ ĐKDT'}</strong>
              </td>
              <td style="font-size: 10pt;">${res.disqualificationReasons.join('; ') || 'Đủ điều kiện'}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>

      <h3>LỊCH SỬ VẮNG HỌC & HỌC BÙ</h3>
      <table>
        <thead>
          <tr>
            <th>Ngày / Tháng / Năm</th>
            <th>Môn học</th>
            <th>Buổi / Bài</th>
            <th>Hình thức vắng</th>
            <th>Số tiết</th>
            <th>Lý do</th>
          </tr>
        </thead>
        <tbody>
          ${studentAbsences.map(att => `
            <tr>
              <td class="center">${att.date}</td>
              <td>${subjects.find(s => s.id === att.subjectId)?.name || 'Môn học'}</td>
              <td>${att.lessonName}</td>
              <td class="center">${att.status}</td>
              <td class="center">${att.missedPeriods}</td>
              <td>${att.reason || 'Không phép'}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>

      <table class="signature-box">
        <tr>
          <td>
            <p><strong>SINH VIÊN</strong></p>
            <br/><br/><br/>
            <p>${currentStudent.fullName}</p>
          </td>
          <td>
            <p><em>Ngày ..... tháng ..... năm 2026</em></p>
            <p><strong>CỐ VẤN HỌC TẬP / GVCN</strong></p>
            <br/><br/><br/>
            <p><strong>${studentClass?.homeroomTeacher?.fullName || 'Cô Ngọc Lê'}</strong></p>
          </td>
        </tr>
      </table>
    `;

    exportToWordDoc(`Ho_So_SV_${currentStudent.studentCode}_${currentStudent.fullName.replace(/\s+/g, '_')}`, content);
  };

  const handlePrint = () => {
    window.print();
  };

  if (!currentStudent) {
    return (
      <div className="p-12 text-center bg-white rounded-2xl border border-slate-200 text-slate-400">
        Chưa có dữ liệu sinh viên.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      
      {/* Grid: Danh sách sinh viên bên trái & Thẻ trích xuất hồ sơ chi tiết bên phải */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Cột 1: Danh sách Sinh viên để chọn */}
        <div className="space-y-3 lg:col-span-1">
          
          <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <Search className="w-3.5 h-3.5 text-orange-600" />
                Tra cứu Sinh viên ({filteredStudentsList.length})
              </h3>
              {onBack && (
                <button
                  onClick={onBack}
                  className="text-xs text-slate-500 hover:text-slate-800 flex items-center gap-1 font-semibold"
                >
                  <ArrowLeft className="w-3.5 h-3.5" /> Quay lại
                </button>
              )}
            </div>

            {/* Ô tìm kiếm */}
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Nhập tên SV, Mã SV..."
              className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:ring-2 focus:ring-orange-500"
            />

            {/* Lọc theo lớp */}
            <select
              value={filterClassId}
              onChange={(e) => setFilterClassId(e.target.value)}
              className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700"
            >
              <option value="all">Tất cả lớp học</option>
              {classes.map(c => (
                <option key={c.id} value={c.id}>{c.name} ({c.cohort})</option>
              ))}
            </select>
          </div>

          {/* List SV */}
          <div className="space-y-2 max-h-[650px] overflow-y-auto pr-1">
            {filteredStudentsList.map(s => {
              const isSelected = s.id === currentStudent.id;
              return (
                <div
                  key={s.id}
                  onClick={() => setActiveStudentId(s.id)}
                  className={`p-3 rounded-2xl border transition cursor-pointer text-left flex items-center justify-between ${
                    isSelected
                      ? 'bg-orange-500 text-white border-orange-600 shadow-md ring-2 ring-orange-400/30'
                      : 'bg-white border-slate-200 hover:bg-slate-50 shadow-2xs'
                  }`}
                >
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className={`font-mono text-xs font-bold ${isSelected ? 'text-orange-100' : 'text-orange-700'}`}>
                        {s.studentCode}
                      </span>
                      <span className={`text-[10px] px-1.5 py-0.2 rounded font-bold ${
                        isSelected ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-700'
                      }`}>
                        {s.className}
                      </span>
                    </div>
                    <h4 className={`text-sm font-bold leading-tight ${isSelected ? 'text-white' : 'text-slate-900'}`}>
                      {s.fullName}
                    </h4>
                  </div>

                  <div className="text-right text-[11px]">
                    <span className={`block font-semibold ${isSelected ? 'text-orange-100' : 'text-slate-600'}`}>
                      {s.role}
                    </span>
                    <span className={`text-[10px] ${isSelected ? 'text-white/80' : 'text-slate-400'}`}>
                      {s.team || 'Tổ 1'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

        </div>

        {/* Cột 2 & 3: Thẻ Trích xuất Hồ sơ Chi tiết */}
        <div className="lg:col-span-2 space-y-6">
          
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-6">
            
            {/* Header Thẻ Sinh viên & Nút In / Xuất Word */}
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-5">
              
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-red-600 via-orange-500 to-amber-500 flex items-center justify-center text-white font-black text-xl shadow-md">
                  {currentStudent.gender === 'Nữ' ? '👩‍🎓' : '👨‍🎓'}
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono text-sm font-black px-2.5 py-0.5 bg-orange-100 text-orange-800 rounded-lg">
                      {currentStudent.studentCode}
                    </span>
                    <span className="px-2.5 py-0.5 bg-amber-100 text-amber-900 text-xs font-bold rounded-lg">
                      {currentStudent.role}
                    </span>
                    <span className="px-2.5 py-0.5 bg-blue-100 text-blue-800 text-xs font-bold rounded-lg">
                      {currentStudent.team || 'Tổ 1'}
                    </span>
                  </div>
                  <h3 className="text-2xl font-black text-slate-900 mt-1">
                    {currentStudent.fullName}
                  </h3>
                  <p className="text-xs text-slate-500">
                    Lớp <strong>{currentStudent.className}</strong> • Khóa: {studentClass?.cohort} • Ngành: {studentClass?.majorName}
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2">
                <button
                  onClick={handleExportWord}
                  className="px-3.5 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs rounded-xl border border-indigo-200 transition flex items-center gap-1.5 shadow-2xs"
                >
                  <FileText className="w-4 h-4 text-indigo-600" />
                  <span>Xuất Phiếu Word</span>
                </button>
                <button
                  onClick={handlePrint}
                  className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition flex items-center gap-1.5 shadow-2xs"
                >
                  <Printer className="w-4 h-4" />
                  <span>In Hồ sơ / PDF</span>
                </button>
              </div>

            </div>

            {/* Thông tin Hành chính & Liên hệ */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 bg-slate-50/70 rounded-2xl border border-slate-200/80 text-xs">
              <div>
                <span className="text-slate-400 block text-[11px]">Năm sinh:</span>
                <span className="font-bold text-slate-800 text-sm">{currentStudent.birthYear}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">Giới tính:</span>
                <span className="font-bold text-slate-800 text-sm">{currentStudent.gender}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">Số điện thoại:</span>
                <span className="font-bold text-slate-800 text-sm font-mono">{currentStudent.phone || 'Chưa có'}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">GVCN phụ trách:</span>
                <span className="font-bold text-orange-700 text-sm">{studentClass?.homeroomTeacher?.fullName || 'Cô Ngọc Lê'}</span>
              </div>
            </div>

            {/* Bảng Kết quả Tổng hợp các Môn học & Xét ĐKDT */}
            <div className="space-y-3">
              <h4 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-orange-600" />
                Bảng điểm tổng hợp các môn học & Điều kiện dự thi ({subjectEvaluations.length} môn)
              </h4>

              <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-2xs">
                <table className="w-full text-left text-xs text-slate-700">
                  <thead className="bg-slate-100 text-slate-700 font-bold uppercase tracking-wider text-[11px]">
                    <tr>
                      <th className="p-3">Môn học</th>
                      <th className="p-3 text-center">Tín chỉ</th>
                      <th className="p-3 text-center bg-orange-100/60 text-orange-900">Điểm TB môn</th>
                      <th className="p-3 text-center">Vắng LT</th>
                      <th className="p-3 text-center">Vắng TH</th>
                      <th className="p-3 text-center">Học bù</th>
                      <th className="p-3 text-center">Xét ĐKDT</th>
                      <th className="p-3">Lý do KĐĐKDT</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {subjectEvaluations.map(({ subject, eval: res }) => (
                      <tr key={subject.id} className="hover:bg-slate-50">
                        <td className="p-3 font-bold text-slate-900">
                          {subject.name}
                        </td>
                        <td className="p-3 text-center">
                          <span className="px-2 py-0.5 bg-slate-100 rounded text-[10px] font-bold">
                            {subject.credits} TC
                          </span>
                        </td>
                        <td className="p-3 text-center font-black text-sm bg-orange-50/50">
                          {res.averageScore !== null ? (
                            <span className={res.averageScore < 5.0 ? 'text-red-600' : 'text-slate-900'}>
                              {formatScore(res.averageScore)}
                            </span>
                          ) : '-'}
                        </td>
                        <td className="p-3 text-center font-semibold">
                          {res.totalAbsencePeriods} tiết
                        </td>
                        <td className="p-3 text-center font-semibold">
                          {res.totalAbsencePracticeLessons} bài
                        </td>
                        <td className="p-3 text-center">
                          {res.makeupCount > 0 ? (
                            <span className="text-emerald-700 font-bold">{res.makeupCount} lần</span>
                          ) : '-'}
                        </td>
                        <td className="p-3 text-center">
                          {res.isDisqualified ? (
                            <span className="px-2.5 py-1 rounded-full text-xs font-black bg-red-100 text-red-700 border border-red-300 inline-flex items-center gap-1">
                              <XCircle className="w-3.5 h-3.5" /> KĐĐKDT
                            </span>
                          ) : (
                            <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 inline-flex items-center gap-1">
                              <CheckCircle2 className="w-3.5 h-3.5" /> Đủ ĐKDT
                            </span>
                          )}
                        </td>
                        <td className="p-3 text-xs text-red-600 font-medium">
                          {res.disqualificationReasons.join('; ') || (
                            <span className="text-emerald-700">Đủ điều kiện</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Chi tiết Lịch sử Vắng học & Lịch sử Học bù của SV */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              
              {/* Lịch sử vắng */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
                <div className="flex items-center justify-between">
                  <h5 className="font-bold text-slate-800 text-xs uppercase tracking-wide flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-red-600" />
                    Lịch sử vắng học ({studentAbsences.length} buổi)
                  </h5>
                </div>

                {studentAbsences.length > 0 ? (
                  <div className="space-y-2 max-h-44 overflow-y-auto">
                    {studentAbsences.map(att => (
                      <div key={att.id} className="p-2.5 bg-white rounded-xl border border-slate-200 text-xs space-y-1">
                        <div className="flex items-center justify-between font-semibold">
                          <span className="text-slate-800">{att.date}</span>
                          <span className={`px-1.5 py-0.2 rounded text-[10px] ${
                            att.status === 'Vắng có phép' ? 'bg-amber-100 text-amber-800' : 'bg-red-100 text-red-800'
                          }`}>
                            {att.status} ({att.missedPeriods} {att.lessonType === 'Thực hành' ? 'bài' : 'tiết'})
                          </span>
                        </div>
                        <p className="text-slate-600 text-[11px]">{att.lessonName}</p>
                        {att.reason && <p className="text-slate-400 text-[10px] italic">Lý do: {att.reason}</p>}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-400 italic">Sinh viên chưa từng vắng buổi học nào.</p>
                )}
              </div>

              {/* Lịch sử học bù */}
              <div className="p-4 bg-emerald-50/50 border border-emerald-200 rounded-2xl space-y-3">
                <div className="flex items-center justify-between">
                  <h5 className="font-bold text-emerald-900 text-xs uppercase tracking-wide flex items-center gap-1.5">
                    <Repeat className="w-3.5 h-3.5 text-emerald-600" />
                    Lịch sử tham gia học bù ({studentMakeups.length} buổi)
                  </h5>
                </div>

                {studentMakeups.length > 0 ? (
                  <div className="space-y-2 max-h-44 overflow-y-auto">
                    {studentMakeups.map(mk => (
                      <div key={mk.id} className="p-2.5 bg-white rounded-xl border border-emerald-200 text-xs space-y-1">
                        <div className="flex items-center justify-between font-semibold">
                          <span className="text-slate-800">{mk.makeupDate}</span>
                          <span className="px-1.5 py-0.2 bg-emerald-100 text-emerald-800 rounded text-[10px] font-bold">
                            Đã trừ {mk.makeupPeriods} {mk.lessonType === 'Thực hành' ? 'bài' : 'tiết'}
                          </span>
                        </div>
                        <p className="text-slate-700 text-[11px]">Học bù tại: <strong>{mk.attendedClassName}</strong></p>
                        <p className="text-slate-500 text-[10px]">{mk.lessonName}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-400 italic">Chưa có lượt học bù nào.</p>
                )}
              </div>

            </div>

          </div>

        </div>

      </div>

    </div>
  );
};
