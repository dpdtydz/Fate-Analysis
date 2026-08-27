import { useState, useEffect } from "react";
import { ExternalLink, Copy, Check, MoreHorizontal, AlertCircle } from "lucide-react";

/**
 * 카카오톡 인앱 브라우저를 벗어나 기본 브라우저로 이동시킨다.
 * 안드로이드는 Chrome intent가 확실하게 동작하지만,
 * iOS는 kakaotalk://web/openExternal 스킴이 사용자 제스처 안에서만 실행되고
 * 그마저도 카카오톡 버전에 따라 무시될 수 있어 수동 안내가 반드시 필요하다.
 */
function escapeToExternalBrowser(): void {
  const ua = navigator.userAgent.toLowerCase();
  const href = window.location.href;

  if (ua.includes("android")) {
    const rawUrl = href.replace(/https?:\/\//, "");
    window.location.href = `intent://${rawUrl}#Intent;scheme=https;package=com.android.chrome;end`;
    return;
  }

  // iOS: 올바른 스킴은 openExternal (openExternalApp은 동작하지 않는다)
  window.location.href = "kakaotalk://web/openExternal?url=" + encodeURIComponent(href);
}

export default function KakaoOutlinkGuide() {
  const [isKakao, setIsKakao] = useState(false);
  const [copied, setCopied] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [isIos, setIsIos] = useState(false);

  useEffect(() => {
    const ua = navigator.userAgent.toLowerCase();
    const isKakaoTalkBrowser = ua.includes("kakaotalk");
    const iosDevice = /iphone|ipad|ipod/.test(ua);
    setIsKakao(isKakaoTalkBrowser);
    setIsIos(iosDevice);

    // iOS는 사용자 제스처 없이 스킴을 실행하면 차단되므로 안내 화면만 띄운다.
    if (isKakaoTalkBrowser && !iosDevice) {
      escapeToExternalBrowser();
    }
  }, []);

  const handleRetryRedirect = () => {
    escapeToExternalBrowser();
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
            브라우저에서 열어주세요
          </h2>
          <p className="text-sm text-ink-soft leading-relaxed">
            카카오톡 안에서는 구글 보안 정책 때문에 로그인이 되지 않습니다.
            {isIos ? " 아래 방법으로 사파리에서 열어주세요." : " 잠시 후 기본 브라우저로 이동합니다."}
          </p>
        </div>

        {/* iOS는 수동 안내가 주 경로, 안드로이드는 버튼이 주 경로 */}
        {isIos ? (
          <div className="bg-surface border border-line rounded-xl p-5 space-y-4">
            <div className="flex gap-4 items-start">
              <span className="w-7 h-7 shrink-0 rounded-full bg-seal text-white text-sm font-semibold flex items-center justify-center">
                1
              </span>
              <p className="text-sm text-ink leading-relaxed pt-0.5">
                화면 <span className="font-semibold">오른쪽 아래의 나침반 아이콘</span>을 누르세요.
                <span className="block text-xs text-ink-faint mt-1">
                  보이지 않으면 오른쪽 위 더보기(⋯) 버튼을 눌러주세요.
                </span>
              </p>
            </div>
            <div className="flex gap-4 items-start">
              <span className="w-7 h-7 shrink-0 rounded-full bg-seal text-white text-sm font-semibold flex items-center justify-center">
                2
              </span>
              <p className="text-sm text-ink leading-relaxed pt-0.5">
                <span className="font-semibold">'Safari로 열기'</span>를 선택하면 됩니다.
              </p>
            </div>

            <button
              onClick={handleRetryRedirect}
              className="w-full flex items-center justify-center gap-2 bg-sunken hover:bg-line text-ink text-sm font-semibold py-3.5 px-6 rounded-xl transition-colors duration-200"
            >
              <ExternalLink className="w-4 h-4" />
              <span>자동으로 열어보기</span>
            </button>
          </div>
        ) : (
          <>
            <button
              onClick={handleRetryRedirect}
              className="w-full flex items-center justify-center gap-2 bg-seal hover:bg-seal-deep text-white text-sm font-semibold py-4 px-6 rounded-xl transition-colors duration-200"
            >
              <ExternalLink className="w-5 h-5" />
              <span>기본 브라우저로 열기</span>
            </button>

            <div className="space-y-4">
              <h3 className="text-xs font-semibold text-ink-faint">
                열리지 않으면 직접 열어주세요
              </h3>
              <div className="bg-surface border border-line rounded-xl p-4 flex gap-4 items-start">
                <div className="bg-sunken p-2.5 rounded-xl shrink-0 text-ink-soft">
                  <MoreHorizontal className="w-5 h-5" />
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-semibold text-ink">안드로이드</p>
                  <p className="text-xs text-ink-soft leading-relaxed">
                    오른쪽 위 <span className="font-medium text-ink">점 세 개(⋮)</span>를 누른 뒤 <span className="font-medium text-ink">'다른 브라우저로 열기'</span>를 선택해 주세요.
                  </p>
                </div>
              </div>
            </div>
          </>
        )}

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
