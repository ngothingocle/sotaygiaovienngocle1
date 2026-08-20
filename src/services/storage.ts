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
import {
  initialTeacherAccount,
  initialMajors,
  initialClasses,
  initialStudents,
  initialSubjects,
  initialAttendanceRecords,
  initialMakeupRecords,
  initialGrades
} from '../data/mockData';

const STORAGE_KEYS = {
  TEACHER: 'so_tay_gv_teacher',
  MAJORS: 'so_tay_gv_majors',
  CLASSES: 'so_tay_gv_classes',
  STUDENTS: 'so_tay_gv_students',
  SUBJECTS: 'so_tay_gv_subjects',
  ATTENDANCE: 'so_tay_gv_attendance',
  MAKEUP: 'so_tay_gv_makeup',
  GRADES: 'so_tay_gv_grades',
  IS_LOGGED_IN: 'so_tay_gv_is_logged_in'
};

function getItem<T>(key: string, fallback: T): T {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : fallback;
  } catch (error) {
    console.error(`Error reading ${key} from localStorage:`, error);
    return fallback;
  }
}

function setItem<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    window.dispatchEvent(new Event('so_tay_gv_storage_updated'));
  } catch (error) {
    console.error(`Error saving ${key} to localStorage:`, error);
  }
}

export const storageService = {
  // Teacher Account
  getTeacherAccount(): TeacherAccount {
    const account = getItem(STORAGE_KEYS.TEACHER, initialTeacherAccount);
    if (account.department.includes('Y học') || account.schoolName === 'Trường Cao đẳng Y tế') {
      account.department = 'Bộ môn Khoa học cơ bản';
      account.schoolName = 'Trường Cao đẳng Y tế Thanh Hóa';
      setItem(STORAGE_KEYS.TEACHER, account);
    }
    return account;
  },
  saveTeacherAccount(account: TeacherAccount): void {
    setItem(STORAGE_KEYS.TEACHER, account);
  },

  // Auth Status
  isLoggedIn(): boolean {
    return getItem(STORAGE_KEYS.IS_LOGGED_IN, true); // Mặc định mở quyền cho GV
  },
  setLoggedIn(status: boolean): void {
    setItem(STORAGE_KEYS.IS_LOGGED_IN, status);
  },

  // Majors
  getMajors(): Major[] {
    return getItem(STORAGE_KEYS.MAJORS, initialMajors);
  },
  saveMajors(majors: Major[]): void {
    setItem(STORAGE_KEYS.MAJORS, majors);
  },

  // Classes
  getClasses(): ClassGroup[] {
    return getItem(STORAGE_KEYS.CLASSES, initialClasses);
  },
  saveClasses(classes: ClassGroup[]): void {
    setItem(STORAGE_KEYS.CLASSES, classes);
  },

  // Students
  getStudents(): Student[] {
    return getItem(STORAGE_KEYS.STUDENTS, initialStudents);
  },
  saveStudents(students: Student[]): void {
    setItem(STORAGE_KEYS.STUDENTS, students);
  },

  // Subjects
  getSubjects(): Subject[] {
    const rawSubjects = getItem(STORAGE_KEYS.SUBJECTS, initialSubjects);
    let changed = false;
    const validated = rawSubjects.map(s => {
      if (!s.gradeConfigs || s.gradeConfigs.length === 0) {
        changed = true;
        return {
          ...s,
          gradeConfigs: getDefaultGradeConfigs(s.credits, s.type)
        };
      }
      return s;
    });
    if (changed) {
      setItem(STORAGE_KEYS.SUBJECTS, validated);
    }
    return validated;
  },
  saveSubjects(subjects: Subject[]): void {
    setItem(STORAGE_KEYS.SUBJECTS, subjects);
  },

  // Attendance
  getAttendance(): AttendanceRecord[] {
    return getItem(STORAGE_KEYS.ATTENDANCE, initialAttendanceRecords);
  },
  saveAttendance(attendance: AttendanceRecord[]): void {
    setItem(STORAGE_KEYS.ATTENDANCE, attendance);
  },

  // Makeups
  getMakeups(): MakeupRecord[] {
    return getItem(STORAGE_KEYS.MAKEUP, initialMakeupRecords);
  },
  saveMakeups(makeups: MakeupRecord[]): void {
    setItem(STORAGE_KEYS.MAKEUP, makeups);
  },

  // Grades: [subjectId][studentId][gradeConfigId] = score
  getGrades(): Record<string, Record<string, Record<string, number | null>>> {
    return getItem(STORAGE_KEYS.GRADES, initialGrades);
  },
  saveGrades(grades: Record<string, Record<string, Record<string, number | null>>>): void {
    setItem(STORAGE_KEYS.GRADES, grades);
  },

  // Reset to default sample
  resetToSample(): void {
    setItem(STORAGE_KEYS.TEACHER, initialTeacherAccount);
    setItem(STORAGE_KEYS.MAJORS, initialMajors);
    setItem(STORAGE_KEYS.CLASSES, initialClasses);
    setItem(STORAGE_KEYS.STUDENTS, initialStudents);
    setItem(STORAGE_KEYS.SUBJECTS, initialSubjects);
    setItem(STORAGE_KEYS.ATTENDANCE, initialAttendanceRecords);
    setItem(STORAGE_KEYS.MAKEUP, initialMakeupRecords);
    setItem(STORAGE_KEYS.GRADES, initialGrades);
    setItem(STORAGE_KEYS.IS_LOGGED_IN, true);
  },

  // Export all data as JSON
  exportBackupJSON(): string {
    const data = {
      teacher: this.getTeacherAccount(),
      majors: this.getMajors(),
      classes: this.getClasses(),
      students: this.getStudents(),
      subjects: this.getSubjects(),
      attendance: this.getAttendance(),
      makeups: this.getMakeups(),
      grades: this.getGrades(),
      exportDate: new Date().toISOString(),
      appName: 'Sổ tay giáo viên - Ngọc Lê'
    };
    return JSON.stringify(data, null, 2);
  },

  // Import all data from JSON
  importBackupJSON(jsonString: string): boolean {
    try {
      const data = JSON.parse(jsonString);
      if (data.teacher) setItem(STORAGE_KEYS.TEACHER, data.teacher);
      if (data.majors) setItem(STORAGE_KEYS.MAJORS, data.majors);
      if (data.classes) setItem(STORAGE_KEYS.CLASSES, data.classes);
      if (data.students) setItem(STORAGE_KEYS.STUDENTS, data.students);
      if (data.subjects) setItem(STORAGE_KEYS.SUBJECTS, data.subjects);
      if (data.attendance) setItem(STORAGE_KEYS.ATTENDANCE, data.attendance);
      if (data.makeups) setItem(STORAGE_KEYS.MAKEUP, data.makeups);
      if (data.grades) setItem(STORAGE_KEYS.GRADES, data.grades);
      return true;
    } catch (e) {
      console.error('Import error:', e);
      return false;
    }
  }
};
