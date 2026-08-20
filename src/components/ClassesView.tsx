import React, { useState } from 'react';
import { 
  Plus, 
  Trash2, 
  Edit, 
  Upload, 
  Download, 
  FileSpreadsheet, 
  FileText, 
  Printer, 
  Users, 
  GraduationCap, 
  BookOpen, 
  Award, 
  Phone, 
  Building2, 
  Search, 
  Filter, 
  Layers, 
  ArrowRightLeft, 
  CheckCircle,
  Sparkles,
  AlertCircle
} from 'lucide-react';
import { Major, ClassGroup, Student, StudentRole, PracticeTeam, TeacherAccount } from '../types';
import { StudentModal } from './StudentModal';
import { ImportModal } from './ImportModal';
import { exportStudentsToExcel, exportToWordDoc } from '../utils/exportImport';

interface ClassesViewProps {
  majors: Major[];
  classes: ClassGroup[];
  students: Student[];
  teacherAccount: TeacherAccount;
  onSaveMajors: (majors: Major[]) => void;
  onSaveClasses: (classes: ClassGroup[]) => void;
  onSaveStudents: (students: Student[]) => void;
  onSelectStudentProfile: (studentId: string) => void;
}

export const ClassesView: React.FC<ClassesViewProps> = ({
  majors,
  classes,
  students,
  teacherAccount,
  onSaveMajors,
  onSaveClasses,
  onSaveStudents,
  onSelectStudentProfile
}) => {
  const [selectedMajorId, setSelectedMajorId] = useState<string>('all');
  const [selectedClassId, setSelectedClassId] = useState<string>(classes[0]?.id || '');
  const [searchKeyword, setSearchKeyword] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [teamFilter, setTeamFilter] = useState<string>('all');

  // Modals state
  const [isStudentModalOpen, setIsStudentModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);

  // Major / Class creation modal state
  const [showAddMajorModal, setShowAddMajorModal] = useState(false);
  const [newMajorName, setNewMajorName] = useState('');
  const [newMajorCode, setNewMajorCode] = useState('');

  const [showAddClassModal, setShowAddClassModal] = useState(false);
  const [newClassName, setNewClassName] = useState('');
  const [newClassCohort, setNewClassCohort] = useState('Khóa 46 (K46)');
  const [newClassMajorId, setNewClassMajorId] = useState(majors[0]?.id || '');
  const [newClassYear, setNewClassYear] = useState('2024 - 2028');
  const [newClassGVCN, setNewClassGVCN] = useState(teacherAccount?.fullName || 'Cô Ngọc Lê');
  const [newClassPhone, setNewClassPhone] = useState(teacherAccount?.phone || '0948090287');
  const [newClassDept, setNewClassDept] = useState(teacherAccount?.department || 'Khoa Y - Dược');

  // Editing Homeroom Teacher
  const [isEditingGVCN, setIsEditingGVCN] = useState(false);
  const [gvcnName, setGvcnName] = useState('');
  const [gvcnPhone, setGvcnPhone] = useState('');
  const [gvcnDept, setGvcnDept] = useState('');

  // Lọc lớp học
  const filteredClasses = classes.filter(c => {
    if (selectedMajorId === 'all') return true;
    return c.majorId === selectedMajorId;
  });

  const currentClass = classes.find(c => c.id === selectedClassId) || filteredClasses[0] || classes[0];

  // Lọc sinh viên của lớp hiện tại
  const classStudents = students.filter(s => s.classId === currentClass?.id);

  const filteredStudents = classStudents.filter(s => {
    const matchesSearch = 
      s.fullName.toLowerCase().includes(searchKeyword.toLowerCase()) ||
      s.studentCode.toLowerCase().includes(searchKeyword.toLowerCase()) ||
      (s.phone && s.phone.includes(searchKeyword));
    
    const matchesRole = roleFilter === 'all' || s.role === roleFilter;
    const matchesTeam = teamFilter === 'all' || s.team === teamFilter;

    return matchesSearch && matchesRole && matchesTeam;
  });

  // Số lượng sinh viên theo tổ
  const team1Count = classStudents.filter(s => s.team === 'Tổ 1').length;
  const team2Count = classStudents.filter(s => s.team === 'Tổ 2').length;

  // Xử lý thêm ngành học mới
  const handleAddMajor = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMajorName.trim()) return;

    const newMajor: Major = {
      id: `major-${Date.now()}`,
      code: newMajorCode.trim().toUpperCase() || `NG${majors.length + 1}`,
      name: newMajorName.trim(),
      description: `Ngành đào tạo ${newMajorName.trim()}`
    };

    const updated = [...majors, newMajor];
    onSaveMajors(updated);
    setShowAddMajorModal(false);
    setNewMajorName('');
    setNewMajorCode('');
  };

  const handleDeleteMajor = (majorId: string) => {
    if (majors.length <= 1) {
      alert('Phải giữ lại ít nhất 1 ngành học!');
      return;
    }
    const hasClasses = classes.some(c => c.majorId === majorId);
    if (hasClasses) {
      if (!confirm('Ngành này đang có lớp học. Bạn có chắc chắn muốn xóa ngành cùng toàn bộ lớp thuộc ngành này?')) {
        return;
      }
      onSaveClasses(classes.filter(c => c.majorId !== majorId));
    }
    onSaveMajors(majors.filter(m => m.id !== majorId));
    if (selectedMajorId === majorId) setSelectedMajorId('all');
  };

  // Xử lý thêm lớp học mới
  const handleAddClass = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClassName.trim()) return;

    const selectedMajor = majors.find(m => m.id === newClassMajorId) || majors[0];

    const newClass: ClassGroup = {
      id: `class-${Date.now()}`,
      name: newClassName.trim().toUpperCase(),
      cohort: newClassCohort.trim(),
      majorId: selectedMajor.id,
      majorName: selectedMajor.name,
      academicYear: newClassYear.trim(),
      homeroomTeacher: {
        fullName: newClassGVCN.trim() || teacherAccount.fullName,
        phone: newClassPhone.trim() || teacherAccount.phone,
        department: newClassDept.trim() || teacherAccount.department
      },
      studentCount: 0
    };

    const updated = [...classes, newClass];
    onSaveClasses(updated);
    setSelectedClassId(newClass.id);
    setShowAddClassModal(false);
    setNewClassName('');
  };

  const handleDeleteClass = (classId: string) => {
    if (classes.length <= 1) {
      alert('Phải giữ lại ít nhất 1 lớp học!');
      return;
    }
    if (confirm('Bạn có chắc muốn xóa lớp này và tất cả sinh viên trong lớp?')) {
      onSaveClasses(classes.filter(c => c.id !== classId));
      onSaveStudents(students.filter(s => s.classId !== classId));
      const remaining = classes.filter(c => c.id !== classId);
      if (remaining.length > 0) setSelectedClassId(remaining[0].id);
    }
  };

  // Cập nhật thông tin GVCN
  const handleStartEditGVCN = () => {
    if (currentClass) {
      setGvcnName(currentClass.homeroomTeacher?.fullName || '');
      setGvcnPhone(currentClass.homeroomTeacher?.phone || '');
      setGvcnDept(currentClass.homeroomTeacher?.department || '');
      setIsEditingGVCN(true);
    }
  };

  const handleSaveGVCN = () => {
    if (!currentClass) return;
    const updated = classes.map(c => {
      if (c.id === currentClass.id) {
        return {
          ...c,
          homeroomTeacher: {
            fullName: gvcnName.trim(),
            phone: gvcnPhone.trim(),
            department: gvcnDept.trim()
          }
        };
      }
      return c;
    });
    onSaveClasses(updated);
    setIsEditingGVCN(false);
  };

  // Sinh viên CRUD
  const handleSaveStudent = (studentData: Partial<Student>) => {
    if (studentData.id) {
      // Edit
      const updated = students.map(s => s.id === studentData.id ? { ...s, ...studentData } as Student : s);
      onSaveStudents(updated);
    } else {
      // Create new
      const newStudent: Student = {
        id: `sv-${Date.now()}`,
        studentCode: studentData.studentCode || `SV${Math.floor(1000 + Math.random() * 9000)}`,
        fullName: studentData.fullName || '',
        classId: studentData.classId || currentClass.id,
        className: studentData.className || currentClass.name,
        birthYear: studentData.birthYear || 2004,
        gender: studentData.gender || 'Nam',
        phone: studentData.phone || '',
        role: studentData.role || 'Sinh viên',
        team: studentData.team || 'Tổ 1',
        email: studentData.email || '',
        notes: studentData.notes || ''
      };
      onSaveStudents([...students, newStudent]);
    }
  };

  const handleDeleteStudent = (studentId: string) => {
    if (confirm('Bạn có chắc muốn xóa sinh viên này khỏi danh sách lớp?')) {
      onSaveStudents(students.filter(s => s.id !== studentId));
    }
  };

  const handleToggleTeam = (student: Student) => {
    const nextTeam: PracticeTeam = student.team === 'Tổ 1' ? 'Tổ 2' : 'Tổ 1';
    const updated = students.map(s => s.id === student.id ? { ...s, team: nextTeam } : s);
    onSaveStudents(updated);
  };

  const handleImportStudents = (newStudentsList: Partial<Student>[]) => {
    const formatted: Student[] = newStudentsList.map((s, idx) => ({
      id: `sv-${Date.now()}-${idx}`,
      studentCode: s.studentCode || `SV${1000 + idx}`,
      fullName: s.fullName || 'Sinh viên',
      classId: currentClass.id,
      className: currentClass.name,
      birthYear: s.birthYear || 2004,
      gender: s.gender || 'Nam',
      phone: s.phone || '',
      role: s.role || 'Sinh viên',
      team: s.team || (idx % 2 === 0 ? 'Tổ 1' : 'Tổ 2'),
      email: s.email || '',
      notes: s.notes || ''
    }));

    onSaveStudents([...students, ...formatted]);
  };

  // Xuất file
  const handleExportExcel = () => {
    if (!currentClass) return;
    exportStudentsToExcel(classStudents, currentClass);
  };

  const handleExportWord = () => {
    if (!currentClass) return;
    const content = `
      <div class="header-box">
        <h3>DANH SÁCH SINH VIÊN LỚP ${currentClass.name}</h3>
        <p><strong>Khóa học:</strong> ${currentClass.cohort} | <strong>Ngành:</strong> ${currentClass.majorName} | <strong>Năm học:</strong> ${currentClass.academicYear}</p>
        <p><strong>Giáo viên chủ nhiệm:</strong> ${currentClass.homeroomTeacher?.fullName || ''} - <strong>SĐT:</strong> ${currentClass.homeroomTeacher?.phone || ''} - <strong>Bộ môn:</strong> ${currentClass.homeroomTeacher?.department || ''}</p>
      </div>
      <table>
        <thead>
          <tr>
            <th>STT</th>
            <th>Mã SV</th>
            <th>Họ và tên</th>
            <th>Năm sinh</th>
            <th>Giới tính</th>
            <th>Số điện thoại</th>
            <th>Cán bộ lớp</th>
            <th>Tổ TH</th>
          </tr>
        </thead>
        <tbody>
          ${classStudents.map((s, i) => `
            <tr>
              <td class="center">${i + 1}</td>
              <td class="center"><strong>${s.studentCode}</strong></td>
              <td>${s.fullName}</td>
              <td class="center">${s.birthYear}</td>
              <td class="center">${s.gender}</td>
              <td>${s.phone}</td>
              <td>${s.role}</td>
              <td class="center">${s.team || 'Tổ 1'}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
      <table class="signature-box">
        <tr>
          <td></td>
          <td>
            <p><em>Ngày ..... tháng ..... năm 2026</em></p>
            <p><strong>GIÁO VIÊN CHỦ NHIỆM</strong></p>
            <br/><br/><br/>
            <p><strong>${currentClass.homeroomTeacher?.fullName || ''}</strong></p>
          </td>
        </tr>
      </table>
    `;
    exportToWordDoc(`Danh_Sach_Lop_${currentClass.name}`, content, `Danh_Sach_${currentClass.name}.doc`);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      
      {/* Top Banner Control: Ngành học & Lớp học Selector */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-4">
        
        {/* Hàng 1: Quản lý Ngành học */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div className="flex items-center gap-2">
            <Building2 className="w-5 h-5 text-orange-600" />
            <span className="font-bold text-slate-800 text-sm">Ngành đào tạo:</span>
            <div className="flex flex-wrap gap-1.5">
              <button
                onClick={() => setSelectedMajorId('all')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-xl transition ${
                  selectedMajorId === 'all'
                    ? 'bg-orange-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Tất cả ngành ({majors.length})
              </button>
              {majors.map(m => (
                <div key={m.id} className="inline-flex items-center">
                  <button
                    onClick={() => setSelectedMajorId(m.id)}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-l-xl transition ${
                      selectedMajorId === m.id
                        ? 'bg-orange-600 text-white shadow-xs'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    {m.name} ({classes.filter(c => c.majorId === m.id).length} lớp)
                  </button>
                  <button
                    onClick={() => handleDeleteMajor(m.id)}
                    title="Xóa ngành học này"
                    className={`px-1.5 py-1.5 text-xs rounded-r-xl border-l border-slate-300 transition ${
                      selectedMajorId === m.id
                        ? 'bg-orange-700 text-orange-200 hover:text-white'
                        : 'bg-slate-200 text-slate-500 hover:text-red-600'
                    }`}
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <button
            onClick={() => setShowAddMajorModal(true)}
            className="px-3 py-1.5 bg-orange-50 hover:bg-orange-100 text-orange-700 font-semibold text-xs rounded-xl border border-orange-200 transition flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Thêm ngành học mới</span>
          </button>
        </div>

        {/* Hàng 2: Chọn Lớp học */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 flex-wrap">
            <GraduationCap className="w-5 h-5 text-red-600" />
            <span className="font-bold text-slate-800 text-sm">Danh sách Lớp học:</span>
            <div className="flex flex-wrap gap-2">
              {filteredClasses.map(c => {
                const isSelected = c.id === currentClass?.id;
                const count = students.filter(s => s.classId === c.id).length;
                return (
                  <div key={c.id} className="inline-flex items-center">
                    <button
                      onClick={() => setSelectedClassId(c.id)}
                      className={`px-3.5 py-2 text-xs font-bold rounded-l-xl transition flex items-center gap-1.5 ${
                        isSelected
                          ? 'bg-gradient-to-r from-red-600 to-orange-600 text-white shadow-md'
                          : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                      }`}
                    >
                      <span>{c.name}</span>
                      <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                        isSelected ? 'bg-white/30 text-white' : 'bg-slate-200 text-slate-600'
                      }`}>
                        {count} SV
                      </span>
                    </button>
                    <button
                      onClick={() => handleDeleteClass(c.id)}
                      title="Xóa lớp học này"
                      className={`px-2 py-2 text-xs rounded-r-xl border-l border-slate-300 transition ${
                        isSelected
                          ? 'bg-red-700 text-red-100 hover:text-white'
                          : 'bg-slate-200 text-slate-500 hover:text-red-600'
                      }`}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          <button
            onClick={() => setShowAddClassModal(true)}
            className="px-4 py-2 bg-gradient-to-r from-red-600 to-orange-500 hover:from-red-700 hover:to-orange-600 text-white font-bold text-xs rounded-xl shadow-md transition flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>Thêm Lớp học mới</span>
          </button>
        </div>
      </div>

      {currentClass ? (
        <div className="space-y-6">
          
          {/* Card Thông tin Lớp học & Giáo viên chủ nhiệm */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 items-center">
              
              {/* Cột 1: Thông tin Lớp */}
              <div className="space-y-1.5 border-b md:border-b-0 md:border-r border-slate-100 pb-3 md:pb-0 md:pr-4">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 bg-red-100 text-red-800 font-black text-sm rounded-lg">
                    {currentClass.name}
                  </span>
                  <span className="text-xs text-slate-500 font-medium">({currentClass.cohort})</span>
                </div>
                <div className="text-xs text-slate-600 space-y-0.5">
                  <p><strong>Ngành:</strong> {currentClass.majorName}</p>
                  <p><strong>Niên khóa:</strong> {currentClass.academicYear}</p>
                  <p><strong>Tổng số SV:</strong> <span className="font-bold text-orange-600">{classStudents.length} sinh viên</span></p>
                </div>
              </div>

              {/* Cột 2: Phân chia 2 Tổ Thực hành */}
              <div className="space-y-2 border-b md:border-b-0 md:border-r border-slate-100 pb-3 md:pb-0 md:pr-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <Layers className="w-4 h-4 text-blue-600" />
                    Phân Tổ thực hành (TH)
                  </span>
                  <span className="text-[11px] text-slate-500">2 Tổ riêng biệt</span>
                </div>
                
                <div className="grid grid-cols-2 gap-2">
                  <div className="p-2.5 bg-blue-50 border border-blue-200 rounded-xl text-center">
                    <span className="text-xs font-bold text-blue-900 block">Tổ 1</span>
                    <span className="text-base font-black text-blue-700">{team1Count}</span>
                    <span className="text-[10px] text-blue-600 block">sinh viên</span>
                  </div>
                  <div className="p-2.5 bg-indigo-50 border border-indigo-200 rounded-xl text-center">
                    <span className="text-xs font-bold text-indigo-900 block">Tổ 2</span>
                    <span className="text-base font-black text-indigo-700">{team2Count}</span>
                    <span className="text-[10px] text-indigo-600 block">sinh viên</span>
                  </div>
                </div>
                <p className="text-[11px] text-slate-500 italic">
                  💡 Nhấp nút chuyển tổ ở từng SV để phân chia Tổ 1 / Tổ 2 cho các bài Thực hành.
                </p>
              </div>

              {/* Cột 3: Thông tin GVCN */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <Award className="w-4 h-4 text-amber-600" />
                    Giáo viên chủ nhiệm (GVCN)
                  </span>
                  {!isEditingGVCN ? (
                    <button
                      onClick={handleStartEditGVCN}
                      className="text-[11px] text-orange-600 hover:text-orange-700 font-semibold hover:underline flex items-center gap-1"
                    >
                      <Edit className="w-3 h-3" /> Sửa
                    </button>
                  ) : (
                    <button
                      onClick={handleSaveGVCN}
                      className="text-[11px] text-emerald-600 hover:text-emerald-700 font-bold hover:underline"
                    >
                      Lưu thay đổi
                    </button>
                  )}
                </div>

                {!isEditingGVCN ? (
                  <div className="bg-orange-50/60 p-3 rounded-xl border border-orange-100 text-xs space-y-1 text-slate-700">
                    <p className="font-bold text-orange-900">{currentClass.homeroomTeacher?.fullName || 'Cô Ngọc Lê'}</p>
                    <p className="flex items-center gap-1.5 text-slate-600">
                      <Phone className="w-3.5 h-3.5 text-orange-600" />
                      <span>{currentClass.homeroomTeacher?.phone || '0948090287'}</span>
                    </p>
                    <p className="text-slate-500 text-[11px]">
                      <strong>Bộ môn:</strong> {currentClass.homeroomTeacher?.department || 'Khoa Y - Dược'}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2 bg-slate-50 p-2.5 rounded-xl border border-slate-200 text-xs">
                    <input
                      type="text"
                      value={gvcnName}
                      onChange={(e) => setGvcnName(e.target.value)}
                      placeholder="Họ tên GVCN"
                      className="w-full p-1.5 bg-white border border-slate-300 rounded-lg text-xs font-semibold"
                    />
                    <input
                      type="text"
                      value={gvcnPhone}
                      onChange={(e) => setGvcnPhone(e.target.value)}
                      placeholder="Số điện thoại"
                      className="w-full p-1.5 bg-white border border-slate-300 rounded-lg text-xs"
                    />
                    <input
                      type="text"
                      value={gvcnDept}
                      onChange={(e) => setGvcnDept(e.target.value)}
                      placeholder="Bộ môn giảng dạy"
                      className="w-full p-1.5 bg-white border border-slate-300 rounded-lg text-xs"
                    />
                  </div>
                )}
              </div>

            </div>
          </div>

          {/* Bảng Danh sách Sinh viên */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            
            {/* Toolbar */}
            <div className="p-4 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 bg-slate-50/70">
              
              {/* Search & Filter */}
              <div className="flex flex-wrap items-center gap-2.5 flex-1 min-w-[280px]">
                <div className="relative flex-1 max-w-xs">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={searchKeyword}
                    onChange={(e) => setSearchKeyword(e.target.value)}
                    placeholder="Tìm theo tên, Mã SV, SĐT..."
                    className="w-full pl-9 pr-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>

                {/* Role Filter */}
                <select
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value)}
                  className="px-2.5 py-1.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-orange-500"
                >
                  <option value="all">Tất cả chức vụ</option>
                  <option value="Lớp trưởng">Lớp trưởng</option>
                  <option value="Bí thư">Bí thư</option>
                  <option value="Lớp phó học tập">Lớp phó học tập</option>
                  <option value="Lớp phó đời sống">Lớp phó đời sống</option>
                  <option value="Tổ trưởng Tổ 1">Tổ trưởng Tổ 1</option>
                  <option value="Tổ trưởng Tổ 2">Tổ trưởng Tổ 2</option>
                  <option value="Sinh viên">Sinh viên thường</option>
                </select>

                {/* Team Filter */}
                <select
                  value={teamFilter}
                  onChange={(e) => setTeamFilter(e.target.value)}
                  className="px-2.5 py-1.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-orange-500"
                >
                  <option value="all">Tất cả Tổ</option>
                  <option value="Tổ 1">Tổ 1 ({team1Count})</option>
                  <option value="Tổ 2">Tổ 2 ({team2Count})</option>
                </select>
              </div>

              {/* Action Buttons: Import, Export, Add Student */}
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  onClick={() => setIsImportModalOpen(true)}
                  className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 font-semibold text-xs rounded-xl border border-blue-200 transition flex items-center gap-1.5 shadow-2xs"
                  title="Nhập danh sách SV từ Excel / Word / PDF"
                >
                  <Upload className="w-3.5 h-3.5 text-blue-600" />
                  <span>Nhập file (Excel/Word/PDF)</span>
                </button>

                <button
                  onClick={handleExportExcel}
                  className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-semibold text-xs rounded-xl border border-emerald-200 transition flex items-center gap-1.5 shadow-2xs"
                  title="Xuất file Excel"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Xuất Excel</span>
                </button>

                <button
                  onClick={handleExportWord}
                  className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-semibold text-xs rounded-xl border border-indigo-200 transition flex items-center gap-1.5 shadow-2xs"
                  title="Xuất file Word"
                >
                  <FileText className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Xuất Word</span>
                </button>

                <button
                  onClick={handlePrint}
                  className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl transition flex items-center gap-1 shadow-2xs"
                  title="In danh sách"
                >
                  <Printer className="w-3.5 h-3.5 text-slate-600" />
                </button>

                <button
                  onClick={() => {
                    setEditingStudent(null);
                    setIsStudentModalOpen(true);
                  }}
                  className="px-3.5 py-1.5 bg-gradient-to-r from-red-600 to-orange-500 hover:from-red-700 hover:to-orange-600 text-white font-bold text-xs rounded-xl shadow-md transition flex items-center gap-1.5"
                >
                  <Plus className="w-4 h-4" />
                  <span>Thêm Sinh viên</span>
                </button>
              </div>

            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-700">
                <thead className="bg-slate-100 text-slate-700 font-bold uppercase tracking-wider text-[11px]">
                  <tr>
                    <th className="p-3 w-12 text-center">STT</th>
                    <th className="p-3">Mã SV</th>
                    <th className="p-3">Họ và Tên Sinh viên</th>
                    <th className="p-3 text-center">Năm sinh</th>
                    <th className="p-3 text-center">Giới tính</th>
                    <th className="p-3">Số điện thoại</th>
                    <th className="p-3">Cán bộ lớp</th>
                    <th className="p-3 text-center">Tổ thực hành</th>
                    <th className="p-3 text-center">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {filteredStudents.length > 0 ? (
                    filteredStudents.map((student, index) => {
                      const isLeader = student.role !== 'Sinh viên';
                      return (
                        <tr key={student.id} className="hover:bg-orange-50/30 transition group">
                          <td className="p-3 text-center text-slate-400 font-medium">
                            {index + 1}
                          </td>
                          <td className="p-3 font-mono font-bold text-orange-700">
                            <button
                              onClick={() => onSelectStudentProfile(student.id)}
                              className="hover:underline hover:text-orange-800 text-left"
                              title="Xem hồ sơ chi tiết sinh viên"
                            >
                              {student.studentCode}
                            </button>
                          </td>
                          <td className="p-3 font-semibold text-slate-900">
                            <button
                              onClick={() => onSelectStudentProfile(student.id)}
                              className="hover:underline hover:text-orange-600 text-left"
                            >
                              {student.fullName}
                            </button>
                          </td>
                          <td className="p-3 text-center text-slate-600">
                            {student.birthYear}
                          </td>
                          <td className="p-3 text-center">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                              student.gender === 'Nữ' 
                                ? 'bg-pink-50 text-pink-700 border border-pink-200' 
                                : 'bg-blue-50 text-blue-700 border border-blue-200'
                            }`}>
                              {student.gender}
                            </span>
                          </td>
                          <td className="p-3 text-slate-600 font-mono">
                            {student.phone ? (
                              <a href={`tel:${student.phone}`} className="hover:text-orange-600">
                                {student.phone}
                              </a>
                            ) : '-'}
                          </td>
                          <td className="p-3">
                            <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold ${
                              isLeader
                                ? 'bg-amber-100 text-amber-900 border border-amber-300'
                                : 'bg-slate-100 text-slate-600'
                            }`}>
                              {isLeader && <Award className="w-3 h-3 text-amber-600 shrink-0" />}
                              <span>{student.role}</span>
                            </span>
                          </td>
                          <td className="p-3 text-center">
                            <button
                              onClick={() => handleToggleTeam(student)}
                              title="Bấm để đổi Tổ 1 ↔ Tổ 2"
                              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition inline-flex items-center gap-1 shadow-2xs ${
                                student.team === 'Tổ 1'
                                  ? 'bg-blue-100 text-blue-800 hover:bg-blue-200'
                                  : 'bg-indigo-100 text-indigo-800 hover:bg-indigo-200'
                              }`}
                            >
                              <span>{student.team || 'Tổ 1'}</span>
                              <ArrowRightLeft className="w-2.5 h-2.5 opacity-60" />
                            </button>
                          </td>
                          <td className="p-3 text-center">
                            <div className="flex items-center justify-center gap-1.5">
                              <button
                                onClick={() => {
                                  setEditingStudent(student);
                                  setIsStudentModalOpen(true);
                                }}
                                title="Chỉnh sửa thông tin SV"
                                className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                              >
                                <Edit className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDeleteStudent(student.id)}
                                title="Xóa sinh viên này"
                                className="p-1.5 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={9} className="p-8 text-center text-slate-400">
                        <Users className="w-10 h-10 mx-auto text-slate-300 mb-2" />
                        <p className="text-sm font-medium">Không tìm thấy sinh viên nào!</p>
                        <p className="text-xs text-slate-400 mt-1">
                          Hãy bấm <strong>"Thêm Sinh viên"</strong> hoặc <strong>"Nhập file (Excel/Word/PDF)"</strong> để bắt đầu.
                        </p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Footer Summary */}
            <div className="p-3 bg-slate-50 border-t border-slate-200 text-xs text-slate-600 flex flex-wrap items-center justify-between gap-2">
              <div>
                Hiển thị <strong>{filteredStudents.length}</strong> / <strong>{classStudents.length}</strong> sinh viên của lớp <strong>{currentClass.name}</strong>
              </div>
              <div className="flex items-center gap-4">
                <span>Tổ 1: <strong>{team1Count}</strong> SV</span>
                <span>Tổ 2: <strong>{team2Count}</strong> SV</span>
                <span>Cán bộ lớp: <strong>{classStudents.filter(s => s.role !== 'Sinh viên').length}</strong> SV</span>
              </div>
            </div>

          </div>

        </div>
      ) : (
        <div className="p-12 text-center bg-white rounded-2xl border border-slate-200 text-slate-500">
          <AlertCircle className="w-12 h-12 mx-auto text-orange-400 mb-3" />
          <h3 className="text-lg font-bold text-slate-800">Chưa có lớp học nào được chọn</h3>
          <p className="text-xs text-slate-500 mt-1">Vui lòng bấm nút "Thêm Lớp học mới" để tạo lớp.</p>
        </div>
      )}

      {/* Modal Thêm Ngành Học */}
      {showAddMajorModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl p-6 border border-slate-100">
            <h3 className="text-lg font-bold text-slate-900 mb-1">Thêm Ngành đào tạo mới</h3>
            <p className="text-xs text-slate-500 mb-4">Giáo viên giảng dạy được toàn quyền thêm bớt ngành học</p>

            <form onSubmit={handleAddMajor} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Tên Ngành học *
                </label>
                <input
                  type="text"
                  required
                  value={newMajorName}
                  onChange={(e) => setNewMajorName(e.target.value)}
                  placeholder="VD: Y Đa khoa, Điều dưỡng, Răng Hàm Mặt..."
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-orange-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Mã Ngành (viết tắt)
                </label>
                <input
                  type="text"
                  value={newMajorCode}
                  onChange={(e) => setNewMajorCode(e.target.value)}
                  placeholder="VD: YDK, DD, RHM, DH..."
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-orange-500 uppercase"
                />
              </div>

              <div className="pt-3 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddMajorModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs rounded-xl shadow-md"
                >
                  Lưu Ngành học
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Thêm Lớp Học */}
      {showAddClassModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl p-6 border border-slate-100">
            <h3 className="text-lg font-bold text-slate-900 mb-1">Thêm Lớp học mới</h3>
            <p className="text-xs text-slate-500 mb-4">Ghi rõ khóa học, ngành học, tên lớp và thông tin GVCN</p>

            <form onSubmit={handleAddClass} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Tên Lớp học *
                  </label>
                  <input
                    type="text"
                    required
                    value={newClassName}
                    onChange={(e) => setNewClassName(e.target.value)}
                    placeholder="VD: YK2024A, DD2024B..."
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-red-700 focus:bg-white focus:ring-2 focus:ring-orange-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Khóa học *
                  </label>
                  <input
                    type="text"
                    required
                    value={newClassCohort}
                    onChange={(e) => setNewClassCohort(e.target.value)}
                    placeholder="VD: Khóa 46 (K46)"
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-orange-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Thuộc Ngành học *
                  </label>
                  <select
                    value={newClassMajorId}
                    onChange={(e) => setNewClassMajorId(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-orange-500"
                  >
                    {majors.map(m => (
                      <option key={m.id} value={m.id}>{m.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Niên khóa đào tạo
                  </label>
                  <input
                    type="text"
                    value={newClassYear}
                    onChange={(e) => setNewClassYear(e.target.value)}
                    placeholder="VD: 2024 - 2028"
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-orange-500"
                  />
                </div>
              </div>

              <div className="border-t border-slate-100 pt-3 space-y-2">
                <span className="text-xs font-bold text-slate-800 block">Thông tin Giáo viên chủ nhiệm:</span>
                <div className="grid grid-cols-3 gap-2">
                  <input
                    type="text"
                    value={newClassGVCN}
                    onChange={(e) => setNewClassGVCN(e.target.value)}
                    placeholder="Họ tên GVCN"
                    className="p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium"
                  />
                  <input
                    type="text"
                    value={newClassPhone}
                    onChange={(e) => setNewClassPhone(e.target.value)}
                    placeholder="Số ĐT GVCN"
                    className="p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                  />
                  <input
                    type="text"
                    value={newClassDept}
                    onChange={(e) => setNewClassDept(e.target.value)}
                    placeholder="Bộ môn"
                    className="p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                  />
                </div>
              </div>

              <div className="pt-3 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddClassModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-gradient-to-r from-red-600 to-orange-500 text-white font-bold text-xs rounded-xl shadow-md"
                >
                  Tạo Lớp học
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Student Modal */}
      <StudentModal
        isOpen={isStudentModalOpen}
        onClose={() => setIsStudentModalOpen(false)}
        onSave={handleSaveStudent}
        initialData={editingStudent}
        classes={classes}
        defaultClassId={currentClass?.id}
      />

      {/* Import Modal */}
      {currentClass && (
        <ImportModal
          isOpen={isImportModalOpen}
          onClose={() => setIsImportModalOpen(false)}
          onImportStudents={handleImportStudents}
          selectedClass={currentClass}
        />
      )}

    </div>
  );
};
