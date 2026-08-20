import React, { useState } from 'react';
import { 
  Calendar, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  AlertTriangle, 
  Plus, 
  Trash2, 
  Search, 
  Filter, 
  Sparkles, 
  ArrowRight, 
  Layers, 
  Users, 
  Building, 
  FileSpreadsheet, 
  CheckCheck,
  History,
  Repeat,
  Info
} from 'lucide-react';
import { 
  Student, 
  ClassGroup, 
  Subject, 
  AttendanceRecord, 
  MakeupRecord, 
  AttendanceStatus,
  PracticeTeam 
} from '../types';

interface AttendanceViewProps {
  students: Student[];
  classes: ClassGroup[];
  subjects: Subject[];
  attendanceRecords: AttendanceRecord[];
  makeupRecords: MakeupRecord[];
  onSaveAttendance: (records: AttendanceRecord[]) => void;
  onSaveMakeups: (records: MakeupRecord[]) => void;
  onSelectStudentProfile: (studentId: string) => void;
}

export const AttendanceView: React.FC<AttendanceViewProps> = ({
  students,
  classes,
  subjects,
  attendanceRecords,
  makeupRecords,
  onSaveAttendance,
  onSaveMakeups,
  onSelectStudentProfile
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'take' | 'history' | 'makeup'>('take');

  // Take Attendance State
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [selectedClassId, setSelectedClassId] = useState<string>(classes[0]?.id || '');
  const classSubjects = subjects.filter(s => s.classId === selectedClassId);
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>(classSubjects[0]?.id || '');
  
  const currentSubject = subjects.find(s => s.id === selectedSubjectId) || classSubjects[0];
  const [selectedLessonId, setSelectedLessonId] = useState<string>(
    currentSubject?.lessons[0]?.id || ''
  );
  const currentLesson = currentSubject?.lessons.find(l => l.id === selectedLessonId) || currentSubject?.lessons[0];
  const [selectedTeam, setSelectedTeam] = useState<'Cả lớp' | 'Tổ 1' | 'Tổ 2'>(
    (currentLesson?.teamAssignment as any) || 'Cả lớp'
  );

  // Student Attendance Form State (temp rows)
  const currentClass = classes.find(c => c.id === selectedClassId) || classes[0];
  const eligibleStudents = students.filter(s => {
    if (s.classId !== selectedClassId) return false;
    if (selectedTeam === 'Cả lớp') return true;
    return s.team === selectedTeam;
  });

  const [sessionStatuses, setSessionStatuses] = useState<Record<string, {
    status: AttendanceStatus;
    missedPeriods: number;
    reason: string;
  }>>({});

  const [saveSuccessMessage, setSaveSuccessMessage] = useState('');

  // History Filter State
  const [historySearch, setHistorySearch] = useState('');
  const [historySubjectFilter, setHistorySubjectFilter] = useState('all');
  const [historyMonthFilter, setHistoryMonthFilter] = useState('all');
  const [historyYearFilter, setHistoryYearFilter] = useState('all');

  // Make-up Form Modal
  const [showMakeupModal, setShowMakeupModal] = useState(false);
  const [mkStudentId, setMkStudentId] = useState(students[0]?.id || '');
  const [mkSubjectId, setMkSubjectId] = useState(subjects[0]?.id || '');
  const [mkLessonName, setMkLessonName] = useState('');
  const [mkLessonType, setMkLessonType] = useState<'Lý thuyết' | 'Thực hành'>('Thực hành');
  const [mkAttendedClassId, setMkAttendedClassId] = useState(classes[0]?.id || '');
  const [mkAttendedTeam, setMkAttendedTeam] = useState<PracticeTeam | 'Cả lớp'>('Tổ 2');
  const [mkDate, setMkDate] = useState(new Date().toISOString().split('T')[0]);
  const [mkPeriods, setMkPeriods] = useState<number>(1);
  const [mkNotes, setMkNotes] = useState('');

  // Initialize or get status for a student
  const getStudentSessionStatus = (studentId: string) => {
    if (sessionStatuses[studentId]) return sessionStatuses[studentId];
    
    // Check if record exists for this date, subject, student
    const existing = attendanceRecords.find(
      r => r.date === selectedDate && r.subjectId === selectedSubjectId && r.studentId === studentId
    );

    if (existing) {
      return {
        status: existing.status,
        missedPeriods: existing.missedPeriods,
        reason: existing.reason || ''
      };
    }

    return {
      status: 'Có mặt' as AttendanceStatus,
      missedPeriods: 0,
      reason: ''
    };
  };

  const handleUpdateStudentStatus = (
    studentId: string, 
    status: AttendanceStatus, 
    missedPeriods?: number, 
    reason?: string
  ) => {
    const current = getStudentSessionStatus(studentId);
    const defaultPeriods = status === 'Có mặt' ? 0 : (currentLesson?.type === 'Thực hành' ? 1 : (currentLesson?.periods || 4));

    setSessionStatuses({
      ...sessionStatuses,
      [studentId]: {
        status,
        missedPeriods: missedPeriods !== undefined ? missedPeriods : defaultPeriods,
        reason: reason !== undefined ? reason : current.reason
      }
    });
  };

  const handleSetAllPresent = () => {
    const updated: Record<string, any> = {};
    eligibleStudents.forEach(s => {
      updated[s.id] = {
        status: 'Có mặt',
        missedPeriods: 0,
        reason: ''
      };
    });
    setSessionStatuses(updated);
  };

  const handleSaveAttendanceRecords = () => {
    if (!currentSubject) return;

    const newRecords: AttendanceRecord[] = eligibleStudents.map(s => {
      const state = getStudentSessionStatus(s.id);
      return {
        id: `att-${Date.now()}-${s.id}`,
        date: selectedDate,
        subjectId: currentSubject.id,
        classId: selectedClassId,
        lessonId: currentLesson?.id,
        lessonName: currentLesson?.name || 'Buổi học',
        lessonType: currentLesson?.type || 'Lý thuyết',
        team: selectedTeam,
        studentId: s.id,
        studentCode: s.studentCode,
        studentName: s.fullName,
        status: state.status,
        missedPeriods: state.missedPeriods,
        reason: state.reason
      };
    });

    // Replace old records on same date & subject for these students
    const filteredOld = attendanceRecords.filter(
      r => !(r.date === selectedDate && r.subjectId === currentSubject.id && eligibleStudents.some(s => s.id === r.studentId))
    );

    onSaveAttendance([...filteredOld, ...newRecords]);
    setSaveSuccessMessage(`Đã lưu điểm danh ngày ${selectedDate} cho ${eligibleStudents.length} sinh viên!`);
    setTimeout(() => setSaveSuccessMessage(''), 4000);
  };

  // Add Makeup record
  const handleAddMakeup = (e: React.FormEvent) => {
    e.preventDefault();
    const student = students.find(s => s.id === mkStudentId);
    const subject = subjects.find(s => s.id === mkSubjectId);
    const attendedClass = classes.find(c => c.id === mkAttendedClassId);

    if (!student || !subject || !attendedClass) return;

    const newMakeup: MakeupRecord = {
      id: `mk-${Date.now()}`,
      studentId: student.id,
      studentCode: student.studentCode,
      studentName: student.fullName,
      originalClassId: student.classId,
      originalClassName: student.className,
      subjectId: subject.id,
      subjectName: subject.name,
      lessonName: mkLessonName.trim() || 'Bài học bù',
      lessonType: mkLessonType,
      attendedClassId: attendedClass.id,
      attendedClassName: `${attendedClass.name} (${mkAttendedTeam})`,
      attendedTeam: mkAttendedTeam,
      makeupDate: mkDate,
      makeupPeriods: Number(mkPeriods),
      notes: mkNotes.trim(),
      verifiedByTeacher: true
    };

    onSaveMakeups([...makeupRecords, newMakeup]);
    setShowMakeupModal(false);
    setMkNotes('');
  };

  const handleDeleteMakeup = (makeupId: string) => {
    if (confirm('Bạn có chắc chắn muốn xóa bản ghi học bù này?')) {
      onSaveMakeups(makeupRecords.filter(m => m.id !== makeupId));
    }
  };

  // Lọc lịch sử vắng
  const absenceRecords = attendanceRecords.filter(
    r => r.status === 'Vắng có phép' || r.status === 'Vắng không phép'
  );

  const filteredAbsences = absenceRecords.filter(r => {
    const matchesSearch = 
      r.studentName.toLowerCase().includes(historySearch.toLowerCase()) ||
      r.studentCode.toLowerCase().includes(historySearch.toLowerCase());
    const matchesSubject = historySubjectFilter === 'all' || r.subjectId === historySubjectFilter;
    
    const [year, month] = r.date.split('-');
    const matchesYear = historyYearFilter === 'all' || year === historyYearFilter;
    const matchesMonth = historyMonthFilter === 'all' || month === historyMonthFilter;

    return matchesSearch && matchesSubject && matchesYear && matchesMonth;
  });

  return (
    <div className="space-y-6">
      
      {/* Sub Tabs Navigation */}
      <div className="bg-white rounded-2xl p-2 border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-2">
          <button
            onClick={() => setActiveSubTab('take')}
            className={`px-4 py-2 text-xs font-bold rounded-xl transition flex items-center gap-2 ${
              activeSubTab === 'take'
                ? 'bg-gradient-to-r from-red-600 to-orange-600 text-white shadow-md'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <Calendar className="w-4 h-4" />
            <span>1. Điểm danh buổi học</span>
          </button>

          <button
            onClick={() => setActiveSubTab('history')}
            className={`px-4 py-2 text-xs font-bold rounded-xl transition flex items-center gap-2 ${
              activeSubTab === 'history'
                ? 'bg-gradient-to-r from-red-600 to-orange-600 text-white shadow-md'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <History className="w-4 h-4" />
            <span>2. Tra cứu Vắng theo Ngày/Tháng/Năm</span>
            <span className="px-1.5 py-0.2 bg-red-100 text-red-700 rounded-full text-[10px] font-black">
              {absenceRecords.length}
            </span>
          </button>

          <button
            onClick={() => setActiveSubTab('makeup')}
            className={`px-4 py-2 text-xs font-bold rounded-xl transition flex items-center gap-2 ${
              activeSubTab === 'makeup'
                ? 'bg-gradient-to-r from-red-600 to-orange-600 text-white shadow-md'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <Repeat className="w-4 h-4 text-emerald-300" />
            <span>3. Quản lý Học bù & Trừ vắng</span>
            <span className="px-1.5 py-0.2 bg-emerald-100 text-emerald-800 rounded-full text-[10px] font-black">
              {makeupRecords.length}
            </span>
          </button>
        </div>

        {activeSubTab === 'makeup' && (
          <button
            onClick={() => setShowMakeupModal(true)}
            className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md transition flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>Ghi nhận Học bù mới</span>
          </button>
        )}
      </div>

      {/* TAB 1: Điểm danh buổi học */}
      {activeSubTab === 'take' && (
        <div className="space-y-6">
          
          {/* Controls chọn Ngày, Lớp, Môn, Bài học, Tổ */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
              
              {/* Ngày học */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1 flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-orange-600" />
                  Ngày học *
                </label>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:bg-white focus:ring-2 focus:ring-orange-500"
                />
              </div>

              {/* Chọn Lớp */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1 flex items-center gap-1">
                  <Building className="w-3.5 h-3.5 text-red-600" />
                  Lớp học *
                </label>
                <select
                  value={selectedClassId}
                  onChange={(e) => {
                    setSelectedClassId(e.target.value);
                    const subList = subjects.filter(s => s.classId === e.target.value);
                    if (subList.length > 0) {
                      setSelectedSubjectId(subList[0].id);
                      if (subList[0].lessons.length > 0) {
                        setSelectedLessonId(subList[0].lessons[0].id);
                      }
                    }
                  }}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:bg-white focus:ring-2 focus:ring-orange-500"
                >
                  {classes.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              {/* Chọn Môn */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Môn học *
                </label>
                <select
                  value={selectedSubjectId}
                  onChange={(e) => {
                    setSelectedSubjectId(e.target.value);
                    const sub = subjects.find(s => s.id === e.target.value);
                    if (sub && sub.lessons.length > 0) {
                      setSelectedLessonId(sub.lessons[0].id);
                    }
                  }}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:bg-white focus:ring-2 focus:ring-orange-500"
                >
                  {classSubjects.map(s => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.credits} TC)
                    </option>
                  ))}
                </select>
              </div>

              {/* Chọn Bài học */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Bài học / Buổi học
                </label>
                <select
                  value={selectedLessonId}
                  onChange={(e) => {
                    setSelectedLessonId(e.target.value);
                    const l = currentSubject?.lessons.find(item => item.id === e.target.value);
                    if (l && l.teamAssignment) {
                      setSelectedTeam(l.teamAssignment as any);
                    }
                  }}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:ring-2 focus:ring-orange-500"
                >
                  {currentSubject?.lessons.map(l => (
                    <option key={l.id} value={l.id}>
                      [{l.type === 'Lý thuyết' ? 'LT' : 'TH'}] {l.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Phân Tổ */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Đối tượng điểm danh
                </label>
                <select
                  value={selectedTeam}
                  onChange={(e) => setSelectedTeam(e.target.value as any)}
                  className="w-full p-2 bg-blue-50 border border-blue-200 text-blue-900 rounded-xl text-xs font-bold focus:bg-white focus:ring-2 focus:ring-blue-500"
                >
                  <option value="Cả lớp">Cả lớp ({students.filter(s => s.classId === selectedClassId).length} SV)</option>
                  <option value="Tổ 1">Tổ 1 ({students.filter(s => s.classId === selectedClassId && s.team === 'Tổ 1').length} SV)</option>
                  <option value="Tổ 2">Tổ 2 ({students.filter(s => s.classId === selectedClassId && s.team === 'Tổ 2').length} SV)</option>
                </select>
              </div>

            </div>

            {/* Notification & Rules Info */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100 text-xs">
              <div className="flex items-center gap-2 text-slate-600">
                <Info className="w-4 h-4 text-orange-600" />
                <span>
                  Đang điểm danh: <strong>{currentSubject?.name}</strong> •{' '}
                  <span className="text-orange-700 font-semibold">{currentLesson?.name}</span> •{' '}
                  <span className="font-bold text-blue-700">{selectedTeam}</span> ({eligibleStudents.length} SV)
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleSetAllPresent}
                  className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold text-xs rounded-xl border border-emerald-200 transition flex items-center gap-1"
                >
                  <CheckCheck className="w-3.5 h-3.5" />
                  <span>Tất cả có mặt</span>
                </button>

                <button
                  type="button"
                  onClick={handleSaveAttendanceRecords}
                  className="px-5 py-1.5 bg-gradient-to-r from-red-600 to-orange-500 hover:from-red-700 hover:to-orange-600 text-white font-bold text-xs rounded-xl shadow-md transition flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Lưu kết quả điểm danh</span>
                </button>
              </div>
            </div>

            {saveSuccessMessage && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs font-bold flex items-center gap-2 animate-in fade-in">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{saveSuccessMessage}</span>
              </div>
            )}

          </div>

          {/* Bảng Sinh viên cần điểm danh */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-700">
                <thead className="bg-slate-100 text-slate-700 font-bold uppercase tracking-wider text-[11px]">
                  <tr>
                    <th className="p-3 w-12 text-center">STT</th>
                    <th className="p-3">Mã SV</th>
                    <th className="p-3">Họ và Tên Sinh viên</th>
                    <th className="p-3 text-center">Cán bộ</th>
                    <th className="p-3 text-center">Tổ</th>
                    <th className="p-3 text-center">Trạng thái điểm danh</th>
                    <th className="p-3 text-center w-28">Số tiết/bài vắng</th>
                    <th className="p-3">Lý do vắng / Ghi chú</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {eligibleStudents.length > 0 ? (
                    eligibleStudents.map((s, idx) => {
                      const session = getStudentSessionStatus(s.id);
                      const isAbsent = session.status === 'Vắng có phép' || session.status === 'Vắng không phép';

                      return (
                        <tr key={s.id} className={`hover:bg-slate-50 transition ${isAbsent ? 'bg-red-50/40' : ''}`}>
                          <td className="p-3 text-center text-slate-400 font-medium">{idx + 1}</td>
                          <td className="p-3 font-mono font-bold text-orange-700">{s.studentCode}</td>
                          <td className="p-3 font-bold text-slate-900">
                            <button
                              onClick={() => onSelectStudentProfile(s.id)}
                              className="hover:underline hover:text-orange-600"
                            >
                              {s.fullName}
                            </button>
                          </td>
                          <td className="p-3 text-center">
                            <span className="text-slate-600 text-[11px] font-medium">{s.role}</span>
                          </td>
                          <td className="p-3 text-center">
                            <span className="px-2 py-0.5 bg-slate-100 rounded text-[10px] font-bold text-slate-700">
                              {s.team || 'Tổ 1'}
                            </span>
                          </td>
                          <td className="p-3 text-center">
                            <div className="inline-flex rounded-xl p-1 bg-slate-100 gap-1">
                              <button
                                type="button"
                                onClick={() => handleUpdateStudentStatus(s.id, 'Có mặt', 0)}
                                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition ${
                                  session.status === 'Có mặt'
                                    ? 'bg-emerald-600 text-white shadow-2xs'
                                    : 'text-slate-600 hover:text-emerald-700'
                                }`}
                              >
                                Có mặt
                              </button>
                              <button
                                type="button"
                                onClick={() => handleUpdateStudentStatus(s.id, 'Vắng có phép')}
                                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition ${
                                  session.status === 'Vắng có phép'
                                    ? 'bg-amber-500 text-white shadow-2xs'
                                    : 'text-slate-600 hover:text-amber-700'
                                }`}
                              >
                                Có phép
                              </button>
                              <button
                                type="button"
                                onClick={() => handleUpdateStudentStatus(s.id, 'Vắng không phép')}
                                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition ${
                                  session.status === 'Vắng không phép'
                                    ? 'bg-red-600 text-white shadow-2xs'
                                    : 'text-slate-600 hover:text-red-700'
                                }`}
                              >
                                Không phép
                              </button>
                              <button
                                type="button"
                                onClick={() => handleUpdateStudentStatus(s.id, 'Học bù', 0)}
                                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition ${
                                  session.status === 'Học bù'
                                    ? 'bg-blue-600 text-white shadow-2xs'
                                    : 'text-slate-600 hover:text-blue-700'
                                }`}
                              >
                                Học bù
                              </button>
                            </div>
                          </td>
                          <td className="p-3 text-center">
                            {isAbsent ? (
                              <input
                                type="number"
                                min={1}
                                max={10}
                                value={session.missedPeriods}
                                onChange={(e) => handleUpdateStudentStatus(s.id, session.status, Number(e.target.value))}
                                className="w-16 p-1 text-center bg-white border border-red-300 text-red-700 font-bold rounded-lg"
                              />
                            ) : (
                              <span className="text-slate-400">-</span>
                            )}
                          </td>
                          <td className="p-3">
                            {isAbsent ? (
                              <input
                                type="text"
                                value={session.reason}
                                onChange={(e) => handleUpdateStudentStatus(s.id, session.status, undefined, e.target.value)}
                                placeholder="Ghi rõ lý do vắng..."
                                className="w-full p-1.5 bg-white border border-slate-300 rounded-lg text-xs"
                              />
                            ) : (
                              <span className="text-slate-400 text-xs">-</span>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={8} className="p-8 text-center text-slate-400">
                        Không có sinh viên nào thuộc đối tượng điểm danh đã chọn.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="p-3 bg-slate-50 border-t border-slate-200 flex justify-end">
              <button
                type="button"
                onClick={handleSaveAttendanceRecords}
                className="px-6 py-2 bg-gradient-to-r from-red-600 to-orange-500 hover:from-red-700 hover:to-orange-600 text-white font-bold text-xs rounded-xl shadow-md transition flex items-center gap-1.5"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Lưu kết quả điểm danh</span>
              </button>
            </div>

          </div>

        </div>
      )}

      {/* TAB 2: Tra cứu Vắng theo Ngày/Tháng/Năm */}
      {activeSubTab === 'history' && (
        <div className="space-y-4">
          
          {/* Filter Bar */}
          <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2.5 flex-1 min-w-[280px]">
              
              <div className="relative flex-1 max-w-xs">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={historySearch}
                  onChange={(e) => setHistorySearch(e.target.value)}
                  placeholder="Tìm SV vắng, Mã SV..."
                  className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                />
              </div>

              {/* Lọc theo môn */}
              <select
                value={historySubjectFilter}
                onChange={(e) => setHistorySubjectFilter(e.target.value)}
                className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs"
              >
                <option value="all">Tất cả môn học</option>
                {subjects.map(s => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>

              {/* Lọc theo Năm */}
              <select
                value={historyYearFilter}
                onChange={(e) => setHistoryYearFilter(e.target.value)}
                className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs"
              >
                <option value="all">Tất cả năm</option>
                <option value="2026">Năm 2026</option>
                <option value="2025">Năm 2025</option>
              </select>

              {/* Lọc theo Tháng */}
              <select
                value={historyMonthFilter}
                onChange={(e) => setHistoryMonthFilter(e.target.value)}
                className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs"
              >
                <option value="all">Tất cả tháng</option>
                <option value="01">Tháng 1</option>
                <option value="02">Tháng 2</option>
                <option value="03">Tháng 3</option>
                <option value="04">Tháng 4</option>
                <option value="05">Tháng 5</option>
                <option value="06">Tháng 6</option>
                <option value="07">Tháng 7</option>
                <option value="08">Tháng 8</option>
                <option value="09">Tháng 9</option>
                <option value="10">Tháng 10</option>
                <option value="11">Tháng 11</option>
                <option value="12">Tháng 12</option>
              </select>

            </div>

            <span className="text-xs text-slate-500 font-medium">
              Tìm thấy <strong>{filteredAbsences.length}</strong> lượt vắng
            </span>
          </div>

          {/* Bảng Chi tiết vắng */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-700">
                <thead className="bg-slate-100 text-slate-700 font-bold uppercase tracking-wider text-[11px]">
                  <tr>
                    <th className="p-3 w-12 text-center">STT</th>
                    <th className="p-3">Ngày / Tháng / Năm</th>
                    <th className="p-3">Mã SV</th>
                    <th className="p-3">Họ và Tên Sinh viên</th>
                    <th className="p-3">Môn học</th>
                    <th className="p-3">Bài học / Buổi</th>
                    <th className="p-3 text-center">Hình thức vắng</th>
                    <th className="p-3 text-center">Số tiết vắng</th>
                    <th className="p-3">Lý do</th>
                    <th className="p-3 text-center">Tình trạng học bù</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {filteredAbsences.length > 0 ? (
                    filteredAbsences.map((att, i) => {
                      const subject = subjects.find(s => s.id === att.subjectId);
                      // Check if made up
                      const hasMadeUp = makeupRecords.some(
                        m => m.studentId === att.studentId && m.subjectId === att.subjectId
                      );

                      return (
                        <tr key={att.id} className="hover:bg-slate-50">
                          <td className="p-3 text-center text-slate-400">{i + 1}</td>
                          <td className="p-3 font-mono font-bold text-slate-800">
                            {att.date}
                          </td>
                          <td className="p-3 font-mono font-bold text-orange-700">
                            {att.studentCode}
                          </td>
                          <td className="p-3 font-bold text-slate-900">
                            <button
                              onClick={() => onSelectStudentProfile(att.studentId)}
                              className="hover:underline hover:text-orange-600"
                            >
                              {att.studentName}
                            </button>
                          </td>
                          <td className="p-3 font-medium text-slate-700">
                            {subject?.name || 'Môn học'}
                          </td>
                          <td className="p-3 text-slate-600">
                            {att.lessonName}
                          </td>
                          <td className="p-3 text-center">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              att.status === 'Vắng có phép'
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-red-100 text-red-800'
                            }`}>
                              {att.status}
                            </span>
                          </td>
                          <td className="p-3 text-center font-black text-red-600">
                            {att.missedPeriods} {att.lessonType === 'Thực hành' ? 'bài' : 'tiết'}
                          </td>
                          <td className="p-3 text-slate-600 italic">
                            {att.reason || 'Không ghi chú'}
                          </td>
                          <td className="p-3 text-center">
                            {hasMadeUp ? (
                              <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-full text-[10px] font-bold">
                                ✓ Đã học bù (được trừ)
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded-full text-[10px]">
                                Chưa học bù
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={10} className="p-8 text-center text-slate-400">
                        Không có dữ liệu vắng nào phù hợp bộ lọc.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      )}

      {/* TAB 3: Quản lý Học bù & Trừ vắng */}
      {activeSubTab === 'makeup' && (
        <div className="space-y-4">
          
          <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs text-slate-700 space-y-1.5">
            <div className="flex items-center gap-2 font-bold text-emerald-900 text-sm">
              <Sparkles className="w-4 h-4 text-emerald-600" />
              <span>Quy chế Học bù liên lớp & Tự động khấu trừ số tiết vắng</span>
            </div>
            <p>
              • <strong>Lý thuyết:</strong> Khi sinh viên tham gia học bù cùng lớp hoặc lớp khác, số tiết học bù sẽ <strong>tự động trừ trực tiếp</strong> vào tổng số tiết vắng lý thuyết của môn đó.
            </p>
            <p>
              • <strong>Thực hành:</strong> Sinh viên vắng 1 bài thực hành nếu hoàn thành học bù tại lớp/tổ khác và được Giáo viên xác nhận sẽ <strong>xóa bỏ trạng thái KĐĐKDT thực hành</strong>.
            </p>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-4 border-b border-slate-200 flex items-center justify-between">
              <h3 className="font-bold text-slate-800 text-sm">
                Danh sách các buổi Học bù đã được xác nhận ({makeupRecords.length})
              </h3>
              <button
                onClick={() => setShowMakeupModal(true)}
                className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md transition flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4" />
                <span>Thêm buổi học bù</span>
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-700">
                <thead className="bg-slate-100 text-slate-700 font-bold uppercase tracking-wider text-[11px]">
                  <tr>
                    <th className="p-3 w-12 text-center">STT</th>
                    <th className="p-3">Mã SV</th>
                    <th className="p-3">Họ và Tên SV</th>
                    <th className="p-3">Lớp gốc</th>
                    <th className="p-3">Môn học</th>
                    <th className="p-3">Nội dung bài học bù</th>
                    <th className="p-3">Lớp / Tổ tham gia học bù</th>
                    <th className="p-3 text-center">Ngày học bù</th>
                    <th className="p-3 text-center">Số tiết/bài được trừ</th>
                    <th className="p-3">Ghi chú xác nhận</th>
                    <th className="p-3 text-center w-12">Xóa</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {makeupRecords.length > 0 ? (
                    makeupRecords.map((mk, idx) => (
                      <tr key={mk.id} className="hover:bg-emerald-50/40">
                        <td className="p-3 text-center text-slate-400">{idx + 1}</td>
                        <td className="p-3 font-mono font-bold text-orange-700">{mk.studentCode}</td>
                        <td className="p-3 font-bold text-slate-900">
                          <button
                            onClick={() => onSelectStudentProfile(mk.studentId)}
                            className="hover:underline hover:text-orange-600"
                          >
                            {mk.studentName}
                          </button>
                        </td>
                        <td className="p-3 text-slate-600 font-semibold">{mk.originalClassName}</td>
                        <td className="p-3 font-medium text-slate-800">{mk.subjectName}</td>
                        <td className="p-3 text-slate-700">
                          <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold mr-1 ${
                            mk.lessonType === 'Thực hành' ? 'bg-blue-100 text-blue-800' : 'bg-amber-100 text-amber-800'
                          }`}>
                            {mk.lessonType}
                          </span>
                          {mk.lessonName}
                        </td>
                        <td className="p-3 text-blue-700 font-bold">
                          {mk.attendedClassName}
                        </td>
                        <td className="p-3 text-center font-mono font-bold text-slate-800">
                          {mk.makeupDate}
                        </td>
                        <td className="p-3 text-center font-bold text-emerald-700">
                          -{mk.makeupPeriods} {mk.lessonType === 'Thực hành' ? 'bài' : 'tiết'}
                        </td>
                        <td className="p-3 text-slate-600 italic text-[11px]">
                          {mk.notes || 'Đã kiểm tra đạt yêu cầu'}
                        </td>
                        <td className="p-3 text-center">
                          <button
                            onClick={() => handleDeleteMakeup(mk.id)}
                            className="p-1 text-slate-400 hover:text-red-600 rounded"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={11} className="p-8 text-center text-slate-400">
                        Chưa có lượt học bù nào được ghi nhận. Bấm "Ghi nhận Học bù mới" để thêm.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

          </div>

        </div>
      )}

      {/* Modal Thêm Học bù */}
      {showMakeupModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="w-full max-w-xl bg-white rounded-2xl shadow-2xl p-6 border border-slate-100 max-h-[85vh] overflow-y-auto">
            <h3 className="text-lg font-bold text-slate-900 mb-1">
              Ghi nhận buổi Học bù cho Sinh viên
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Ghi chú rõ ở ngày học của lớp SV tham gia học bù và tự động trừ số tiết/bài vắng của SV
            </p>

            <form onSubmit={handleAddMakeup} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                
                {/* Chọn Sinh viên */}
                <div className="col-span-2">
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Sinh viên cần học bù *
                  </label>
                  <select
                    value={mkStudentId}
                    onChange={(e) => setMkStudentId(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold focus:bg-white focus:ring-2 focus:ring-orange-500"
                  >
                    {students.map(s => (
                      <option key={s.id} value={s.id}>
                        {s.studentCode} - {s.fullName} ({s.className} - {s.team})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Chọn Môn học */}
                <div className="col-span-2">
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Môn học cần học bù *
                  </label>
                  <select
                    value={mkSubjectId}
                    onChange={(e) => setMkSubjectId(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold focus:bg-white focus:ring-2 focus:ring-orange-500"
                  >
                    {subjects.map(s => (
                      <option key={s.id} value={s.id}>{s.name} ({s.credits} TC)</option>
                    ))}
                  </select>
                </div>

                {/* Tên bài học */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Tên bài học cần bù *
                  </label>
                  <input
                    type="text"
                    required
                    value={mkLessonName}
                    onChange={(e) => setMkLessonName(e.target.value)}
                    placeholder="VD: Bài TH 1, Bài 2..."
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-orange-500"
                  />
                </div>

                {/* Loại bài */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Loại bài học
                  </label>
                  <select
                    value={mkLessonType}
                    onChange={(e) => setMkLessonType(e.target.value as any)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-blue-700 focus:bg-white focus:ring-2 focus:ring-orange-500"
                  >
                    <option value="Thực hành">Thực hành (TH)</option>
                    <option value="Lý thuyết">Lý thuyết (LT)</option>
                  </select>
                </div>

                {/* Lớp SV tham gia học bù */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Lớp SV tham gia học bù *
                  </label>
                  <select
                    value={mkAttendedClassId}
                    onChange={(e) => setMkAttendedClassId(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-orange-500 font-semibold"
                  >
                    {classes.map(c => (
                      <option key={c.id} value={c.id}>{c.name} ({c.majorName})</option>
                    ))}
                  </select>
                </div>

                {/* Tổ tham gia học bù */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Tổ ghép học bù
                  </label>
                  <select
                    value={mkAttendedTeam}
                    onChange={(e) => setMkAttendedTeam(e.target.value as any)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-orange-500"
                  >
                    <option value="Tổ 1">Tổ 1</option>
                    <option value="Tổ 2">Tổ 2</option>
                    <option value="Cả lớp">Cả lớp</option>
                  </select>
                </div>

                {/* Ngày học bù */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Ngày đi học bù *
                  </label>
                  <input
                    type="date"
                    required
                    value={mkDate}
                    onChange={(e) => setMkDate(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-orange-500 font-bold"
                  />
                </div>

                {/* Số tiết/bài được trừ */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Số tiết / bài được trừ *
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={10}
                    value={mkPeriods}
                    onChange={(e) => setMkPeriods(Number(e.target.value))}
                    className="w-full p-2.5 bg-emerald-50 border border-emerald-200 text-emerald-800 font-bold rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                {/* Ghi chú */}
                <div className="col-span-2">
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Ghi chú đánh giá của GV
                  </label>
                  <input
                    type="text"
                    value={mkNotes}
                    onChange={(e) => setMkNotes(e.target.value)}
                    placeholder="VD: Đã làm bài test bù đạt yêu cầu, thao tác chuẩn..."
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-orange-500"
                  />
                </div>

              </div>

              <div className="pt-3 flex justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowMakeupModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md"
                >
                  Xác nhận Học bù & Khấu trừ vắng
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
