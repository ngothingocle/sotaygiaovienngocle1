import { 
  GradeWeightConfig, 
  Subject, 
  Student, 
  AttendanceRecord, 
  MakeupRecord, 
  StudentGrade 
} from '../types';

/**
 * Tạo danh sách cột điểm kiểm tra mặc định theo số tín chỉ
 */
export function getDefaultGradeConfigs(credits: number, subjectType?: string): GradeWeightConfig[] {
  if (credits === 1) {
    return [
      { id: 'kt1_hs1', name: 'Bài KT 1 (HS1)', weight: 1, type: 'Lý thuyết' },
      { id: 'kt2_hs2', name: 'Bài KT 2 (HS2)', weight: 2, type: 'Lý thuyết' }
    ];
  } else if (credits === 2) {
    return [
      { id: 'kt1_hs1', name: 'Bài KT 1 (HS1)', weight: 1, type: 'Lý thuyết' },
      { id: 'kt2_hs2', name: 'Bài KT 2 (HS2)', weight: 2, type: 'Lý thuyết' }
    ];
  } else if (credits === 2.5) {
    return [
      { id: 'kt_th_hs1', name: 'Bài KT Thực hành (HS1)', weight: 1, type: 'Thực hành' },
      { id: 'kt_lt_hs2', name: 'Bài KT Lý thuyết (HS2)', weight: 2, type: 'Lý thuyết' }
    ];
  } else if (credits === 3.5) {
    return [
      { id: 'kt_th1_hs1', name: 'Bài KT Thực hành 1 (HS1)', weight: 1, type: 'Thực hành' },
      { id: 'kt_th2_hs1', name: 'Bài KT Thực hành 2 (HS1)', weight: 1, type: 'Thực hành' },
      { id: 'kt_lt_hs2', name: 'Bài KT Lý thuyết (HS2)', weight: 2, type: 'Lý thuyết' }
    ];
  } else if (subjectType === 'Thực hành') {
    return [
      { id: 'kt_th1_hs1', name: 'Bài KT Thực hành 1 (HS1)', weight: 1, type: 'Thực hành' },
      { id: 'kt_th2_hs2', name: 'Bài KT Thực hành 2 (HS2)', weight: 2, type: 'Thực hành' }
    ];
  }

  // Mặc định tổng quát
  return [
    { id: 'kt1_hs1', name: 'Bài KT Thường xuyên (HS1)', weight: 1, type: 'Chung' },
    { id: 'kt2_hs2', name: 'Bài KT Định kỳ (HS2)', weight: 2, type: 'Chung' }
  ];
}

/**
 * Tính điểm trung bình môn học từ danh sách điểm và hệ số
 * Thuật toán: (tất cả điểm * hệ số tương ứng) / tổng hệ số
 * Làm tròn 1 chữ số thập phân (hoặc 2 chữ số)
 */
export function calculateAverageGrade(
  scores: Record<string, number | null>,
  configs: GradeWeightConfig[],
  precision: number = 1
): number | null {
  let weightedSum = 0;
  let totalWeight = 0;
  let hasValidScore = false;

  for (const config of configs) {
    const score = scores[config.id];
    if (score !== undefined && score !== null && !isNaN(score)) {
      weightedSum += score * config.weight;
      totalWeight += config.weight;
      hasValidScore = true;
    }
  }

  if (!hasValidScore || totalWeight === 0) {
    return null;
  }

  const avg = weightedSum / totalWeight;
  return Number(avg.toFixed(precision));
}

/**
 * Tính toán số tiết vắng, số buổi học bù, điểm trung bình và xét KĐĐKDT cho 1 sinh viên
 */
export function evaluateStudentSubjectStatus(
  student: Student,
  subject: Subject,
  studentScores: Record<string, number | null> | undefined,
  attendanceRecords: AttendanceRecord[],
  makeupRecords: MakeupRecord[]
): StudentGrade {
  // Lọc điểm danh của sinh viên này trong môn này
  const studentAttendance = attendanceRecords.filter(
    r => r.studentId === student.id && r.subjectId === subject.id
  );

  // Tính số tiết vắng lý thuyết thô
  const rawTheoryMissed = studentAttendance
    .filter(r => r.lessonType === 'Lý thuyết' && (r.status === 'Vắng có phép' || r.status === 'Vắng không phép'))
    .reduce((sum, r) => sum + (r.missedPeriods || 0), 0);

  // Tính số bài vắng thực hành thô
  const rawPracticeMissed = studentAttendance
    .filter(r => r.lessonType === 'Thực hành' && (r.status === 'Vắng có phép' || r.status === 'Vắng không phép'))
    .length;

  // Lọc số buổi học bù đã được xác nhận của SV cho môn này
  const studentMakeups = makeupRecords.filter(
    m => m.studentId === student.id && m.subjectId === subject.id && m.verifiedByTeacher
  );

  const makeupTheoryPeriods = studentMakeups
    .filter(m => m.lessonType === 'Lý thuyết')
    .reduce((sum, m) => sum + (m.makeupPeriods || 0), 0);

  const makeupPracticeLessons = studentMakeups
    .filter(m => m.lessonType === 'Thực hành')
    .reduce((sum, m) => sum + (m.makeupPeriods || 1), 0);

  // Số tiết / bài vắng sau khi trừ học bù
  const netTheoryMissed = Math.max(0, rawTheoryMissed - makeupTheoryPeriods);
  const netPracticeMissed = Math.max(0, rawPracticeMissed - makeupPracticeLessons);

  // Tính Điểm Trung Bình
  const scores = studentScores || {};
  const averageScore = calculateAverageGrade(scores, subject.gradeConfigs, 1);

  // Xét Không đủ điều kiện dự thi (KĐĐKDT)
  const disqualificationReasons: string[] = [];

  // 1. Vắng quá số tiết quy định (đối với Lý thuyết)
  if (subject.maxAllowedAbsencePeriods > 0 && netTheoryMissed > subject.maxAllowedAbsencePeriods) {
    disqualificationReasons.push(
      `Vắng ${netTheoryMissed} tiết LT (vượt quá ${subject.maxAllowedAbsencePeriods} tiết quy định)`
    );
  }

  // 2. Vắng bài thực hành chưa học bù (đối với Thực hành)
  if (netPracticeMissed > 0) {
    disqualificationReasons.push(
      `Vắng ${netPracticeMissed} bài thực hành chưa hoàn thành học bù`
    );
  }

  // 3. Điểm trung bình các bài kiểm tra < 5.0 (theo quy chế: ĐTB môn < 5.0 không đủ điều kiện dự thi)
  if (averageScore !== null && averageScore < 5.0) {
    disqualificationReasons.push(
      `Điểm TB môn đạt ${averageScore.toFixed(1)} < 5.0 (Không đủ điều kiện dự thi)`
    );
  }

  const isDisqualified = disqualificationReasons.length > 0;

  return {
    studentId: student.id,
    scores,
    averageScore,
    isDisqualified,
    disqualificationReasons,
    totalAbsencePeriods: netTheoryMissed,
    totalAbsencePracticeLessons: netPracticeMissed,
    makeupCount: studentMakeups.length
  };
}

/**
 * Định dạng hiển thị điểm số
 */
export function formatScore(score: number | null | undefined): string {
  if (score === null || score === undefined || isNaN(score)) return '-';
  return score.toFixed(1);
}
