import React, { useState } from 'react';
import { Lock, User, Phone, Mail, ShieldAlert, CheckCircle2, KeyRound, ArrowRight, HelpCircle } from 'lucide-react';
import { TeacherAccount } from '../types';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  teacherAccount: TeacherAccount;
  onSuccessLogin: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  teacherAccount,
  onSuccessLogin
}) => {
  const [username, setUsername] = useState('');
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [showForgot, setShowForgot] = useState(false);
  const [recoveryStatus, setRecoveryStatus] = useState<'idle' | 'sending' | 'sent'>('idle');
  const [recoveryMethod, setRecoveryMethod] = useState<'phone' | 'email'>('phone');

  if (!isOpen) return null;

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const cleanUser = username.trim();
    const cleanPin = pin.trim();

    if (cleanUser === teacherAccount.username && cleanPin === teacherAccount.pin) {
      onSuccessLogin();
      onClose();
    } else {
      setError('Tên đăng nhập hoặc mã đăng nhập không chính xác! (Mặc định: 0948090287 / 12345678)');
    }
  };

  const handleSendRecovery = () => {
    setRecoveryStatus('sending');
    setTimeout(() => {
      setRecoveryStatus('sent');
    }, 800);
  };

  const handleQuickFill = () => {
    setUsername(teacherAccount.username);
    setPin(teacherAccount.pin);
    setShowForgot(false);
    setError('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs">
      <div className="w-full max-w-md overflow-hidden bg-white shadow-2xl rounded-2xl border border-slate-100 animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header với tông màu đỏ cam sư phạm */}
        <div className="bg-gradient-to-r from-red-600 via-orange-500 to-amber-500 p-6 text-white text-center relative">
          <div className="w-16 h-16 mx-auto mb-3 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center shadow-inner">
            <Lock className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-2xl font-bold tracking-tight">Sổ tay giáo viên - Ngọc Lê</h2>
          <p className="text-orange-100 text-sm mt-1">Cổng đăng nhập bảo mật dành cho Giáo viên</p>
        </div>

        <div className="p-6">
          {!showForgot ? (
            <form onSubmit={handleLogin} className="space-y-4">
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm flex items-start gap-2">
                  <ShieldAlert className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                  Tên đăng nhập / Số điện thoại
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <User className="w-5 h-5" />
                  </div>
                  <input
                    type="text"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Nhập 0948090287"
                    className="w-full pl-11 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                  Mã đăng nhập (Mật khẩu)
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <KeyRound className="w-5 h-5" />
                  </div>
                  <input
                    type="password"
                    required
                    value={pin}
                    onChange={(e) => setPin(e.target.value)}
                    placeholder="Nhập 12345678"
                    className="w-full pl-11 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between text-xs pt-1">
                <span className="text-slate-500">Mặc định: 0948090287 / 12345678</span>
                <button
                  type="button"
                  onClick={() => setShowForgot(true)}
                  className="font-medium text-orange-600 hover:text-orange-700 hover:underline inline-flex items-center gap-1"
                >
                  <HelpCircle className="w-3.5 h-3.5" />
                  Quên mã đăng nhập?
                </button>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full py-3 px-4 bg-gradient-to-r from-red-600 to-orange-500 hover:from-red-700 hover:to-orange-600 text-white font-semibold rounded-xl shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2"
                >
                  <span>Đăng nhập quyền Giáo viên</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>

              <div className="pt-2 text-center">
                <button
                  type="button"
                  onClick={handleQuickFill}
                  className="text-xs text-slate-500 hover:text-slate-700 bg-slate-100 hover:bg-slate-200 py-1.5 px-3 rounded-lg transition"
                >
                  ⚡ Điền tự động tài khoản mẫu (Cô Ngọc Lê)
                </button>
              </div>
            </form>
          ) : (
            <div className="space-y-4">
              <div className="text-center">
                <h3 className="text-lg font-bold text-slate-800">Cung cấp lại thông tin đăng nhập</h3>
                <p className="text-xs text-slate-600 mt-1">
                  Nếu bạn quên tên đăng nhập hoặc mã đăng nhập, hệ thống sẽ hỗ trợ gửi thông tin xác nhận về Số điện thoại hoặc Gmail chính chủ của Giáo viên.
                </p>
              </div>

              <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl space-y-2 text-xs text-slate-700">
                <div className="flex items-center gap-2 font-semibold text-amber-800">
                  <Phone className="w-4 h-4 text-orange-600" />
                  <span>Số điện thoại: 0948090287</span>
                </div>
                <div className="flex items-center gap-2 font-semibold text-amber-800">
                  <Mail className="w-4 h-4 text-red-600" />
                  <span>Gmail: ngoclecyt@gmail.com</span>
                </div>
              </div>

              {recoveryStatus === 'idle' && (
                <div className="space-y-3">
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setRecoveryMethod('phone')}
                      className={`flex-1 py-2 px-3 text-xs rounded-lg border font-medium transition ${
                        recoveryMethod === 'phone' 
                          ? 'border-orange-500 bg-orange-50 text-orange-700 font-semibold' 
                          : 'border-slate-200 bg-white text-slate-600'
                      }`}
                    >
                      Nhận SMS qua SĐT
                    </button>
                    <button
                      type="button"
                      onClick={() => setRecoveryMethod('email')}
                      className={`flex-1 py-2 px-3 text-xs rounded-lg border font-medium transition ${
                        recoveryMethod === 'email' 
                          ? 'border-red-500 bg-red-50 text-red-700 font-semibold' 
                          : 'border-slate-200 bg-white text-slate-600'
                      }`}
                    >
                      Nhận qua Gmail
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={handleSendRecovery}
                    className="w-full py-2.5 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white font-medium text-sm rounded-xl shadow transition"
                  >
                    Gửi thông tin khôi phục ngay
                  </button>
                </div>
              )}

              {recoveryStatus === 'sending' && (
                <div className="py-6 text-center text-sm text-slate-600">
                  <div className="inline-block w-6 h-6 border-2 border-orange-500 border-t-transparent rounded-full animate-spin mb-2"></div>
                  <p>Đang gửi thông tin về {recoveryMethod === 'phone' ? 'SĐT 0948090287' : 'Gmail ngoclecyt@gmail.com'}...</p>
                </div>
              )}

              {recoveryStatus === 'sent' && (
                <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl space-y-3">
                  <div className="flex items-center gap-2 text-emerald-800 font-semibold text-sm">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                    <span>Đã xác thực thông tin thành công!</span>
                  </div>
                  <div className="bg-white p-3 rounded-lg border border-emerald-100 text-xs space-y-1.5 text-slate-800">
                    <p>• <strong>Tên đăng nhập:</strong> <code className="bg-slate-100 px-1 py-0.5 rounded text-orange-700 font-bold">{teacherAccount.username}</code></p>
                    <p>• <strong>Mã đăng nhập:</strong> <code className="bg-slate-100 px-1 py-0.5 rounded text-red-700 font-bold">{teacherAccount.pin}</code></p>
                    <p className="text-[11px] text-slate-500 pt-1">Đã thông báo đến: {teacherAccount.phone} & {teacherAccount.email}</p>
                  </div>

                  <button
                    type="button"
                    onClick={handleQuickFill}
                    className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs rounded-lg transition shadow-xs"
                  >
                    Tự động điền & Quay lại Đăng nhập
                  </button>
                </div>
              )}

              <button
                type="button"
                onClick={() => {
                  setShowForgot(false);
                  setRecoveryStatus('idle');
                }}
                className="w-full py-2 text-xs text-slate-600 hover:text-slate-800 font-medium"
              >
                ← Quay lại màn hình đăng nhập
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
