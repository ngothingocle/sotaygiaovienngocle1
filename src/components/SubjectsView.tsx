import React, { useState } from 'react';
import { 
  BookOpen, 
  Plus, 
  Trash2, 
  Edit, 
  Clock, 
  Layers, 
  Sliders, 
  Award, 
  CheckCircle2, 
  AlertTriangle, 
  Save, 
  X,
  FileText,
  ListOrdered
} from 'lucide-react';
import { Subject, ClassGroup, Lesson, GradeWeightConfig, SubjectType } from '../types';
import { getDefaultGradeConfigs } from '../utils/calculations';

interface SubjectsViewProps {
  subjects: Subject[];
  classes: ClassGroup[];
  onSaveSubjects: (subjects: Subject[]) => void;
}

export const SubjectsView: React.FC<SubjectsViewProps> = ({
  subjects,
  classes,
  onSaveSubjects
}) => {
  const [selectedClassId, setSelectedClassId] = useState<string>(classes[0]?.id || '');
  const [editingSubject, setEditingSubject] = useState<Subject | null>(null);
  const [isCreatingNew, setIsCreatingNew] = useState(false);

  // Form states for creating/editing subject
  const [name, setName] = useState('');
  const [classId, setClassId] = useState(selectedClassId);
  const [credits, setCredits] = useState<number>(2);
  const [type, setType] = useState<SubjectType>('Kết hợp (LT + TH)');
  const [totalTheoryPeriods, setTotalTheoryPeriods] = useState<number>(30);
  const [totalPracticeLessons, setTotalPracticeLessons] = useState<number>(3);
  const [maxAllowedAbsencePeriods, setMaxAllowedAbsencePeriods] = useState<number>(6);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [gradeConfigs, setGradeConfigs] = useState<GradeWeightConfig[]>([]);

  // Selected subject for viewing detailed lessons
  const currentClass = classes.find(c => c.id === selectedClassId) || classes[0];
  const classSubjects = subjects.filter(s => s.classId === selectedClassId);
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>(classSubjects[0]?.id || '');
  const activeSubject = subjects.find(s => s.id === selectedSubjectId) || classSubjects[0];

  const handleOpenCreate = () => {
    setName('');
    setClassId(selectedClassId);
    setCredits(2);
    setType('Kết hợp (LT + TH)');
    setTotalTheoryPeriods(30);
    setTotalPracticeLessons(3);
    setMaxAllowedAbsencePeriods(6);
    
    // Tạo sẵn bài học mẫu
    const defaultLessons: Lesson[] = [
      { id: `les-${Date.now()}-1`, lessonNumber: 1, name: 'Bài 1: Lý thuyết đại cương', type: 'Lý thuyết', periods: 4, teamAssignment: 'Cả lớp' },
      { id: `les-${Date.now()}-2`, lessonNumber: 2, name: 'Bài 2: Kiến thức chuyên đề', type: 'Lý thuyết', periods: 4, teamAssignment: 'Cả lớp' },
      { id: `les-${Date.now()}-3`, lessonNumber: 1, name: 'Bài TH 1: Kỹ năng cơ bản', type: 'Thực hành', periods: 4, teamAssignment: 'Tổ 1' },
      { id: `les-${Date.now()}-4`, lessonNumber: 1, name: 'Bài TH 1: Kỹ năng cơ bản', type: 'Thực hành', periods: 4, teamAssignment: 'Tổ 2' }
    ];
    setLessons(defaultLessons);
    setGradeConfigs(getDefaultGradeConfigs(2));
    setEditingSubject(null);
    setIsCreatingNew(true);
  };

  const handleOpenEdit = (subject: Subject) => {
    setEditingSubject(subject);
    setName(subject.name);
    setClassId(subject.classId);
    setCredits(subject.credits);
    setType(subject.type);
    setTotalTheoryPeriods(subject.totalTheoryPeriods);
    setTotalPracticeLessons(subject.totalPracticeLessons);
    setMaxAllowedAbsencePeriods(subject.maxAllowedAbsencePeriods);
    setLessons([...subject.lessons]);
    setGradeConfigs([...subject.gradeConfigs]);
    setIsCreatingNew(true);
  };

  const handleCreditChange = (newCredits: number) => {
    setCredits(newCredits);
    // Tự động cập nhật số tiết vắng quy định và cấu hình cột điểm
    const defaultConfigs = getDefaultGradeConfigs(newCredits, type);
    setGradeConfigs(defaultConfigs);

    // Tính ước lượng số tiết
    if (newCredits === 1) {
      setTotalTheoryPeriods(15);
      setMaxAllowedAbsencePeriods(3);
    } else if (newCredits === 2) {
      setTotalTheoryPeriods(30);
      setMaxAllowedAbsencePeriods(6);
    } else if (newCredits === 2.5) {
      setTotalTheoryPeriods(30);
      setTotalPracticeLessons(3);
      setMaxAllowedAbsencePeriods(6);
    } else if (newCredits === 3.5) {
      setTotalTheoryPeriods(45);
      setTotalPracticeLessons(4);
      setMaxAllowedAbsencePeriods(9);
    }
  };

  const handleAddLesson = (lessonType: 'Lý thuyết' | 'Thực hành', teamAssignment: 'Cả lớp' | 'Tổ 1' | 'Tổ 2' = 'Cả lớp') => {
    const sameTypeCount = lessons.filter(l => l.type === lessonType && l.teamAssignment === teamAssignment).length;
    const newLesson: Lesson = {
      id: `les-${Date.now()}-${lessons.length + 1}`,
      lessonNumber: sameTypeCount + 1,
      name: `${lessonType === 'Thực hành' ? 'Bài TH' : 'Bài LT'} ${sameTypeCount + 1}: Nội dung bài học mới`,
      type: lessonType,
      periods: 4,
      teamAssignment
    };
    setLessons([...lessons, newLesson]);
  };

  const handleRemoveLesson = (lessonId: string) => {
    setLessons(lessons.filter(l => l.id !== lessonId));
  };

  const handleUpdateLessonName = (lessonId: string, newName: string) => {
    setLessons(lessons.map(l => l.id === lessonId ? { ...l, name: newName } : l));
  };

  const handleUpdateLessonTeam = (lessonId: string, team: 'Cả lớp' | 'Tổ 1' | 'Tổ 2') => {
    setLessons(lessons.map(l => l.id === lessonId ? { ...l, teamAssignment: team } : l));
  };

  const handleSaveSubjectSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    if (editingSubject) {
      // Update
      const updated = subjects.map(s => {
        if (s.id === editingSubject.id) {
          return {
            ...s,
            name: name.trim(),
            classId,
            credits,
            type,
            totalTheoryPeriods,
            totalPracticeLessons,
            maxAllowedAbsencePeriods,
            lessons,
            gradeConfigs
          };
        }
        return s;
      });
      onSaveSubjects(updated);
    } else {
      // New
      const newSubject: Subject = {
        id: `sub-${Date.now()}`,
        classId,
        name: name.trim(),
        credits,
        type,
        totalTheoryPeriods,
        totalPracticeLessons,
        maxAllowedAbsencePeriods,
        lessons,
        gradeConfigs
      };
      onSaveSubjects([...subjects, newSubject]);
      setSelectedSubjectId(newSubject.id);
    }

    setIsCreatingNew(false);
    setEditingSubject(null);
  };

  const handleDeleteSubject = (subjectId: string) => {
    if (confirm('Bạn có chắc chắn muốn xóa môn học này khỏi lớp?')) {
      const updated = subjects.filter(s => s.id !== subjectId);
      onSaveSubjects(updated);
      if (selectedSubjectId === subjectId) {
        setSelectedSubjectId(updated[0]?.id || '');
      }
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Selector Lớp học */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-wrap">
          <BookOpen className="w-5 h-5 text-orange-600" />
          <span className="font-bold text-slate-800 text-sm">Chọn Lớp quản lý môn học:</span>
          <div className="flex flex-wrap gap-2">
            {classes.map(c => (
              <button
                key={c.id}
                onClick={() => {
                  setSelectedClassId(c.id);
                  const firstSub = subjects.find(s => s.classId === c.id);
                  if (firstSub) setSelectedSubjectId(firstSub.id);
                }}
                className={`px-3.5 py-1.5 text-xs font-bold rounded-xl transition ${
                  selectedClassId === c.id
                    ? 'bg-gradient-to-r from-red-600 to-orange-600 text-white shadow-md'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                {c.name} ({subjects.filter(s => s.classId === c.id).length} môn)
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={handleOpenCreate}
          className="px-4 py-2 bg-gradient-to-r from-red-600 to-orange-500 hover:from-red-700 hover:to-orange-600 text-white font-bold text-xs rounded-xl shadow-md transition flex items-center gap-1.5"
        >
          <Plus className="w-4 h-4" />
          <span>Thêm Môn học mới cho lớp {currentClass?.name}</span>
        </button>
      </div>

      {/* Grid Danh sách Môn học của Lớp */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Danh sách thẻ Môn học */}
        <div className="space-y-3 lg:col-span-1">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              Các môn học lớp {currentClass?.name} ({classSubjects.length})
            </h3>
          </div>

          {classSubjects.length > 0 ? (
            <div className="space-y-2.5">
              {classSubjects.map(sub => {
                const isSelected = sub.id === activeSubject?.id;
                return (
                  <div
                    key={sub.id}
                    onClick={() => setSelectedSubjectId(sub.id)}
                    className={`p-4 rounded-2xl border transition cursor-pointer text-left relative group ${
                      isSelected
                        ? 'bg-orange-50/80 border-orange-400 ring-2 ring-orange-500/20 shadow-md'
                        : 'bg-white border-slate-200 hover:border-slate-300 shadow-2xs'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 bg-red-100 text-red-800 text-[10px] font-black rounded">
                            {sub.credits} Tín chỉ
                          </span>
                          <span className="px-2 py-0.5 bg-slate-100 text-slate-700 text-[10px] font-semibold rounded">
                            {sub.type}
                          </span>
                        </div>
                        <h4 className="font-bold text-slate-900 text-sm mt-1.5 leading-snug">
                          {sub.name}
                        </h4>
                      </div>

                      <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenEdit(sub);
                          }}
                          className="p-1 text-slate-400 hover:text-blue-600 rounded-md"
                          title="Sửa môn học"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteSubject(sub.id);
                          }}
                          className="p-1 text-slate-400 hover:text-red-600 rounded-md"
                          title="Xóa môn học"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <div className="mt-3 pt-2.5 border-t border-slate-100 grid grid-cols-2 gap-2 text-[11px] text-slate-600">
                      <div>
                        <span className="text-slate-400">LT tối đa vắng:</span>{' '}
                        <strong className="text-red-700">{sub.maxAllowedAbsencePeriods} tiết</strong>
                      </div>
                      <div>
                        <span className="text-slate-400">Tổng bài học:</span>{' '}
                        <strong>{sub.lessons.length} bài</strong>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="p-8 text-center bg-white rounded-2xl border border-slate-200 text-slate-400">
              <BookOpen className="w-8 h-8 mx-auto text-slate-300 mb-2" />
              <p className="text-xs font-medium">Lớp này chưa có môn học nào</p>
              <button
                onClick={handleOpenCreate}
                className="mt-3 px-3 py-1.5 bg-orange-600 text-white text-xs font-bold rounded-xl"
              >
                + Thêm môn học ngay
              </button>
            </div>
          )}
        </div>

        {/* Chi tiết Môn học & Quản lý Bài học theo Tổ */}
        <div className="lg:col-span-2 space-y-5">
          {activeSubject ? (
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-6">
              
              {/* Header chi tiết môn */}
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 bg-red-600 text-white text-xs font-black rounded-lg">
                      {activeSubject.credits} Tín chỉ
                    </span>
                    <span className="px-2 py-0.5 bg-blue-100 text-blue-800 text-xs font-bold rounded-lg">
                      {activeSubject.type}
                    </span>
                    <span className="text-xs text-slate-500 font-medium">
                      Lớp {currentClass?.name}
                    </span>
                  </div>
                  <h3 className="text-xl font-black text-slate-900 mt-1">
                    {activeSubject.name}
                  </h3>
                </div>

                <button
                  onClick={() => handleOpenEdit(activeSubject)}
                  className="px-3.5 py-1.5 bg-orange-50 hover:bg-orange-100 text-orange-700 font-bold text-xs rounded-xl border border-orange-200 transition flex items-center gap-1.5"
                >
                  <Edit className="w-3.5 h-3.5" />
                  <span>Chỉnh sửa thông số môn</span>
                </button>
              </div>

              {/* Quy chế vắng & Cấu hình kiểm tra */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                {/* Khối quy định vắng */}
                <div className="p-4 bg-amber-50/70 border border-amber-200 rounded-2xl space-y-2">
                  <div className="flex items-center gap-2 font-bold text-amber-900 text-xs uppercase tracking-wide">
                    <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                    <span>Quy định xét dự thi (KĐĐKDT)</span>
                  </div>
                  <ul className="text-xs text-slate-700 space-y-1.5">
                    <li className="flex items-start gap-1.5">
                      <span className="text-red-600 font-bold">•</span>
                      <span>
                        <strong>Môn Lý thuyết:</strong> Vắng quá <span className="font-bold text-red-600">{activeSubject.maxAllowedAbsencePeriods} tiết</span> sẽ bị <strong>KĐĐKDT</strong> (trừ khi đã học bù).
                      </span>
                    </li>
                    <li className="flex items-start gap-1.5">
                      <span className="text-red-600 font-bold">•</span>
                      <span>
                        <strong>Môn Thực hành:</strong> Vắng <strong>1 bài thực hành</strong> sẽ bị <strong>KĐĐKDT</strong> (nếu chưa hoàn thành học bù).
                      </span>
                    </li>
                    <li className="flex items-start gap-1.5">
                      <span className="text-red-600 font-bold">•</span>
                      <span>
                        <strong>Điểm TB kiểm tra:</strong> Đạt dưới <strong>5.0</strong> là <strong>KĐĐKDT</strong>.
                      </span>
                    </li>
                  </ul>
                </div>

                {/* Khối cấu hình cột điểm kiểm tra */}
                <div className="p-4 bg-blue-50/70 border border-blue-200 rounded-2xl space-y-2">
                  <div className="flex items-center gap-2 font-bold text-blue-900 text-xs uppercase tracking-wide">
                    <Award className="w-4 h-4 text-blue-600 shrink-0" />
                    <span>Quy định bài kiểm tra ({activeSubject.credits} TC)</span>
                  </div>
                  <div className="space-y-1.5 text-xs text-slate-700">
                    <p className="text-[11px] text-slate-500">Hệ thống áp dụng chuẩn hệ số theo số tín chỉ:</p>
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {(activeSubject.gradeConfigs && activeSubject.gradeConfigs.length > 0
                        ? activeSubject.gradeConfigs 
                        : getDefaultGradeConfigs(activeSubject.credits, activeSubject.type)
                      ).map(c => (
                        <span key={c.id} className="px-2.5 py-1 bg-white border border-blue-200 rounded-lg text-xs font-bold text-blue-800 shadow-2xs">
                          {c.name} (Hệ số {c.weight})
                        </span>
                      ))}
                    </div>
                    <p className="text-[11px] text-slate-500 pt-1">
                      <em>Công thức: ĐTB = Tổng (Điểm × Hệ số) / Tổng hệ số</em>
                    </p>
                  </div>
                </div>

              </div>

              {/* Danh sách Bài học của Môn (Phân bài theo Cả lớp / Tổ 1 / Tổ 2) */}
              <div className="space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <ListOrdered className="w-4 h-4 text-orange-600" />
                    <h4 className="font-bold text-slate-800 text-sm">
                      Danh sách bài học & Buổi giảng dạy ({activeSubject.lessons.length} bài)
                    </h4>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleAddLesson('Lý thuyết', 'Cả lớp')}
                      className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition"
                    >
                      + Thêm bài Lý thuyết
                    </button>
                    <button
                      onClick={() => handleAddLesson('Thực hành', 'Tổ 1')}
                      className="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-semibold rounded-lg transition"
                    >
                      + Thêm bài TH (Tổ 1)
                    </button>
                    <button
                      onClick={() => handleAddLesson('Thực hành', 'Tổ 2')}
                      className="px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-semibold rounded-lg transition"
                    >
                      + Thêm bài TH (Tổ 2)
                    </button>
                  </div>
                </div>

                <div className="border border-slate-200 rounded-2xl overflow-hidden">
                  <table className="w-full text-left text-xs text-slate-700">
                    <thead className="bg-slate-100 text-slate-700 font-bold uppercase tracking-wider text-[11px]">
                      <tr>
                        <th className="p-3 w-14 text-center">STT</th>
                        <th className="p-3">Tên Bài học</th>
                        <th className="p-3 text-center">Loại bài</th>
                        <th className="p-3 text-center">Phân đối tượng</th>
                        <th className="p-3 text-center">Số tiết</th>
                        <th className="p-3 text-center w-14">Xóa</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 bg-white">
                      {activeSubject.lessons.map((lesson, idx) => (
                        <tr key={lesson.id} className="hover:bg-slate-50">
                          <td className="p-3 text-center font-bold text-slate-400">{idx + 1}</td>
                          <td className="p-3">
                            <input
                              type="text"
                              value={lesson.name}
                              onChange={(e) => {
                                const newLessons = activeSubject.lessons.map(l => 
                                  l.id === lesson.id ? { ...l, name: e.target.value } : l
                                );
                                const updated = subjects.map(s => s.id === activeSubject.id ? { ...s, lessons: newLessons } : s);
                                onSaveSubjects(updated);
                              }}
                              className="w-full p-1.5 bg-transparent hover:bg-slate-100 focus:bg-white border border-transparent focus:border-slate-300 rounded-lg text-xs font-medium text-slate-900"
                            />
                          </td>
                          <td className="p-3 text-center">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              lesson.type === 'Lý thuyết'
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-blue-100 text-blue-800'
                            }`}>
                              {lesson.type}
                            </span>
                          </td>
                          <td className="p-3 text-center">
                            <select
                              value={lesson.teamAssignment || 'Cả lớp'}
                              onChange={(e) => {
                                const team = e.target.value as any;
                                const newLessons = activeSubject.lessons.map(l => 
                                  l.id === lesson.id ? { ...l, teamAssignment: team } : l
                                );
                                const updated = subjects.map(s => s.id === activeSubject.id ? { ...s, lessons: newLessons } : s);
                                onSaveSubjects(updated);
                              }}
                              className="p-1 bg-slate-50 border border-slate-200 rounded text-xs font-semibold text-slate-700"
                            >
                              <option value="Cả lớp">Cả lớp</option>
                              <option value="Tổ 1">Tổ 1</option>
                              <option value="Tổ 2">Tổ 2</option>
                            </select>
                          </td>
                          <td className="p-3 text-center font-semibold text-slate-800">
                            {lesson.periods} tiết
                          </td>
                          <td className="p-3 text-center">
                            <button
                              onClick={() => {
                                const newLessons = activeSubject.lessons.filter(l => l.id !== lesson.id);
                                const updated = subjects.map(s => s.id === activeSubject.id ? { ...s, lessons: newLessons } : s);
                                onSaveSubjects(updated);
                              }}
                              className="p-1 text-slate-400 hover:text-red-600 rounded"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

              </div>

            </div>
          ) : (
            <div className="p-12 text-center bg-white rounded-2xl border border-slate-200 text-slate-400">
              <p>Chọn một môn học bên trái để xem và chỉnh sửa chi tiết.</p>
            </div>
          )}
        </div>

      </div>

      {/* Modal Thêm/Sửa Môn học */}
      {isCreatingNew && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl p-6 border border-slate-100 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-lg font-bold text-slate-900">
                {editingSubject ? 'Chỉnh sửa Môn học' : 'Thêm Môn học mới cho lớp'}
              </h3>
              <button
                onClick={() => setIsCreatingNew(false)}
                className="p-1 text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveSubjectSubmit} className="space-y-4 pt-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Tên Môn học *
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="VD: Dược lý học, Giải phẫu bệnh, Kỹ thuật Điều dưỡng..."
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold focus:bg-white focus:ring-2 focus:ring-orange-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Lớp áp dụng
                  </label>
                  <select
                    value={classId}
                    onChange={(e) => setClassId(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-orange-500"
                  >
                    {classes.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Số Tín chỉ * (Chọn 1, 2, 2.5, 3.5...)
                  </label>
                  <select
                    value={credits}
                    onChange={(e) => handleCreditChange(Number(e.target.value))}
                    className="w-full p-2.5 bg-orange-50 border border-orange-200 text-orange-900 rounded-xl text-sm font-bold focus:bg-white focus:ring-2 focus:ring-orange-500"
                  >
                    <option value={1}>1 Tín chỉ (2 bài KT: 1 HS1 + 1 HS2)</option>
                    <option value={2}>2 Tín chỉ (2 bài KT: 1 HS1 + 1 HS2)</option>
                    <option value={2.5}>2.5 Tín chỉ (2 bài KT: 1 TH HS1 + 1 LT HS2)</option>
                    <option value={3.5}>3.5 Tín chỉ (3 bài KT: 1 LT HS2 + 2 TH HS1)</option>
                    <option value={3}>3 Tín chỉ</option>
                    <option value={4}>4 Tín chỉ</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Phân loại môn
                  </label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value as SubjectType)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-orange-500"
                  >
                    <option value="Lý thuyết">Lý thuyết thuần túy</option>
                    <option value="Thực hành">Thực hành thuần túy</option>
                    <option value="Kết hợp (LT + TH)">Kết hợp (Lý thuyết + Thực hành)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Số tiết vắng tối đa cho phép (LT) *
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={50}
                    value={maxAllowedAbsencePeriods}
                    onChange={(e) => setMaxAllowedAbsencePeriods(Number(e.target.value))}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-red-700 focus:bg-white focus:ring-2 focus:ring-orange-500"
                  />
                  <span className="text-[10px] text-slate-500">Vắng quá số tiết này sẽ bị KĐĐKDT</span>
                </div>
              </div>

              {/* Cấu hình cột điểm */}
              <div className="pt-3 border-t border-slate-100 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800 block">
                    Cấu hình các cột điểm kiểm tra ({gradeConfigs.length} cột):
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      const newId = `kt_${Date.now()}_hs1`;
                      setGradeConfigs([
                        ...gradeConfigs,
                        { id: newId, name: `Bài KT ${gradeConfigs.length + 1}`, weight: 1, type: 'Lý thuyết' }
                      ]);
                    }}
                    className="px-2 py-1 bg-orange-50 hover:bg-orange-100 text-orange-700 font-bold text-[11px] rounded-lg border border-orange-200 transition"
                  >
                    + Thêm cột điểm
                  </button>
                </div>
                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {gradeConfigs.map((cfg, i) => (
                    <div key={cfg.id} className="flex items-center gap-2 bg-slate-50 p-2 rounded-xl border border-slate-200 text-xs">
                      <span className="w-5 text-center font-bold text-slate-400">{i + 1}</span>
                      <input
                        type="text"
                        value={cfg.name}
                        onChange={(e) => {
                          const updated = [...gradeConfigs];
                          updated[i].name = e.target.value;
                          setGradeConfigs(updated);
                        }}
                        className="flex-1 p-1 bg-white border border-slate-300 rounded font-semibold text-slate-800"
                        placeholder="Tên bài kiểm tra"
                      />
                      <select
                        value={cfg.weight}
                        onChange={(e) => {
                          const updated = [...gradeConfigs];
                          updated[i].weight = Number(e.target.value);
                          setGradeConfigs(updated);
                        }}
                        className="p-1 bg-white border border-slate-300 rounded font-bold text-orange-700"
                      >
                        <option value={1}>HS 1</option>
                        <option value={2}>HS 2</option>
                        <option value={3}>HS 3</option>
                      </select>
                      {gradeConfigs.length > 1 && (
                        <button
                          type="button"
                          onClick={() => {
                            setGradeConfigs(gradeConfigs.filter((_, idx) => idx !== i));
                          }}
                          className="p-1 text-slate-400 hover:text-red-600 rounded"
                          title="Xóa cột"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-4 flex justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsCreatingNew(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-gradient-to-r from-red-600 to-orange-500 hover:from-red-700 hover:to-orange-600 text-white font-bold text-xs rounded-xl shadow-md"
                >
                  {editingSubject ? 'Lưu cập nhật' : 'Tạo Môn học'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
