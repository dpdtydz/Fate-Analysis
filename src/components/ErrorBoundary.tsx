import React, { Component, ErrorInfo, ReactNode } from "react";
import { RefreshCw, AlertCircle } from "lucide-react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export default class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("[ErrorBoundary caught an error]:", error, errorInfo);

    // Auto-reload if dynamic chunk loading failed
    const errorMsg = error?.message || "";
    if (
      errorMsg.includes("dynamically imported module") ||
      errorMsg.includes("Loading chunk") ||
      errorMsg.includes("Importing a module script failed")
    ) {
      const reloadKey = "boundary_chunk_reload";
      const last = sessionStorage.getItem(reloadKey);
      const now = Date.now();
      if (!last || now - parseInt(last, 10) > 10000) {
        sessionStorage.setItem(reloadKey, String(now));
        window.location.reload();
      }
    }
  }

  private handleReload = () => {
    // Clear potentially corrupt storage or cache keys if needed, then reload
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      const errorMsg = this.state.error?.message || "";
      const isChunkError =
        errorMsg.includes("dynamically imported module") ||
        errorMsg.includes("Loading chunk") ||
        errorMsg.includes("Importing a module script failed");

      return (
        <div className="min-h-screen bg-bg flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-surface border border-line rounded-3xl p-6 sm:p-8 shadow-xl text-center space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center mx-auto shadow-sm">
              <AlertCircle className="w-7 h-7" />
            </div>

            <div className="space-y-2">
              <h2 className="text-lg sm:text-xl font-bold text-ink">
                {isChunkError ? "새로운 업데이트가 도착했습니다" : "화면 표시 중 오류가 발생했습니다"}
              </h2>
              <p className="text-xs sm:text-sm text-ink-soft leading-relaxed">
                {isChunkError ? (
                  <>
                    서비스 최신 버전이 배포되어 페이지 갱신이 필요합니다.<br />
                    새로고침을 누르면 최신 화면으로 즉시 연결됩니다.
                  </>
                ) : (
                  <>
                    일시적인 데이터 로딩 오류가 발생했습니다.<br />
                    아래 버튼을 눌러 화면을 다시 불러와 주세요.
                  </>
                )}
              </p>
            </div>

            <div className="flex flex-col gap-2 pt-2">
              <button
                type="button"
                onClick={this.handleReload}
                className="w-full py-3 px-5 bg-seal hover:bg-seal-deep text-white text-sm font-bold rounded-2xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98"
              >
                <RefreshCw className="w-4 h-4" />
                <span>{isChunkError ? "최신 버전으로 새로고침" : "화면 새로고침"}</span>
              </button>

              {!isChunkError && (
                <button
                  type="button"
                  onClick={() => {
                    this.setState({ hasError: false, error: null });
                    window.location.hash = "#/";
                  }}
                  className="w-full py-2.5 px-4 rounded-xl bg-sunken hover:bg-line text-ink text-xs font-semibold transition-colors cursor-pointer"
                >
                  홈으로 돌아가기
                </button>
              )}
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
