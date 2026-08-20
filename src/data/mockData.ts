import {
  Major,
  ClassGroup,
  Student,
  Subject,
  AttendanceRecord,
  MakeupRecord,
  TeacherAccount
} from '../types';
import { getDefaultGradeConfigs } from '../utils/calculations';

export const initialTeacherAccount: TeacherAccount = {
  username: '0948090287',
  pin: '12345678',
  fullName: 'Cô Ngọc Lê',
  phone: '0948090287',
  email: 'ngoclecyt@gmail.com',
  department: 'Bộ môn Khoa học cơ bản',
  schoolName: 'Trường Cao đẳng Y tế Thanh Hóa'
};

export const initialMajors: Major[] = [
  { id: 'major-1', code: 'YDK', name: 'Y Đa khoa', description: 'Đào tạo Bác sĩ / Y sĩ đa khoa thực hành' },
  { id: 'major-2', code: 'DD', name: 'Điều dưỡng', description: 'Đào tạo Cử nhân Điều dưỡng chuyên nghiệp' },
  { id: 'major-3', code: 'DH', name: 'Dược học', description: 'Đào tạo Dược sĩ lâm sàng và quản lý dược' },
  { id: 'major-4', code: 'PHCN', name: 'Kỹ thuật Phục hồi chức năng', description: 'Kỹ thuật vật lý trị liệu & PHCN' }
];

export const initialClasses: ClassGroup[] = [
  {
    id: 'class-1',
    name: 'YK2023A',
    cohort: 'Khóa 45 (K45)',
    majorId: 'major-1',
    majorName: 'Y Đa khoa',
    academicYear: '2023 - 2027',
    homeroomTeacher: {
      fullName: 'Cô Ngọc Lê',
      phone: '0948090287',
      department: 'Bộ môn Khoa học cơ bản'
    },
    studentCount: 12
  },
  {
    id: 'class-2',
    name: 'DD2024B',
    cohort: 'Khóa 46 (K46)',
    majorId: 'major-2',
    majorName: 'Điều dưỡng',
    academicYear: '2024 - 2027',
    homeroomTeacher: {
      fullName: 'Cô Ngọc Lê',
      phone: '0948090287',
      department: 'Bộ môn Khoa học cơ bản'
    },
    studentCount: 8
  },
  {
    id: 'class-3',
    name: 'DH2023A',
    cohort: 'Khóa 45 (K45)',
    majorId: 'major-3',
    majorName: 'Dược học',
    academicYear: '2023 - 2026',
    homeroomTeacher: {
      fullName: 'ThS. Trần Văn Minh',
      phone: '0912345678',
      department: 'Bộ môn Dược lý & Hóa dược'
    },
    studentCount: 6
  }
];

export const initialStudents: Student[] = [
  // Lớp YK2023A (class-1)
  {
    id: 'sv-101',
    studentCode: 'YK2301',
    fullName: 'Nguyễn Văn An',
    classId: 'class-1',
    className: 'YK2023A',
    birthYear: 2004,
    gender: 'Nam',
    phone: '0981112233',
    role: 'Lớp trưởng',
    team: 'Tổ 1',
    email: 'an.nv@student.edu.vn'
  },
  {
    id: 'sv-102',
    studentCode: 'YK2302',
    fullName: 'Trần Thị Bích Ngọc',
    classId: 'class-1',
    className: 'YK2023A',
    birthYear: 2004,
    gender: 'Nữ',
    phone: '0982223344',
    role: 'Bí thư',
    team: 'Tổ 1',
    email: 'ngoc.ttb@student.edu.vn'
  },
  {
    id: 'sv-103',
    studentCode: 'YK2303',
    fullName: 'Lê Hoàng Cường',
    classId: 'class-1',
    className: 'YK2023A',
    birthYear: 2003,
    gender: 'Nam',
    phone: '0983334455',
    role: 'Lớp phó học tập',
    team: 'Tổ 1',
    email: 'cuong.lh@student.edu.vn'
  },
  {
    id: 'sv-104',
    studentCode: 'YK2304',
    fullName: 'Phạm Quỳnh Dung',
    classId: 'class-1',
    className: 'YK2023A',
    birthYear: 2004,
    gender: 'Nữ',
    phone: '0984445566',
    role: 'Lớp phó đời sống',
    team: 'Tổ 1',
    email: 'dung.pq@student.edu.vn'
  },
  {
    id: 'sv-105',
    studentCode: 'YK2305',
    fullName: 'Vũ Đức Hải',
    classId: 'class-1',
    className: 'YK2023A',
    birthYear: 2004,
    gender: 'Nam',
    phone: '0985556677',
    role: 'Tổ trưởng Tổ 1',
    team: 'Tổ 1',
    email: 'hai.vd@student.edu.vn'
  },
  {
    id: 'sv-106',
    studentCode: 'YK2306',
    fullName: 'Đỗ Thúy Hằng',
    classId: 'class-1',
    className: 'YK2023A',
    birthYear: 2004,
    gender: 'Nữ',
    phone: '0986667788',
    role: 'Sinh viên',
    team: 'Tổ 1',
    email: 'hang.dt@student.edu.vn'
  },
  {
    id: 'sv-107',
    studentCode: 'YK2307',
    fullName: 'Hoàng Minh Khang',
    classId: 'class-1',
    className: 'YK2023A',
    birthYear: 2004,
    gender: 'Nam',
    phone: '0987778899',
    role: 'Tổ trưởng Tổ 2',
    team: 'Tổ 2',
    email: 'khang.hm@student.edu.vn'
  },
  {
    id: 'sv-108',
    studentCode: 'YK2308',
    fullName: 'Ngô Phương Linh',
    classId: 'class-1',
    className: 'YK2023A',
    birthYear: 2004,
    gender: 'Nữ',
    phone: '0988889900',
    role: 'Sinh viên',
    team: 'Tổ 2',
    email: 'linh.np@student.edu.vn'
  },
  {
    id: 'sv-109',
    studentCode: 'YK2309',
    fullName: 'Bùi Thanh Nam',
    classId: 'class-1',
    className: 'YK2023A',
    birthYear: 2003,
    gender: 'Nam',
    phone: '0989990011',
    role: 'Sinh viên',
    team: 'Tổ 2',
    email: 'nam.bt@student.edu.vn'
  },
  {
    id: 'sv-110',
    studentCode: 'YK2310',
    fullName: 'Đặng Mai Phương',
    classId: 'class-1',
    className: 'YK2023A',
    birthYear: 2004,
    gender: 'Nữ',
    phone: '0971112233',
    role: 'Sinh viên',
    team: 'Tổ 2',
    email: 'phuong.dm@student.edu.vn'
  },
  {
    id: 'sv-111',
    studentCode: 'YK2311',
    fullName: 'Trịnh Quốc Quân',
    classId: 'class-1',
    className: 'YK2023A',
    birthYear: 2004,
    gender: 'Nam',
    phone: '0972223344',
    role: 'Sinh viên',
    team: 'Tổ 2',
    email: 'quan.tq@student.edu.vn'
  },
  {
    id: 'sv-112',
    studentCode: 'YK2312',
    fullName: 'Mai Yến Trang',
    classId: 'class-1',
    className: 'YK2023A',
    birthYear: 2004,
    gender: 'Nữ',
    phone: '0973334455',
    role: 'Sinh viên',
    team: 'Tổ 2',
    email: 'trang.my@student.edu.vn'
  },

  // Lớp DD2024B (class-2)
  {
    id: 'sv-201',
    studentCode: 'DD2401',
    fullName: 'Phan Bảo Châu',
    classId: 'class-2',
    className: 'DD2024B',
    birthYear: 2005,
    gender: 'Nữ',
    phone: '0961112233',
    role: 'Lớp trưởng',
    team: 'Tổ 1',
    email: 'chau.pb@student.edu.vn'
  },
  {
    id: 'sv-202',
    studentCode: 'DD2402',
    fullName: 'Lâm Tuấn Đạt',
    classId: 'class-2',
    className: 'DD2024B',
    birthYear: 2005,
    gender: 'Nam',
    phone: '0962223344',
    role: 'Bí thư',
    team: 'Tổ 1',
    email: 'dat.lt@student.edu.vn'
  },
  {
    id: 'sv-203',
    studentCode: 'DD2403',
    fullName: 'Hồ Thảo Ly',
    classId: 'class-2',
    className: 'DD2024B',
    birthYear: 2005,
    gender: 'Nữ',
    phone: '0963334455',
    role: 'Tổ trưởng Tổ 1',
    team: 'Tổ 1',
    email: 'ly.ht@student.edu.vn'
  },
  {
    id: 'sv-204',
    studentCode: 'DD2404',
    fullName: 'Lý Quốc Mạnh',
    classId: 'class-2',
    className: 'DD2024B',
    birthYear: 2005,
    gender: 'Nam',
    phone: '0964445566',
    role: 'Sinh viên',
    team: 'Tổ 1',
    email: 'manh.lq@student.edu.vn'
  },
  {
    id: 'sv-205',
    studentCode: 'DD2405',
    fullName: 'Dương Thị Nga',
    classId: 'class-2',
    className: 'DD2024B',
    birthYear: 2005,
    gender: 'Nữ',
    phone: '0965556677',
    role: 'Tổ trưởng Tổ 2',
    team: 'Tổ 2',
    email: 'nga.dt@student.edu.vn'
  },
  {
    id: 'sv-206',
    studentCode: 'DD2406',
    fullName: 'Vương Gia Phúc',
    classId: 'class-2',
    className: 'DD2024B',
    birthYear: 2005,
    gender: 'Nam',
    phone: '0966667788',
    role: 'Sinh viên',
    team: 'Tổ 2',
    email: 'phuc.vg@student.edu.vn'
  },
  {
    id: 'sv-207',
    studentCode: 'DD2407',
    fullName: 'Cao Kim Oanh',
    classId: 'class-2',
    className: 'DD2024B',
    birthYear: 2005,
    gender: 'Nữ',
    phone: '0967778899',
    role: 'Sinh viên',
    team: 'Tổ 2',
    email: 'oanh.ck@student.edu.vn'
  },
  {
    id: 'sv-208',
    studentCode: 'DD2408',
    fullName: 'Tạ Minh Trí',
    classId: 'class-2',
    className: 'DD2024B',
    birthYear: 2005,
    gender: 'Nam',
    phone: '0968889900',
    role: 'Sinh viên',
    team: 'Tổ 2',
    email: 'tri.tm@student.edu.vn'
  }
];

export const initialSubjects: Subject[] = [
  // Môn 1: Giải phẫu - Sinh lý (3.5 tín chỉ: 1 LT HS2, 2 TH HS1) thuộc lớp YK2023A
  {
    id: 'sub-1',
    classId: 'class-1',
    name: 'Giải phẫu - Sinh lý hệ cơ quan',
    credits: 3.5,
    type: 'Kết hợp (LT + TH)',
    totalTheoryPeriods: 45,
    totalPracticeLessons: 4,
    maxAllowedAbsencePeriods: 9, // Vắng quá 20% (9 tiết) là KĐĐKDT
    lessons: [
      { id: 'les-1', lessonNumber: 1, name: 'Giải phẫu học Hệ tim mạch & Tuần hoàn', type: 'Lý thuyết', periods: 4, teamAssignment: 'Cả lớp' },
      { id: 'les-2', lessonNumber: 2, name: 'Sinh lý học Hô hấp và Trao đổi khí', type: 'Lý thuyết', periods: 4, teamAssignment: 'Cả lớp' },
      { id: 'les-3', lessonNumber: 3, name: 'Giải phẫu - Sinh lý Hệ tiêu hóa & Tiết niệu', type: 'Lý thuyết', periods: 4, teamAssignment: 'Cả lớp' },
      { id: 'les-4', lessonNumber: 4, name: 'Hệ thần kinh và các cơ quan cảm giác', type: 'Lý thuyết', periods: 4, teamAssignment: 'Cả lớp' },
      { id: 'les-5', lessonNumber: 1, name: 'Thực hành 1: Quan sát mô hình tim phổi và mạch máu', type: 'Thực hành', periods: 4, teamAssignment: 'Tổ 1' },
      { id: 'les-6', lessonNumber: 1, name: 'Thực hành 1: Quan sát mô hình tim phổi và mạch máu', type: 'Thực hành', periods: 4, teamAssignment: 'Tổ 2' },
      { id: 'les-7', lessonNumber: 2, name: 'Thực hành 2: Định nhóm máu ABO và đo huyết áp', type: 'Thực hành', periods: 4, teamAssignment: 'Tổ 1' },
      { id: 'les-8', lessonNumber: 2, name: 'Thực hành 2: Định nhóm máu ABO và đo huyết áp', type: 'Thực hành', periods: 4, teamAssignment: 'Tổ 2' },
      { id: 'les-9', lessonNumber: 3, name: 'Thực hành 3: Khám phản xạ thần kinh và cảm giác', type: 'Thực hành', periods: 4, teamAssignment: 'Tổ 1' },
      { id: 'les-10', lessonNumber: 3, name: 'Thực hành 3: Khám phản xạ thần kinh và cảm giác', type: 'Thực hành', periods: 4, teamAssignment: 'Tổ 2' },
      { id: 'les-11', lessonNumber: 4, name: 'Thực hành 4: Tổng hợp kỹ năng khám cơ quan', type: 'Thực hành', periods: 4, teamAssignment: 'Tổ 1' },
      { id: 'les-12', lessonNumber: 4, name: 'Thực hành 4: Tổng hợp kỹ năng khám cơ quan', type: 'Thực hành', periods: 4, teamAssignment: 'Tổ 2' }
    ],
    gradeConfigs: getDefaultGradeConfigs(3.5)
  },

  // Môn 2: Dược lý học đại cương (2 tín chỉ: 1 HS1, 1 HS2) thuộc lớp YK2023A
  {
    id: 'sub-2',
    classId: 'class-1',
    name: 'Dược lý học đại cương',
    credits: 2,
    type: 'Lý thuyết',
    totalTheoryPeriods: 30,
    totalPracticeLessons: 0,
    maxAllowedAbsencePeriods: 6, // Vắng quá 6 tiết là KĐĐKDT
    lessons: [
      { id: 'les-201', lessonNumber: 1, name: 'Dược động học & Dược lực học', type: 'Lý thuyết', periods: 4, teamAssignment: 'Cả lớp' },
      { id: 'les-202', lessonNumber: 2, name: 'Thuốc tác dụng trên hệ thần kinh thực vật', type: 'Lý thuyết', periods: 4, teamAssignment: 'Cả lớp' },
      { id: 'les-203', lessonNumber: 3, name: 'Thuốc kháng sinh và hóa trị liệu', type: 'Lý thuyết', periods: 4, teamAssignment: 'Cả lớp' },
      { id: 'les-204', lessonNumber: 4, name: 'Thuốc hạ sốt, giảm đau, chống viêm', type: 'Lý thuyết', periods: 4, teamAssignment: 'Cả lớp' },
      { id: 'les-205', lessonNumber: 5, name: 'Thuốc tim mạch và lợi tiểu', type: 'Lý thuyết', periods: 4, teamAssignment: 'Cả lớp' }
    ],
    gradeConfigs: getDefaultGradeConfigs(2)
  },

  // Môn 3: Kỹ thuật Điều dưỡng cơ bản (2.5 tín chỉ: 1 TH HS1, 1 LT HS2) thuộc lớp DD2024B
  {
    id: 'sub-3',
    classId: 'class-2',
    name: 'Kỹ thuật Điều dưỡng cơ bản',
    credits: 2.5,
    type: 'Kết hợp (LT + TH)',
    totalTheoryPeriods: 30,
    totalPracticeLessons: 3,
    maxAllowedAbsencePeriods: 6,
    lessons: [
      { id: 'les-301', lessonNumber: 1, name: 'Quy trình điều dưỡng và kỹ năng giao tiếp', type: 'Lý thuyết', periods: 4, teamAssignment: 'Cả lớp' },
      { id: 'les-302', lessonNumber: 2, name: 'Theo dõi dấu hiệu sinh tồn và hồ sơ bệnh án', type: 'Lý thuyết', periods: 4, teamAssignment: 'Cả lớp' },
      { id: 'les-303', lessonNumber: 1, name: 'Thực hành: Đo huyết áp, đếm mạch, thân nhiệt', type: 'Thực hành', periods: 4, teamAssignment: 'Tổ 1' },
      { id: 'les-304', lessonNumber: 1, name: 'Thực hành: Đo huyết áp, đếm mạch, thân nhiệt', type: 'Thực hành', periods: 4, teamAssignment: 'Tổ 2' },
      { id: 'les-305', lessonNumber: 2, name: 'Thực hành: Tiêm thuốc (tiêm trong da, dưới da, bắp, tĩnh mạch)', type: 'Thực hành', periods: 4, teamAssignment: 'Tổ 1' },
      { id: 'les-306', lessonNumber: 2, name: 'Thực hành: Tiêm thuốc (tiêm trong da, dưới da, bắp, tĩnh mạch)', type: 'Thực hành', periods: 4, teamAssignment: 'Tổ 2' },
      { id: 'les-307', lessonNumber: 3, name: 'Thực hành: Truyền dịch và chăm sóc vết thương', type: 'Thực hành', periods: 4, teamAssignment: 'Tổ 1' },
      { id: 'les-308', lessonNumber: 3, name: 'Thực hành: Truyền dịch và chăm sóc vết thương', type: 'Thực hành', periods: 4, teamAssignment: 'Tổ 2' }
    ],
    gradeConfigs: getDefaultGradeConfigs(2.5)
  },

  // Môn 4: Đạo đức & Pháp luật Y tế (1 tín chỉ: 2 bài HS1 & HS2) thuộc lớp YK2023A
  {
    id: 'sub-4',
    classId: 'class-1',
    name: 'Đạo đức & Pháp luật Y tế',
    credits: 1,
    type: 'Lý thuyết',
    totalTheoryPeriods: 15,
    totalPracticeLessons: 0,
    maxAllowedAbsencePeriods: 3,
    lessons: [
      { id: 'les-401', lessonNumber: 1, name: '12 Điều Y đức và Lời thề Hippocrates', type: 'Lý thuyết', periods: 3, teamAssignment: 'Cả lớp' },
      { id: 'les-402', lessonNumber: 2, name: 'Luật Khám bệnh, chữa bệnh Việt Nam', type: 'Lý thuyết', periods: 3, teamAssignment: 'Cả lớp' },
      { id: 'les-403', lessonNumber: 3, name: 'Quyền và nghĩa vụ của Người hành nghề y', type: 'Lý thuyết', periods: 3, teamAssignment: 'Cả lớp' }
    ],
    gradeConfigs: getDefaultGradeConfigs(1)
  }
];

export const initialAttendanceRecords: AttendanceRecord[] = [
  // Điểm danh môn Giải phẫu (sub-1) cho lớp YK2023A
  {
    id: 'att-1',
    date: '2026-03-02',
    subjectId: 'sub-1',
    classId: 'class-1',
    lessonId: 'les-1',
    lessonName: 'Giải phẫu học Hệ tim mạch & Tuần hoàn',
    lessonType: 'Lý thuyết',
    team: 'Cả lớp',
    studentId: 'sv-101',
    studentCode: 'YK2301',
    studentName: 'Nguyễn Văn An',
    status: 'Có mặt',
    missedPeriods: 0
  },
  {
    id: 'att-2',
    date: '2026-03-02',
    subjectId: 'sub-1',
    classId: 'class-1',
    lessonId: 'les-1',
    lessonName: 'Giải phẫu học Hệ tim mạch & Tuần hoàn',
    lessonType: 'Lý thuyết',
    team: 'Cả lớp',
    studentId: 'sv-105',
    studentCode: 'YK2305',
    studentName: 'Vũ Đức Hải',
    status: 'Vắng có phép',
    missedPeriods: 4,
    reason: 'Sốt cao có giấy khám bệnh viện'
  },
  {
    id: 'att-3',
    date: '2026-03-09',
    subjectId: 'sub-1',
    classId: 'class-1',
    lessonId: 'les-2',
    lessonName: 'Sinh lý học Hô hấp và Trao đổi khí',
    lessonType: 'Lý thuyết',
    team: 'Cả lớp',
    studentId: 'sv-109',
    studentCode: 'YK2309',
    studentName: 'Bùi Thanh Nam',
    status: 'Vắng không phép',
    missedPeriods: 4,
    reason: 'Không lý do'
  },
  {
    id: 'att-4',
    date: '2026-03-16',
    subjectId: 'sub-1',
    classId: 'class-1',
    lessonId: 'les-5',
    lessonName: 'Thực hành 1: Quan sát mô hình tim phổi và mạch máu',
    lessonType: 'Thực hành',
    team: 'Tổ 1',
    studentId: 'sv-101',
    studentCode: 'YK2301',
    studentName: 'Nguyễn Văn An',
    status: 'Vắng có phép',
    missedPeriods: 1,
    reason: 'Trùng lịch tham gia hội thao trường'
  },
  {
    id: 'att-5',
    date: '2026-03-16',
    subjectId: 'sub-1',
    classId: 'class-1',
    lessonId: 'les-5',
    lessonName: 'Thực hành 1: Quan sát mô hình tim phổi và mạch máu',
    lessonType: 'Thực hành',
    team: 'Tổ 1',
    studentId: 'sv-103',
    studentCode: 'YK2303',
    studentName: 'Lê Hoàng Cường',
    status: 'Có mặt',
    missedPeriods: 0
  },
  {
    id: 'att-6',
    date: '2026-03-23',
    subjectId: 'sub-1',
    classId: 'class-1',
    lessonId: 'les-7',
    lessonName: 'Thực hành 2: Định nhóm máu ABO và đo huyết áp',
    lessonType: 'Thực hành',
    team: 'Tổ 1',
    studentId: 'sv-111',
    studentCode: 'YK2311',
    studentName: 'Trịnh Quốc Quân',
    status: 'Vắng không phép',
    missedPeriods: 1,
    reason: 'Không phép'
  }
];

export const initialMakeupRecords: MakeupRecord[] = [
  {
    id: 'mk-1',
    studentId: 'sv-101',
    studentCode: 'YK2301',
    studentName: 'Nguyễn Văn An',
    originalClassId: 'class-1',
    originalClassName: 'YK2023A',
    subjectId: 'sub-1',
    subjectName: 'Giải phẫu - Sinh lý hệ cơ quan',
    lessonId: 'les-5',
    lessonName: 'Thực hành 1: Quan sát mô hình tim phổi và mạch máu',
    lessonType: 'Thực hành',
    attendedClassId: 'class-1',
    attendedClassName: 'YK2023A (Học ghép cùng Tổ 2)',
    attendedTeam: 'Tổ 2',
    makeupDate: '2026-03-18',
    makeupPeriods: 1,
    notes: 'Đã hoàn thành đầy đủ bài thực hành mô hình tim phổi cùng Tổ 2',
    verifiedByTeacher: true
  },
  {
    id: 'mk-2',
    studentId: 'sv-105',
    studentCode: 'YK2305',
    studentName: 'Vũ Đức Hải',
    originalClassId: 'class-1',
    originalClassName: 'YK2023A',
    subjectId: 'sub-1',
    subjectName: 'Giải phẫu - Sinh lý hệ cơ quan',
    lessonId: 'les-1',
    lessonName: 'Giải phẫu học Hệ tim mạch & Tuần hoàn',
    lessonType: 'Lý thuyết',
    attendedClassId: 'class-2',
    attendedClassName: 'DD2024B (Lớp Điều dưỡng)',
    attendedTeam: 'Cả lớp',
    makeupDate: '2026-03-20',
    makeupPeriods: 4,
    notes: 'Đã tham gia học bù đủ 4 tiết lý thuyết hệ tuần hoàn lớp DD2024B',
    verifiedByTeacher: true
  }
];

export const initialGrades: Record<string, Record<string, Record<string, number | null>>> = {
  // Structure: [subjectId][studentId][gradeConfigId] = score
  'sub-1': {
    // sub-1 (3.5 TC): kt_th1_hs1, kt_th2_hs1, kt_lt_hs2
    'sv-101': { kt_th1_hs1: 8.5, kt_th2_hs1: 9.0, kt_lt_hs2: 8.0 }, // TB: (8.5*1 + 9.0*1 + 8.0*2)/4 = 33.5/4 = 8.4
    'sv-102': { kt_th1_hs1: 9.0, kt_th2_hs1: 9.5, kt_lt_hs2: 9.0 }, // TB: 9.1
    'sv-103': { kt_th1_hs1: 7.5, kt_th2_hs1: 8.0, kt_lt_hs2: 7.0 }, // TB: 7.4
    'sv-104': { kt_th1_hs1: 8.0, kt_th2_hs1: 7.5, kt_lt_hs2: 8.5 }, // TB: 8.1
    'sv-105': { kt_th1_hs1: 6.5, kt_th2_hs1: 7.0, kt_lt_hs2: 6.5 }, // TB: 6.6
    'sv-106': { kt_th1_hs1: 8.0, kt_th2_hs1: 8.5, kt_lt_hs2: 8.0 }, // TB: 8.1
    'sv-107': { kt_th1_hs1: 7.0, kt_th2_hs1: 7.5, kt_lt_hs2: 7.0 }, // TB: 7.1
    'sv-108': { kt_th1_hs1: 9.0, kt_th2_hs1: 8.5, kt_lt_hs2: 8.5 }, // TB: 8.6
    'sv-109': { kt_th1_hs1: 4.0, kt_th2_hs1: 4.5, kt_lt_hs2: 4.0 }, // TB: 4.1 (< 5 -> KĐĐKDT)
    'sv-110': { kt_th1_hs1: 7.5, kt_th2_hs1: 8.0, kt_lt_hs2: 7.5 }, // TB: 7.6
    'sv-111': { kt_th1_hs1: 6.0, kt_th2_hs1: 6.5, kt_lt_hs2: 6.0 }, // TB: 6.1 (nhưng vắng TH chưa bù -> KĐĐKDT)
    'sv-112': { kt_th1_hs1: 8.5, kt_th2_hs1: 9.0, kt_lt_hs2: 8.5 }  // TB: 8.6
  },
  'sub-2': {
    // sub-2 (2 TC): kt1_hs1, kt2_hs2
    'sv-101': { kt1_hs1: 8.0, kt2_hs2: 8.5 }, // TB: (8*1 + 8.5*2)/3 = 8.3
    'sv-102': { kt1_hs1: 9.0, kt2_hs2: 9.0 },
    'sv-103': { kt1_hs1: 7.0, kt2_hs2: 7.5 },
    'sv-104': { kt1_hs1: 8.5, kt2_hs2: 8.0 },
    'sv-105': { kt1_hs1: 6.5, kt2_hs2: 7.0 },
    'sv-106': { kt1_hs1: 8.0, kt2_hs2: 8.0 },
    'sv-107': { kt1_hs1: 7.5, kt2_hs2: 7.0 },
    'sv-108': { kt1_hs1: 8.5, kt2_hs2: 9.0 },
    'sv-109': { kt1_hs1: 5.0, kt2_hs2: 4.5 }, // TB: 4.7 (< 5 -> KĐĐKDT)
    'sv-110': { kt1_hs1: 7.5, kt2_hs2: 8.0 },
    'sv-111': { kt1_hs1: 6.0, kt2_hs2: 6.5 },
    'sv-112': { kt1_hs1: 8.5, kt2_hs2: 8.5 }
  },
  'sub-3': {
    // sub-3 (2.5 TC): kt_th_hs1, kt_lt_hs2
    'sv-201': { kt_th_hs1: 9.0, kt_lt_hs2: 8.5 },
    'sv-202': { kt_th_hs1: 8.0, kt_lt_hs2: 8.0 },
    'sv-203': { kt_th_hs1: 8.5, kt_lt_hs2: 9.0 },
    'sv-204': { kt_th_hs1: 7.0, kt_lt_hs2: 7.5 },
    'sv-205': { kt_th_hs1: 8.5, kt_lt_hs2: 8.0 },
    'sv-206': { kt_th_hs1: 6.5, kt_lt_hs2: 6.0 },
    'sv-207': { kt_th_hs1: 9.0, kt_lt_hs2: 9.5 },
    'sv-208': { kt_th_hs1: 7.5, kt_lt_hs2: 8.0 }
  }
};
