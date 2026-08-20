import React, { useState } from 'react';
import { 
  Header 
} from './components/Header';
import { 
  ClassesView 
} from './components/ClassesView';
import { 
  SubjectsView 
} from './components/SubjectsView';
import { 
  AttendanceView 
} from './components/AttendanceView';
import { 
  GradesView 
} from './components/GradesView';
import { 
  StudentProfileView 
} from './components/StudentProfileView';
import { 
  ReportsView 
} from './components/ReportsView';
import { 
  AuthModal 
} from './components/AuthModal';
import { 
  StudentModal 
} from './components/StudentModal';
import { 
  ImportModal 
} from './components/ImportModal';
import { 
  Student, 
  ClassGroup, 
  Subject, 
  AttendanceRecord, 
  MakeupRecord, 
  TeacherAccount,
  Major 
} from './types';
import { storageService } from './services/storage';
import { evaluateStudentSubjectStatus } from './utils/calculations';
import { 
  RotateCcw
} from 'lucide-react';

export default function App() {
  // Authentication State
  const [teacherAccount, setTeacherAccount] = useState<TeacherAccount>(storageService.getTeacherAccount());
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(storageService.isLoggedIn());
  const [showAuthModal, setShowAuthModal] = useState<boolean>(false);

  // Active Navigation Tab
  const [activeTab, setActiveTab] = useState<string>('classes');

  // Application Data States
  const [students, setStudents] = useState<Student[]>(storageService.getStudents());
  const [classes, setClasses] = useState<ClassGroup[]>(storageService.getClasses());
  const [majors, setMajors] = useState<Major[]>(storageService.getMajors());
  const [subjects, setSubjects] = useState<Subject[]>(storageService.getSubjects());
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>(storageService.getAttendance());
  const [makeupRecords, setMakeupRecords] = useState<MakeupRecord[]>(storageService.getMakeups());
  const [grades, setGrades] = useState<Record<string, Record<string, Record<string, number | null>>>>(storageService.getGrades());

  // Student Profile Selected Id
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);

  // Student Modal (Add/Edit)
  const [studentModalOpen, setStudentModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [defaultClassIdForNewStudent, setDefaultClassIdForNewStudent] = useState<string>(classes[0]?.id || '');

  // Import Modal
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [importTargetClassId, setImportTargetClassId] = useState<string>(classes[0]?.id || '');

  // Sync Majors
  const handleSaveMajors = (updatedMajors: Major[]) => {
    setMajors(updatedMajors);
    storageService.saveMajors(updatedMajors);
  };

  // Sync Students
  const handleSaveStudents = (updatedStudents: Student[]) => {
    setStudents(updatedStudents);
    storageService.saveStudents(updatedStudents);
  };

  // Sync Classes
  const handleSaveClasses = (updatedClasses: ClassGroup[]) => {
    setClasses(updatedClasses);
    storageService.saveClasses(updatedClasses);
  };

  // Sync Subjects
  const handleSaveSubjects = (updatedSubjects: Subject[]) => {
    setSubjects(updatedSubjects);
    storageService.saveSubjects(updatedSubjects);
  };

  // Sync Attendance
  const handleSaveAttendance = (updatedRecords: AttendanceRecord[]) => {
    setAttendanceRecords(updatedRecords);
    storageService.saveAttendance(updatedRecords);
  };

  // Sync Makeups
  const handleSaveMakeups = (updatedMakeups: MakeupRecord[]) => {
    setMakeupRecords(updatedMakeups);
    storageService.saveMakeups(updatedMakeups);
  };

  // Sync Grades
  const handleSaveGrades = (updatedGrades: Record<string, Record<string, Record<string, number | null>>>) => {
    setGrades(updatedGrades);
    storageService.saveGrades(updatedGrades);
  };

  // Login handler
  const handleLoginSuccess = () => {
    storageService.setLoggedIn(true);
    setIsLoggedIn(true);
    setShowAuthModal(false);
  };

  // Logout handler
  const handleLogout = () => {
    storageService.setLoggedIn(false);
    setIsLoggedIn(false);
    setShowAuthModal(true);
  };

  // Navigate to Student Profile view
  const handleSelectStudentProfile = (studentId: string) => {
    setSelectedStudentId(studentId);
    setActiveTab('profile');
  };

  // Open Student Modal for adding
  const handleOpenAddStudent = (classId?: string) => {
    setEditingStudent(null);
    if (classId) setDefaultClassIdForNewStudent(classId);
    setStudentModalOpen(true);
  };

  // Open Student Modal for editing
  const handleOpenEditStudent = (student: Student) => {
    setEditingStudent(student);
    setStudentModalOpen(true);
  };

  // Save single student (add or edit)
  const handleSaveSingleStudent = (studentData: Partial<Student>) => {
    const targetClass = classes.find(c => c.id === studentData.classId) || classes[0];
    if (editingStudent) {
      const updated = students.map(s => {
        if (s.id === editingStudent.id) {
          return {
            ...s,
            ...studentData,
            className: targetClass?.name || s.className
          } as Student;
        }
        return s;
      });
      handleSaveStudents(updated);
    } else {
      const newStudent: Student = {
        id: `st-${Date.now()}`,
        studentCode: studentData.studentCode || `SV${Date.now().toString().slice(-4)}`,
        fullName: studentData.fullName || 'Sinh viên mới',
        classId: targetClass?.id || classes[0]?.id || '',
        className: targetClass?.name || 'Lớp mới',
        birthYear: studentData.birthYear || 2004,
        gender: studentData.gender || 'Nam',
        phone: studentData.phone || '',
        role: studentData.role || 'Sinh viên',
        team: studentData.team || 'Tổ 1',
        email: studentData.email,
        notes: studentData.notes
      };
      handleSaveStudents([...students, newStudent]);
    }
    setStudentModalOpen(false);
  };

  // Open Import Modal
  const handleOpenImport = (classId: string) => {
    setImportTargetClassId(classId);
    setImportModalOpen(true);
  };

  // Import batch students
  const handleImportStudents = (imported: Partial<Student>[]) => {
    const targetClass = classes.find(c => c.id === importTargetClassId) || classes[0];
    const newStudents: Student[] = imported.map((st, i) => ({
      id: `st-${Date.now()}-${i}`,
      studentCode: st.studentCode || `SV${Date.now().toString().slice(-4)}${i}`,
      fullName: st.fullName || 'Sinh viên',
      classId: targetClass?.id || '',
      className: targetClass?.name || '',
      birthYear: st.birthYear || 2004,
      gender: st.gender || 'Nam',
      phone: st.phone || '',
      role: st.role || 'Sinh viên',
      team: st.team || 'Tổ 1',
      email: st.email,
      notes: st.notes
    }));

    handleSaveStudents([...students, ...newStudents]);
    setImportModalOpen(false);
  };

  // Reset sample data
  const handleResetSampleData = () => {
    if (confirm('Bạn có muốn khôi phục lại toàn bộ dữ liệu mẫu ban đầu của ứng dụng?')) {
      storageService.resetToSample();
      setTeacherAccount(storageService.getTeacherAccount());
      setStudents(storageService.getStudents());
      setClasses(storageService.getClasses());
      setSubjects(storageService.getSubjects());
      setAttendanceRecords(storageService.getAttendance());
      setMakeupRecords(storageService.getMakeups());
      setGrades(storageService.getGrades());
      alert('Đã khôi phục dữ liệu mẫu thành công!');
    }
  };

  const currentImportClass = classes.find(c => c.id === importTargetClassId) || classes[0];

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 flex flex-col font-sans selection:bg-orange-500 selection:text-white">
      
      {/* Top Header Navigation */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        teacherAccount={teacherAccount}
        isLoggedIn={isLoggedIn}
        onOpenAuthModal={() => setShowAuthModal(true)}
        onLogout={handleLogout}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
        
        {/* Render View theo Tab */}
        {activeTab === 'classes' && (
          <ClassesView
            students={students}
            classes={classes}
            majors={majors}
            teacherAccount={teacherAccount}
            onSaveMajors={handleSaveMajors}
            onSaveStudents={handleSaveStudents}
            onSaveClasses={handleSaveClasses}
            onSelectStudentProfile={handleSelectStudentProfile}
          />
        )}

        {activeTab === 'subjects' && (
          <SubjectsView
            subjects={subjects}
            classes={classes}
            onSaveSubjects={handleSaveSubjects}
          />
        )}

        {activeTab === 'attendance' && (
          <AttendanceView
            students={students}
            classes={classes}
            subjects={subjects}
            attendanceRecords={attendanceRecords}
            makeupRecords={makeupRecords}
            onSaveAttendance={handleSaveAttendance}
            onSaveMakeups={handleSaveMakeups}
            onSelectStudentProfile={handleSelectStudentProfile}
          />
        )}

        {activeTab === 'grades' && (
          <GradesView
            subjects={subjects}
            classes={classes}
            students={students}
            grades={grades}
            attendanceRecords={attendanceRecords}
            makeupRecords={makeupRecords}
            onSaveGrades={handleSaveGrades}
            onSaveSubjects={handleSaveSubjects}
            onSelectStudentProfile={handleSelectStudentProfile}
          />
        )}

        {activeTab === 'profile' && (
          <StudentProfileView
            students={students}
            classes={classes}
            subjects={subjects}
            grades={grades}
            attendanceRecords={attendanceRecords}
            makeupRecords={makeupRecords}
            selectedStudentId={selectedStudentId}
            onBack={() => setActiveTab('classes')}
          />
        )}

        {activeTab === 'reports' && (
          <ReportsView
            students={students}
            classes={classes}
            subjects={subjects}
            grades={grades}
            attendanceRecords={attendanceRecords}
            makeupRecords={makeupRecords}
            onSelectStudentProfile={handleSelectStudentProfile}
          />
        )}

      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 mt-12 py-6 text-center text-xs text-slate-500 space-y-2">
        <div className="max-w-7xl mx-auto px-4 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="font-bold text-slate-700">Sổ tay giáo viên - Ngọc Lê</span>
            <span>• Hệ thống Quản lý Đào tạo, Điểm danh & Điểm số chuẩn tín chỉ</span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleResetSampleData}
              className="text-slate-400 hover:text-red-600 transition flex items-center gap-1 text-[11px] font-semibold"
              title="Khôi phục lại dữ liệu mẫu"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Khôi phục dữ liệu mẫu</span>
            </button>
            <span>•</span>
            <span className="font-mono text-slate-400">v2.5.0 Pro</span>
          </div>
        </div>
      </footer>

      {/* Modal Đăng nhập / Xác thực */}
      {showAuthModal && (
        <AuthModal
          isOpen={showAuthModal}
          onClose={() => setShowAuthModal(false)}
          onSuccessLogin={handleLoginSuccess}
          teacherAccount={teacherAccount}
        />
      )}

      {/* Modal Thêm / Sửa Sinh viên */}
      {studentModalOpen && (
        <StudentModal
          isOpen={studentModalOpen}
          onClose={() => setStudentModalOpen(false)}
          onSave={handleSaveSingleStudent}
          initialData={editingStudent}
          classes={classes}
          defaultClassId={defaultClassIdForNewStudent}
        />
      )}

      {/* Modal Nhập dữ liệu Sinh viên từ File */}
      {importModalOpen && currentImportClass && (
        <ImportModal
          isOpen={importModalOpen}
          onClose={() => setImportModalOpen(false)}
          onImportStudents={handleImportStudents}
          selectedClass={currentImportClass}
        />
      )}

    </div>
  );
}
