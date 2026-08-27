import { useState, useEffect } from "react";
import { ExternalLink, Copy, Check, Compass, MoreHorizontal, AlertCircle } from "lucide-react";

export default function KakaoOutlinkGuide() {
  const [isKakao, setIsKakao] = useState(false);
  const [copied, setCopied] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const ua = navigator.userAgent.toLowerCase();
    const isKakaoTalkBrowser = ua.includes("kakaotalk");
    setIsKakao(isKakaoTalkBrowser);

    if (isKakaoTalkBrowser) {
      if (ua.includes("android")) {
        // Android Chrome Intent format (bulletproof for escaping KakaoTalk browser on Android)
        const rawUrl = window.location.href.replace(/https?:\/\//, "");
        window.location.href = `intent://${rawUrl}#Intent;scheme=https;package=com.android.chrome;end`;
      } else {
        // iOS or general Safari/Default browser escape scheme
        window.location.href = "kakaotalk://web/openExternalApp?url=" + encodeURIComponent(window.location.href);
      }
    }
  }, []);

  const handleRetryRedirect = () => {
    const ua = navigator.userAgent.toLowerCase();
    if (ua.includes("android")) {
      const rawUrl = window.location.href.replace(/https?:\/\//, "");
      window.location.href = `intent://${rawUrl}#Intent;scheme=https;package=com.android.chrome;end`;
    } else {
      window.location.href = "kakaotalk://web/openExternalApp?url=" + encodeURIComponent(window.location.href);
    }
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      // Fallback
      const textArea = document.createElement("textarea");
      textArea.value = window.location.href;
      document.body.appendChild(textArea);
      textArea.select();
      try {
        document.execCommand("copy");
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (e) {
        console.error("Failed to copy link", e);
      }
      document.body.removeChild(textArea);
    }
  };

  if (!isKakao || dismissed) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[99999] bg-paper text-ink flex flex-col justify-between p-6 overflow-y-auto font-sans">
      {/* Upper content */}
      <div className="max-w-md mx-auto w-full pt-8 space-y-8">
        {/* Header */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-sunken text-ink-soft">
            <AlertCircle className="w-6 h-6" />
          </div>
          <h2 className="font-serif text-2xl font-semibold tracking-tight text-ink">
            구글 로그인 제한 안내
          </h2>
          <p className="text-sm text-ink-soft leading-relaxed">
            카카오톡 인앱 브라우저에서는 구글의 보안 정책에 따라 구글 로그인이 차단됩니다. 서비스를 이용하려면 <span className="font-semibold text-ink">외부 브라우저</span>로 이동해 주세요.
          </p>
        </div>

        {/* Action Button: Open in Default Browser */}
        <button
          onClick={handleRetryRedirect}
          className="w-full flex items-center justify-center gap-2 bg-seal hover:bg-seal-deep text-white text-sm font-semibold py-4 px-6 rounded-xl transition-colors duration-200"
        >
          <ExternalLink className="w-5 h-5" />
          <span>기본 브라우저로 열기</span>
        </button>

        {/* Manual Method Instructions */}
        <div className="space-y-4">
          <h3 className="text-xs font-semibold text-ink-faint">
            직접 외부 브라우저로 여는 방법
          </h3>

          <div className="bg-surface border border-line rounded-xl divide-y divide-line overflow-hidden">
            {/* iOS */}
            <div className="p-4 flex gap-4 items-start">
              <div className="bg-sunken p-2.5 rounded-xl shrink-0 text-ink-soft">
                <Compass className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-semibold text-ink">아이폰 (iOS)</p>
                <p className="text-xs text-ink-soft leading-relaxed">
                  우측 하단의 <span className="font-medium text-ink">나침반 모양 아이콘</span> 또는 <span className="font-medium text-ink">더보기(⋯)</span> 버튼을 누른 뒤 <span className="font-medium text-ink">'Safari로 열기'</span>를 선택해 주세요.
                </p>
              </div>
            </div>

            {/* Android */}
            <div className="p-4 flex gap-4 items-start">
              <div className="bg-sunken p-2.5 rounded-xl shrink-0 text-ink-soft">
                <MoreHorizontal className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-semibold text-ink">안드로이드 (Galaxy 등)</p>
                <p className="text-xs text-ink-soft leading-relaxed">
                  우측 상단의 <span className="font-medium text-ink">점 세 개(⋮)</span> 버튼을 누른 다음 <span className="font-medium text-ink">'다른 브라우저로 열기'</span> 또는 <span className="font-medium text-ink">'Chrome으로 열기'</span>를 선택해 주세요.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Copy Link Section */}
        <div className="bg-surface border border-line rounded-xl p-4 flex items-center justify-between gap-4">
          <div className="min-w-0 flex-1">
            <p className="text-xs text-ink-faint">직접 링크 복사하기</p>
            <p className="text-xs text-ink-soft truncate mt-1">
              {window.location.href}
            </p>
          </div>
          <button
            onClick={handleCopyLink}
            className={`flex items-center gap-1.5 py-2 px-3.5 rounded-xl text-xs font-medium shrink-0 transition-colors duration-200 ${
              copied
                ? "bg-ink text-white"
                : "bg-sunken hover:bg-line text-ink"
            }`}
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5" />
                <span>복사 완료</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>링크 복사</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Footer Content */}
      <div className="max-w-md mx-auto w-full pt-8 pb-4 text-center">
        <button
          onClick={() => setDismissed(true)}
          className="text-xs text-ink-faint hover:text-ink underline decoration-dotted underline-offset-4 transition-colors duration-150"
        >
          안내를 닫고 계속 진행하기
        </button>
      </div>
    </div>
  );
}
