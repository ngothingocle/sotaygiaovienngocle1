import React, { useState, useEffect } from 'react';
import { X, UserPlus, Save, UserCheck, Phone, Hash, Calendar, Award } from 'lucide-react';
import { Student, StudentRole, Gender, PracticeTeam, ClassGroup } from '../types';

interface StudentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (student: Partial<Student>) => void;
  initialData?: Student | null;
  classes: ClassGroup[];
  defaultClassId?: string;
}

const ROLE_OPTIONS: StudentRole[] = [
  'Lớp trưởng',
  'Bí thư',
  'Lớp phó học tập',
  'Lớp phó đời sống',
  'Tổ trưởng Tổ 1',
  'Tổ trưởng Tổ 2',
  'Sinh viên'
];

export const StudentModal: React.FC<StudentModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialData,
  classes,
  defaultClassId
}) => {
  const [studentCode, setStudentCode] = useState('');
  const [fullName, setFullName] = useState('');
  const [classId, setClassId] = useState(defaultClassId || (classes[0]?.id || ''));
  const [birthYear, setBirthYear] = useState<number>(2004);
  const [gender, setGender] = useState<Gender>('Nam');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState<StudentRole>('Sinh viên');
  const [team, setTeam] = useState<PracticeTeam>('Tổ 1');
  const [email, setEmail] = useState('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (initialData) {
      setStudentCode(initialData.studentCode);
      setFullName(initialData.fullName);
      setClassId(initialData.classId);
      setBirthYear(initialData.birthYear || 2004);
      setGender(initialData.gender || 'Nam');
      setPhone(initialData.phone || '');
      setRole(initialData.role || 'Sinh viên');
      setTeam(initialData.team || 'Tổ 1');
      setEmail(initialData.email || '');
      setNotes(initialData.notes || '');
    } else {
      setStudentCode(`SV${Math.floor(1000 + Math.random() * 9000)}`);
      setFullName('');
      setClassId(defaultClassId || (classes[0]?.id || ''));
      setBirthYear(2004);
      setGender('Nam');
      setPhone('');
      setRole('Sinh viên');
      setTeam('Tổ 1');
      setEmail('');
      setNotes('');
    }
  }, [initialData, defaultClassId, classes, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim() || !studentCode.trim()) return;

    const selectedClass = classes.find(c => c.id === classId);

    const studentData: Partial<Student> = {
      ...(initialData ? { id: initialData.id } : {}),
      studentCode: studentCode.trim().toUpperCase(),
      fullName: fullName.trim(),
      classId,
      className: selectedClass?.name || 'Lớp',
      birthYear: Number(birthYear),
      gender,
      phone: phone.trim(),
      role,
      team,
      email: email.trim(),
      notes: notes.trim()
    };

    onSave(studentData);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl overflow-hidden border border-slate-100 animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-orange-600 via-red-600 to-rose-600 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-white/20 rounded-xl">
              {initialData ? <UserCheck className="w-5 h-5 text-white" /> : <UserPlus className="w-5 h-5 text-white" />}
            </div>
            <div>
              <h3 className="font-bold text-lg">
                {initialData ? 'Chỉnh sửa thông tin Sinh viên' : 'Thêm Sinh viên mới vào lớp'}
              </h3>
              <p className="text-xs text-orange-100">
                Toàn quyền quản lý bởi Giáo viên Ngọc Lê
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

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Mã sinh viên */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                <Hash className="w-3.5 h-3.5 text-orange-600" />
                Mã Sinh viên *
              </label>
              <input
                type="text"
                required
                value={studentCode}
                onChange={(e) => setStudentCode(e.target.value)}
                placeholder="VD: YK2301, DD2402..."
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>

            {/* Họ và tên */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Họ và Tên Sinh viên *
              </label>
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="VD: Nguyễn Văn An"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500 font-medium"
              />
            </div>

            {/* Lớp học */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Lớp học *
              </label>
              <select
                value={classId}
                onChange={(e) => setClassId(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500"
              >
                {classes.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.majorName} - {c.cohort})
                  </option>
                ))}
              </select>
            </div>

            {/* Cán bộ lớp */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                <Award className="w-3.5 h-3.5 text-red-600" />
                Cán bộ Lớp (Chức vụ)
              </label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as StudentRole)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500 font-medium text-orange-700"
              >
                {ROLE_OPTIONS.map(r => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </div>

            {/* Giới tính */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Giới tính
              </label>
              <div className="flex gap-3 pt-1">
                <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
                  <input
                    type="radio"
                    name="gender"
                    value="Nam"
                    checked={gender === 'Nam'}
                    onChange={() => setGender('Nam')}
                    className="text-orange-600 focus:ring-orange-500"
                  />
                  <span>Nam</span>
                </label>
                <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
                  <input
                    type="radio"
                    name="gender"
                    value="Nữ"
                    checked={gender === 'Nữ'}
                    onChange={() => setGender('Nữ')}
                    className="text-orange-600 focus:ring-orange-500"
                  />
                  <span>Nữ</span>
                </label>
              </div>
            </div>

            {/* Năm sinh */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-blue-600" />
                Năm sinh
              </label>
              <input
                type="number"
                min={1980}
                max={2015}
                value={birthYear}
                onChange={(e) => setBirthYear(Number(e.target.value))}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>

            {/* Số điện thoại SV */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                <Phone className="w-3.5 h-3.5 text-emerald-600" />
                Số điện thoại SV
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="VD: 0981112233"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>

            {/* Tổ thực hành */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Phân Tổ thực hành (TH)
              </label>
              <select
                value={team}
                onChange={(e) => setTeam(e.target.value as PracticeTeam)}
                className="w-full px-3.5 py-2.5 bg-blue-50 border border-blue-200 rounded-xl text-sm font-semibold text-blue-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="Tổ 1">Tổ 1</option>
                <option value="Tổ 2">Tổ 2</option>
              </select>
            </div>

            {/* Email */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Email sinh viên
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="VD: sv@student.edu.vn"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>

            {/* Ghi chú */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Ghi chú thêm
              </label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Tình trạng, hoàn cảnh..."
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>

          </div>

          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-xl transition"
            >
              Hủy bỏ
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 bg-gradient-to-r from-red-600 to-orange-500 hover:from-red-700 hover:to-orange-600 text-white font-semibold text-sm rounded-xl shadow-md hover:shadow-lg transition flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              <span>{initialData ? 'Cập nhật Sinh viên' : 'Lưu Sinh viên'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
