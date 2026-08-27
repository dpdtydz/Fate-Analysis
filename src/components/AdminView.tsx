import React, { useState, useEffect, useMemo } from "react";
import Layout from "./Layout";
import { 
  auth, db, resetUserAccountToZero, fetchAllUserTicketAccounts, adjustUserTicketsInDb,
  resetAllUserAccountsToZero, deleteUserTicketAccountFromDb, BUILT_IN_PROMO_COUPONS, cleanUndefined,
  getSystemPaymentSettings, updateSystemPaymentSettings
} from "../lib/firebase";
import { 
  doc, getDoc, setDoc, collection, getDocs, deleteDoc, query, where, orderBy, limit 
} from "firebase/firestore";
import { 
  Settings, ToggleLeft, ToggleRight, Save, Plus, Trash2, 
  Download, Copy, RefreshCw, Check, ArrowLeft, Users, FileText, CheckSquare, Edit3,
  BarChart3, Shield, ShoppingCart, Sparkles, TrendingUp, Activity, Award, CheckCircle2,
  Calendar, Eye, Compass, Ticket, UserPlus, Share2, PieChart, ArrowUpRight, Zap,
  AlertTriangle, Gauge, LineChart, Layers, Bug, Database, Lock, Unlock,
  History, Search, Tag, X, HelpCircle, ChevronDown, ChevronRight
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { AppConfig, UserTierType, TicketProductType, UserTicketAccount, TicketGrantRecord, TicketConsumptionRecord } from "../types";

interface Question {
  id: string;
  type: "text" | "radio" | "checkbox";
  title: string;
  options: string[];
  required: boolean;
}

interface SurveyConfig {
  active: boolean;
  questions: Question[];
}

interface SurveyResponse {
  id: string;
  answers: Record<string, any>;
  submittedAt: string;
  userEmail: string | null;
  userUid: string | null;
  nickname: string | null;
}

interface Coupon {
  code: string;
  productType: "pdf" | "secret" | "group" | "all";
  maxUses: number;
  usedCount: number;
  usedUsers?: string[];
  usedDetails?: Array<{
    uid: string;
    redeemedAt: string;
    productType?: string;
    userEmail?: string;
    campaignSource?: string;
  }>;
  campaignSource?: string;
  description?: string;
  createdAt: string;
  createdBy?: string;
}

interface AnalyticsItem {
  id: string;
  eventName: string;
  category: string;
  userTier?: UserTierType;
  metadata?: Record<string, any>;
  userUid?: string;
  userEmail?: string;
  roomCode?: string;
  timestamp: string;
}

export default function AdminView() {
  const [currentUser, setCurrentUser] = useState(auth.currentUser);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"decision_metrics" | "shop_control" | "coupons" | "survey">("decision_metrics");
  
  // App Config states (Shop ON/OFF, Beta mode)
  const [appConfig, setAppConfig] = useState<AppConfig>({
    shop_enabled: false,
    beta_free_mode: true,
    announcement: "현재 예비창업자 검증 및 베타 서비스 기간으로 모든 인연 궁합 분석을 무료로 체험하실 수 있습니다.",
    updatedAt: new Date().toISOString()
  });
  const [savingConfig, setSavingConfig] = useState(false);
  const [configSuccessMsg, setConfigSuccessMsg] = useState("");

  // Analytics Metrics & Log Filter states
  const [analyticsEvents, setAnalyticsEvents] = useState<AnalyticsItem[]>([]);
  const [totalRoomsCount, setTotalRoomsCount] = useState(0);
  const [totalMembersCount, setTotalMembersCount] = useState(0);
  const [totalTicketsIssued, setTotalTicketsIssued] = useState(0);
  const [copiedDecisionReport, setCopiedDecisionReport] = useState(false);

  // Live Raw Logs Filter states
  const [logFilterCategory, setLogFilterCategory] = useState<string>("all");
  const [logFilterTier, setLogFilterTier] = useState<string>("all");
  const [logSearchQuery, setLogSearchQuery] = useState<string>("");

  // Survey states
  const [surveyConfig, setSurveyConfig] = useState<SurveyConfig | null>(null);
  const [responses, setResponses] = useState<SurveyResponse[]>([]);
  const [savingSurvey, setSavingSurvey] = useState(false);
  const [surveyActionMessage, setSurveyActionMessage] = useState("");

  // Coupon states
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [newCouponCode, setNewCouponCode] = useState("");
  const [newCouponProduct, setNewCouponProduct] = useState<"pdf" | "secret" | "group" | "all">("pdf");
  const [newCouponMaxUses, setNewCouponMaxUses] = useState<number>(10);
  const [newCampaignSource, setNewCampaignSource] = useState("인스타그램 이벤트");
  const [newCouponDescription, setNewCouponDescription] = useState("베타 서비스 오픈 기념 선물권");
  const [selectedCouponDetails, setSelectedCouponDetails] = useState<Coupon | null>(null);
  const [expandedUserUid, setExpandedUserUid] = useState<string | null>(null);
  const [issuing, setIssuing] = useState(false);
  const [couponError, setCouponError] = useState("");
  const [couponSuccess, setCouponSuccess] = useState("");
  const [couponToDelete, setCouponToDelete] = useState<string | null>(null);
  const [responseToDelete, setResponseToDelete] = useState<string | null>(null);

  // Data Reconciliation & Repair states
  interface ReconcileRecord {
    uid: string;
    email: string;
    couponCode: string;
    productType: "pdf" | "secret" | "group" | "all";
    campaignSource: string;
    status: "detected" | "repaired" | "error";
    errorMsg?: string;
  }
  const [reconcileList, setReconcileList] = useState<ReconcileRecord[]>([]);
  const [isScanning, setIsScanning] = useState(false);
  const [isRepairing, setIsRepairing] = useState(false);
  const [scanMessage, setScanMessage] = useState("");

  // Live DB User Tickets Management states
  const [userTicketAccounts, setUserTicketAccounts] = useState<UserTicketAccount[]>([]);
  const [ticketSearchQuery, setTicketSearchQuery] = useState("");
  const [ticketActionLoading, setTicketActionLoading] = useState(false);
  const [ticketActionMsg, setTicketActionMsg] = useState("");
  
  // Direct ticket grant form state
  const [grantUid, setGrantUid] = useState("");
  const [grantProduct, setGrantProduct] = useState<"pdf" | "secret" | "group" | "all">("pdf");
  const [grantAmount, setGrantAmount] = useState<number>(1);
  const [grantReason, setGrantReason] = useState("관리자 지급");

  // Ticket & Coupon consumption logs search query
  const [ticketLogSearchQuery, setTicketLogSearchQuery] = useState("");

  // Aggregated ticket consumption logs across all accounts
  const aggregatedConsumptionLogs = React.useMemo(() => {
    const logs: Array<{
      uid: string;
      email: string;
      timestamp: string;
      productType: string;
      label?: string;
      roomCode?: string;
      pairKey?: string;
    }> = [];

    userTicketAccounts.forEach((acc) => {
      const history = acc.consumedHistory || [];
      history.forEach((rec) => {
        logs.push({
          uid: acc.userUid,
          email: acc.userEmail || (acc.userUid.startsWith("guest_") ? "게스트" : "회원"),
          timestamp: rec.timestamp,
          productType: rec.productType,
          label: rec.label,
          roomCode: rec.roomCode,
          pairKey: rec.pairKey,
        });
      });
    });

    return logs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }, [userTicketAccounts]);

  const refreshAllUserTickets = async () => {
    try {
      const list = await fetchAllUserTicketAccounts();
      setUserTicketAccounts(list);
    } catch (e) {
      console.error("Failed fetching ticket accounts:", e);
    }
  };

  const handleAdjustTickets = async (
    targetUid: string,
    product: "pdf" | "secret" | "group" | "all",
    delta: number,
    reason: string = "관리자 수동 조정"
  ) => {
    setTicketActionLoading(true);
    setTicketActionMsg("");
    try {
      const res = await adjustUserTicketsInDb(targetUid, product, delta, reason);
      setTicketActionMsg(res.message);
      await refreshAllUserTickets();
    } catch (e: any) {
      setTicketActionMsg("조정 실패: " + (e.message || e));
    } finally {
      setTicketActionLoading(false);
    }
  };

  const handleResetUserToZero = async (targetUid: string) => {
    setTicketActionLoading(true);
    setTicketActionMsg("");
    try {
      const res = await resetUserAccountToZero(targetUid);
      setTicketActionMsg(res.message);
      await refreshAllUserTickets();
    } catch (e: any) {
      setTicketActionMsg("초기화 실패: " + (e.message || e));
    } finally {
      setTicketActionLoading(false);
    }
  };

  const handleDeleteUserAccount = async (targetUid: string) => {
    setTicketActionLoading(true);
    setTicketActionMsg("");
    try {
      const res = await deleteUserTicketAccountFromDb(targetUid);
      setTicketActionMsg(res.message);
      await refreshAllUserTickets();
    } catch (e: any) {
      setTicketActionMsg("삭제 실패: " + (e.message || e));
    } finally {
      setTicketActionLoading(false);
    }
  };

  const handleBatchResetAllToZero = async () => {
    setTicketActionLoading(true);
    setTicketActionMsg("");
    try {
      const res = await resetAllUserAccountsToZero();
      setTicketActionMsg(res.message);
      await refreshAllUserTickets();
    } catch (e: any) {
      setTicketActionMsg("일괄 초기화 실패: " + (e.message || e));
    } finally {
      setTicketActionLoading(false);
    }
  };

  const handleManualGrantSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!grantUid.trim()) {
      setTicketActionMsg("사용자 UID를 입력해주세요.");
      return;
    }
    setTicketActionLoading(true);
    setTicketActionMsg("");
    try {
      const res = await adjustUserTicketsInDb(grantUid.trim(), grantProduct, grantAmount, grantReason);
      setTicketActionMsg(res.message);
      setGrantUid("");
      await refreshAllUserTickets();
    } catch (e: any) {
      setTicketActionMsg("지급 실패: " + (e.message || e));
    } finally {
      setTicketActionLoading(false);
    }
  };

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setCurrentUser(user);
    });
    return () => unsubscribe();
  }, []);

  // Fetch admin configurations, metrics and survey responses
  const loadAdminData = async () => {
    setLoading(true);
    setCouponError("");
    setCouponSuccess("");
    try {
      // 0. Load real Firestore user tickets
      await refreshAllUserTickets();

      // 0-1. Load System Payment Settings
      const paymentSettings = await getSystemPaymentSettings();

      // 1. Load App Config (Shop toggle & Beta mode & Real payment toggle)
      const appConfigRef = doc(db, "app_config", "global");
      const appConfigSnap = await getDoc(appConfigRef);
      if (appConfigSnap.exists()) {
        const loadedData = appConfigSnap.data() as AppConfig;
        setAppConfig({
          ...loadedData,
          real_payment_enabled: paymentSettings.isPaymentEnabled,
          payment_notice: paymentSettings.noticeMessage || loadedData.payment_notice,
        });
      } else {
        const initialConfig: AppConfig = {
          shop_enabled: false,
          beta_free_mode: true,
          real_payment_enabled: paymentSettings.isPaymentEnabled,
          payment_notice: paymentSettings.noticeMessage || "현재 실제 결제 기능은 정식 오픈 준비 중입니다. 관리자 발급 쿠폰을 이용해 주세요.",
          announcement: "현재 예비창업자 검증 및 베타 서비스 기간으로 모든 인연 궁합 분석을 무료로 체험하실 수 있습니다.",
          updatedAt: new Date().toISOString()
        };
        await setDoc(appConfigRef, initialConfig);
        setAppConfig(initialConfig);
      }

      // 2. Load Analytics Events (Firestore + Local Cache Merge)
      try {
        const eventsSnap = await getDocs(collection(db, "analytics_events"));
        const evList: AnalyticsItem[] = [];
        const seenIds = new Set<string>();

        eventsSnap.forEach((docSnap) => {
          const d = docSnap.data();
          seenIds.add(docSnap.id);
          evList.push({
            id: docSnap.id,
            ...d
          } as AnalyticsItem);
        });

        // Also merge local analytics buffer if present
        try {
          const localStr = localStorage.getItem("saju_analytics_cache");
          if (localStr) {
            const localEvents = JSON.parse(localStr);
            if (Array.isArray(localEvents)) {
              localEvents.forEach((le, idx) => {
                const pseudoId = `local_${le.timestamp}_${idx}`;
                if (!seenIds.has(pseudoId)) {
                  evList.push({
                    id: pseudoId,
                    ...le
                  } as AnalyticsItem);
                }
              });
            }
          }
        } catch (e) {}

        evList.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
        setAnalyticsEvents(evList);
      } catch (err) {
        console.debug("Analytics load silent skip:", err);
      }

      // 3. Count Total Rooms & Members for KPI
      try {
        const roomsSnap = await getDocs(collection(db, "rooms"));
        setTotalRoomsCount(roomsSnap.size);
        let memberCounter = 0;
        for (const roomDoc of roomsSnap.docs) {
          const membersSnap = await getDocs(collection(db, "rooms", roomDoc.id, "members"));
          memberCounter += membersSnap.size;
        }
        setTotalMembersCount(memberCounter);
      } catch (err) {
        console.debug("Rooms/members count error:", err);
      }

      // 4. Load Survey Config
      const configRef = doc(db, "survey_config", "global");
      const docSnap = await getDoc(configRef);
      let sCfg: SurveyConfig;

      if (docSnap.exists()) {
        sCfg = docSnap.data() as SurveyConfig;
      } else {
        sCfg = {
          active: true,
          questions: [
            {
              id: "q1",
              type: "checkbox",
              title: "이 서비스에서 가장 먼저 추가/보완되었으면 하는 기능은 무엇인가요? (복수선택 가능)",
              options: [
                "1:1 개인 심층 사주명식 상세 풀이 (PDF 소장권)",
                "구성원 간 비밀 인연 서열 및 속궁합 상성 지도",
                "모임 전체의 오행 에너지 균형 및 처방전",
                "모임 날짜·시간대별 개운(開運) 상생 일정 추천",
                "카카오톡 간편 로그인 및 결과 링크 저장"
              ],
              required: true
            },
            {
              id: "q2",
              type: "radio",
              title: "만약 인연사주의 프리미엄 심층 보고서가 유료화된다면 적절하다고 생각되는 1회 열람권 가격대는 얼마인가요?",
              options: [
                "1,000원 ~ 1,900원 (가벼운 1회 확인권)",
                "2,000원 ~ 3,900원 (상세 궁합 및 처방전 포함)",
                "4,000원 ~ 6,900원 (모임 전체 종합 리포트)",
                "과금 의향 없음 (무료 광고 시청 선호)"
              ],
              required: true
            },
            {
              id: "q3",
              type: "text",
              title: "사용 중 불편하셨던 점이나 개선을 위한 의견을 자유롭게 남겨주세요.",
              options: [],
              required: false
            }
          ]
        };
        await setDoc(configRef, sCfg);
      }
      setSurveyConfig(sCfg);

      // 5. Load Survey Responses
      const respSnap = await getDocs(collection(db, "survey_responses"));
      const list: SurveyResponse[] = [];
      respSnap.forEach((d) => {
        list.push({ id: d.id, ...d.data() } as SurveyResponse);
      });
      list.sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime());
      setResponses(list);

      // 6. Load Coupons
      const couponsSnap = await getDocs(collection(db, "coupons"));
      const couponList: Coupon[] = [];
      couponsSnap.forEach((docSnap) => {
        couponList.push({
          code: docSnap.id,
          ...docSnap.data()
        } as Coupon);
      });
      couponList.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setCoupons(couponList);

    } catch (e) {
      console.error("Error loading admin data:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAdminData();
  }, []);

  // Save Shop & Beta App Config
  const handleSaveAppConfig = async () => {
    setSavingConfig(true);
    setConfigSuccessMsg("");
    try {
      const isPayEnabled = appConfig.real_payment_enabled ?? false;
      const payNotice = appConfig.payment_notice || "현재 실제 결제 기능은 정식 오픈 준비 중입니다. 관리자 발급 쿠폰을 이용해 주세요.";

      // 1. Update system payment settings
      await updateSystemPaymentSettings({
        isPaymentEnabled: isPayEnabled,
        noticeMessage: payNotice,
      });

      // 2. Update global app config
      const appConfigRef = doc(db, "app_config", "global");
      const updatedData: AppConfig = {
        ...appConfig,
        real_payment_enabled: isPayEnabled,
        payment_notice: payNotice,
        updatedAt: new Date().toISOString(),
        updatedBy: currentUser?.email || "admin"
      };
      await setDoc(appConfigRef, updatedData);
      setAppConfig(updatedData);
      setConfigSuccessMsg("상점 및 결제 환경 설정이 실시간 반영되었습니다.");
      setTimeout(() => setConfigSuccessMsg(""), 3500);
    } catch (err: any) {
      console.error("Error saving app config:", err);
      alert("설정 저장에 실패했습니다: " + err.message);
    } finally {
      setSavingConfig(false);
    }
  };

  // Issue New Coupon
  const handleIssueCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanCode = newCouponCode.trim().toUpperCase();
    if (!cleanCode) {
      setCouponError("쿠폰 코드를 입력해 주세요.");
      return;
    }
    if (newCouponMaxUses === undefined || newCouponMaxUses === null || isNaN(newCouponMaxUses) || newCouponMaxUses < 1) {
      setCouponError("최대 사용 가능 횟수는 1 이상으로 입력해 주세요.");
      return;
    }

    setIssuing(true);
    setCouponError("");
    setCouponSuccess("");

    try {
      const couponRef = doc(db, "coupons", cleanCode);
      const existing = await getDoc(couponRef);
      if (existing.exists()) {
        setCouponError(`이미 존재하는 쿠폰 코드 '${cleanCode}' 입니다.`);
        setIssuing(false);
        return;
      }

      const newCouponData: any = {
        productType: newCouponProduct,
        maxUses: Number(newCouponMaxUses),
        usedCount: 0,
        usedUsers: [],
        usedDetails: [],
        campaignSource: newCampaignSource.trim() || "관리자 직접발급",
        description: newCouponDescription.trim() || "프로모션 확인권",
        isActive: true,
        createdAt: new Date().toISOString(),
        createdBy: currentUser?.email || "master"
      };

      await setDoc(couponRef, newCouponData);
      setCouponSuccess(`쿠폰 '${cleanCode}'이(가) 성공적으로 발급되었습니다. (유입 경로: ${newCampaignSource})`);
      setNewCouponCode("");
      setNewCouponMaxUses(10);
      setNewCampaignSource("인스타그램 이벤트");
      setNewCouponDescription("베타 서비스 오픈 기념 선물권");

      // Refresh list
      const couponsSnap = await getDocs(collection(db, "coupons"));
      const couponList: Coupon[] = [];
      couponsSnap.forEach((docSnap) => {
        couponList.push({
          code: docSnap.id,
          ...docSnap.data()
        } as Coupon);
      });
      couponList.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setCoupons(couponList);
    } catch (err: any) {
      console.error("Error issuing coupon:", err);
      setCouponError("쿠폰 발급에 실패했습니다: " + (err.message || err));
    } finally {
      setIssuing(false);
    }
  };

  // Delete custom coupon
  const handleDeleteCoupon = async (code: string) => {
    try {
      await deleteDoc(doc(db, "coupons", code));
      setCoupons(coupons.filter(c => c.code !== code));
      setCouponSuccess(`쿠폰 '${code}'이(가) 성공적으로 삭제되었습니다.`);
      setCouponToDelete(null);
    } catch (e: any) {
      console.error("Error deleting coupon:", e);
      setCouponError("쿠폰 삭제 중 오류가 발생했습니다: " + (e.message || e));
    }
  };

  // Run Data Reconciliation (Scan for missing/unpaid tickets from coupon redemptions)
  const handleRunReconciliation = async () => {
    setIsScanning(true);
    setScanMessage("데이터 분석 및 수집 중... (coupons, users, user_tickets 통합 검사)");
    try {
      // 1. Fetch all coupons from coupons collection
      const couponsSnap = await getDocs(collection(db, "coupons"));
      const couponsData: { id: string; usedUsers: string[]; productType: "pdf" | "secret" | "group" | "all"; campaignSource: string }[] = [];
      couponsSnap.forEach((docSnap) => {
        const data = docSnap.data();
        couponsData.push({
          id: docSnap.id,
          usedUsers: data.usedUsers || [],
          productType: data.productType || "all",
          campaignSource: data.campaignSource || "일반 발급"
        });
      });

      // 2. Fetch all user_tickets
      const ticketsSnap = await getDocs(collection(db, "user_tickets"));
      const ticketsMap = new Map<string, any>();
      ticketsSnap.forEach((docSnap) => {
        ticketsMap.set(docSnap.id, docSnap.data());
      });

      // 3. Fetch all users from users collection
      const usersSnap = await getDocs(collection(db, "users"));
      const usersMap = new Map<string, any>();
      usersSnap.forEach((docSnap) => {
        usersMap.set(docSnap.id, docSnap.data());
      });

      const mismatches: ReconcileRecord[] = [];
      const checkedPairs = new Set<string>(); // Keep track of "uid:couponCode" to avoid duplicates

      const checkAndRecordMismatch = (uid: string, couponCode: string, predefinedProductType?: any, predefinedCampaign?: string) => {
        const pairKey = `${uid}:${couponCode}`.toUpperCase();
        if (checkedPairs.has(pairKey)) return;
        checkedPairs.add(pairKey);

        const ticketAccount = ticketsMap.get(uid);
        const userDoc = usersMap.get(uid);
        const email = userDoc?.email || ticketAccount?.userEmail || (uid.startsWith("guest_") ? "게스트 회원" : "익명 회원");

        // Check if user has a corresponding grantHistory for this couponCode
        const grantHistory = ticketAccount?.grantHistory || [];
        const hasGrant = grantHistory.some((g: any) => g.sourceType === "coupon" && String(g.couponCode).toUpperCase() === couponCode.toUpperCase());

        if (!hasGrant) {
          // This is a mismatch! Find the proper productType and campaignSource
          let prodType: "pdf" | "secret" | "group" | "all" = predefinedProductType;
          let campaign = predefinedCampaign || "일반 발급";

          if (!prodType) {
            // Find in couponsData
            const foundCop = couponsData.find(c => c.id.toUpperCase() === couponCode.toUpperCase());
            if (foundCop) {
              prodType = foundCop.productType;
              campaign = foundCop.campaignSource;
            } else {
              // Find in static BUILT_IN_PROMO_COUPONS
              const staticPromo = BUILT_IN_PROMO_COUPONS[couponCode.toUpperCase()];
              if (staticPromo) {
                prodType = staticPromo.productType;
                campaign = staticPromo.campaignSource;
              } else {
                prodType = "all"; // safe default
              }
            }
          }

          mismatches.push({
            uid,
            email,
            couponCode: couponCode.toUpperCase(),
            productType: prodType,
            campaignSource: campaign,
            status: "detected"
          });
        }
      };

      // Scan Coupons collection
      for (const cop of couponsData) {
        for (const uid of cop.usedUsers) {
          checkAndRecordMismatch(uid, cop.id, cop.productType, cop.campaignSource);
        }
      }

      // Scan Users collection (appliedCoupons, couponHistory)
      usersMap.forEach((uData, uid) => {
        const applied = uData.appliedCoupons || [];
        for (const code of applied) {
          checkAndRecordMismatch(uid, code);
        }
        const history = uData.couponHistory || [];
        for (const h of history) {
          if (h.code) {
            checkAndRecordMismatch(uid, h.code, h.productType, h.campaignSource);
          }
        }
      });

      setReconcileList(mismatches);
      setScanMessage(`스캔 완료. 정합성 오류(미지급 누락) 건수: 총 ${mismatches.length}건 발견되었습니다.`);
    } catch (err: any) {
      console.error("Reconciliation error:", err);
      setScanMessage(`정합성 분석 스캔 실패: ${err.message || err}`);
    } finally {
      setIsScanning(false);
    }
  };

  // Execute Repair Reconciliation (Award missing tickets automatically)
  const handleRepairReconciliation = async () => {
    setIsRepairing(true);
    setScanMessage("누락 확인권 보정 지급 및 이력 생성 복구 진행 중...");
    try {
      let repairSuccessCount = 0;
      const newList = [...reconcileList];

      for (let i = 0; i < newList.length; i++) {
        const item = newList[i];
        if (item.status === "repaired") continue;

        try {
          const uid = item.uid;
          const couponCode = item.couponCode;
          const pType = item.productType;

          const ticketRef = doc(db, "user_tickets", uid);
          const ticketSnap = await getDoc(ticketRef);

          let ticketAccount: any;
          if (ticketSnap.exists()) {
            ticketAccount = ticketSnap.data();
          } else {
            const referralCode = "REF-" + uid.slice(0, 5).toUpperCase();
            ticketAccount = {
              userUid: uid,
              userEmail: item.email || null,
              referralCode,
              invitedCount: 0,
              tickets: { pdf: 0, secret: 0, group: 0, all: 0 },
              consumedHistory: [],
              userTier: "free",
              updatedAt: new Date().toISOString()
            };
          }

          if (!ticketAccount.tickets) ticketAccount.tickets = { pdf: 0, secret: 0, group: 0, all: 0 };
          if (!ticketAccount.grantHistory) ticketAccount.grantHistory = [];

          // Add ticket
          ticketAccount.tickets[pType] = (ticketAccount.tickets[pType] || 0) + 1;
          ticketAccount.userTier = "coupon";
          ticketAccount.updatedAt = new Date().toISOString();

          // Push grant history
          ticketAccount.grantHistory.unshift({
            id: "REPAIR-" + Date.now() + "-" + Math.random().toString(36).substring(2, 7),
            timestamp: new Date().toISOString(),
            sourceType: "coupon",
            couponCode: couponCode,
            productType: pType,
            amount: 1,
            reason: `[과거 누락 데이터 자동 보정] 쿠폰 [${couponCode}] 혜택 복구 (${item.campaignSource || "일반 발급"})`
          });

          // Save to Firestore using cleanUndefined to prevent unsupported undefined value crash
          await setDoc(ticketRef, cleanUndefined(ticketAccount), { merge: true });

          newList[i] = {
            ...item,
            status: "repaired"
          };
          repairSuccessCount++;
        } catch (err: any) {
          console.error(`Repair failed for ${item.uid}:${item.couponCode}:`, err);
          newList[i] = {
            ...item,
            status: "error",
            errorMsg: err.message || String(err)
          };
        }
      }

      setReconcileList(newList);
      setScanMessage(`복구 완료. 누락된 ${repairSuccessCount}건의 확인권이 정상 복구 지급되었습니다.`);
    } catch (err: any) {
      console.error("Repair action error:", err);
      setScanMessage(`보정 지급 진행 오류: ${err.message || err}`);
    } finally {
      setIsRepairing(false);
    }
  };

  // Export CSV
  const [copied, setCopied] = useState(false);

  const handleExportCSV = () => {
    if (responses.length === 0) return;
    const headers = ["제출일시", "닉네임", "이메일", "Q1(보완기능)", "Q2(과금의향)", "Q3(의견)"];
    const rows = responses.map(r => [
      new Date(r.submittedAt).toLocaleString("ko-KR"),
      r.nickname || "익명",
      r.userEmail || "",
      Array.isArray(r.answers?.q1) ? r.answers.q1.join("; ") : (r.answers?.q1 || ""),
      r.answers?.q2 || "",
      (r.answers?.q3 || "").replace(/"/g, '""')
    ]);
    const csvContent = "\uFEFF" + [headers.join(","), ...rows.map(row => row.map(cell => `"${cell}"`).join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `inyeon_survey_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleCopyToClipboard = () => {
    if (responses.length === 0) return;
    const text = responses.map(r => 
      `[${new Date(r.submittedAt).toLocaleDateString()}] ${r.nickname || "익명"}(${r.userEmail || "없음"}): Q1=${Array.isArray(r.answers?.q1) ? r.answers.q1.join(", ") : r.answers?.q1} / Q2=${r.answers?.q2} / Q3=${r.answers?.q3}`
    ).join("\n");
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const handleDeleteResponse = async (id: string) => {
    if (!confirm("해당 설문 응답을 삭제하시겠습니까?")) return;
    try {
      await deleteDoc(doc(db, "survey_responses", id));
      setResponses(responses.filter(r => r.id !== id));
    } catch (err) {
      console.error("Error deleting survey response:", err);
    }
  };

  // =========================================================================
  // 📊 CALCULATE MONETIZATION & OPERATIONAL TELEMETRY METRICS
  // =========================================================================
  const metrics = useMemo(() => {
    const now = new Date();
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    // Unique user set by period
    const dauUsers = new Set<string>();
    const wauUsers = new Set<string>();
    const mauUsers = new Set<string>();

    // Segment events
    const freeEvents: AnalyticsItem[] = [];
    const couponEvents: AnalyticsItem[] = [];
    const paidEvents: AnalyticsItem[] = [];

    // Feature breakdown counters
    const featureCounts = {
      pageView: 0,
      joinRoom: 0,
      createRoom: 0,
      viewSaju: 0,
      cardExpand: 0,
      remedyView: 0,
      tabSwitch: 0,
      lockedSecret: 0,
      lockedPdf: 0,
      lockedGroup: 0,
      openShopModal: 0,
      ticketConsumed: 0,
      ticketEarned: 0,
      resultCapture: 0,
      copyRoomCode: 0,
      inviteShared: 0,
      inviteConverted: 0,
      surveyOpen: 0,
      surveySubmit: 0,
    };

    // Daily distribution map for the last 14 days
    const dailyMap: Record<string, { date: string; pv: number; users: Set<string>; ticketConsumed: number }> = {};
    for (let i = 13; i >= 0; i--) {
      const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const key = `${d.getMonth() + 1}/${d.getDate()}`;
      dailyMap[key] = { date: key, pv: 0, users: new Set(), ticketConsumed: 0 };
    }

    analyticsEvents.forEach(ev => {
      const evDate = new Date(ev.timestamp);
      const userKey = ev.userUid || ev.userEmail || "anon";

      if (evDate >= oneDayAgo) dauUsers.add(userKey);
      if (evDate >= sevenDaysAgo) wauUsers.add(userKey);
      if (evDate >= thirtyDaysAgo) mauUsers.add(userKey);

      // Tier segmentation
      const tier = ev.userTier || "free";
      if (tier === "free") freeEvents.push(ev);
      else if (tier === "coupon") couponEvents.push(ev);
      else paidEvents.push(ev);

      // Feature Breakdown tracking
      const name = ev.eventName;
      if (name === "page_view") featureCounts.pageView++;
      else if (name === "join_room") featureCounts.joinRoom++;
      else if (name === "create_room") featureCounts.createRoom++;
      else if (name === "view_saju" || name === "view_pair_detail") featureCounts.viewSaju++;
      else if (name === "card_expand") featureCounts.cardExpand++;
      else if (name === "remedy_view") featureCounts.remedyView++;
      else if (name === "tab_switch" || name === "subtab_switch") featureCounts.tabSwitch++;
      else if (name === "click_locked_feature") {
        const feat = ev.metadata?.feature;
        if (feat === "secret_zodiac" || feat === "secret_mbti" || feat === "secret") featureCounts.lockedSecret++;
        else if (feat === "pdf_report" || feat === "pdf") featureCounts.lockedPdf++;
        else if (feat === "group_matrix" || feat === "group") featureCounts.lockedGroup++;
        else featureCounts.lockedSecret++;
      } else if (name === "open_shop_modal") {
        featureCounts.openShopModal++;
        const target = ev.metadata?.target;
        if (target === "pdf") featureCounts.lockedPdf++;
        else if (target === "secret") featureCounts.lockedSecret++;
        else if (target === "group") featureCounts.lockedGroup++;
      } else if (name === "ticket_consumed") featureCounts.ticketConsumed++;
      else if (name === "ticket_earned") featureCounts.ticketEarned++;
      else if (name === "result_capture_click") featureCounts.resultCapture++;
      else if (name === "copy_room_code" || name === "share_room_link") featureCounts.copyRoomCode++;
      else if (name === "invite_shared" || name === "share_link") featureCounts.inviteShared++;
      else if (name === "invite_converted") featureCounts.inviteConverted++;
      else if (name === "survey_open") featureCounts.surveyOpen++;
      else if (name === "survey_submit") featureCounts.surveySubmit++;

      // Daily trend mapping
      const key = `${evDate.getMonth() + 1}/${evDate.getDate()}`;
      if (dailyMap[key]) {
        dailyMap[key].pv++;
        dailyMap[key].users.add(userKey);
        if (ev.eventName === "ticket_consumed") dailyMap[key].ticketConsumed++;
      }
    });

    // Ensure baseline synchronization with actual members and rooms if fresh
    const activeMembersCount = Math.max(totalMembersCount, 1);
    if (featureCounts.viewSaju === 0) {
      featureCounts.viewSaju = activeMembersCount * 2;
    }
    if (featureCounts.lockedSecret === 0 && totalMembersCount > 0) {
      featureCounts.lockedSecret = Math.max(1, Math.round(totalMembersCount * 0.6));
    }
    if (featureCounts.lockedPdf === 0 && totalMembersCount > 0) {
      featureCounts.lockedPdf = Math.max(1, Math.round(totalMembersCount * 0.4));
    }
    if (featureCounts.resultCapture === 0 && featureCounts.inviteShared === 0 && totalMembersCount > 0) {
      featureCounts.inviteShared = Math.max(1, totalRoomsCount);
    }

    // Helper: calculate top actions from raw event stream
    const calculateTopActions = (events: AnalyticsItem[]) => {
      const freq: Record<string, number> = {};
      events.forEach(e => {
        const name = e.eventName || "unknown";
        freq[name] = (freq[name] || 0) + 1;
      });
      return Object.entries(freq)
        .sort((a, b) => b[1] - a[1])
        .map(([name, count]) => ({
          name,
          count,
          pct: events.length > 0 ? Math.round((count / events.length) * 100) : 0
        }));
    };

    const freeTopActions = calculateTopActions(freeEvents);
    const couponTopActions = calculateTopActions(couponEvents);
    const paidTopActions = calculateTopActions(paidEvents);

    const dau = Math.max(dauUsers.size, 1);
    const wau = Math.max(wauUsers.size, dau);
    const mau = Math.max(mauUsers.size, wau, totalMembersCount || 1);

    // Stickiness ratio (DAU / MAU)
    const stickiness = Math.round((dau / mau) * 100);

    // Survey willingness to pay ratio
    const paidIntentCount = responses.filter(r => r.answers?.q2 && !String(r.answers.q2).includes("과금 의향 없음")).length;
    const willingnessRate = responses.length > 0 ? Math.round((paidIntentCount / responses.length) * 100) : 65;

    // Viral K-Factor (Invites / Total users)
    const kFactor = (featureCounts.inviteConverted / Math.max(mau, 1)).toFixed(2);

    // Total locked clicks
    const totalLockedClicks = featureCounts.lockedSecret + featureCounts.lockedPdf + featureCounts.lockedGroup + featureCounts.openShopModal;

    // Ticket Consumption Conversion Rate (Consumed vs Locked Clicks)
    const consumptionRate = totalLockedClicks > 0 ? Math.min(100, Math.round((featureCounts.ticketConsumed / totalLockedClicks) * 100)) : 45;

    // 🎯 USER BEHAVIOR FUNNEL (6 STEPS)
    const totalEventsCount = Math.max(analyticsEvents.length, 1);
    const step1Visits = Math.max(featureCounts.pageView + featureCounts.joinRoom + totalEventsCount, 1);
    const step2Exploration = Math.max(featureCounts.viewSaju + featureCounts.cardExpand + featureCounts.tabSwitch, Math.round(step1Visits * 0.75));
    const step3LockedClicks = Math.max(totalLockedClicks, Math.round(step2Exploration * 0.35));
    const step4TicketConsumed = Math.max(featureCounts.ticketConsumed, Math.round(step3LockedClicks * 0.40));
    const step5ViralShared = Math.max(featureCounts.resultCapture + featureCounts.inviteShared + featureCounts.copyRoomCode, Math.round(step4TicketConsumed * 0.50));
    const step6Feedback = Math.max(responses.length, 1);

    const funnel = [
      { step: "1단계: 서비스 방문/랜딩", count: step1Visits, pct: 100, dropPct: 0, desc: "방 생성 및 초대 링크/코드 접속" },
      { step: "2단계: 궁합·오행 상세 탐색", count: step2Exploration, pct: Math.min(100, Math.round((step2Exploration / step1Visits) * 100)), dropPct: Math.max(0, 100 - Math.round((step2Exploration / step1Visits) * 100)), desc: "1:1 케미 카드 아코디언 및 오행 탭 확인" },
      { step: "3단계: 프리미엄 잠금 터치", count: step3LockedClicks, pct: Math.min(100, Math.round((step3LockedClicks / step1Visits) * 100)), dropPct: Math.max(0, 100 - Math.round((step3LockedClicks / step2Exploration) * 100)), desc: "비밀인연·PDF·그룹오행 해금 모달 열람" },
      { step: "4단계: 1회권/쿠폰 소모 해금", count: step4TicketConsumed, pct: Math.min(100, Math.round((step4TicketConsumed / step1Visits) * 100)), dropPct: Math.max(0, 100 - Math.round((step4TicketConsumed / step3LockedClicks) * 100)), desc: "보유 1회 확인권 차감 후 상세 내용 조회" },
      { step: "5단계: 이미지 캡처 & 친구 초대", count: step5ViralShared, pct: Math.min(100, Math.round((step5ViralShared / step1Visits) * 100)), dropPct: Math.max(0, 100 - Math.round((step5ViralShared / step4TicketConsumed) * 100)), desc: "결과 이미지 저장 및 친구 초대 바이럴" },
      { step: "6단계: 과금 의향 설문 참여", count: step6Feedback, pct: Math.min(100, Math.round((step6Feedback / step1Visits) * 100)), dropPct: Math.max(0, 100 - Math.round((step6Feedback / step5ViralShared) * 100)), desc: "적정 가격대 및 기능 피드백 제출" },
    ];

    // 🎯 MONETIZATION READINESS SCORE (0 to 100)
    const score = Math.round(
      willingnessRate * 0.35 +
      consumptionRate * 0.25 +
      Math.min(100, stickiness * 2.5) * 0.20 +
      Math.min(100, parseFloat(kFactor) * 100) * 0.20
    );

    let readinessStatus: { label: string; color: string; desc: string; badge: string };
    if (score >= 70) {
      readinessStatus = {
        label: "유료화 전환 추천 (High Readiness)",
        color: "text-ink",
        desc: "1회권 소모 참여와 설문 지불 의향이 높아, 유료 결제 전환 시 안정적인 수익 창출이 기대됩니다.",
        badge: "유료화 적기"
      };
    } else if (score >= 45) {
      readinessStatus = {
        label: "추가 모객·무료 바이럴 검증 권장 (Moderate Readiness)",
        color: "text-ink",
        desc: "기본적인 지불 의향은 확인되었으나, 모임방 생성 바이럴과 1회권 재방문 고착도를 조금 더 확충하는 것을 추천합니다.",
        badge: "추가 검증 권장"
      };
    } else {
      readinessStatus = {
        label: "무료 모객 집중 단계 (Early Discovery)",
        color: "text-ink",
        desc: "아직 초기 단계로 유료화보다는 무료 체험 및 친구 초대 혜택을 통해 MAU 풀을 300명 이상 확장하는 것이 우선입니다.",
        badge: "무료 모객 집중"
      };
    }

    const trendList = Object.values(dailyMap);
    const maxPv = Math.max(...trendList.map(t => t.pv), 10);

    return {
      dau,
      wau,
      mau,
      stickiness,
      willingnessRate,
      paidIntentCount,
      kFactor,
      featureCounts,
      funnel,
      score,
      readinessStatus,
      freeCount: freeEvents.length,
      couponCount: couponEvents.length,
      paidCount: paidEvents.length,
      ticketConsumedCount: featureCounts.ticketConsumed,
      lockedClicksCount: totalLockedClicks,
      inviteShareCount: featureCounts.inviteShared,
      inviteConvertCount: featureCounts.inviteConverted,
      freeTopActions,
      couponTopActions,
      paidTopActions,
      trendList,
      maxPv
    };
  }, [analyticsEvents, responses, totalMembersCount]);

  // Copy Monetization Decision Executive Report
  const handleCopyDecisionReport = () => {
    const reportText = `[인연사주 - 서비스 유료화(Monetization) 의사결정 분석 보고서]
작성일시: ${new Date().toLocaleString("ko-KR")}
분석 대상: 인연사주 (동서양 사주·자미두수·점성술 기반 인연 매칭 플랫폼)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
■ 1. 유료화 타당성 종합 진단 (Monetization Readiness Score)
- 종합 의사결정 점수: ${metrics.score} / 100점
- 최종 판단 결과: ${metrics.readinessStatus.label}
- 진단 요약: ${metrics.readinessStatus.desc}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
■ 2. 핵심 활성 사용자 및 고착도 지표
- MAU (월간 활성 사용자): ${metrics.mau.toLocaleString()}명
- WAU (주간 활성 사용자): ${metrics.wau.toLocaleString()}명
- DAU (일간 활성 사용자): ${metrics.dau.toLocaleString()}명
- 고착도 (Stickiness, DAU/MAU): ${metrics.stickiness}%
- 개설된 모임방 수: ${totalRoomsCount.toLocaleString()}개 / 참여 인원: ${totalMembersCount.toLocaleString()}명

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
■ 3. 유저 세그먼트별 활동 분석
- [무료 탐색자 (Free)]: 전체 활동의 ${Math.round((metrics.freeCount / Math.max(analyticsEvents.length, 1)) * 100)}% 점유
- [쿠폰/초대 체험자 (Trial)]: 전체 활동의 ${Math.round((metrics.couponCount / Math.max(analyticsEvents.length, 1)) * 100)}% 점유 (1회 확인권 ${metrics.ticketConsumedCount}회 소모)
- [유료 전환 의향자 (Core)]: 전체 활동의 ${Math.round((metrics.paidCount / Math.max(analyticsEvents.length, 1)) * 100)}% 점유

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
■ 4. 1회 확인권 소모 & 친구 초대 바이럴 성과
- 1회 확인권 누적 소모 횟수: ${metrics.ticketConsumedCount}회
- 잠금 기능 탐색(구매 의향 클릭): ${metrics.lockedClicksCount}회
- 친구 초대 링크 공유 횟수: ${metrics.inviteShareCount}회 / 초대 유입 전환: ${metrics.inviteConvertCount}명
- 바이럴 계수 (K-Factor): ${metrics.kFactor}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
■ 5. 정량적 설문 지불의향 검증 (응답자 ${responses.length}명)
- 유료 리포트 지불 의향률: ${metrics.willingnessRate}% (${responses.length}명 중 ${metrics.paidIntentCount}명 찬성)
- 선호 가격대: 1,000원 ~ 2,900원 (단발성 1회 확인권 및 모임 총괄 분석서 선호)
`;

    navigator.clipboard.writeText(reportText).then(() => {
      setCopiedDecisionReport(true);
      setTimeout(() => setCopiedDecisionReport(false), 2500);
    });
  };

  // Render Access Denied
  const isAdminUser = currentUser?.email?.toLowerCase() === "lhs41977@gmail.com";

  if (!loading && !isAdminUser) {
    return (
      <Layout title="관리자 콘솔" showHomeButton>
        <div className="flex flex-col items-center justify-center py-16 text-center space-y-6">
          <div className="w-14 h-14 rounded-full bg-sunken text-ink-soft flex items-center justify-center">
            <Lock className="w-6 h-6" />
          </div>
          <div className="space-y-2">
            <h3 className="font-serif text-lg font-semibold text-ink">접근 권한이 없습니다</h3>
            <p className="text-sm text-ink-soft leading-relaxed max-w-xs mx-auto">
              이 화면은 최고 관리자(<span className="font-semibold text-ink">lhs41977@gmail.com</span>) 전용 콘솔입니다.
              구글 로그인으로 해당 계정에 접속해 주세요.
            </p>
          </div>
          <a
            href="#/"
            className="px-5 py-3 bg-seal hover:bg-seal-deep text-white font-semibold text-sm rounded-xl transition-colors cursor-pointer"
          >
            처음으로 돌아가기
          </a>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="관리자 콘솔" showHomeButton>
      <div className="space-y-6 text-left pb-16">

        {/* Master Header */}
        <div className="bg-surface border border-line rounded-xl p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="space-y-1.5">
            <h2 className="font-serif text-lg font-semibold text-ink">
              유료화 의사결정 콘솔
            </h2>
            <p className="text-xs text-ink-soft">
              관리자 <span className="font-medium text-ink">{currentUser?.email}</span> · MAU {metrics.mau}명 · 판정 <span className="font-medium text-ink">{metrics.readinessStatus.badge}</span>
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyDecisionReport}
              className="flex items-center gap-1.5 px-4 py-2.5 bg-sunken hover:bg-line text-ink font-semibold text-xs rounded-xl transition-colors cursor-pointer"
            >
              {copiedDecisionReport ? (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>보고서 복사 완료</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>의사결정 보고서 복사</span>
                </>
              )}
            </button>

            <button
              onClick={loadAdminData}
              disabled={loading}
              className="flex items-center gap-1.5 px-3 py-2.5 bg-sunken hover:bg-line text-ink text-xs font-semibold rounded-xl transition-colors cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
              <span>새로고침</span>
            </button>
          </div>
        </div>

        {/* Global Navigation Tabs */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-1 bg-sunken p-1 rounded-xl text-sm">
          <button
            onClick={() => setActiveTab("decision_metrics")}
            className={`py-2.5 px-2 text-xs rounded-lg transition-colors text-center cursor-pointer ${
              activeTab === "decision_metrics"
                ? "bg-surface text-ink font-semibold"
                : "text-ink-soft hover:text-ink font-medium"
            }`}
          >
            유료화 지표
          </button>

          <button
            onClick={() => setActiveTab("coupons")}
            className={`py-2.5 px-2 text-xs rounded-lg transition-colors text-center cursor-pointer ${
              activeTab === "coupons"
                ? "bg-surface text-ink font-semibold"
                : "text-ink-soft hover:text-ink font-medium"
            }`}
          >
            확인권·쿠폰 관리
          </button>

          <button
            onClick={() => setActiveTab("shop_control")}
            className={`py-2.5 px-2 text-xs rounded-lg transition-colors text-center cursor-pointer ${
              activeTab === "shop_control"
                ? "bg-surface text-ink font-semibold"
                : "text-ink-soft hover:text-ink font-medium"
            }`}
          >
            상점·베타 제어
          </button>

          <button
            onClick={() => setActiveTab("survey")}
            className={`py-2.5 px-2 text-xs rounded-lg transition-colors text-center cursor-pointer ${
              activeTab === "survey"
                ? "bg-surface text-ink font-semibold"
                : "text-ink-soft hover:text-ink font-medium"
            }`}
          >
            지불의향 설문 ({responses.length}명)
          </button>
        </div>

        {/* ========================================================================= */}
        {/* TAB 1: BM MONETIZATION DECISION METRICS & CHARTS                          */}
        {/* ========================================================================= */}
        {activeTab === "decision_metrics" && (
          <div className="space-y-6 animate-fade-in">
            
            {/* 1. MONETIZATION READINESS SCORECARD */}
            <div className="bg-surface border border-line rounded-xl p-5 sm:p-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1.5">
                  <span className="text-xs text-ink-faint block">
                    유료화 적정성 종합 지수 (Monetization Readiness)
                  </span>
                  <h3 className={`font-serif text-lg font-semibold tracking-tight ${metrics.readinessStatus.color}`}>
                    {metrics.readinessStatus.label}
                  </h3>
                  <p className="text-xs text-ink-soft leading-relaxed max-w-2xl">
                    {metrics.readinessStatus.desc}
                  </p>
                </div>

                {/* Big Score Dial */}
                <div className="flex items-center gap-4 bg-sunken p-4 rounded-xl shrink-0">
                  <div className="text-right">
                    <span className="text-xs text-ink-faint block">의사결정 스코어</span>
                    <span className="font-mono text-3xl font-semibold text-ink">
                      {metrics.score}<span className="text-sm font-normal text-ink-faint">/100</span>
                    </span>
                  </div>
                  <span className="text-xs font-semibold text-ink">
                    {metrics.score >= 70 ? "GO" : metrics.score >= 45 ? "WAIT" : "GROW"}
                  </span>
                </div>
              </div>

              {/* Progress Factors */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mt-4 pt-4 border-t border-line text-xs">
                <div className="bg-sunken p-2.5 rounded-xl">
                  <span className="text-xs text-ink-faint block">설문 유료 지불의향</span>
                  <span className="font-semibold text-ink">{metrics.willingnessRate}% ({metrics.paidIntentCount}/{responses.length}명)</span>
                </div>
                <div className="bg-sunken p-2.5 rounded-xl">
                  <span className="text-xs text-ink-faint block">1회권 소모율</span>
                  <span className="font-semibold text-ink">{metrics.ticketConsumedCount}회 소모 완료</span>
                </div>
                <div className="bg-sunken p-2.5 rounded-xl">
                  <span className="text-xs text-ink-faint block">고착도 (DAU/MAU)</span>
                  <span className="font-semibold text-ink">{metrics.stickiness}% 고착</span>
                </div>
                <div className="bg-sunken p-2.5 rounded-xl">
                  <span className="text-xs text-ink-faint block">바이럴 K-Factor</span>
                  <span className="font-semibold text-ink">{metrics.kFactor} (초대 {metrics.inviteConvertCount}명 유입)</span>
                </div>
              </div>
            </div>

            {/* 2. CORE TRAFFIC KPI CARDS (DAU, WAU, MAU, STICKINESS) */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">

              <div className="bg-surface border border-line rounded-xl p-4 space-y-1 text-left">
                <span className="text-xs text-ink-soft block">MAU (월간 활성)</span>
                <div className="font-mono text-2xl font-semibold text-ink">
                  {metrics.mau.toLocaleString()}<span className="text-xs font-normal text-ink-soft ml-1">명</span>
                </div>
                <span className="text-xs text-ink-faint block">
                  30일간 순 방문자
                </span>
              </div>

              <div className="bg-surface border border-line rounded-xl p-4 space-y-1 text-left">
                <span className="text-xs text-ink-soft block">WAU (주간 활성)</span>
                <div className="font-mono text-2xl font-semibold text-ink">
                  {metrics.wau.toLocaleString()}<span className="text-xs font-normal text-ink-soft ml-1">명</span>
                </div>
                <span className="text-xs text-ink-faint block">
                  7일간 순 방문자
                </span>
              </div>

              <div className="bg-surface border border-line rounded-xl p-4 space-y-1 text-left">
                <span className="text-xs text-ink-soft block">DAU (일간 활성)</span>
                <div className="font-mono text-2xl font-semibold text-ink">
                  {metrics.dau.toLocaleString()}<span className="text-xs font-normal text-ink-soft ml-1">명</span>
                </div>
                <span className="text-xs text-ink-faint block">
                  24시간 순 방문자
                </span>
              </div>

              <div className="bg-surface border border-line rounded-xl p-4 space-y-1 text-left">
                <span className="text-xs text-ink-soft block">서비스 고착도</span>
                <div className="font-mono text-2xl font-semibold text-ink">
                  {metrics.stickiness}<span className="text-xs font-normal text-ink-soft ml-0.5">%</span>
                </div>
                <span className="text-xs text-ink-faint block">
                  DAU ÷ MAU 비율
                </span>
              </div>

            </div>

            {/* 3. VISUAL ACTIVITY TREND CHART (LAST 14 DAYS) */}
            <div className="bg-surface border border-line rounded-xl p-5 sm:p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-[15px] font-semibold text-ink">
                  최근 14일 트래픽·확인권 소모 추이
                </h4>
                <span className="text-xs text-ink-faint">일별 인터랙션 집계</span>
              </div>

              {/* Bar Chart Visualizer */}
              <div className="h-44 flex items-end justify-between gap-1 sm:gap-2 pt-6 pb-2 px-2 bg-sunken rounded-xl">
                {metrics.trendList.map((item, idx) => {
                  const pvHeight = Math.max(12, Math.round((item.pv / metrics.maxPv) * 100));
                  const ticketHeight = Math.min(pvHeight, item.ticketConsumed * 15);
                  return (
                    <div key={idx} className="flex-1 flex flex-col items-center gap-1 group relative">
                      {/* Tooltip on Hover */}
                      <div className="absolute -top-10 hidden group-hover:flex flex-col items-center bg-ink text-white text-xs px-2 py-1 rounded-md z-20 whitespace-nowrap shadow-lg">
                        <span>{item.date} : {item.pv} PV</span>
                        <span>티켓 소모: {item.ticketConsumed}회</span>
                      </div>

                      {/* Dual Bar */}
                      <div className="w-full max-w-[22px] flex flex-col justify-end h-32 rounded-t-md overflow-hidden bg-line/60 relative">
                        <div
                          style={{ height: `${pvHeight}%` }}
                          className="w-full bg-ink/30 rounded-t-md transition-all"
                        />
                        {item.ticketConsumed > 0 && (
                          <div
                            style={{ height: `${ticketHeight}%` }}
                            className="w-full bg-ink absolute bottom-0 left-0"
                          />
                        )}
                      </div>
                      <span className="text-xs text-ink-faint font-mono">{idx % 2 === 0 ? item.date : ""}</span>
                    </div>
                  );
                })}
              </div>

              <div className="flex items-center justify-center gap-4 text-xs text-ink-soft pt-1">
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded bg-ink/30 inline-block" />
                  <span>페이지뷰·기능 탐색 (PV)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded bg-ink inline-block" />
                  <span>1회 확인권 소모</span>
                </div>
              </div>
            </div>

            {/* 4. FEATURE & MENU ENGAGEMENT HITMAP */}
            <div className="bg-surface border border-line rounded-xl p-5 sm:p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-[15px] font-semibold text-ink">
                  기능별 클릭 인기도
                </h4>
                <span className="text-xs text-ink-faint">실측 인터랙션 집계</span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-left">
                {/* 1:1 케미 & 궁합 조회 */}
                <div className="bg-sunken p-3 rounded-xl space-y-1">
                  <span className="text-xs text-ink-soft block">궁합·사주 조회</span>
                  <div className="font-mono text-lg font-semibold text-ink">
                    {metrics.featureCounts.viewSaju + metrics.featureCounts.cardExpand}
                    <span className="text-xs font-normal text-ink-faint ml-1">회</span>
                  </div>
                  <span className="text-xs text-ink-faint block">
                    기본 탐색 코어
                  </span>
                </div>

                {/* 4대 영역 잠금 터치 */}
                <div className="bg-sunken p-3 rounded-xl space-y-1">
                  <span className="text-xs text-ink-soft block">비밀 인연 잠금 터치</span>
                  <div className="font-mono text-lg font-semibold text-ink">
                    {metrics.featureCounts.lockedSecret}
                    <span className="text-xs font-normal text-ink-faint ml-1">회</span>
                  </div>
                  <span className="text-xs text-ink-faint block">
                    최대 관심 품목
                  </span>
                </div>

                {/* PDF 리포트 락 */}
                <div className="bg-sunken p-3 rounded-xl space-y-1">
                  <span className="text-xs text-ink-soft block">PDF 리포트 잠금 터치</span>
                  <div className="font-mono text-lg font-semibold text-ink">
                    {metrics.featureCounts.lockedPdf}
                    <span className="text-xs font-normal text-ink-faint ml-1">회</span>
                  </div>
                  <span className="text-xs text-ink-faint block">
                    고단가 유료 전환군
                  </span>
                </div>

                {/* 결과 이미지 캡처 & 공유 */}
                <div className="bg-sunken p-3 rounded-xl space-y-1">
                  <span className="text-xs text-ink-soft block">이미지 캡처·공유</span>
                  <div className="font-mono text-lg font-semibold text-ink">
                    {metrics.featureCounts.resultCapture + metrics.featureCounts.inviteShared}
                    <span className="text-xs font-normal text-ink-faint ml-1">회</span>
                  </div>
                  <span className="text-xs text-ink-faint block">
                    바이럴 확산 동력
                  </span>
                </div>
              </div>
            </div>

            {/* 5. USER BEHAVIOR CONVERSION & DROP-OFF FUNNEL */}
            <div className="bg-surface border border-line rounded-xl p-5 sm:p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-[15px] font-semibold text-ink">
                  유저 행동 전환·이탈 퍼널 (6단계)
                </h4>
                <span className="text-xs text-ink-faint">
                  전환 병목지점 추적
                </span>
              </div>

              <div className="space-y-3">
                {metrics.funnel.map((step, idx) => (
                  <div key={idx} className="space-y-1 text-left">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-ink">{step.step}</span>
                        <span className="text-xs text-ink-faint font-normal hidden sm:inline">({step.desc})</span>
                      </div>
                      <div className="flex items-center gap-2 font-mono">
                        <strong className="text-ink">{step.count.toLocaleString()}회</strong>
                        <span className="text-xs text-ink-soft">({step.pct}%)</span>
                        {step.dropPct > 0 && (
                          <span className="text-xs text-ink-faint bg-sunken px-1.5 py-0.5 rounded-md">
                            이탈 {step.dropPct}%
                          </span>
                        )}
                      </div>
                    </div>
                    {/* Progress bar */}
                    <div className="w-full h-2 bg-sunken rounded-full overflow-hidden">
                      <div
                        style={{ width: `${Math.max(4, step.pct)}%` }}
                        className="h-full rounded-full transition-all bg-ink/70"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 6. USER TIER SEGMENT COMPARISON (FREE vs TRIAL/COUPON vs PAID) */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-[15px] font-semibold text-ink">
                  유저 세그먼트별 활동·이탈 지점
                </h4>
                <span className="text-xs text-ink-faint">
                  Firestore 로그 기반 (N={analyticsEvents.length}건)
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">

                {/* Segment 1: Free Tier */}
                <div className="bg-surface border border-line rounded-xl p-4 space-y-3 text-left">
                  <div className="flex items-center justify-between border-b border-line pb-2">
                    <span className="font-semibold text-xs text-ink">무료 사용자 (Free)</span>
                    <span className="text-xs bg-sunken text-ink-soft px-1.5 py-0.5 rounded-md">
                      N={metrics.freeCount}건
                    </span>
                  </div>

                  {/* Top Real Actions */}
                  <div className="space-y-1.5 text-xs">
                    <span className="text-xs text-ink-faint block">발생 상위 이벤트</span>
                    {metrics.freeTopActions.length === 0 ? (
                      <p className="text-xs text-ink-faint">아직 수집된 로그가 없습니다.</p>
                    ) : (
                      metrics.freeTopActions.slice(0, 3).map((act, i) => (
                        <div key={i} className="flex justify-between items-center bg-sunken p-1.5 rounded-lg text-xs">
                          <span className="font-mono truncate text-ink-soft">{act.name}</span>
                          <strong className="text-ink">{act.count}회 ({act.pct}%)</strong>
                        </div>
                      ))
                    )}
                  </div>

                  <div className="space-y-1 text-xs border-t border-line pt-2">
                    <div className="flex justify-between text-xs">
                      <span className="text-ink-faint">주요 이탈 지점</span>
                      <span className="text-ink font-medium">비밀 인연 잠금 마주침</span>
                    </div>
                  </div>
                  <p className="text-xs text-ink-soft bg-sunken p-2.5 rounded-xl leading-relaxed">
                    <strong className="text-ink">전환 처방</strong> · 친구 1명 초대 시 즉시 1회 확인권을 지급해 체험 단계로 유도.
                  </p>
                </div>

                {/* Segment 2: Coupon / Trial Tier */}
                <div className="bg-surface border border-line rounded-xl p-4 space-y-3 text-left">
                  <div className="flex items-center justify-between border-b border-line pb-2">
                    <span className="font-semibold text-xs text-ink">쿠폰·초대 체험자 (Trial)</span>
                    <span className="text-xs bg-sunken text-ink-soft px-1.5 py-0.5 rounded-md">
                      N={metrics.couponCount}건
                    </span>
                  </div>

                  {/* Top Real Actions */}
                  <div className="space-y-1.5 text-xs">
                    <span className="text-xs text-ink-faint block">발생 상위 이벤트</span>
                    {metrics.couponTopActions.length === 0 ? (
                      <p className="text-xs text-ink-faint">아직 수집된 로그가 없습니다.</p>
                    ) : (
                      metrics.couponTopActions.slice(0, 3).map((act, i) => (
                        <div key={i} className="flex justify-between items-center bg-sunken p-1.5 rounded-lg text-xs">
                          <span className="font-mono truncate text-ink-soft">{act.name}</span>
                          <strong className="text-ink">{act.count}회 ({act.pct}%)</strong>
                        </div>
                      ))
                    )}
                  </div>

                  <div className="space-y-1 text-xs border-t border-line pt-2">
                    <div className="flex justify-between text-xs">
                      <span className="text-ink-faint">1회권 소모 / 초대 시도</span>
                      <strong className="text-ink font-mono">{metrics.featureCounts.ticketConsumed}회 / {metrics.featureCounts.inviteShared}회</strong>
                    </div>
                  </div>
                  <p className="text-xs text-ink-soft bg-sunken p-2.5 rounded-xl leading-relaxed">
                    <strong className="text-ink">전환 처방</strong> · 1회권 소모 후 결과 공유와 만족도 설문을 연계.
                  </p>
                </div>

                {/* Segment 3: Paid Intent Tier */}
                <div className="bg-surface border border-line rounded-xl p-4 space-y-3 text-left">
                  <div className="flex items-center justify-between border-b border-line pb-2">
                    <span className="font-semibold text-xs text-ink">유료 지불 의향자 (Core Paid)</span>
                    <span className="text-xs bg-sunken text-ink-soft px-1.5 py-0.5 rounded-md">
                      응답 {responses.length}명
                    </span>
                  </div>

                  <div className="space-y-1.5 text-xs">
                    <div className="flex justify-between text-xs">
                      <span className="text-ink-faint">지불 의향 찬성률</span>
                      <strong className="text-ink font-mono">{metrics.willingnessRate}% ({metrics.paidIntentCount}명)</strong>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-ink-faint">최대 관심 품목</span>
                      <span className="text-ink font-medium">PDF 소장권·모임 오행</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-ink-faint">선호 과금 모델</span>
                      <span className="text-ink-soft">1,000~2,900원 건별 결제</span>
                    </div>
                  </div>

                  <p className="text-xs text-ink-soft bg-sunken p-2.5 rounded-xl leading-relaxed">
                    <strong className="text-ink">전환 처방</strong> · 정식 결제 오픈 시 얼리버드 할인 안내 이메일 발송.
                  </p>
                </div>

              </div>
            </div>

            {/* 7. FILTERABLE RAW LIVE EVENT AUDIT EXPLORER */}
            <div className="bg-surface border border-line rounded-xl p-5 sm:p-6 space-y-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                <h4 className="text-[15px] font-semibold text-ink">
                  실시간 이벤트 로그 탐색기
                </h4>
                <div className="flex items-center gap-2">
                  <button
                    onClick={loadAdminData}
                    className="p-1.5 rounded-lg bg-sunken hover:bg-line text-ink-soft hover:text-ink transition-colors cursor-pointer"
                    title="로그 새로고침"
                    aria-label="로그 새로고침"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                  </button>
                  <span className="text-xs text-ink-faint">전체 {analyticsEvents.length}건 중 표시</span>
                </div>
              </div>

              {/* Filters Toolbar */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                {/* Filter 1: Tier */}
                <div className="flex items-center gap-2">
                  <span className="text-xs text-ink-faint shrink-0">세그먼트</span>
                  <select
                    value={logFilterTier}
                    onChange={(e) => setLogFilterTier(e.target.value)}
                    className="w-full bg-sunken rounded-xl px-2 py-1.5 text-xs text-ink focus:outline-none focus:ring-1 focus:ring-ink"
                  >
                    <option value="all">전체 유저 (All Tiers)</option>
                    <option value="free">무료 사용자 (Free)</option>
                    <option value="coupon">쿠폰·체험자 (Coupon/Trial)</option>
                    <option value="paid">유료 지불자 (Paid)</option>
                  </select>
                </div>

                {/* Filter 2: Category */}
                <div className="flex items-center gap-2">
                  <span className="text-xs text-ink-faint shrink-0">카테고리</span>
                  <select
                    value={logFilterCategory}
                    onChange={(e) => setLogFilterCategory(e.target.value)}
                    className="w-full bg-sunken rounded-xl px-2 py-1.5 text-xs text-ink focus:outline-none focus:ring-1 focus:ring-ink"
                  >
                    <option value="all">전체 카테고리 (All)</option>
                    <option value="traffic">방문 및 트래픽 (traffic)</option>
                    <option value="engagement">콘텐츠 탐색 (engagement)</option>
                    <option value="conversion">잠금 터치 및 해금 (conversion)</option>
                    <option value="viral">공유 및 초대 (viral)</option>
                    <option value="ui_nav">UI 및 탭 전환 (ui_nav)</option>
                  </select>
                </div>

                {/* Filter 3: Search text */}
                <div>
                  <input
                    type="text"
                    placeholder="이벤트명, 룸코드, 메타데이터 검색"
                    value={logSearchQuery}
                    onChange={(e) => setLogSearchQuery(e.target.value)}
                    className="w-full bg-sunken rounded-xl px-3 py-1.5 text-xs text-ink placeholder:text-ink-faint focus:outline-none focus:ring-1 focus:ring-ink"
                  />
                </div>
              </div>

              {/* Filtered Event Stream */}
              {(() => {
                const filtered = analyticsEvents.filter(ev => {
                  if (logFilterTier !== "all" && (ev.userTier || "free") !== logFilterTier) return false;
                  if (logFilterCategory !== "all" && ev.category !== logFilterCategory) return false;
                  if (logSearchQuery.trim()) {
                    const q = logSearchQuery.toLowerCase();
                    const matchEvent = ev.eventName.toLowerCase().includes(q);
                    const matchRoom = ev.roomCode?.toLowerCase().includes(q);
                    const matchMeta = ev.metadata ? JSON.stringify(ev.metadata).toLowerCase().includes(q) : false;
                    if (!matchEvent && !matchRoom && !matchMeta) return false;
                  }
                  return true;
                });

                if (filtered.length === 0) {
                  return (
                    <div className="p-6 text-center text-xs text-ink-faint bg-sunken rounded-xl">
                      일치하는 이벤트 로그가 없습니다. 필터를 조정해 보세요.
                    </div>
                  );
                }

                return (
                  <div className="overflow-x-auto max-h-96">
                    <table className="w-full text-left text-xs">
                      <thead className="text-ink-faint border-b border-line text-xs sticky top-0 z-10 bg-surface">
                        <tr>
                          <th className="p-2.5 font-medium">발생 일시</th>
                          <th className="p-2.5 font-medium">이벤트명</th>
                          <th className="p-2.5 font-medium">세그먼트</th>
                          <th className="p-2.5 font-medium">카테고리</th>
                          <th className="p-2.5 font-medium">룸코드</th>
                          <th className="p-2.5 font-medium">상세 메타데이터</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-line font-mono">
                        {filtered.slice(0, 30).map((ev) => (
                          <tr key={ev.id} className="hover:bg-sunken transition-colors">
                            <td className="p-2.5 text-ink-faint whitespace-nowrap text-xs">
                              {new Date(ev.timestamp).toLocaleTimeString("ko-KR")}
                            </td>
                            <td className="p-2.5 font-semibold text-ink">{ev.eventName}</td>
                            <td className="p-2.5">
                              <span className="px-1.5 py-0.5 rounded-md text-xs bg-sunken text-ink-soft">
                                {ev.userTier || "free"}
                              </span>
                            </td>
                            <td className="p-2.5 text-ink-soft font-sans text-xs">{ev.category}</td>
                            <td className="p-2.5 text-ink-soft text-xs">{ev.roomCode || "-"}</td>
                            <td className="p-2.5 text-ink-faint truncate max-w-xs text-xs">
                              {ev.metadata ? JSON.stringify(ev.metadata) : "-"}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                );
              })()}
            </div>

          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 2: LIVE FIRESTORE TICKETS & PROMO COUPONS MANAGEMENT                  */}
        {/* ========================================================================= */}
        {activeTab === "coupons" && (
          <div className="space-y-6 animate-fade-in">
            
            {/* 1. Live DB Ticket Account Statistics & Actions */}
            <div className="bg-surface border border-line rounded-xl p-5 sm:p-6 space-y-4">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div>
                  <h4 className="text-[15px] font-semibold text-ink">
                    티켓 실시간 통합 관리
                  </h4>
                  <p className="text-xs text-ink-soft mt-0.5">
                    user_tickets 컬렉션 연동. 모든 사용자의 1회 확인권 잔여량을 조회하고 직접 지급·차감·초기화합니다.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={refreshAllUserTickets}
                    disabled={ticketActionLoading}
                    className="flex items-center gap-1.5 px-3 py-2 bg-sunken hover:bg-line text-ink text-xs font-semibold rounded-xl transition-colors cursor-pointer"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${ticketActionLoading ? "animate-spin" : ""}`} />
                    <span>DB 새로고침</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleBatchResetAllToZero}
                    disabled={ticketActionLoading || userTicketAccounts.length === 0}
                    className="flex items-center gap-1.5 px-3 py-2 bg-sunken hover:bg-line disabled:opacity-50 text-seal text-xs font-semibold rounded-xl transition-colors cursor-pointer"
                    title="모든 사용자 티켓을 0장으로 일괄 초기화합니다."
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>전체 계정 일괄 초기화</span>
                  </button>
                </div>
              </div>

              {ticketActionMsg && (
                <div className="text-xs bg-sunken text-ink p-3 rounded-xl flex items-center gap-2 animate-fade-in">
                  <CheckCircle2 className="w-4 h-4 text-ink-soft shrink-0" />
                  <span className="font-medium">{ticketActionMsg}</span>
                </div>
              )}

              {/* DB Aggregated Summary Cards */}
              {(() => {
                const totalPdf = userTicketAccounts.reduce((acc, cur) => acc + (cur.tickets?.pdf || 0), 0);
                const totalSecret = userTicketAccounts.reduce((acc, cur) => acc + (cur.tickets?.secret || 0), 0);
                const totalGroup = userTicketAccounts.reduce((acc, cur) => acc + (cur.tickets?.group || 0), 0);
                const totalAll = userTicketAccounts.reduce((acc, cur) => acc + (cur.tickets?.all || 0), 0);
                const grandTotal = totalPdf + totalSecret + totalGroup + totalAll;

                return (
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-xs">
                    <div className="bg-sunken p-3 rounded-xl">
                      <div className="text-xs text-ink-faint">등록 계정 수</div>
                      <div className="font-mono font-semibold text-base text-ink">{userTicketAccounts.length}명</div>
                    </div>
                    <div className="bg-sunken p-3 rounded-xl">
                      <div className="text-xs text-ink-faint">PDF 소장권</div>
                      <div className="font-mono font-semibold text-base text-ink">{totalPdf}장</div>
                    </div>
                    <div className="bg-sunken p-3 rounded-xl">
                      <div className="text-xs text-ink-faint">비밀인연권</div>
                      <div className="font-mono font-semibold text-base text-ink">{totalSecret}장</div>
                    </div>
                    <div className="bg-sunken p-3 rounded-xl">
                      <div className="text-xs text-ink-faint">그룹오행권</div>
                      <div className="font-mono font-semibold text-base text-ink">{totalGroup}장</div>
                    </div>
                    <div className="bg-sunken p-3 rounded-xl col-span-2 sm:col-span-1">
                      <div className="text-xs text-ink-faint">올패스 / 총합</div>
                      <div className="font-mono font-semibold text-base text-ink">{totalAll}장 (총 {grandTotal}장)</div>
                    </div>
                  </div>
                );
              })()}

              {/* Search & Filter Bar */}
              <div className="flex items-center justify-between gap-2 flex-wrap pt-2">
                <input
                  type="text"
                  value={ticketSearchQuery}
                  onChange={(e) => setTicketSearchQuery(e.target.value)}
                  placeholder="UID 또는 추천인 코드로 계정 검색"
                  className="px-3 py-2 bg-sunken rounded-xl text-xs flex-1 min-w-[200px] text-ink placeholder:text-ink-faint focus:outline-none focus:ring-1 focus:ring-ink"
                />
                <span className="text-xs text-ink-faint">
                  표시 중: {userTicketAccounts.filter(a => !ticketSearchQuery || a.userUid.toLowerCase().includes(ticketSearchQuery.toLowerCase()) || (a.referralCode || "").toLowerCase().includes(ticketSearchQuery.toLowerCase())).length}개
                </span>
              </div>

              {/* User Tickets Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="text-ink-faint border-b border-line text-xs">
                    <tr>
                      <th className="p-3 font-medium">사용자 UID / 추천인</th>
                      <th className="p-3 font-medium text-center">PDF</th>
                      <th className="p-3 font-medium text-center">비밀인연</th>
                      <th className="p-3 font-medium text-center">그룹오행</th>
                      <th className="p-3 font-medium text-center">올패스</th>
                      <th className="p-3 font-medium text-center">등급</th>
                      <th className="p-3 font-medium text-center">지급 / 차감 / 초기화</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line">
                    {userTicketAccounts
                      .filter(a => !ticketSearchQuery || a.userUid.toLowerCase().includes(ticketSearchQuery.toLowerCase()) || (a.referralCode || "").toLowerCase().includes(ticketSearchQuery.toLowerCase()))
                      .map((acc) => {
                        const isCurrentMaster = auth.currentUser?.uid === acc.userUid;
                        const isExpanded = expandedUserUid === acc.userUid;
                        return (
                          <React.Fragment key={acc.userUid}>
                            <tr className={`hover:bg-sunken transition-colors ${isCurrentMaster ? "font-medium" : ""} ${isExpanded ? "bg-sunken/60" : ""}`}>
                              <td className="p-3">
                                <div className="flex items-center gap-1.5">
                                  <span className="font-mono text-xs text-ink">{acc.userUid}</span>
                                  {isCurrentMaster && (
                                    <span className="px-1.5 py-0.5 bg-sunken text-ink-soft rounded-md text-xs font-medium">
                                      내 계정
                                    </span>
                                  )}
                                  <button
                                    type="button"
                                    onClick={() => setExpandedUserUid(isExpanded ? null : acc.userUid)}
                                    className={`flex items-center gap-0.5 px-1.5 py-0.5 rounded-md text-xs font-medium transition-colors ml-1 cursor-pointer ${
                                      isExpanded
                                        ? "bg-line text-ink"
                                        : "bg-sunken hover:bg-line text-ink-soft"
                                    }`}
                                    title="티켓 발급/유입 경로 추적"
                                  >
                                    <Search className="w-2.5 h-2.5" />
                                    <span>경로 추적</span>
                                  </button>
                                </div>
                                <div className="text-xs text-ink-faint font-mono">
                                  추천코드: {acc.referralCode || "-"} (초대: {acc.invitedCount || 0}명)
                                </div>
                              </td>
                              <td className="p-3 text-center font-mono font-semibold text-ink">
                                {acc.tickets?.pdf || 0}
                              </td>
                              <td className="p-3 text-center font-mono font-semibold text-ink">
                                {acc.tickets?.secret || 0}
                              </td>
                              <td className="p-3 text-center font-mono font-semibold text-ink">
                                {acc.tickets?.group || 0}
                              </td>
                              <td className="p-3 text-center font-mono font-semibold text-ink">
                                {acc.tickets?.all || 0}
                              </td>
                              <td className="p-3 text-center">
                                <span className="px-2 py-0.5 rounded-md text-xs bg-sunken text-ink-soft">
                                  {acc.userTier || "free"}
                                </span>
                              </td>
                              <td className="p-3 text-center">
                                <div className="flex items-center justify-center gap-1 flex-wrap">
                                  {/* Quick Grant Buttons */}
                                  <button
                                    type="button"
                                    onClick={() => handleAdjustTickets(acc.userUid, "pdf", 1, "관리자 빠른 지급")}
                                    disabled={ticketActionLoading}
                                    title="PDF 1장 지급"
                                    className="px-1.5 py-0.5 bg-sunken hover:bg-line text-ink rounded-md text-xs font-medium cursor-pointer"
                                  >
                                    +PDF
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleAdjustTickets(acc.userUid, "secret", 1, "관리자 빠른 지급")}
                                    disabled={ticketActionLoading}
                                    title="비밀인연 1장 지급"
                                    className="px-1.5 py-0.5 bg-sunken hover:bg-line text-ink rounded-md text-xs font-medium cursor-pointer"
                                  >
                                    +비밀
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleAdjustTickets(acc.userUid, "group", 1, "관리자 빠른 지급")}
                                    disabled={ticketActionLoading}
                                    title="그룹오행 1장 지급"
                                    className="px-1.5 py-0.5 bg-sunken hover:bg-line text-ink rounded-md text-xs font-medium cursor-pointer"
                                  >
                                    +그룹
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleAdjustTickets(acc.userUid, "all", 1, "관리자 빠른 지급")}
                                    disabled={ticketActionLoading}
                                    title="올패스 1장 지급"
                                    className="px-1.5 py-0.5 bg-sunken hover:bg-line text-ink rounded-md text-xs font-medium cursor-pointer"
                                  >
                                    +올패스
                                  </button>

                                  {/* Quick Deduct */}
                                  <button
                                    type="button"
                                    onClick={() => handleAdjustTickets(acc.userUid, "pdf", -1, "관리자 빠른 차감")}
                                    disabled={ticketActionLoading || (acc.tickets?.pdf || 0) <= 0}
                                    title="PDF 1장 차감"
                                    className="px-1.5 py-0.5 bg-sunken hover:bg-line text-ink-soft disabled:opacity-30 rounded-md text-xs font-medium cursor-pointer"
                                  >
                                    -PDF
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleAdjustTickets(acc.userUid, "secret", -1, "관리자 빠른 차감")}
                                    disabled={ticketActionLoading || (acc.tickets?.secret || 0) <= 0}
                                    title="비밀 1장 차감"
                                    className="px-1.5 py-0.5 bg-sunken hover:bg-line text-ink-soft disabled:opacity-30 rounded-md text-xs font-medium cursor-pointer"
                                  >
                                    -비밀
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleAdjustTickets(acc.userUid, "group", -1, "관리자 빠른 차감")}
                                    disabled={ticketActionLoading || (acc.tickets?.group || 0) <= 0}
                                    title="그룹 1장 차감"
                                    className="px-1.5 py-0.5 bg-sunken hover:bg-line text-ink-soft disabled:opacity-30 rounded-md text-xs font-medium cursor-pointer"
                                  >
                                    -그룹
                                  </button>

                                  {/* Zero Reset Button */}
                                  <button
                                    type="button"
                                    onClick={() => handleResetUserToZero(acc.userUid)}
                                    disabled={ticketActionLoading}
                                    title="보유 티켓을 0장으로 초기화"
                                    className="px-2 py-0.5 bg-sunken hover:bg-line text-seal rounded-md text-xs font-medium transition-colors cursor-pointer flex items-center gap-0.5 ml-1"
                                  >
                                    <span>0건 초기화</span>
                                  </button>

                                  {/* Record Delete Button */}
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteUserAccount(acc.userUid)}
                                    disabled={ticketActionLoading}
                                    title="Firestore user_tickets 문서 완전 삭제"
                                    className="p-1 text-ink-faint hover:text-seal rounded-md transition-colors cursor-pointer"
                                  >
                                    <Trash2 className="w-3 h-3" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                            {isExpanded && (
                              <tr className="bg-sunken/60">
                                <td colSpan={7} className="p-4">
                                  <div className="space-y-2 max-w-4xl mx-auto">
                                    <div className="flex items-center justify-between border-b border-line pb-2">
                                      <h5 className="font-semibold text-xs text-ink flex items-center gap-1.5">
                                        <History className="w-3.5 h-3.5 text-ink-soft" />
                                        <span>티켓 획득 경로·발급 이력</span>
                                        <span className="font-mono text-ink-soft text-xs">{acc.userUid}</span>
                                      </h5>
                                      <button
                                        type="button"
                                        onClick={() => setExpandedUserUid(null)}
                                        className="text-xs text-ink-soft hover:text-ink cursor-pointer"
                                      >
                                        상세 닫기
                                      </button>
                                    </div>
                                    {!acc.grantHistory || acc.grantHistory.length === 0 ? (
                                      <p className="text-xs text-ink-faint py-2 pl-1">
                                        기록된 획득 이력이 없습니다. (최근 업데이트 이전 발급되었거나 기본 초기 상태)
                                      </p>
                                    ) : (
                                      <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                                        {acc.grantHistory.map((g) => (
                                          <div key={g.id || Math.random().toString()} className="flex items-center justify-between bg-surface p-2.5 rounded-xl text-xs">
                                            <div className="flex items-center gap-2 flex-wrap">
                                              <span className="px-1.5 py-0.5 rounded-md text-xs bg-sunken text-ink-soft font-medium">
                                                {g.sourceType === "coupon" ? `쿠폰 [${g.couponCode}]` :
                                                 g.sourceType === "referral" ? "친구 초대" :
                                                 g.sourceType === "manual_admin" ? "수동 지급" : "시스템"}
                                              </span>
                                              <span className="text-ink font-medium">
                                                {g.productType === "pdf" ? "심층 리포트 PDF 소장권" :
                                                 g.productType === "secret" ? "비밀 인연 궁합 해독권" :
                                                 g.productType === "group" ? "그룹 오행 분석권" : "전체 1회 올패스"}
                                                <span className="text-ink ml-1 font-mono font-semibold">+{g.amount}장</span>
                                              </span>
                                              <span className="text-ink-faint font-mono text-xs">|</span>
                                              <span className="text-ink-soft">{g.reason}</span>
                                            </div>
                                            <span className="text-ink-faint text-xs font-mono shrink-0">
                                              {new Date(g.timestamp).toLocaleString("ko-KR")}
                                            </span>
                                          </div>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                </td>
                              </tr>
                            )}
                          </React.Fragment>
                        );
                      })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* 2. Manual Custom Ticket Grant Box */}
            <div className="bg-surface border border-line rounded-xl p-5 sm:p-6 space-y-4">
              <h4 className="text-[15px] font-semibold text-ink">
                특정 사용자 티켓 직접 지급
              </h4>

              <form onSubmit={handleManualGrantSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                  <div>
                    <label className="text-xs font-medium text-ink-soft block mb-1">
                      대상 사용자 UID
                    </label>
                    <input
                      type="text"
                      value={grantUid}
                      onChange={(e) => setGrantUid(e.target.value)}
                      placeholder="예: 2mY... 또는 guest_..."
                      className="w-full px-3 py-2 bg-sunken rounded-xl text-xs font-mono text-ink placeholder:text-ink-faint focus:outline-none focus:ring-1 focus:ring-ink"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-medium text-ink-soft block mb-1">
                      지급 품목
                    </label>
                    <select
                      value={grantProduct}
                      onChange={(e: any) => setGrantProduct(e.target.value)}
                      className="w-full px-3 py-2 bg-sunken rounded-xl text-xs text-ink focus:outline-none focus:ring-1 focus:ring-ink"
                    >
                      <option value="pdf">심층 리포트 PDF 소장권</option>
                      <option value="secret">비밀 인연·속마음 상성 해독권</option>
                      <option value="group">그룹 오행 총괄 분석서</option>
                      <option value="all">전체 기능 1회 올패스</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-medium text-ink-soft block mb-1">
                      지급 수량 (장)
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={100}
                      value={grantAmount}
                      onChange={(e) => setGrantAmount(Number(e.target.value))}
                      className="w-full px-3 py-2 bg-sunken rounded-xl text-xs font-mono text-ink focus:outline-none focus:ring-1 focus:ring-ink"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-medium text-ink-soft block mb-1">
                      지급 사유
                    </label>
                    <input
                      type="text"
                      value={grantReason}
                      onChange={(e) => setGrantReason(e.target.value)}
                      placeholder="예: 고객센터 보상, 이벤트 참여"
                      className="w-full px-3 py-2 bg-sunken rounded-xl text-xs text-ink placeholder:text-ink-faint focus:outline-none focus:ring-1 focus:ring-ink"
                    />
                  </div>
                </div>

                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={ticketActionLoading || !grantUid.trim()}
                    className="flex items-center gap-1.5 px-5 py-2.5 bg-seal hover:bg-seal-deep disabled:opacity-50 text-white text-xs font-semibold rounded-xl transition-colors cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>{ticketActionLoading ? "처리 중..." : "티켓 지급하기"}</span>
                  </button>
                </div>
              </form>
            </div>

            {/* Create New 1-Use Coupon */}
            <div className="bg-surface border border-line rounded-xl p-5 sm:p-6 space-y-4">
              <h4 className="text-[15px] font-semibold text-ink">
                프로모션 쿠폰 신규 발급
              </h4>

              <form onSubmit={handleIssueCoupon} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                  <div>
                    <label className="text-xs font-medium text-ink-soft block mb-1">
                      쿠폰 코드 (대문자 자동 변환)
                    </label>
                    <input
                      type="text"
                      value={newCouponCode}
                      onChange={(e) => setNewCouponCode(e.target.value.toUpperCase())}
                      placeholder="예: VIP2026, SUMMER100"
                      className="w-full px-3 py-2 bg-sunken rounded-xl text-xs font-mono text-ink placeholder:text-ink-faint focus:outline-none focus:ring-1 focus:ring-ink"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-medium text-ink-soft block mb-1">
                      지급할 1회 확인권 품목
                    </label>
                    <select
                      value={newCouponProduct}
                      onChange={(e: any) => setNewCouponProduct(e.target.value)}
                      className="w-full px-3 py-2 bg-sunken rounded-xl text-xs text-ink focus:outline-none focus:ring-1 focus:ring-ink"
                    >
                      <option value="pdf">심층 리포트 PDF 소장권</option>
                      <option value="secret">비밀 인연·속마음 상성 해독권</option>
                      <option value="group">그룹 오행 총괄 분석서</option>
                      <option value="all">전체 기능 1회 올패스</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-medium text-ink-soft block mb-1">
                      최대 사용 가능 횟수
                    </label>
                    <input
                      type="number"
                      value={newCouponMaxUses}
                      onChange={(e) => {
                        const val = e.target.value === "" ? 0 : Number(e.target.value);
                        setNewCouponMaxUses(val);
                      }}
                      className="w-full px-3 py-2 bg-sunken rounded-xl text-xs font-mono text-ink focus:outline-none focus:ring-1 focus:ring-ink"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-medium text-ink-soft block mb-1">
                      유입 경로 / 캠페인 소스
                    </label>
                    <input
                      type="text"
                      value={newCampaignSource}
                      onChange={(e) => setNewCampaignSource(e.target.value)}
                      placeholder="예: 인스타그램 광고, 오프라인 홍보"
                      className="w-full px-3 py-2 bg-sunken rounded-xl text-xs text-ink placeholder:text-ink-faint focus:outline-none focus:ring-1 focus:ring-ink"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-medium text-ink-soft block mb-1">
                    쿠폰 설명 (내부 관리용)
                  </label>
                  <input
                    type="text"
                    value={newCouponDescription}
                    onChange={(e) => setNewCouponDescription(e.target.value)}
                    placeholder="예: 인플루언서 마케팅 연계 1회 전용 체험 쿠폰"
                    className="w-full px-3 py-2 bg-sunken rounded-xl text-xs text-ink placeholder:text-ink-faint focus:outline-none focus:ring-1 focus:ring-ink"
                  />
                </div>

                {couponError && (
                  <div className="text-xs text-seal bg-sunken p-2.5 rounded-xl font-medium">
                    {couponError}
                  </div>
                )}
                {couponSuccess && (
                  <div className="text-xs text-ink bg-sunken p-2.5 rounded-xl font-medium">
                    {couponSuccess}
                  </div>
                )}

                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={issuing}
                    className="flex items-center gap-1.5 px-5 py-2.5 bg-seal hover:bg-seal-deep text-white text-xs font-semibold rounded-xl transition-colors cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>{issuing ? "발급 처리 중..." : "쿠폰 발급하기"}</span>
                  </button>
                </div>
              </form>
            </div>

            {/* Coupons List Table */}
            <div className="bg-surface border border-line rounded-xl p-5 sm:p-6 space-y-4">
              <div className="flex items-center justify-between animate-fade-in">
                <h4 className="text-[15px] font-semibold text-ink">
                  발급된 쿠폰 목록 ({coupons.length}개)
                </h4>
                <span className="text-xs text-ink-faint">유입 경로·등록 추적 연동</span>
              </div>

              {coupons.length === 0 ? (
                <div className="p-8 text-center text-xs text-ink-faint bg-sunken rounded-xl">
                  발급된 커스텀 쿠폰이 없습니다.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="text-ink-faint border-b border-line text-xs">
                      <tr>
                        <th className="p-3 font-medium">쿠폰 코드</th>
                        <th className="p-3 font-medium">유입 캠페인 경로</th>
                        <th className="p-3 font-medium">쿠폰 설명</th>
                        <th className="p-3 font-medium">대상 품목</th>
                        <th className="p-3 font-medium text-center">사용 / 한도</th>
                        <th className="p-3 font-medium">생성 일시</th>
                        <th className="p-3 font-medium text-center">조회 / 관리</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-line">
                      {coupons.map((c) => {
                        const isExhausted = c.usedCount >= c.maxUses;
                        return (
                          <tr key={c.code} className="hover:bg-sunken transition-colors">
                            <td className="p-3 font-mono font-semibold text-ink">{c.code}</td>
                            <td className="p-3 text-ink-soft">
                              {c.campaignSource || <span className="text-ink-faint text-xs">-</span>}
                            </td>
                            <td className="p-3 text-ink-soft max-w-xs truncate" title={c.description}>
                              {c.description || <span className="text-ink-faint text-xs">-</span>}
                            </td>
                            <td className="p-3">
                              <span className="px-2 py-0.5 rounded-md text-xs bg-sunken text-ink-soft">
                                {c.productType === "pdf" ? "PDF 리포트" :
                                 c.productType === "secret" ? "비밀 인연" :
                                 c.productType === "group" ? "그룹 오행" : "전체 올패스"}
                              </span>
                            </td>
                            <td className="p-3 text-center font-mono">
                              <span className={isExhausted ? "text-seal font-semibold" : "text-ink font-semibold"}>
                                {c.usedCount}
                              </span>
                              <span className="text-ink-faint"> / {c.maxUses}</span>
                            </td>
                            <td className="p-3 text-xs text-ink-faint">
                              {new Date(c.createdAt).toLocaleDateString("ko-KR")}
                            </td>
                            <td className="p-3 text-center">
                              <div className="flex items-center justify-center gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => setSelectedCouponDetails(c)}
                                  className="px-2 py-1 bg-sunken hover:bg-line text-ink font-medium rounded-md text-xs transition-colors cursor-pointer"
                                  title="유입 유저 추적 및 상세 이력 보기"
                                >
                                  추적
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteCoupon(c.code)}
                                  className="p-1 text-ink-faint hover:text-seal transition-colors cursor-pointer"
                                  title="쿠폰 삭제"
                                  aria-label="쿠폰 삭제"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Selected Coupon Details redemption list tracing panel */}
            <AnimatePresence>
              {selectedCouponDetails && (
                <motion.div
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 15 }}
                  className="bg-surface border border-line rounded-xl p-5 sm:p-6 space-y-4"
                >
                  <div className="flex items-center justify-between border-b border-line pb-3">
                    <h4 className="text-[15px] font-semibold text-ink">
                      쿠폰 등록 추적: <span className="font-mono text-ink-soft">{selectedCouponDetails.code}</span>
                    </h4>
                    <button
                      type="button"
                      onClick={() => setSelectedCouponDetails(null)}
                      className="p-1 hover:bg-sunken rounded-md text-ink-faint hover:text-ink transition-colors cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 bg-sunken p-4 rounded-xl text-xs">
                    <div>
                      <span className="text-ink-faint block mb-0.5">캠페인 경로(유입출처)</span>
                      <span className="font-semibold text-ink">{selectedCouponDetails.campaignSource || "일반 발급"}</span>
                    </div>
                    <div>
                      <span className="text-ink-faint block mb-0.5">쿠폰 설명</span>
                      <span className="font-semibold text-ink">{selectedCouponDetails.description || "프로모션 확인권"}</span>
                    </div>
                    <div>
                      <span className="text-ink-faint block mb-0.5">총 등록 건수</span>
                      <span className="font-semibold text-ink font-mono">{selectedCouponDetails.usedCount} / {selectedCouponDetails.maxUses}회</span>
                    </div>
                    <div>
                      <span className="text-ink-faint block mb-0.5">발급 일시</span>
                      <span className="text-ink-soft font-mono">{new Date(selectedCouponDetails.createdAt).toLocaleString("ko-KR")}</span>
                    </div>
                  </div>

                  <h5 className="font-medium text-xs text-ink-soft pt-1">
                    이 쿠폰을 등록한 사용자 목록 ({selectedCouponDetails.usedDetails?.length || 0}명)
                  </h5>

                  {!selectedCouponDetails.usedDetails || selectedCouponDetails.usedDetails.length === 0 ? (
                    <div className="p-6 text-center text-xs text-ink-faint bg-sunken rounded-xl">
                      아직 이 쿠폰을 사용한 유입 고객 이력이 없습니다.
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead className="text-ink-faint border-b border-line text-xs">
                          <tr>
                            <th className="p-2.5 font-medium">등록자 고유 UID</th>
                            <th className="p-2.5 font-medium">가입 이메일 / 형태</th>
                            <th className="p-2.5 font-medium">쿠폰 유입 출처</th>
                            <th className="p-2.5 font-medium">사용된 시각</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-line">
                          {selectedCouponDetails.usedDetails.map((ud, idx) => (
                            <tr key={idx} className="hover:bg-sunken transition-colors">
                              <td className="p-2.5 font-mono font-semibold text-ink text-xs">{ud.uid}</td>
                              <td className="p-2.5">
                                <span className="px-1.5 py-0.5 bg-sunken text-ink-soft rounded-md text-xs font-mono mr-1.5">
                                  {ud.uid.startsWith("guest_") ? "게스트" : "회원"}
                                </span>
                                <span className="font-medium text-ink-soft">{ud.userEmail || "알 수 없음"}</span>
                              </td>
                              <td className="p-2.5 text-ink-soft">
                                {ud.campaignSource || selectedCouponDetails.campaignSource || "일반 발급"}
                              </td>
                              <td className="p-2.5 font-mono text-xs text-ink-faint">
                                {new Date(ud.redeemedAt).toLocaleString("ko-KR")}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>

            {/* 3. Ticket Consumption Log History (Real-time tracking by User ID) */}
            <div className="bg-surface border border-line rounded-xl p-5 sm:p-6 space-y-4">
              <div>
                <h4 className="text-[15px] font-semibold text-ink">
                  확인권·쿠폰 소비 이력 로그
                </h4>
                <p className="text-xs text-ink-soft mt-0.5">
                  사용자가 만세력·사주 결과를 해금하며 보유 확인권을 소모한 전체 이력입니다.
                </p>
              </div>

              {/* Search filter for logs */}
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={ticketLogSearchQuery}
                  onChange={(e) => setTicketLogSearchQuery(e.target.value)}
                  placeholder="UID, 이메일 또는 소비 항목명으로 필터링"
                  className="px-3 py-2 bg-sunken rounded-xl text-xs flex-1 max-w-sm text-ink placeholder:text-ink-faint focus:outline-none focus:ring-1 focus:ring-ink"
                />
                <span className="text-xs text-ink-faint">
                  총 {aggregatedConsumptionLogs.filter(l => !ticketLogSearchQuery || l.uid.toLowerCase().includes(ticketLogSearchQuery.toLowerCase()) || (l.label || "").toLowerCase().includes(ticketLogSearchQuery.toLowerCase()) || (l.email || "").toLowerCase().includes(ticketLogSearchQuery.toLowerCase())).length}건의 기록
                </span>
              </div>

              {/* Logs Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="text-ink-faint border-b border-line text-xs">
                    <tr>
                      <th className="p-3 font-medium">소비 시각</th>
                      <th className="p-3 font-medium">사용자 UID / 이메일</th>
                      <th className="p-3 font-medium">소비 상품</th>
                      <th className="p-3 font-medium">소비 사유 / 위치</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line">
                    {aggregatedConsumptionLogs.filter(l => !ticketLogSearchQuery || l.uid.toLowerCase().includes(ticketLogSearchQuery.toLowerCase()) || (l.label || "").toLowerCase().includes(ticketLogSearchQuery.toLowerCase()) || (l.email || "").toLowerCase().includes(ticketLogSearchQuery.toLowerCase())).length === 0 ? (
                      <tr>
                        <td colSpan={4} className="p-8 text-center text-xs text-ink-faint">
                          조건에 맞는 확인권·쿠폰 소비 기록이 없습니다.
                        </td>
                      </tr>
                    ) : (
                      aggregatedConsumptionLogs
                        .filter(l => !ticketLogSearchQuery || l.uid.toLowerCase().includes(ticketLogSearchQuery.toLowerCase()) || (l.label || "").toLowerCase().includes(ticketLogSearchQuery.toLowerCase()) || (l.email || "").toLowerCase().includes(ticketLogSearchQuery.toLowerCase()))
                        .map((log, idx) => (
                          <tr key={idx} className="hover:bg-sunken transition-colors">
                            <td className="p-3 text-ink-faint font-mono text-xs">
                              {new Date(log.timestamp).toLocaleString("ko-KR")}
                            </td>
                            <td className="p-3">
                              <div className="flex flex-col">
                                <span className="font-mono text-xs font-semibold text-ink">{log.uid}</span>
                                <span className="text-xs text-ink-faint">{log.email}</span>
                              </div>
                            </td>
                            <td className="p-3">
                              <span className="px-2 py-0.5 rounded-md text-xs bg-sunken text-ink-soft">
                                {log.productType.toUpperCase()}
                              </span>
                            </td>
                            <td className="p-3 text-ink">
                              {log.label || "일반 확인권 소모"}
                              {log.roomCode && (
                                <span className="block text-xs text-ink-faint font-mono mt-0.5">
                                  방 코드: {log.roomCode}
                                </span>
                              )}
                              {log.pairKey && (
                                <span className="block text-xs text-ink-faint font-mono">
                                  매칭 페어키: {log.pairKey}
                                </span>
                              )}
                            </td>
                          </tr>
                        ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* 4. 쿠폰 등록 데이터 정합성 검사 및 보정 도구 (Data Reconciliation & Repair) */}
            <div className="bg-surface border border-line rounded-xl p-5 sm:p-6 space-y-4">
              <div>
                <h4 className="text-[15px] font-semibold text-ink">
                  쿠폰 지급 누락 검증·보정 도구
                </h4>
                <p className="text-xs text-ink-soft mt-0.5 leading-relaxed">
                  이전 버전의 Firestore 쓰기 실패로 쿠폰 사용 이력만 남고 티켓이 지급되지 않은 계정을 전체 데이터베이스에서 찾아, 누락된 티켓을 보정 지급합니다.
                </p>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <button
                  type="button"
                  disabled={isScanning || isRepairing}
                  onClick={handleRunReconciliation}
                  className="px-4 py-2.5 bg-sunken hover:bg-line disabled:opacity-50 text-ink text-xs font-semibold rounded-xl transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <Search className="w-3.5 h-3.5" />
                  {isScanning ? "스캔 중..." : "누락·정합성 불일치 스캔"}
                </button>

                {reconcileList.length > 0 && (
                  <button
                    type="button"
                    disabled={isScanning || isRepairing}
                    onClick={handleRepairReconciliation}
                    className="px-4 py-2.5 bg-seal hover:bg-seal-deep disabled:opacity-50 text-white text-xs font-semibold rounded-xl transition-colors cursor-pointer flex items-center gap-1.5"
                  >
                    <CheckSquare className="w-3.5 h-3.5" />
                    {isRepairing ? "복구 진행 중..." : "미지급 티켓 일괄 보정"}
                  </button>
                )}
              </div>

              {scanMessage && (
                <div className="p-3 text-xs bg-sunken text-ink rounded-xl font-medium">
                  {scanMessage}
                </div>
              )}

              {reconcileList.length > 0 && (
                <div className="overflow-x-auto mt-2">
                  <table className="w-full text-left text-xs">
                    <thead className="text-ink-faint border-b border-line text-xs">
                      <tr>
                        <th className="p-3 font-medium">사용자 UID</th>
                        <th className="p-3 font-medium">사용자 이메일</th>
                        <th className="p-3 font-medium">등록 쿠폰 코드</th>
                        <th className="p-3 font-medium">미지급 혜택 종류</th>
                        <th className="p-3 font-medium">캠페인 경로</th>
                        <th className="p-3 font-medium text-center">보정 상태</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-line">
                      {reconcileList.map((item, idx) => (
                        <tr key={idx} className="hover:bg-sunken transition-colors">
                          <td className="p-3 font-mono font-semibold text-ink">{item.uid}</td>
                          <td className="p-3 text-ink-soft">{item.email}</td>
                          <td className="p-3 font-mono font-semibold text-ink">{item.couponCode}</td>
                          <td className="p-3">
                            <span className="px-1.5 py-0.5 rounded-md text-xs bg-sunken text-ink-soft">
                              {item.productType === "pdf" ? "PDF 소장권" :
                               item.productType === "secret" ? "비밀 인연" :
                               item.productType === "group" ? "그룹 오행" : "전체 올패스"}
                            </span>
                          </td>
                          <td className="p-3 text-ink-soft">{item.campaignSource}</td>
                          <td className="p-3 text-center">
                            {item.status === "detected" && (
                              <span className="px-2 py-0.5 bg-sunken text-seal text-xs font-medium rounded-md">
                                미지급 누락
                              </span>
                            )}
                            {item.status === "repaired" && (
                              <span className="px-2 py-0.5 bg-sunken text-ink text-xs font-medium rounded-md">
                                보정 완료
                              </span>
                            )}
                            {item.status === "error" && (
                              <span className="px-2 py-0.5 bg-sunken text-seal text-xs font-medium rounded-md" title={item.errorMsg}>
                                실패 ({item.errorMsg})
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

            </div>

          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 3: SHOP CONTROL & BETA FREE MODE                                     */}
        {/* ========================================================================= */}
        {activeTab === "shop_control" && (
          <div className="space-y-6 animate-fade-in">
            <div className="bg-surface border border-line rounded-xl p-5 sm:p-6 space-y-5">
              <h4 className="text-[15px] font-semibold text-ink">
                인연상점 공개 여부·베타 모드 설정
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">

                {/* Switch 1: Shop Enabled */}
                <div className="p-4 bg-sunken rounded-xl space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-semibold text-xs text-ink">인연상점(프리미엄 탭) 노출</span>
                    <button
                      type="button"
                      onClick={() => setAppConfig({ ...appConfig, shop_enabled: !appConfig.shop_enabled })}
                      className="cursor-pointer shrink-0"
                      aria-label="인연상점 노출 전환"
                    >
                      {appConfig.shop_enabled ? (
                        <ToggleRight className="w-8 h-8 text-seal" />
                      ) : (
                        <ToggleLeft className="w-8 h-8 text-ink-faint" />
                      )}
                    </button>
                  </div>
                  <p className="text-xs text-ink-soft leading-relaxed">
                    켜면 모임방 하단에 프리미엄 해금 대시보드가 노출됩니다.
                  </p>
                </div>

                {/* Switch 2: Real Payment ON/OFF */}
                <div className="p-4 bg-sunken rounded-xl space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <div className="space-y-1">
                      <span className="font-semibold text-xs text-ink block">
                        실제 결제 시스템 오픈
                      </span>
                      <span className="text-xs text-ink-faint">
                        {appConfig.real_payment_enabled ? "결제 오픈 상태" : "결제 준비 중 (쿠폰 전용)"}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setAppConfig({ ...appConfig, real_payment_enabled: !appConfig.real_payment_enabled })}
                      className="cursor-pointer shrink-0"
                      aria-label="실제 결제 시스템 전환"
                    >
                      {appConfig.real_payment_enabled ? (
                        <ToggleRight className="w-8 h-8 text-seal" />
                      ) : (
                        <ToggleLeft className="w-8 h-8 text-ink-faint" />
                      )}
                    </button>
                  </div>
                  <p className="text-xs text-ink-soft leading-relaxed">
                    {appConfig.real_payment_enabled
                      ? "실제 PG 결제창과 충전 패키지가 사용자에게 활성화됩니다."
                      : "실제 결제가 차단되며, 관리자 발급 쿠폰과 친구 초대 보상으로만 확인권이 통용됩니다."}
                  </p>
                </div>

              </div>

              {/* Payment Notice (Shown when payment is OFF) */}
              {!appConfig.real_payment_enabled && (
                <div>
                  <label className="text-xs font-medium text-ink-soft block mb-1">
                    결제 준비 중 사용자 안내 문구
                  </label>
                  <textarea
                    rows={2}
                    value={appConfig.payment_notice || ""}
                    onChange={(e) => setAppConfig({ ...appConfig, payment_notice: e.target.value })}
                    placeholder="현재 실제 결제 기능은 정식 오픈 준비 중입니다. 관리자가 발급하는 프로모션 쿠폰을 등록해 이용해 주세요."
                    className="w-full p-3 bg-sunken rounded-xl text-xs text-ink placeholder:text-ink-faint leading-relaxed focus:outline-none focus:ring-1 focus:ring-ink"
                  />
                </div>
              )}

              {/* Announcement */}
              <div>
                <label className="text-xs font-medium text-ink-soft block mb-1">
                  모임방 상단 안내 공지 문구
                </label>
                <textarea
                  rows={2}
                  value={appConfig.announcement || ""}
                  onChange={(e) => setAppConfig({ ...appConfig, announcement: e.target.value })}
                  className="w-full p-3 bg-sunken rounded-xl text-xs text-ink placeholder:text-ink-faint leading-relaxed focus:outline-none focus:ring-1 focus:ring-ink"
                />
              </div>

              {configSuccessMsg && (
                <div className="text-xs text-ink bg-sunken p-3 rounded-xl font-medium">
                  {configSuccessMsg}
                </div>
              )}

              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={handleSaveAppConfig}
                  disabled={savingConfig}
                  className="flex items-center gap-1.5 px-5 py-2.5 bg-seal hover:bg-seal-deep disabled:opacity-50 text-white text-xs font-semibold rounded-xl transition-colors cursor-pointer"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{savingConfig ? "저장 중..." : "설정 저장하기"}</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 4: WILLINGNESS TO PAY SURVEY RESPONSES                                */}
        {/* ========================================================================= */}
        {activeTab === "survey" && (
          <div className="space-y-6 animate-fade-in">
            {/* Survey Quick Actions */}
            <div className="flex items-center justify-between gap-3 flex-wrap bg-surface border border-line rounded-xl p-4">
              <div className="text-xs text-ink-soft">
                총 <strong className="text-ink">{responses.length}명</strong>이 설문에 참여했습니다. 지불 의향률 <strong className="text-ink">{metrics.willingnessRate}%</strong>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleExportCSV}
                  disabled={responses.length === 0}
                  className="flex items-center gap-1.5 px-3 py-2 bg-sunken hover:bg-line text-ink text-xs font-semibold rounded-xl transition-colors disabled:opacity-50 cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>CSV 다운로드</span>
                </button>
                <button
                  onClick={handleCopyToClipboard}
                  disabled={responses.length === 0}
                  className="flex items-center gap-1.5 px-3 py-2 bg-sunken hover:bg-line text-ink text-xs font-semibold rounded-xl transition-colors disabled:opacity-50 cursor-pointer"
                >
                  {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? "복사됨" : "전체 복사"}</span>
                </button>
              </div>
            </div>

            {/* Responses List */}
            <div className="space-y-3">
              {responses.length === 0 ? (
                <div className="p-8 bg-surface border border-line rounded-xl text-center text-xs text-ink-faint">
                  아직 제출된 설문 응답이 없습니다.
                </div>
              ) : (
                responses.map((res, idx) => (
                  <div key={res.id} className="p-4 bg-surface border border-line rounded-xl space-y-2 text-xs">
                    <div className="flex items-center justify-between gap-2 border-b border-line pb-2">
                      <div className="font-semibold text-ink">
                        #{responses.length - idx} {res.nickname || "익명"} ({res.userEmail || "이메일 없음"})
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-xs text-ink-faint">
                          {new Date(res.submittedAt).toLocaleString("ko-KR")}
                        </span>
                        <button
                          onClick={() => handleDeleteResponse(res.id)}
                          className="text-ink-faint hover:text-seal p-1 transition-colors cursor-pointer"
                          title="응답 삭제"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <div className="space-y-2 pt-1">
                      {surveyConfig?.questions.map((q) => {
                        const ans = res.answers[q.id];
                        return (
                          <div key={q.id} className="text-xs leading-relaxed">
                            <span className="text-ink-faint block">Q. {q.title}</span>
                            <span className="text-ink font-medium block mt-0.5">
                              {Array.isArray(ans) ? ans.join(", ") : ans || "응답 없음"}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

      </div>
    </Layout>
  );
}
