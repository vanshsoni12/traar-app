import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Route, Routes } from "react-router-dom";

import App from "./App";
import AppLayout from "./components/AppLayout";
import DestinationPage from "./pages/DestinationPage";
import StaysPage from "./pages/StaysPage";
import FoodPage from "./pages/FoodPage";
import PlacesPage from "./pages/PlacesPage";
import NearbyTripsPage from "./pages/NearbyTripsPage";
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
      <BrowserRouter>
        <Routes>
          <Route element={<AppLayout />}>
            <Route path="/" element={<App />} />
            <Route path="/help" element={<HelpBoothPage />} />

            <Route path="/provider/login" element={<ProviderLoginPage />} />
           
            <Route path="/provider" element={<ProviderDashboardPage />} />
            <Route path="/provider/services/new" element={<AddListingPage />} />
            <Route path="/provider/documents" element={<ProviderDocumentsPage />} />

            <Route path="/admin" element={<AdminReviewPage />} />
            <Route path="/admin/login" element={<AdminLoginPage />} />

            <Route path="/destinations/:city" element={<DestinationPage />} />
            <Route path="/destinations/:city/stays" element={<StaysPage />} />
            <Route path="/destinations/:city/food" element={<FoodPage />} />
            <Route path="/destinations/:city/places" element={<PlacesPage />} />
            <Route path="/destinations/:city/nearby" element={<NearbyTripsPage />} />

            <Route path="/my-trip" element={<MyTripPage />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </TripProvider>
  </StrictMode>
);