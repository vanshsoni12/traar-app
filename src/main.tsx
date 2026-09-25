import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { HashRouter, Route, Routes } from "react-router-dom";
import "./theme.css";

import App from "./App";
import DirectoryPage from "./pages/DirectoryPage";
import AppLayout from "./components/AppLayout";
import DestinationPage from "./pages/DestinationPage";
import MyTripPage from "./pages/MyTripPage";
import { TripProvider } from "./context/TripContext";
import ProviderLoginPage from "./pages/ProviderLoginPage";
import ProviderDashboardPage from "./pages/ProviderDashboardPage";
import AddListingPage from "./pages/AddListingPage";
import AdminReviewPage from "./pages/AdminReviewPage";
import AdminLoginPage from "./pages/AdminLoginPage";
import HelpBoothPage from "./pages/HelpBoothPage";
import "./index.css";

import ProviderDocumentsPage from "./pages/ProviderDocumentsPage";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <TripProvider>
      <HashRouter>
        <Routes>
          <Route element={<AppLayout />}>
            <Route path="/" element={<App />} />
            <Route path="/favourites" element={<DirectoryPage key="favourites" favourites />} />
            <Route path="/search" element={<DirectoryPage key="search" />} />
            <Route path="/help" element={<HelpBoothPage />} />

            <Route path="/provider/login" element={<ProviderLoginPage />} />

            <Route path="/provider" element={<ProviderDashboardPage />} />
            <Route path="/provider/services/new" element={<AddListingPage />} />
            <Route path="/provider/documents" element={<ProviderDocumentsPage />} />

            <Route path="/admin" element={<AdminReviewPage />} />
            <Route path="/admin/login" element={<AdminLoginPage />} />

            <Route path="/destinations/:city" element={<DestinationPage />} />
            <Route path="/destinations/:city/stays" element={<DirectoryPage key="STAY" category="STAY" />} />
            <Route path="/destinations/:city/food" element={<DirectoryPage key="FOOD" category="FOOD" />} />
            <Route path="/destinations/:city/places" element={<DirectoryPage key="PLACE" category="PLACE" />} />
            <Route path="/destinations/:city/nearby" element={<DirectoryPage key="TRAVEL" category="TRAVEL" />} />

            <Route path="/my-trip" element={<MyTripPage />} />
          </Route>
        </Routes>
      </HashRouter>
    </TripProvider>
  </StrictMode>
);
