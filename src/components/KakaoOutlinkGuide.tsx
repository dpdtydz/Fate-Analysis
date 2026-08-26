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
    <div className="fixed inset-0 z-[99999] bg-slate-950 text-slate-100 flex flex-col justify-between p-6 overflow-y-auto">
      {/* Upper content */}
      <div className="max-w-md mx-auto w-full pt-8 space-y-8">
        {/* Header Alert Card */}
        <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-6 text-center space-y-3">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-amber-500/20 text-amber-400">
            <AlertCircle className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-bold tracking-tight text-white">
            구글 로그인 보안 제한 안내
          </h2>
          <p className="text-sm text-slate-300 leading-relaxed">
            카카오톡 인앱 브라우저 환경에서는 구글의 보안 정책으로 인해 구글 소셜 로그인이 차단됩니다. 안전하고 원활한 서비스를 이용하기 위해 <span className="text-amber-400 font-semibold">외부 브라우저</span>로 이동해 주세요.
          </p>
        </div>

        {/* Action Button: Open in Default Browser */}
        <button
          onClick={handleRetryRedirect}
          className="w-full flex items-center justify-center gap-2 bg-amber-400 hover:bg-amber-300 text-slate-950 font-semibold py-4 px-6 rounded-2xl transition-all duration-200 shadow-lg shadow-amber-400/10 hover:shadow-amber-400/20"
        >
          <ExternalLink className="w-5 h-5" />
          <span>기본 브라우저로 열기</span>
        </button>

        {/* Manual Method Instructions */}
        <div className="space-y-4">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            수동으로 외부 브라우저 여는 방법
          </h3>

          <div className="bg-slate-900/50 border border-slate-800/80 rounded-2xl divide-y divide-slate-800/60 overflow-hidden">
            {/* iOS */}
            <div className="p-4 flex gap-4 items-start">
              <div className="bg-slate-800/60 p-2.5 rounded-xl shrink-0 text-slate-300">
                <Compass className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-semibold text-slate-200">아이폰 (iOS)</p>
                <p className="text-xs text-slate-400 leading-relaxed">
                  우측 하단의 <span className="text-amber-400 font-medium">나침반 모양 아이콘</span> 또는 <span className="text-amber-400 font-medium">더보기(⋯)</span> 버튼을 터치한 후 <span className="text-white font-medium">'Safari로 열기'</span>를 선택해 주세요.
                </p>
              </div>
            </div>

            {/* Android */}
            <div className="p-4 flex gap-4 items-start">
              <div className="bg-slate-800/60 p-2.5 rounded-xl shrink-0 text-slate-300">
                <MoreHorizontal className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-semibold text-slate-200">안드로이드 (Galaxy 등)</p>
                <p className="text-xs text-slate-400 leading-relaxed">
                  우측 상단의 <span className="text-amber-400 font-medium">점 세 개(⋮)</span> 버튼을 누른 다음 <span className="text-white font-medium">'다른 브라우저로 열기'</span> 또는 <span className="text-white font-medium">'Chrome으로 열기'</span>를 선택해 주세요.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Copy Link Section */}
        <div className="bg-slate-900/30 border border-slate-800/40 rounded-2xl p-4 flex items-center justify-between gap-4">
          <div className="min-w-0 flex-1">
            <p className="text-xs text-slate-400">직접 링크 복사하기</p>
            <p className="text-xs text-slate-300 font-mono truncate mt-1">
              {window.location.href}
            </p>
          </div>
          <button
            onClick={handleCopyLink}
            className={`flex items-center gap-1.5 py-2 px-3.5 rounded-xl text-xs font-medium shrink-0 transition-all duration-200 ${
              copied
                ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                : "bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700/50"
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
          className="text-xs text-slate-500 hover:text-slate-400 underline decoration-dotted underline-offset-4 transition-colors duration-150"
        >
          경고 무시하고 그냥 진행할래요
        </button>
      </div>
    </div>
  );
}
