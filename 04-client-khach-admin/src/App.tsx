import { BrowserRouter, Navigate, Route, Routes, useLocation } from "react-router-dom";
import Navbar from "./components/Navbar";
import GalaxySky from "./components/GalaxySky";
import AdminLayout from "./components/AdminLayout";
import Protected from "./components/Protected";
import { AuthProvider } from "./context/AuthContext";
import { HoldFlowGuard, HoldSessionProvider } from "./context/HoldSessionContext";
import { BrandProvider } from "./context/BrandContext";
import { ThemeProvider } from "./context/ThemeContext";
import { useBrand } from "./context/BrandContext";
import SettingsAdminPage from "./pages/admin/SettingsAdminPage";
import HomePage from "./pages/HomePage";
import MovieDetailPage from "./pages/MovieDetailPage";
import SeatMapPage from "./pages/SeatMapPage";
import CheckoutPage from "./pages/CheckoutPage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import TicketsPage from "./pages/TicketsPage";
import PosHomePage from "./pages/pos/PosHomePage";
import PosPrintPage from "./pages/pos/PosPrintPage";
import PosScanPage from "./pages/pos/PosScanPage";
import GenreAdminPage from "./pages/admin/GenreAdminPage";
import MovieAdminPage from "./pages/admin/MovieAdminPage";
import ShowtimeAdminPage from "./pages/admin/ShowtimeAdminPage";
import ConcessionAdminPage from "./pages/admin/ConcessionAdminPage";
import ReportAdminPage from "./pages/admin/ReportAdminPage";
import ConcessionPage from "./pages/ConcessionPage";
import { PosMovieRedirect } from "./pages/pos/PosShowtimesPage";
import PosRevenuePage from "./pages/pos/PosRevenuePage";

function Shell() {
  const loc = useLocation();
  const admin = loc.pathname.startsWith("/admin");
  const { name } = useBrand();
  return (
    <>
      <GalaxySky />
      {!admin && <Navbar />}
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/movies/:movieId" element={<MovieDetailPage />} />
        <Route path="/showtimes/:movieId" element={<MovieDetailPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/pos/login" element={<LoginPage pos />} />
        <Route
          path="/book/:showtimeId"
          element={<Protected roles={["CUSTOMER"]}><SeatMapPage channel="ONLINE" /></Protected>}
        />
        <Route
          path="/concessions/:reservationId"
          element={<Protected roles={["CUSTOMER"]}><ConcessionPage channel="ONLINE" /></Protected>}
        />
        <Route
          path="/checkout/:reservationId"
          element={<Protected roles={["CUSTOMER"]}><CheckoutPage channel="ONLINE" /></Protected>}
        />
        <Route path="/tickets" element={<Protected roles={["CUSTOMER"]}><TicketsPage /></Protected>} />
        <Route path="/pos" element={<Protected roles={["CASHIER"]}><PosHomePage /></Protected>} />
        <Route
          path="/pos/movies/:movieId"
          element={<Protected roles={["CASHIER"]}><PosMovieRedirect /></Protected>}
        />
        <Route
          path="/pos/book/:showtimeId"
          element={<Protected roles={["CASHIER"]}><SeatMapPage channel="POS" /></Protected>}
        />
        <Route
          path="/pos/concessions/:reservationId"
          element={<Protected roles={["CASHIER"]}><ConcessionPage channel="POS" /></Protected>}
        />
        <Route
          path="/pos/checkout/:reservationId"
          element={<Protected roles={["CASHIER"]}><CheckoutPage channel="POS" /></Protected>}
        />
        <Route path="/pos/print/:reservationId" element={<Protected roles={["CASHIER"]}><PosPrintPage /></Protected>} />
        <Route path="/pos/tickets" element={<Protected roles={["CASHIER"]}><PosScanPage /></Protected>} />
        <Route path="/pos/revenue" element={<Protected roles={["CASHIER"]}><PosRevenuePage /></Protected>} />
        <Route path="/admin" element={<Protected roles={["ADMIN"]}><AdminLayout /></Protected>}>
          <Route index element={<Navigate to="movies" replace />} />
          <Route path="movies" element={<MovieAdminPage />} />
          <Route path="genres" element={<GenreAdminPage />} />
          <Route path="showtimes" element={<ShowtimeAdminPage />} />
          <Route path="concessions" element={<ConcessionAdminPage />} />
          <Route path="reports" element={<ReportAdminPage />} />
          <Route path="settings" element={<SettingsAdminPage />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      {!admin && (
        <footer className="site">
          {name} · Đặt vé online và POS · Client chỉ gọi REST http://localhost:8080
        </footer>
      )}
    </>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <ThemeProvider>
        <BrandProvider>
          <BrowserRouter>
            <HoldSessionProvider>
              <HoldFlowGuard />
              <Shell />
            </HoldSessionProvider>
          </BrowserRouter>
        </BrandProvider>
      </ThemeProvider>
    </AuthProvider>
  );
}
