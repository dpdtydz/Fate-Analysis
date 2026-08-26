import React, { useState } from "react";
import { X, ShieldCheck, FileText } from "lucide-react";

interface LegalModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: "terms" | "privacy" | "cookies";
}

export default function LegalModal({
  isOpen,
  onClose,
  initialTab = "terms",
}: LegalModalProps) {
  const [activeTab, setActiveTab] = useState<"terms" | "privacy" | "cookies">(initialTab);

  // Sync initial tab when opened
  React.useEffect(() => {
    if (isOpen) {
      setActiveTab(initialTab);
    }
  }, [isOpen, initialTab]);

  if (!isOpen) return null;

  return (
    <div
      id="legal-modal-backdrop"
      className="fixed inset-0 z-[2000] flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-fade-in"
    >
      <div
        id="legal-modal-content"
        className="bg-[#FAF8F5] border border-[#E2D8C7] rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[85vh] text-left relative animate-scale-up"
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-[#E8E0D0] bg-[#FAF8F5] flex items-center justify-between">
          <div className="flex items-center space-x-2">
            {activeTab === "terms" ? (
              <FileText className="w-5 h-5 text-[#C0392B]" />
            ) : (
              <ShieldCheck className="w-5 h-5 text-emerald-600" />
            )}
            <h3 className="font-serif font-bold text-base sm:text-lg text-[#1E293B]">
              {activeTab === "terms" && "서비스 이용약관"}
              {activeTab === "privacy" && "개인정보 처리방침"}
              {activeTab === "cookies" && "광고 및 쿠키 운영 정책"}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-black/5 text-[#8C827A] hover:text-[#1E293B] transition cursor-pointer"
            title="닫기"
            aria-label="닫기"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex border-b border-[#E8E0D0] bg-[#F2ECE0]/60 px-4 pt-2 gap-2 overflow-x-auto scrollbar-none">
          <button
            type="button"
            onClick={() => setActiveTab("terms")}
            className={`pb-2.5 px-3 text-xs font-serif font-bold transition border-b-2 cursor-pointer whitespace-nowrap ${
              activeTab === "terms"
                ? "border-[#C0392B] text-[#C0392B]"
                : "border-transparent text-[#8C827A] hover:text-[#1E293B]"
            }`}
          >
            📜 이용약관
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("privacy")}
            className={`pb-2.5 px-3 text-xs font-serif font-bold transition border-b-2 cursor-pointer whitespace-nowrap ${
              activeTab === "privacy"
                ? "border-emerald-600 text-emerald-700 font-extrabold"
                : "border-transparent text-[#8C827A] hover:text-[#1E293B]"
            }`}
          >
            🛡️ 개인정보 처리방침
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("cookies")}
            className={`pb-2.5 px-3 text-xs font-serif font-bold transition border-b-2 cursor-pointer whitespace-nowrap ${
              activeTab === "cookies"
                ? "border-amber-600 text-amber-700 font-extrabold"
                : "border-transparent text-[#8C827A] hover:text-[#1E293B]"
            }`}
          >
            🍪 광고 및 쿠키 정책
          </button>
        </div>

        {/* Body Content with Scroll */}
        <div className="p-5 overflow-y-auto space-y-4 text-xs text-[#5A524A] leading-relaxed select-text">
          {activeTab === "terms" ? (
            <div className="space-y-3.5">
              <div className="bg-[#FAF7F2] p-3 rounded-xl border border-[#E8E0D0] text-[11px] text-[#7A6B5D]">
                인연사주(因緣四柱)는 정보통신망 이용촉진 및 정보보호 등에 관한 법률 및 전자상거래법 등 관계 법령을 준수합니다.
              </div>

              <p className="font-bold text-[#2C3E50]">제 1 조 (목적)</p>
              <p>본 약관은 인연사주(이하 "서비스")가 제공하는 동양 명리학 기반 만세력 계산, 오행 분석 및 1:1·그룹 궁합 매칭 서비스의 이용과 관련하여 회사와 이용자의 권리, 의무 및 책임사항, 기타 필요한 사항을 규정함을 목적으로 합니다.</p>
              
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
          ) : activeTab === "privacy" ? (
            <div className="space-y-3.5">
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
          ) : (
            <div className="space-y-3.5">
              <div className="bg-amber-50 p-3 rounded-xl border border-amber-200 text-[11px] text-amber-800">
                🍪 <strong>광고 및 쿠키(Cookie) 운영 정책 고지</strong><br />
                인연사주는 사용자 편의 향상과 원활한 서비스 광고 송출을 위해 쿠키 기술 및 구글 애드센스(Google AdSense) 플랫폼을 운용합니다.
              </div>

              <p className="font-bold text-[#2C3E50]">1. 쿠키(Cookie)란 무엇인가요?</p>
              <p>쿠키는 웹사이트를 방문할 때 사용자의 브라우저에 저장되는 작은 텍스트 파일입니다. 쿠키를 통해 사이트는 사용자의 설정을 기억하고 맞춤형 광고를 제공할 수 있습니다.</p>

              <p className="font-bold text-[#2C3E50]">2. 구글 애드센스(Google AdSense) 및 맞춤형 광고</p>
              <p>• 구글(Google Inc.)을 포함한 제3자 광고 사업자는 쿠키 기술을 활용하여 사용자의 본 사이트 및 타 웹사이트 방문 기록에 기반해 맞춤형 광고를 게재합니다.<br />
              • 구글의 광고 쿠키 사용으로 구글과 파트너 업체는 사용자 방문 정보를 바탕으로 유용한 맞춤형 광고를 노출할 수 있습니다.</p>

              <p className="font-bold text-[#2C3E50]">3. 쿠키 저장 및 광고 개인 최적화 비활성화 방법</p>
              <p>이용자는 쿠키의 설치 및 사용에 대한 선택권을 가지고 있으며, 원치 않을 경우 언제든지 이를 차단할 수 있습니다.</p>
              <ul className="list-disc pl-4 space-y-1 text-[11px] text-[#6A5E53]">
                <li><strong>구글 맞춤형 광고 해제</strong>: 구글 광고 설정(<a href="https://adssettings.google.com" target="_blank" rel="noreferrer" className="text-[#C0392B] underline">adssettings.google.com</a>)에서 맞춤형 광고 수신을 해제할 수 있습니다.</li>
                <li><strong>웹브라우저 옵션 설정</strong>: 브라우저 상단의 설정 &gt; 개인정보 보호 및 보안 &gt; 쿠키 및 기타 사이트 데이터 메뉴에서 쿠키 수집을 전면 차단하거나 허용할 수 있습니다.</li>
              </ul>

              <p className="font-bold text-[#2C3E50]">4. 동의 및 거부에 따른 영향</p>
              <p>쿠키 수집을 거부할 경우 맞춤형 광고의 품질과 일부 부가 기능의 동작이 매끄럽지 않을 수 있으나, 사주 명식 연산 및 만세력·궁합 해독 결과의 기본 열람 서비스는 차별 없이 동일하게 사용하실 수 있습니다.</p>
            </div>
          )}
        </div>

        {/* Footer Close Button */}
        <div className="p-4 border-t border-[#E8E0D0] bg-[#FAF8F5] flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 bg-[#2C3E50] hover:bg-[#1A252F] text-white font-serif font-bold text-xs rounded-xl transition cursor-pointer"
          >
            확인 및 닫기
          </button>
        </div>
      </div>
    </div>
  );
}
