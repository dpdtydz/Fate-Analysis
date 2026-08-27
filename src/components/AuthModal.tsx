import React, { useState } from "react";
import { X, CheckCircle2, ShieldAlert, Chrome } from "lucide-react";
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
      setSuccessMsg("Google 계정으로 로그인되었어요. 정회원 혜택이 적용됩니다.");
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
      setErrorMsg("아이디는 2~16자의 한글, 영문, 숫자로만 입력해 주세요. 특수문자와 기호는 사용할 수 없어요.");
      return;
    }

    if (password.length < 6) {
      setErrorMsg("비밀번호는 6자리 이상 입력해 주세요.");
      return;
    }

    if (isSignUp) {
      if (!agreeTerms || !agreePrivacy) {
        setErrorMsg("서비스 이용약관과 개인정보 수집·이용에 동의해 주세요.");
        return;
      }
    }

    setLoading(true);
    try {
      if (isSignUp) {
        await signUpWithUsername(cleanUsername, password, nickname || undefined);
        setSuccessMsg("일반 회원가입이 완료되었어요.");
      } else {
        await signInWithUsername(cleanUsername, password);
        setSuccessMsg("로그인되었어요.");
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
    <div className="fixed inset-0 z-[999] flex items-center justify-center p-3 sm:p-4 bg-black/50 animate-fade-in overflow-y-auto">
      <div
        className="bg-surface rounded-xl w-full max-w-md p-5 sm:p-7 shadow-lg space-y-4 relative my-auto max-h-[95vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1 rounded-xl text-ink-faint hover:text-ink hover:bg-sunken transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="text-center space-y-1 pt-1">
          <h3 className="font-serif text-lg font-semibold text-ink">
            {isSignUp ? "회원가입" : "로그인"}
          </h3>
          <p className="text-xs text-ink-faint">
            Google 계정 또는 아이디로 시작할 수 있어요.
          </p>
        </div>

        {/* Tab Selection (Grid 2-cols to prevent overflow) */}
        <div className="grid grid-cols-2 gap-1 bg-sunken p-1 rounded-xl text-xs">
          <button
            type="button"
            onClick={() => { setActiveTab("google"); setErrorMsg(""); }}
            className={`py-2 px-2 rounded-xl transition-colors flex items-center justify-center gap-1.5 cursor-pointer overflow-hidden ${
              activeTab === "google"
                ? "bg-surface text-ink font-semibold"
                : "text-ink-soft hover:text-ink font-medium"
            }`}
          >
            <span className="truncate">Google 연동</span>
            <span className="text-xs text-ink-faint shrink-0 whitespace-nowrap">정회원</span>
          </button>

          <button
            type="button"
            onClick={() => { setActiveTab("username"); setErrorMsg(""); }}
            className={`py-2 px-2 rounded-xl transition-colors flex items-center justify-center gap-1.5 cursor-pointer overflow-hidden ${
              activeTab === "username"
                ? "bg-surface text-ink font-semibold"
                : "text-ink-soft hover:text-ink font-medium"
            }`}
          >
            <span className="truncate">아이디 가입</span>
            <span className="text-xs text-ink-faint shrink-0 whitespace-nowrap">일반</span>
          </button>
        </div>

        {/* Error / Success Feedback */}
        {errorMsg && (
          <div className="flex items-start gap-2 bg-sunken text-seal text-xs p-3 rounded-xl">
            <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="flex items-start gap-2 bg-sunken text-ink text-xs p-3 rounded-xl">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-ink-soft mt-0.5" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* TAB 1: GOOGLE ONE-CLICK SIGN IN */}
        {activeTab === "google" && (
          <div className="space-y-4 pt-1">
            <div className="bg-sunken p-4 rounded-xl text-xs text-ink-soft space-y-2 text-left">
              <p className="font-semibold text-ink">Google 정회원으로 할 수 있는 일</p>
              <ul className="space-y-1.5 leading-relaxed">
                <li>모임방 개설과 관리 (방장 권한)</li>
                <li>1회 확인권·프로모션 쿠폰 등록과 사용</li>
                <li>심층 명리 리포트 PDF와 인연 상점 이용</li>
              </ul>
            </div>

            <button
              onClick={handleGoogleLogin}
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 bg-seal hover:bg-seal-deep text-white py-3 px-4 rounded-xl text-sm font-semibold transition-colors disabled:opacity-50 cursor-pointer"
            >
              <Chrome className="w-4 h-4" />
              <span>{loading ? "Google 연결 중..." : "Google 계정으로 로그인"}</span>
            </button>

            {/* Google Terms Consent Notice */}
            <p className="text-xs text-ink-faint text-center leading-relaxed">
              Google 로그인 시 인연사주의{" "}
              <button
                type="button"
                onClick={() => setViewingDoc("terms")}
                className="text-ink-soft underline hover:text-ink cursor-pointer"
              >
                이용약관
              </button>
              {" 및 "}
              <button
                type="button"
                onClick={() => setViewingDoc("privacy")}
                className="text-ink-soft underline hover:text-ink cursor-pointer"
              >
                개인정보 처리방침
              </button>
              에 동의하는 것으로 처리돼요.
            </p>
          </div>
        )}

        {/* TAB 2: USERNAME SIGN UP / SIGN IN (ZERO EMAIL COLLECTION) */}
        {activeTab === "username" && (
          <form onSubmit={handleUsernameSubmit} className="space-y-3 text-left">
            {/* Notice about regular membership (No email collected) */}
            <div className="bg-sunken p-3 rounded-xl text-xs text-ink-soft leading-relaxed">
              <span className="font-semibold text-ink">일반회원 안내</span> — SNS 연동이나 이메일 수집 없이 아이디만으로 참여하는 계정이에요. 모임방 참여와 개인 명식 조회가 가능하고, 필요할 때 Google 연동으로 정회원 전환이 가능해요.
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-ink-soft">
                아이디 (한글 또는 영문)
              </label>
              <input
                type="text"
                required
                placeholder="예: 홍길동, sajudosa"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full bg-sunken rounded-xl px-4 py-3 text-sm text-ink focus:outline-none focus:ring-1 focus:ring-ink"
              />
              <p className="text-xs text-ink-faint">
                2~16자의 한글 또는 영문/숫자 (이메일·특수문자 제외)
              </p>
            </div>

            {isSignUp && (
              <div className="space-y-1">
                <label className="text-xs font-medium text-ink-soft">
                  닉네임 (선택)
                </label>
                <input
                  type="text"
                  placeholder="미입력 시 아이디로 자동 설정돼요"
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                  className="w-full bg-sunken rounded-xl px-4 py-3 text-sm text-ink focus:outline-none focus:ring-1 focus:ring-ink"
                />
              </div>
            )}

            <div className="space-y-1">
              <label className="text-xs font-medium text-ink-soft">
                비밀번호 (6자리 이상)
              </label>
              <input
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-sunken rounded-xl px-4 py-3 text-sm text-ink focus:outline-none focus:ring-1 focus:ring-ink"
              />
            </div>

            {/* Terms and Agreements Section for Sign Up */}
            {isSignUp && (
              <div className="bg-sunken rounded-xl p-3 space-y-2 text-xs">
                {/* All Agree Checkbox */}
                <label className="flex items-center justify-between pb-2 border-b border-line cursor-pointer select-none">
                  <span className="font-semibold text-ink">약관 전체 동의</span>
                  <input
                    type="checkbox"
                    checked={isAllAgreed}
                    onChange={(e) => handleAllAgreeToggle(e.target.checked)}
                    className="w-4 h-4 accent-seal rounded cursor-pointer"
                  />
                </label>

                {/* Terms of Service (Required) */}
                <div className="flex items-center justify-between text-xs text-ink-soft">
                  <label className="flex items-center gap-1.5 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={agreeTerms}
                      onChange={(e) => setAgreeTerms(e.target.checked)}
                      className="w-3.5 h-3.5 accent-seal rounded cursor-pointer"
                    />
                    <span><span className="font-semibold text-ink">[필수]</span> 서비스 이용약관 동의</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => setViewingDoc("terms")}
                    className="text-xs text-ink-soft underline hover:text-ink cursor-pointer"
                  >
                    전문 보기
                  </button>
                </div>

                {/* Privacy Policy (Required) */}
                <div className="flex items-center justify-between text-xs text-ink-soft">
                  <label className="flex items-center gap-1.5 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={agreePrivacy}
                      onChange={(e) => setAgreePrivacy(e.target.checked)}
                      className="w-3.5 h-3.5 accent-seal rounded cursor-pointer"
                    />
                    <span><span className="font-semibold text-ink">[필수]</span> 개인정보 수집 및 이용 동의</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => setViewingDoc("privacy")}
                    className="text-xs text-ink-soft underline hover:text-ink cursor-pointer"
                  >
                    전문 보기
                  </button>
                </div>

                {/* Marketing (Optional) */}
                <div className="flex items-center justify-between text-xs text-ink-soft">
                  <label className="flex items-center gap-1.5 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={agreeMarketing}
                      onChange={(e) => setAgreeMarketing(e.target.checked)}
                      className="w-3.5 h-3.5 accent-seal rounded cursor-pointer"
                    />
                    <span>[선택] 혜택 및 운세 알림 수신 동의</span>
                  </label>
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-seal hover:bg-seal-deep text-white py-3 px-4 rounded-xl text-sm font-semibold transition-colors disabled:opacity-50 mt-2 cursor-pointer"
            >
              {loading ? "처리 중..." : isSignUp ? "약관 동의하고 가입하기" : "아이디로 로그인"}
            </button>

            {/* Toggle SignUp / SignIn */}
            <div className="text-center pt-1">
              <button
                type="button"
                onClick={() => { setIsSignUp(!isSignUp); setErrorMsg(""); }}
                className="text-xs text-ink-soft hover:text-ink underline cursor-pointer"
              >
                {isSignUp ? "이미 계정이 있으신가요? 아이디 로그인" : "계정이 없으신가요? 아이디 회원가입"}
              </button>
            </div>
          </form>
        )}

        {/* Terms / Privacy Document Modal Popup */}
        {viewingDoc && (
          <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-black/50 animate-fade-in">
            <div className="bg-surface rounded-xl w-full max-w-lg p-6 shadow-lg space-y-4 max-h-[85vh] overflow-y-auto text-left relative">
              <div className="flex items-center justify-between border-b border-line pb-3">
                <h4 className="font-serif text-lg font-semibold text-ink">
                  {viewingDoc === "terms" ? "서비스 이용약관" : "개인정보 수집 및 이용 동의"}
                </h4>
                <button
                  type="button"
                  onClick={() => setViewingDoc(null)}
                  className="p-1 rounded-xl hover:bg-sunken text-ink-faint hover:text-ink transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {viewingDoc === "terms" ? (
                <div className="space-y-3.5 text-xs text-ink-soft leading-relaxed">
                  <div className="bg-sunken p-3 rounded-xl text-xs text-ink-soft">
                    인연사주(因緣四柱)는 정보통신망 이용촉진 및 정보보호 등에 관한 법률 및 전자상거래법 등 관계 법령을 준수합니다.
                  </div>

                  <p className="font-semibold text-ink">제 1 조 (목적)</p>
                  <p>본 약관은 인연사주(이하 "서비스")가 제공하는 동양 명리학 기반 만세력 계산, 오행 분석 및 1:1·그룹 궁합 매칭 서비스(이하 "서비스")의 이용과 관련하여 회사와 이용자의 권리, 의무 및 책임사항, 기타 필요한 사항을 규정함을 목적으로 합니다.</p>

                  <p className="font-semibold text-ink">제 2 조 (서비스의 제공 및 성격)</p>
                  <p>1. 서비스는 이용자가 입력한 생년월일시 및 출생지를 기반으로 정통 천문 만세력 절기식에 따른 명식 및 오행 분포 분석을 제공합니다.<br />
                  2. 본 분석 결과는 상호 소통 및 성향 이해를 돕기 위한 문화·엔터테인먼트 콘텐츠로서, 의학적·법률적·재정적 판단의 직접적 근거로 사용할 수 없습니다.</p>

                  <p className="font-semibold text-ink">제 3 조 (이용자의 의무 및 금지행위)</p>
                  <p>1. 이용자는 타인의 정보를 도용하거나 허위 사실을 입력하여 서비스를 부정 이용할 수 없습니다.<br />
                  2. 서비스를 이용하여 취득한 타인의 명식 정보를 당사자의 명시적 동의 없이 외부에 무단 유출하거나 상업적으로 재배포할 수 없습니다.<br />
                  3. 비정상적인 반복 호출, 크롤링, 리버스 엔지니어링 등 서비스의 안정적 운영을 저해하는 일체의 행위를 금합니다.</p>

                  <p className="font-semibold text-ink">제 4 조 (데이터 보관 및 자동 파기)</p>
                  <p>1. 이용자가 생성한 임시 모임방 및 참여 명식 데이터는 방 생성일로부터 30일 경과 시 데이터베이스에서 영구 자동 파기됩니다.<br />
                  2. 이용자는 회원 탈퇴 기능을 통해 언제든지 본인의 모든 계정 및 등록 데이터를 즉시 완전 삭제할 수 있습니다.</p>

                  <p className="font-semibold text-ink">제 5 조 (면책 및 분쟁 해결)</p>
                  <p>서비스는 천재지변, 불가항력적 클라우드 네트워크 장애 또는 이용자의 귀책사유로 인한 데이터 손실에 대해 책임을 지지 않으며, 분쟁 발생 시 관계 법령에 따른 관할 법원을 통하여 원만히 해결합니다.</p>
                </div>
              ) : (
                <div className="space-y-3.5 text-xs text-ink-soft leading-relaxed">
                  <div className="bg-sunken p-3 rounded-xl text-xs text-ink-soft">
                    <span className="font-semibold text-ink">인연사주 개인정보 처리방침 고지</span><br />
                    본 방침은 「개인정보 보호법」 제30조에 따라 정보주체의 개인정보를 보호하고 관련 고충을 신속하게 처리하기 위하여 수립·공개합니다.
                  </div>

                  <p className="font-semibold text-ink">1. 개인정보의 처리 목적</p>
                  <p>서비스는 다음의 목적을 위해서만 개인정보를 처리하며, 목적 외의 용도로는 사용하지 않습니다.</p>
                  <ul className="list-disc pl-4 space-y-1 text-xs text-ink-soft">
                    <li><strong>만세력 및 궁합 분석</strong>: 24절기 천문 역산, 오행 생극제화 계산 및 그룹 케미스트리 리포트 산출</li>
                    <li><strong>회원 관리</strong>: 회원 식별, 계정 인증, 본인 의사 확인, 1회 확인권/쿠폰 정상 발급 및 소모 관리</li>
                    <li><strong>보안 및 부정 이용 방지</strong>: 비인가 접근 차단, 서비스 악용 방지 및 통신보안 로그 관리</li>
                  </ul>

                  <p className="font-semibold text-ink">2. 처리하는 개인정보 항목 및 수집 방법</p>
                  <ul className="list-disc pl-4 space-y-1 text-xs text-ink-soft">
                    <li><strong>일반 회원가입 시</strong>: 사용자 식별 아이디, 비밀번호(일방향 암호화 저장), 닉네임</li>
                    <li><strong>Google 간편 로그인 시</strong>: 소셜 UID(식별값), 닉네임, 프로필 이메일</li>
                    <li><strong>사주 명식 산출 시</strong>: 생년월일, 태어난 시각(선택), 성별, 출생지역(시/도, 시/군/구)</li>
                    <li><strong>서비스 이용 중 자동 생성</strong>: 접속 IP 주소, 서비스 이용 로그, 비정상 접속 기록</li>
                    <li>※ 주민등록번호, 연락처, 카드 결제 정보 등 불필요한 민감 정보는 일체 수집하거나 보관하지 않습니다.</li>
                  </ul>

                  <p className="font-semibold text-ink">3. 개인정보의 처리 및 보유 기간</p>
                  <p>• <strong>회원 탈퇴 시</strong>: 모든 개인식별 정보 및 저장된 명식 데이터는 지체 없이 즉시 영구 파기됩니다.<br />
                  • <strong>모임방 참여 데이터</strong>: 생성일 기준 30일 경과 시 데이터베이스에서 영구 자동 삭제됩니다.<br />
                  • <strong>관계 법령에 따른 보존</strong>: 통신비밀보호법 제15조의2에 따른 접속 로그 기록(3개월 보관 후 자동 파기).</p>

                  <p className="font-semibold text-ink">4. 개인정보의 파기 절차 및 기술적 방법</p>
                  <p>파기 사유가 발생한 개인정보는 재생 불가능한 기술적 방식(Cryptographic Erasure 및 DB 레코드 영구 삭제)을 적용하여 복구할 수 없는 상태로 즉시 파기합니다.</p>

                  <p className="font-semibold text-ink">5. 개인정보의 제3자 제공 및 처리 위탁</p>
                  <p>1. 서비스는 정보주체의 사전 동의 없이 개인정보를 제3자에게 제공하거나 판매하지 않습니다.<br />
                  2. 안전한 클라우드 인프라 운영을 위해 Google Cloud Platform(Firebase)의 보안 데이터센터 환경을 이용하며, 접근 권한 제어 규칙(Security Rules)으로 보호됩니다.</p>

                  <p className="font-semibold text-ink">6. 개인정보의 안전성 확보 조치 (보안 대책)</p>
                  <ul className="list-disc pl-4 space-y-1 text-xs text-ink-soft">
                    <li><strong>비밀번호 일방향 암호화</strong>: 회원의 비밀번호는 단방향 해시 암호화되어 관리자도 원문을 알 수 없습니다.</li>
                    <li><strong>전송 구간 암호화(HTTPS/TLS)</strong>: 모든 데이터 통신은 TLS 암호화 프로토콜을 통하여 안전하게 송수신됩니다.</li>
                    <li><strong>접근 권한 제한</strong>: 데이터베이스에 대한 무인가 접근을 차단하는 보안 규칙(Security Rules) 및 방화벽을 적용합니다.</li>
                  </ul>

                  <p className="font-semibold text-ink">7. 정보주체의 권리와 행사 방법</p>
                  <p>정보주체는 언제든지 서비스 내 '내정보' 또는 상단 '회원탈퇴' 메뉴를 통해 본인의 개인정보 열람, 정정, 즉시 삭제(회원탈퇴)를 요구할 수 있습니다.</p>

                  <p className="font-semibold text-ink">8. 개인정보 보호책임자 및 권익침해 구제</p>
                  <p className="text-xs text-ink-soft">
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
                  className="w-full py-3 bg-seal hover:bg-seal-deep text-white text-sm font-semibold rounded-xl transition-colors cursor-pointer"
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
