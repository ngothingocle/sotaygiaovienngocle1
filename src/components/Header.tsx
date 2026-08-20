import React from 'react';
import { 
  BookOpen, 
  GraduationCap, 
  Phone, 
  Mail, 
  ShieldCheck, 
  UserCheck, 
  KeyRound,
  Sparkles,
  Users,
  CalendarCheck,
  Award,
  BarChart3,
  Contact
} from 'lucide-react';
import { TeacherAccount } from '../types';

interface HeaderProps {
  teacherAccount: TeacherAccount;
  onOpenAuthModal: () => void;
  isLoggedIn: boolean;
  onLogout: () => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const Header: React.FC<HeaderProps> = ({
  teacherAccount,
  onOpenAuthModal,
  isLoggedIn,
  onLogout,
  activeTab,
  setActiveTab
}) => {
  const navTabs = [
    {
      id: 'classes',
      label: 'Lớp học & Sinh viên',
      shortLabel: 'Lớp & SV',
      icon: Users,
      badge: 'Đa lớp'
    },
    {
      id: 'subjects',
      label: 'Môn học & Tín chỉ',
      shortLabel: 'Môn học',
      icon: BookOpen,
      badge: 'Chuẩn TC'
    },
    {
      id: 'attendance',
      label: 'Điểm danh & Học bù',
      shortLabel: 'Điểm danh',
      icon: CalendarCheck,
      badge: 'Khấu trừ vắng'
    },
    {
      id: 'grades',
      label: 'Điểm kiểm tra & Xét ĐKDT',
      shortLabel: 'Điểm & ĐKDT',
      icon: Award,
      badge: 'ĐTB < 5.0'
    },
    {
      id: 'profile',
      label: 'Hồ sơ Sinh viên',
      shortLabel: 'Hồ sơ SV',
      icon: Contact,
      badge: 'Trích xuất'
    },
    {
      id: 'reports',
      label: 'Báo cáo & Thống kê',
      shortLabel: 'Báo cáo',
      icon: BarChart3,
      badge: 'Xuất file'
    }
  ];

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-sm">
      {/* Top Banner với thông tin định danh Giáo viên & Hotline */}
      <div className="bg-gradient-to-r from-red-600 via-orange-600 to-amber-500 text-white px-4 py-1.5 text-xs shadow-inner">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1.5 font-bold tracking-wide uppercase bg-black/20 px-2.5 py-0.5 rounded-full text-[11px]">
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              Sổ tay điện tử giảng dạy
            </span>
            <span className="hidden sm:inline-block text-orange-200">|</span>
            <span className="font-semibold text-white tracking-wide text-xs sm:text-[13px]">
              Bộ môn Khoa học cơ bản - Trường Cao đẳng Y tế Thanh Hóa
            </span>
          </div>

          <div className="flex items-center gap-4 text-xs font-medium">
            <a 
              href={`tel:${teacherAccount?.phone || '0948090287'}`} 
              className="flex items-center gap-1 hover:text-amber-200 transition"
              title="Hotline Giáo viên"
            >
              <Phone className="w-3.5 h-3.5 text-amber-300" />
              <span className="font-mono">{teacherAccount?.phone || '0948090287'}</span>
            </a>
            <a 
              href={`mailto:${teacherAccount?.email || 'ngoclecyt@gmail.com'}`} 
              className="hidden md:flex items-center gap-1 hover:text-amber-200 transition"
              title="Email Giáo viên"
            >
              <Mail className="w-3.5 h-3.5 text-amber-300" />
              <span>{teacherAccount?.email || 'ngoclecyt@gmail.com'}</span>
            </a>
            <div className="flex items-center gap-1 bg-white/20 px-2.5 py-0.5 rounded-md font-semibold text-white text-[11px]">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-300" />
              <span>Toàn quyền GV</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Bar */}
      <div className="max-w-7xl mx-auto px-4 py-3">
        <div className="flex items-center justify-between gap-4">
          
          {/* Logo & App Title */}
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-red-600 to-orange-500 flex items-center justify-center text-white shadow-md shadow-orange-500/20 shrink-0">
              <GraduationCap className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl md:text-2xl font-black tracking-tight text-slate-900">
                  Sổ tay giáo viên <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-600 to-orange-600">- Ngọc Lê</span>
                </h1>
              </div>
              <p className="text-xs font-semibold text-slate-600">
                Bộ môn Khoa học cơ bản • Trường Cao đẳng Y tế Thanh Hóa
              </p>
            </div>
          </div>

          {/* Teacher Profile Card & Actions */}
          <div className="flex items-center gap-3">
            <div className="hidden lg:flex items-center gap-2.5 bg-slate-50 border border-slate-200 px-3.5 py-1.5 rounded-2xl">
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-orange-500 to-red-500 flex items-center justify-center text-white font-bold text-xs shadow-xs">
                NL
              </div>
              <div className="text-left text-xs">
                <div className="font-bold text-slate-800 flex items-center gap-1">
                  <span>{teacherAccount?.fullName || 'Cô Ngọc Lê'}</span>
                  <span className="px-1.5 py-0.2 bg-orange-100 text-orange-700 text-[10px] rounded font-bold">GVCN</span>
                </div>
                <div className="text-slate-500 font-mono text-[11px]">{teacherAccount?.phone || '0948090287'}</div>
              </div>
            </div>

            {isLoggedIn ? (
              <div className="flex items-center gap-2">
                <span className="hidden sm:inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-xl text-xs font-bold">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  Đã đăng nhập
                </span>
              </div>
            ) : (
              <button
                onClick={onOpenAuthModal}
                className="px-4 py-2 bg-gradient-to-r from-red-600 to-orange-500 hover:from-red-700 hover:to-orange-600 text-white text-xs font-bold rounded-xl shadow-md transition flex items-center gap-1.5"
              >
                <KeyRound className="w-4 h-4" />
                <span>Đăng nhập Giáo viên</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Navigation Tab Bar - Highly Visible & Responsive */}
      <div className="bg-slate-50/90 border-t border-slate-200 px-2 sm:px-4 py-1.5">
        <div className="max-w-7xl mx-auto flex items-center gap-1.5 sm:gap-2 overflow-x-auto no-scrollbar py-0.5">
          {navTabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all duration-150 shrink-0 ${
                  isActive
                    ? 'bg-gradient-to-r from-red-600 to-orange-600 text-white shadow-md shadow-orange-600/20 scale-[1.02]'
                    : 'bg-white text-slate-700 hover:text-orange-600 hover:bg-orange-50/80 border border-slate-200/80'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-orange-600'}`} />
                <span>{tab.label}</span>
                {tab.badge && (
                  <span
                    className={`hidden md:inline-block px-1.5 py-0.5 rounded-full text-[10px] font-semibold ${
                      isActive
                        ? 'bg-black/20 text-white'
                        : 'bg-slate-100 text-slate-500'
                    }`}
                  >
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </header>
  );
};
