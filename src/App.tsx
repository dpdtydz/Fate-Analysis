import { useState, useEffect } from "react";
import GatewayView from "./components/GatewayView";
import LandingView from "./components/LandingView";
import CreateView from "./components/CreateView";
import RoomView from "./components/RoomView";
import JoinView from "./components/JoinView";
import MeView from "./components/MeView";
import MySajuView from "./components/MySajuView";
import GroupView from "./components/GroupView";
import KakaoOutlinkGuide from "./components/KakaoOutlinkGuide";
import AdminView from "./components/AdminView";
import SurveyPopup from "./components/SurveyPopup";
import { processReferralReward } from "./lib/firebase";
import { logAnalyticsEvent } from "./lib/analytics";

interface ParsedRoute {
  path: string;
  code?: string;
  memberId?: string;
}

function parseRoute(hash: string): ParsedRoute {
  // Strip '#', then isolate path from query string parameters (?...)
  const rawHash = hash.replace(/^#/, "") || "/";
  const cleanPath = rawHash.split("?")[0] || "/";

  if (cleanPath === "/" || cleanPath === "") {
    return { path: "/" };
  }
  if (cleanPath === "/my-saju" || cleanPath === "/me") {
    return { path: "/my-saju" };
  }
  if (cleanPath === "/group" || cleanPath === "/group-hub" || cleanPath === "/rooms") {
    return { path: "/group" };
  }
  if (cleanPath === "/create") {
    return { path: "/create" };
  }
  if (cleanPath === "/admin") {
    return { path: "/admin" };
  }

  // Check /room/{code}/me/{id}
  const meMatch = cleanPath.match(/^\/room\/([A-Z0-9]{6})\/me\/([a-zA-Z0-9_\-]+)$/);
  if (meMatch) {
    return { path: "/room/me", code: meMatch[1], memberId: meMatch[2] };
  }

  // Check /room/{code}/join
  const joinMatch = cleanPath.match(/^\/room\/([A-Z0-9]{6})\/join$/);
  if (joinMatch) {
    return { path: "/room/join", code: joinMatch[1] };
  }

  // Check /room/{code}/group
  const groupMatch = cleanPath.match(/^\/room\/([A-Z0-9]{6})\/group$/);
  if (groupMatch) {
    return { path: "/room/group", code: groupMatch[1] };
  }

  // Check /room/{code}
  const roomMatch = cleanPath.match(/^\/room\/([A-Z0-9]{6})$/);
  if (roomMatch) {
    return { path: "/room", code: roomMatch[1] };
  }

  return { path: "/" };
}

export default function App() {
  const [hash, setHash] = useState(window.location.hash || "#/");

  useEffect(() => {
    // 1. Process Referral parameter (?ref=...) from search or hash
    try {
      const urlParams = new URLSearchParams(window.location.search);
      let refCode = urlParams.get("ref");
      if (!refCode && window.location.hash.includes("?ref=")) {
        const hashQuery = window.location.hash.split("?ref=")[1];
        if (hashQuery) refCode = hashQuery.split("&")[0];
      }

      if (refCode) {
        processReferralReward(refCode).then((rewarded) => {
          if (rewarded) {
            logAnalyticsEvent({
              eventName: "invite_converted",
              category: "viral",
              metadata: { referrerId: refCode }
            });
          }
        });
      }
    } catch (err) {
      console.debug("Referral param parsing error:", err);
    }

    // 2. Initial Page View Log
    logAnalyticsEvent({
      eventName: "page_view",
      category: "traffic",
      metadata: { hash: window.location.hash || "#/" }
    });

    const handleHashChange = () => {
      setHash(window.location.hash || "#/");
      logAnalyticsEvent({
        eventName: "page_view",
        category: "traffic",
        metadata: { hash: window.location.hash || "#/" }
      });
    };
    window.addEventListener("hashchange", handleHashChange);
    return () => {
      window.removeEventListener("hashchange", handleHashChange);
    };
  }, []);

  const route = parseRoute(hash);

  const renderContent = () => {
    switch (route.path) {
      case "/":
        return <GatewayView />;
      case "/group":
        return <LandingView />;
      case "/my-saju":
        return <MySajuView />;
      case "/create":
        return <CreateView />;
      case "/admin":
        return <AdminView />;
      case "/room":
        return <RoomView code={route.code!} />;
      case "/room/join":
        return <JoinView code={route.code!} />;
      case "/room/me":
        return <MeView code={route.code!} memberId={route.memberId!} />;
      case "/room/group":
        return <GroupView code={route.code!} />;
      default:
        return <GatewayView />;
    }
  };

  return (
    <>
      <KakaoOutlinkGuide />
      {renderContent()}
      <SurveyPopup />
    </>
  );
}
