import { SidebarContent } from "./NavigationMenu";
import TravellerHeader from "./TravellerHeader";
import { useState } from "react";
import { Outlet, useLocation } from "react-router-dom";

import PageControls from "./PageControls";
import ExplorerModals from "./ExplorerModals";
import { ExplorerProvider, useExplorer } from "../context/ExplorerContext";
import "./Explorer.css";
import { CityContext } from "../context/CityContext";

export default function AppLayout() {
  const { pathname } = useLocation();
  const nearby = /^\/destinations\/[^/]+\/nearby\/?$/.test(pathname);
  const [city, setCity] = useState(() => {
    try {
      return sessionStorage.getItem("traar-city") ||
        JSON.parse(localStorage.getItem("traar-search") || "{}").city || "Bhopal";
    } catch { return "Bhopal"; }
  });
  return (
    <CityContext.Provider value={{ city, setCity }}>
      <ExplorerProvider>
        <div className={nearby ? 'nearby-workspace' : undefined}>
          {nearby && <aside className="nearby-desktop-sidebar" aria-label="Travel navigation"><SidebarContent /></aside>}
          <div className={nearby ? 'nearby-workspace-main' : undefined}>
            {nearby && <TravellerHeader showMenu={false} />}
            <PageControls />
            <div className="page-with-sidebar"><Outlet /></div>
          </div>
        </div>
        <ExplorerModals /><Toast />
      </ExplorerProvider>
    </CityContext.Provider>
  );
}

function Toast() { const { notice, setNotice } = useExplorer(); return notice ? <div className="ex-toast" role="status">{notice}<button onClick={() => setNotice('')}>×</button></div> : null; }
