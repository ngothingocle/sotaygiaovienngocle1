export type StudentRole = 
  | 'Lớp trưởng'
  | 'Bí thư'
  | 'Lớp phó học tập'
  | 'Lớp phó đời sống'
  | 'Tổ trưởng Tổ 1'
  | 'Tổ trưởng Tổ 2'
  | 'Sinh viên';

export type Gender = 'Nam' | 'Nữ';

export type PracticeTeam = 'Tổ 1' | 'Tổ 2';

export interface Student {
  id: string;
  studentCode: string; // Mã Sinh viên
  fullName: string;    // Họ tên
  classId: string;     // Thuộc lớp nào
  className: string;   // Tên lớp
  birthYear: number;   // Năm sinh
  gender: Gender;      // Giới tính
  phone: string;       // SĐT SV
  role: StudentRole;   // Cán bộ lớp
  team?: PracticeTeam; // Tổ thực hành (Tổ 1, Tổ 2)
  email?: string;
  address?: string;
  notes?: string;
}

export interface HomeroomTeacher {
  fullName: string;  // Họ tên GVCN
  phone: string;     // Số điện thoại
  department: string;// Bộ môn
}

export interface Major {
  id: string;
  code: string;
  name: string;        // Tên ngành học (e.g., Y Đa khoa, Điều dưỡng, Dược học...)
  description?: string;
}

export interface ClassGroup {
  id: string;
  name: string;        // Tên lớp (e.g. YK2023A, DD2024B...)
  cohort: string;      // Khóa học (e.g., Khóa 45, Khóa 46, K2023...)
  majorId: string;     // Thuộc ngành nào
  majorName: string;   // Tên ngành
  academicYear: string;// Năm học (e.g., 2023-2027)
  homeroomTeacher: HomeroomTeacher; // Thông tin GVCN
  studentCount?: number;
}

export type SubjectType = 'Lý thuyết' | 'Thực hành' | 'Kết hợp (LT + TH)';

export interface Lesson {
  id: string;
  lessonNumber: number;  // Số bài (Bài 1, Bài 2...)
  name: string;          // Tên bài học
  type: 'Lý thuyết' | 'Thực hành';
  periods: number;       // Số tiết (mặc định e.g. 2 - 4 tiết)
  teamAssignment?: 'Cả lớp' | 'Tổ 1' | 'Tổ 2'; // Phân bài theo tổ
  description?: string;
}

export interface GradeWeightConfig {
  id: string;
  name: string;      // e.g., 'Bài KT 1 (HS1)', 'Bài KT TH 1 (HS1)', 'Bài KT LT (HS2)'
  weight: number;    // Hệ số (1 hoặc 2)
  type: 'Lý thuyết' | 'Thực hành' | 'Chung';
}

export interface Subject {
  id: string;
  classId: string;       // Thuộc lớp nào
  name: string;          // Tên môn học (e.g. Giải phẫu bệnh, Dược lý, Điều dưỡng cơ bản...)
  credits: number;       // Số tín chỉ (1, 2, 2.5, 3.5...)
  type: SubjectType;     // Lý thuyết / Thực hành / Kết hợp
  totalTheoryPeriods: number;   // Tổng số tiết lý thuyết
  totalPracticeLessons: number; // Tổng số bài thực hành
  maxAllowedAbsencePeriods: number; // Số tiết vắng quy định tối đa cho phép đối với LT
  lessons: Lesson[];     // Danh sách bài học
  gradeConfigs: GradeWeightConfig[]; // Cấu hình các cột điểm kiểm tra
}

export type AttendanceStatus = 'Có mặt' | 'Vắng có phép' | 'Vắng không phép' | 'Học bù';

export interface AttendanceRecord {
  id: string;
  date: string;          // YYYY-MM-DD
  subjectId: string;     // Thuộc môn nào
  classId: string;       // Lớp học
  lessonId?: string;     // Thuộc bài nào
  lessonName?: string;
  lessonType: 'Lý thuyết' | 'Thực hành';
  team?: 'Cả lớp' | 'Tổ 1' | 'Tổ 2';
  studentId: string;
  studentCode: string;
  studentName: string;
  status: AttendanceStatus;
  missedPeriods: number; // Số tiết vắng trong buổi (với LT) hoặc số bài (1 với TH)
  reason?: string;
  isMakeup?: boolean;
}

export interface MakeupRecord {
  id: string;
  studentId: string;
  studentCode: string;
  studentName: string;
  originalClassId: string;    // Lớp gốc của SV
  originalClassName: string;
  subjectId: string;          // Môn học
  subjectName: string;
  lessonId?: string;          // Bài học cần bù
  lessonName: string;
  lessonType: 'Lý thuyết' | 'Thực hành';
  
  // Thông tin lớp/buổi học bù
  attendedClassId: string;    // Lớp SV tham gia học bù (có thể cùng lớp hoặc khác lớp)
  attendedClassName: string;
  attendedTeam?: PracticeTeam | 'Cả lớp';
  makeupDate: string;         // Ngày học bù (YYYY-MM-DD)
  makeupPeriods: number;      // Số tiết / số bài bù
  notes: string;              // Ghi chú
  verifiedByTeacher: boolean; // GV đã xác nhận
}

export interface StudentGrade {
  studentId: string;
  scores: Record<string, number | null>; // { [gradeConfigId]: score }
  averageScore?: number | null;          // Điểm trung bình các bài kiểm tra
  isDisqualified: boolean;              // Không đủ điều kiện dự thi (KĐĐKDT)
  disqualificationReasons: string[];    // Lý do KĐĐKDT (vắng quá tiết, ĐTB < 5, vắng TH)
  totalAbsencePeriods: number;          // Tổng số tiết vắng lý thuyết (sau khi trừ bù)
  totalAbsencePracticeLessons: number;  // Tổng số bài vắng thực hành (sau khi trừ bù)
  makeupCount: number;                  // Số buổi học bù
}

export interface TeacherAccount {
  username: string; // '0948090287'
  pin: string;      // '12345678'
  fullName: string; // 'Ngọc Lê'
  phone: string;    // '0948090287'
  email: string;    // 'ngoclecyt@gmail.com'
  department: string;// 'Bộ môn Y học cơ sở'
  schoolName: string;
  avatarUrl?: string;
}
