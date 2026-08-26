import React, { useState } from "react";
import { X, Lock, User as UserIcon, Sparkles, CheckCircle2, ShieldAlert, ArrowRight, Chrome, Check, ExternalLink, ShieldCheck, KeyRound } from "lucide-react";
import { signInWithGoogle, signInWithUsername, signUpWithUsername, getFriendlyAuthErrorMessage } from "../lib/firebase";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  initialMode?: "signin" | "signup";
}

export default function AuthModal({
  isOpen,
  onClose,
  onSuccess,
  initialMode = "signin"
}: AuthModalProps) {
  const [activeTab, setActiveTab] = useState<"google" | "username">("google");
  const [isSignUp, setIsSignUp] = useState(initialMode === "signup");
  
  // Username Form state (Zero email collection)
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [nickname, setNickname] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // Terms and Conditions Agreement State
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [agreePrivacy, setAgreePrivacy] = useState(false);
  const [agreeMarketing, setAgreeMarketing] = useState(false);
  const [viewingDoc, setViewingDoc] = useState<"terms" | "privacy" | null>(null);

  if (!isOpen) return null;

  const handleAllAgreeToggle = (checked: boolean) => {
    setAgreeTerms(checked);
    setAgreePrivacy(checked);
    setAgreeMarketing(checked);
  };

  const isAllAgreed = agreeTerms && agreePrivacy && agreeMarketing;

  const handleGoogleLogin = async () => {
    setErrorMsg("");
    setLoading(true);
    try {
      await signInWithGoogle();
      setSuccessMsg("Google 계정으로 로그인되었습니다. (정회원 혜택 적용)");
      setTimeout(() => {
        onClose();
        if (onSuccess) onSuccess();
      }, 1000);
    } catch (err: any) {
      if (err.code !== "auth/popup-closed-by-user") {
        setErrorMsg(getFriendlyAuthErrorMessage(err));
      }
    } finally {
      setLoading(false);
    }
  };

  const handleUsernameSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");

    const cleanUsername = username.trim();
    if (!cleanUsername || !password.trim()) {
      setErrorMsg("아이디와 비밀번호를 모두 입력해 주세요.");
      return;
    }

    // Strict Korean/English/Number validation (No special chars or email @ codes)
    const usernameRegex = /^[a-zA-Z가-힣0-9]{2,16}$/;
    if (!usernameRegex.test(cleanUsername)) {
      setErrorMsg("아이디는 2~16자의 한글, 영문, 숫자로만 입력할 수 있습니다. (특수문자 및 기호 제외)");
      return;
    }

    if (password.length < 6) {
      setErrorMsg("비밀번호는 최소 6자리 이상이어야 합니다.");
      return;
    }

    if (isSignUp) {
      if (!agreeTerms || !agreePrivacy) {
        setErrorMsg("서비스 이용약관 및 개인정보 수집·이용에 필수 동의해 주세요.");
        return;
      }
    }

    setLoading(true);
    try {
      if (isSignUp) {
        await signUpWithUsername(cleanUsername, password, nickname || undefined);
        setSuccessMsg("일반 회원가입이 완료되었습니다.");
      } else {
        await signInWithUsername(cleanUsername, password);
        setSuccessMsg("로그인되었습니다. 환영합니다.");
      }

      setTimeout(() => {
        onClose();
        if (onSuccess) onSuccess();
      }, 1200);
    } catch (err: any) {
      console.error("Auth error:", err);
      setErrorMsg(getFriendlyAuthErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-fade-in overflow-y-auto">
      <div 
        className="bg-[#FFFDF9] border border-[#E0D8CC] rounded-3xl w-full max-w-md p-5 sm:p-7 shadow-2xl space-y-4 relative my-auto max-h-[95vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Decorative Top Accent */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-amber-600 via-red-600 to-amber-700" />

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-full text-[#5C5046] hover:text-[#2C3E50] hover:bg-black/5 transition cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="text-center space-y-1 pt-1">
          <div className="inline-flex items-center gap-1.5 text-xs font-serif font-bold text-amber-800 bg-amber-50 px-3 py-1 rounded-full border border-amber-200 mb-1">
            <ShieldCheck className="w-3.5 h-3.5 text-amber-700" />
            인연사주(因緣四柱) 회원 서비스
          </div>
          <h3 className="font-serif font-black text-xl text-[#2C3E50]">
            {isSignUp ? "회원가입" : "로그인"}
          </h3>
          <p className="text-xs text-[#5C5046]">
            Google 간편로그인 또는 간편 아이디 계정으로 시작하세요
          </p>
        </div>

        {/* Tab Selection (Grid 2-cols to prevent overflow) */}
        <div className="grid grid-cols-2 gap-1 bg-[#F5EFE6] p-1 rounded-2xl border border-[#E0D8CC] text-xs font-serif font-bold">
          <button
            type="button"
            onClick={() => { setActiveTab("google"); setErrorMsg(""); }}
            className={`py-2 px-2 rounded-xl transition flex items-center justify-center gap-1 cursor-pointer overflow-hidden ${
              activeTab === "google"
                ? "bg-white text-[#2C3E50] shadow-xs"
                : "text-[#5C5046] hover:text-[#2C3E50]"
            }`}
          >
            <Chrome className="w-3.5 h-3.5 text-rose-600 shrink-0" />
            <span className="text-[11px] sm:text-xs truncate">Google 연동</span>
            <span className="text-[8.5px] bg-amber-100 text-amber-900 px-1 py-0.2 rounded font-mono shrink-0 whitespace-nowrap">정회원</span>
          </button>
          
          <button
            type="button"
            onClick={() => { setActiveTab("username"); setErrorMsg(""); }}
            className={`py-2 px-2 rounded-xl transition flex items-center justify-center gap-1 cursor-pointer overflow-hidden ${
              activeTab === "username"
                ? "bg-white text-[#2C3E50] shadow-xs"
                : "text-[#5C5046] hover:text-[#2C3E50]"
            }`}
          >
            <UserIcon className="w-3.5 h-3.5 text-amber-700 shrink-0" />
            <span className="text-[11px] sm:text-xs truncate">아이디 가입</span>
            <span className="text-[8.5px] bg-gray-100 text-gray-700 px-1 py-0.2 rounded font-mono shrink-0 whitespace-nowrap">일반</span>
          </button>
        </div>

        {/* Error / Success Feedback */}
        {errorMsg && (
          <div className="flex items-start gap-2 bg-rose-50 border border-rose-200 text-rose-800 text-xs p-3 rounded-2xl animate-shake">
            <ShieldAlert className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="flex items-start gap-2 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs p-3 rounded-2xl">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600 mt-0.5" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* TAB 1: GOOGLE ONE-CLICK SIGN IN */}
        {activeTab === "google" && (
          <div className="space-y-4 pt-1">
            <div className="bg-[#FAF7F2] p-4 rounded-2xl border border-[#E8E0D0] text-xs text-[#5A4D41] space-y-2 text-left">
              <div className="flex items-center gap-2 font-serif font-bold text-[#2C3E50]">
                <Sparkles className="w-4 h-4 text-amber-600" />
                <span>Google 정회원 권한 안내</span>
              </div>
              <ul className="space-y-1.5 text-[11px] text-[#5C5046]">
                <li className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                  <span>내 팀/동아리 모임방 <strong>무제한 신규 개설 (방장)</strong></span>
                </li>
                <li className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                  <span>오픈베타 <strong>1회 확인권 및 프로모션 쿠폰</strong> 등록/사용</span>
                </li>
                <li className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                  <span>심층 명리 리포트 PDF 및 인연 상점 이용 권한</span>
                </li>
              </ul>
            </div>

            <button
              onClick={handleGoogleLogin}
              disabled={loading}
              className="w-full flex items-center justify-center gap-3 bg-[#2C3E50] hover:bg-[#1A252F] text-white py-3.5 px-4 rounded-2xl font-serif font-bold text-sm shadow-md transition disabled:opacity-50 cursor-pointer active:scale-98"
            >
              <Chrome className="w-5 h-5 text-amber-400" />
              <span>{loading ? "Google 연결 중..." : "Google 계정으로 원클릭 로그인"}</span>
              <ArrowRight className="w-4 h-4 text-white/60 ml-auto" />
            </button>

            {/* Google Terms Consent Notice */}
            <p className="text-[11px] text-[#5C5046] text-center leading-relaxed">
              Google 로그인 시 인연사주의{" "}
              <button
                type="button"
                onClick={() => setViewingDoc("terms")}
                className="text-[#C0392B] underline font-medium hover:text-[#9E2A2B]"
              >
                이용약관
              </button>
              {" 및 "}
              <button
                type="button"
                onClick={() => setViewingDoc("privacy")}
                className="text-[#C0392B] underline font-medium hover:text-[#9E2A2B]"
              >
                개인정보 처리방침
              </button>
              에 동의하는 것으로 처리됩니다.
            </p>
          </div>
        )}

        {/* TAB 2: USERNAME SIGN UP / SIGN IN (ZERO EMAIL COLLECTION) */}
        {activeTab === "username" && (
          <form onSubmit={handleUsernameSubmit} className="space-y-3 text-left">
            {/* Notice about regular membership (No email collected) */}
            <div className="bg-[#FAF7F2] p-3 rounded-2xl border border-[#E8E0D0] text-[11px] text-[#5C5046] leading-relaxed">
              <strong>일반회원 안내</strong>: SNS 계정 연동이나 이메일 수집 없이 한글 또는 영문 아이디로 간편하게 참여하는 계정입니다. 타인 모임방 참여 및 개인 명식 조회가 가능하며, 추후 필요 시 언제든 Google 연동으로 정회원 승급이 가능합니다.
            </div>

            <div className="space-y-1">
              <label className="text-xs font-serif font-bold text-[#5A4D41] flex items-center gap-1.5">
                <UserIcon className="w-3.5 h-3.5 text-amber-700" />
                아이디 (한글 또는 영문)
              </label>
              <input
                type="text"
                required
                placeholder="예: 홍길동, sajudosa"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full bg-[#FAF7F2] border border-[#E8E0D0] focus:border-amber-600 rounded-xl px-3 py-2 text-xs text-[#2C3E50] outline-hidden"
              />
              <p className="text-[10px] text-[#A3998E]">
                * 2~16자의 한글 또는 영문/숫자 (이메일 및 특수문자 제외)
              </p>
            </div>

            {isSignUp && (
              <div className="space-y-1">
                <label className="text-xs font-serif font-bold text-[#5A4D41] flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-700" />
                  닉네임 (선택)
                </label>
                <input
                  type="text"
                  placeholder="미입력 시 아이디로 자동 설정됩니다"
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                  className="w-full bg-[#FAF7F2] border border-[#E8E0D0] focus:border-amber-600 rounded-xl px-3 py-2 text-xs text-[#2C3E50] outline-hidden"
                />
              </div>
            )}

            <div className="space-y-1">
              <label className="text-xs font-serif font-bold text-[#5A4D41] flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-amber-700" />
                비밀번호 (6자리 이상)
              </label>
              <input
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-[#FAF7F2] border border-[#E8E0D0] focus:border-amber-600 rounded-xl px-3 py-2 text-xs text-[#2C3E50] outline-hidden"
              />
            </div>

            {/* Terms and Agreements Section for Sign Up */}
            {isSignUp && (
              <div className="bg-[#FAF7F2] border border-[#E8E0D0] rounded-2xl p-3 space-y-2 text-xs">
                {/* All Agree Checkbox */}
                <label className="flex items-center justify-between pb-2 border-b border-[#E8E0D0] cursor-pointer select-none">
                  <span className="font-serif font-bold text-[#2C3E50]">약관 전체 동의하기</span>
                  <input
                    type="checkbox"
                    checked={isAllAgreed}
                    onChange={(e) => handleAllAgreeToggle(e.target.checked)}
                    className="w-4 h-4 text-[#C0392B] accent-[#C0392B] rounded cursor-pointer"
                  />
                </label>

                {/* Terms of Service (Required) */}
                <div className="flex items-center justify-between text-[11px] text-[#5A4D41]">
                  <label className="flex items-center gap-1.5 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={agreeTerms}
                      onChange={(e) => setAgreeTerms(e.target.checked)}
                      className="w-3.5 h-3.5 text-[#C0392B] accent-[#C0392B] rounded cursor-pointer"
                    />
                    <span><strong className="text-[#C0392B]">[필수]</strong> 서비스 이용약관 동의</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => setViewingDoc("terms")}
                    className="text-[#5C5046] underline hover:text-[#2C3E50] text-[10px]"
                  >
                    전문 보기
                  </button>
                </div>

                {/* Privacy Policy (Required) */}
                <div className="flex items-center justify-between text-[11px] text-[#5A4D41]">
                  <label className="flex items-center gap-1.5 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={agreePrivacy}
                      onChange={(e) => setAgreePrivacy(e.target.checked)}
                      className="w-3.5 h-3.5 text-[#C0392B] accent-[#C0392B] rounded cursor-pointer"
                    />
                    <span><strong className="text-[#C0392B]">[필수]</strong> 개인정보 수집 및 이용 동의</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => setViewingDoc("privacy")}
                    className="text-[#5C5046] underline hover:text-[#2C3E50] text-[10px]"
                  >
                    전문 보기
                  </button>
                </div>

                {/* Marketing (Optional) */}
                <div className="flex items-center justify-between text-[11px] text-[#5A4D41]">
                  <label className="flex items-center gap-1.5 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={agreeMarketing}
                      onChange={(e) => setAgreeMarketing(e.target.checked)}
                      className="w-3.5 h-3.5 text-[#C0392B] accent-[#C0392B] rounded cursor-pointer"
                    />
                    <span>[선택] 혜택 및 운세 알림 수신 동의</span>
                  </label>
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-amber-700 to-red-700 hover:from-amber-800 hover:to-red-800 text-white py-3 px-4 rounded-2xl font-serif font-bold text-xs shadow-md transition disabled:opacity-50 mt-2 cursor-pointer active:scale-98"
            >
              {loading ? "처리 중..." : isSignUp ? "약관 동의하고 일반회원 가입 완료" : "아이디로 로그인"}
            </button>

            {/* Toggle SignUp / SignIn */}
            <div className="text-center pt-1">
              <button
                type="button"
                onClick={() => { setIsSignUp(!isSignUp); setErrorMsg(""); }}
                className="text-xs text-[#5C5046] hover:text-[#2C3E50] underline font-sans cursor-pointer"
              >
                {isSignUp ? "이미 계정이 있으신가요? 아이디 로그인" : "계정이 없으신가요? 간편 아이디 회원가입"}
              </button>
            </div>
          </form>
        )}

        {/* Terms / Privacy Document Modal Popup */}
        {viewingDoc && (
          <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-fade-in">
            <div className="bg-white border border-[#E0D8CC] rounded-3xl w-full max-w-lg p-6 shadow-2xl space-y-4 max-h-[85vh] overflow-y-auto text-left relative">
              <div className="flex items-center justify-between border-b border-[#E8E0D0] pb-3">
                <h4 className="font-serif font-bold text-base text-[#2C3E50]">
                  {viewingDoc === "terms" ? "서비스 이용약관" : "개인정보 수집 및 이용 동의"}
                </h4>
                <button
                  type="button"
                  onClick={() => setViewingDoc(null)}
                  className="p-1.5 rounded-full hover:bg-black/5 text-gray-500 hover:text-gray-800 transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {viewingDoc === "terms" ? (
                <div className="space-y-3.5 text-xs text-[#5A524A] leading-relaxed">
                  <div className="bg-[#FAF7F2] p-3 rounded-xl border border-[#E8E0D0] text-[11px] text-[#7A6B5D]">
                    인연사주(因緣四柱)는 정보통신망 이용촉진 및 정보보호 등에 관한 법률 및 전자상거래법 등 관계 법령을 준수합니다.
                  </div>

                  <p className="font-bold text-[#2C3E50]">제 1 조 (목적)</p>
                  <p>본 약관은 인연사주(이하 "서비스")가 제공하는 동양 명리학 기반 만세력 계산, 오행 분석 및 1:1·그룹 궁합 매칭 서비스(이하 "서비스")의 이용과 관련하여 회사와 이용자의 권리, 의무 및 책임사항, 기타 필요한 사항을 규정함을 목적으로 합니다.</p>
                  
                  <p className="font-bold text-[#2C3E50]">제 2 조 (서비스의 제공 및 성격)</p>
                  <p>1. 서비스는 이용자가 입력한 생년월일시 및 출생지를 기반으로 정통 천문 만세력 절기식에 따른 명식 및 오행 분포 분석을 제공합니다.<br />
                  2. 본 분석 결과는 상호 소통 및 성향 이해를 돕기 위한 문화·엔터테인먼트 콘텐츠로서, 의학적·법률적·재정적 판단의 직접적 근거로 사용할 수 없습니다.</p>

                  <p className="font-bold text-[#2C3E50]">제 3 조 (이용자의 의무 및 금지행위)</p>
                  <p>1. 이용자는 타인의 정보를 도용하거나 허위 사실을 입력하여 서비스를 부정 이용할 수 없습니다.<br />
                  2. 서비스를 이용하여 취득한 타인의 명식 정보를 당사자의 명시적 동의 없이 외부에 무단 유출하거나 상업적으로 재배포할 수 없습니다.<br />
                  3. 비정상적인 반복 호출, 크롤링, 리버스 엔지니어링 등 서비스의 안정적 운영을 저해하는 일체의 행위를 금합니다.</p>

                  <p className="font-bold text-[#2C3E50]">제 4 조 (데이터 보관 및 자동 파기)</p>
                  <p>1. 이용자가 생성한 임시 모임방 및 참여 명식 데이터는 방 생성일로부터 30일 경과 시 데이터베이스에서 영구 자동 파기됩니다.<br />
                  2. 이용자는 회원 탈퇴 기능을 통해 언제든지 본인의 모든 계정 및 등록 데이터를 즉시 완전 삭제할 수 있습니다.</p>

                  <p className="font-bold text-[#2C3E50]">제 5 조 (면책 및 분쟁 해결)</p>
                  <p>서비스는 천재지변, 불가항력적 클라우드 네트워크 장애 또는 이용자의 귀책사유로 인한 데이터 손실에 대해 책임을 지지 않으며, 분쟁 발생 시 관계 법령에 따른 관할 법원을 통하여 원만히 해결합니다.</p>
                </div>
              ) : (
                <div className="space-y-3.5 text-xs text-[#5A524A] leading-relaxed">
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-[11px] text-slate-800">
                    🔒 <strong>인연사주 개인정보 처리방침 고지</strong><br />
                    본 방침은 「개인정보 보호법」 제30조에 따라 정보주체의 개인정보를 보호하고 관련 고충을 신속하게 처리하기 위하여 수립·공개합니다.
                  </div>

                  <p className="font-bold text-[#2C3E50]">1. 개인정보의 처리 목적</p>
                  <p>서비스는 다음의 목적을 위해서만 개인정보를 처리하며, 목적 외의 용도로는 절대 사용하지 않습니다.</p>
                  <ul className="list-disc pl-4 space-y-1 text-[11px] text-[#6A5E53]">
                    <li><strong>만세력 및 궁합 분석</strong>: 정통 24절기 천문 역산, 오행 생극제화 계산 및 그룹 케미스트리 리포트 산출</li>
                    <li><strong>회원 관리</strong>: 회원 식별, 계정 인증, 본인 의사 확인, 1회 확인권/쿠폰 정상 발급 및 소모 관리</li>
                    <li><strong>보안 및 부정 이용 방지</strong>: 비인가 접근 차단, 서비스 악용 방지 및 통신보안 로그 관리</li>
                  </ul>

                  <p className="font-bold text-[#2C3E50]">2. 처리하는 개인정보 항목 및 수집 방법</p>
                  <ul className="list-disc pl-4 space-y-1 text-[11px] text-[#6A5E53]">
                    <li><strong>일반 회원가입 시</strong>: 사용자 식별 아이디, 비밀번호(일방향 암호화 저장), 닉네임</li>
                    <li><strong>Google 간편 로그인 시</strong>: 소셜 UID(식별값), 닉네임, 프로필 이메일</li>
                    <li><strong>사주 명식 산출 시</strong>: 생년월일, 태어난 시각(선택), 성별, 출생지역(시/도, 시/군/구)</li>
                    <li><strong>서비스 이용 중 자동 생성</strong>: 접속 IP 주소, 서비스 이용 로그, 비정상 접속 기록</li>
                    <li><em>※ 주민등록번호, 연락처, 카드 결제 정보 등 불필요한 민감 정보는 일체 수집하거나 보관하지 않습니다.</em></li>
                  </ul>

                  <p className="font-bold text-[#2C3E50]">3. 개인정보의 처리 및 보유 기간</p>
                  <p>• <strong>회원 탈퇴 시</strong>: 모든 개인식별 정보 및 저장된 명식 데이터는 지체 없이 즉시 영구 파기됩니다.<br />
                  • <strong>모임방 참여 데이터</strong>: 생성일 기준 30일 경과 시 데이터베이스에서 영구 자동 삭제됩니다.<br />
                  • <strong>관계 법령에 따른 보존</strong>: 통신비밀보호법 제15조의2에 따른 접속 로그 기록(3개월 보관 후 자동 파기).</p>

                  <p className="font-bold text-[#2C3E50]">4. 개인정보의 파기 절차 및 기술적 방법</p>
                  <p>파기 사유가 발생한 개인정보는 재생 불가능한 기술적 방식(Cryptographic Erasure 및 DB 레코드 영구 삭제)을 적용하여 복구할 수 없는 상태로 즉시 파기합니다.</p>

                  <p className="font-bold text-[#2C3E50]">5. 개인정보의 제3자 제공 및 처리 위탁</p>
                  <p>1. 서비스는 정보주체의 사전 동의 없이 개인정보를 제3자에게 제공하거나 판매하지 않습니다.<br />
                  2. 안전한 클라우드 인프라 운영을 위해 Google Cloud Platform(Firebase)의 고도화된 보안 데이터센터 환경을 이용하며, 엄격한 접근 권한 제어 규칙(Security Rules)으로 안전하게 보호됩니다.</p>

                  <p className="font-bold text-[#2C3E50]">6. 개인정보의 안전성 확보 조치 (보안 대책)</p>
                  <ul className="list-disc pl-4 space-y-1 text-[11px] text-[#6A5E53]">
                    <li><strong>비밀번호 일방향 암호화</strong>: 회원의 비밀번호는 단방향 해시 암호화되어 관리자도 원문을 알 수 없습니다.</li>
                    <li><strong>전송 구간 암호화(HTTPS/TLS)</strong>: 모든 데이터 통신은 TLS 암호화 프로토콜을 통하여 안전하게 송수신됩니다.</li>
                    <li><strong>접근 권한 제한</strong>: 데이터베이스에 대한 무인가 접근을 차단하는 보안 규칙(Security Rules) 및 방화벽을 적용합니다.</li>
                  </ul>

                  <p className="font-bold text-[#2C3E50]">7. 정보주체의 권리와 행사 방법</p>
                  <p>정보주체는 언제든지 서비스 내 '내정보' 또는 상단 '회원탈퇴' 메뉴를 통해 본인의 개인정보 열람, 정정, 즉시 삭제(회원탈퇴)를 요구할 수 있습니다.</p>

                  <p className="font-bold text-[#2C3E50]">8. 개인정보 보호책임자 및 권익침해 구제</p>
                  <p className="text-[11px] text-[#6A5E53]">
                    • <strong>개인정보 보호책임자</strong>: 인연사주 운영팀 (문의: lhs41977@gmail.com)<br />
                    • <strong>권익침해 구제기관</strong>: 개인정보침해신고센터 (privacy.kisa.or.kr / 118), 경찰청 사이버수사국 (ecrm.police.go.kr / 182)
                  </p>
                </div>
              )}

              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => {
                    if (viewingDoc === "terms") setAgreeTerms(true);
                    if (viewingDoc === "privacy") setAgreePrivacy(true);
                    setViewingDoc(null);
                  }}
                  className="w-full py-2.5 bg-[#C0392B] hover:bg-[#A93226] text-white font-serif font-bold text-xs rounded-xl transition cursor-pointer"
                >
                  동의하고 닫기
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
