import { useState, useEffect } from "react";
import LandingView from "./components/LandingView";
import CreateView from "./components/CreateView";
import RoomView from "./components/RoomView";
import JoinView from "./components/JoinView";
import MeView from "./components/MeView";
import GroupView from "./components/GroupView";
import KakaoOutlinkGuide from "./components/KakaoOutlinkGuide";
import AdminView from "./components/AdminView";
import SurveyPopup from "./components/SurveyPopup";

interface ParsedRoute {
  path: string;
  code?: string;
  memberId?: string;
}

function parseRoute(hash: string): ParsedRoute {
  const cleanHash = hash.replace(/^#/, "") || "/";

  if (cleanHash === "/" || cleanHash === "") {
    return { path: "/" };
  }
  if (cleanHash === "/create") {
    return { path: "/create" };
  }
  if (cleanHash === "/admin") {
    return { path: "/admin" };
  }

  // Check /room/{code}/me/{id}
  const meMatch = cleanHash.match(/^\/room\/([A-Z0-9]{6})\/me\/([a-zA-Z0-9_\-]+)$/);
  if (meMatch) {
    return { path: "/room/me", code: meMatch[1], memberId: meMatch[2] };
  }

  // Check /room/{code}/join
  const joinMatch = cleanHash.match(/^\/room\/([A-Z0-9]{6})\/join$/);
  if (joinMatch) {
    return { path: "/room/join", code: joinMatch[1] };
  }

  // Check /room/{code}/group
  const groupMatch = cleanHash.match(/^\/room\/([A-Z0-9]{6})\/group$/);
  if (groupMatch) {
    return { path: "/room/group", code: groupMatch[1] };
  }

  // Check /room/{code}
  const roomMatch = cleanHash.match(/^\/room\/([A-Z0-9]{6})$/);
  if (roomMatch) {
    return { path: "/room", code: roomMatch[1] };
  }

  return { path: "/" };
}

export default function App() {
  const [hash, setHash] = useState(window.location.hash || "#/");

  useEffect(() => {
    const handleHashChange = () => {
      setHash(window.location.hash || "#/");
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
        return <LandingView />;
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
        return <LandingView />;
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
