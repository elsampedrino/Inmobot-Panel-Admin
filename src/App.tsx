import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import ProtectedRoute from "./components/ProtectedRoute";
import Shell from "./components/Shell";
import LoginPage from "./pages/LoginPage";
import DashboardPage from "./pages/DashboardPage";
import LeadsPage from "./pages/LeadsPage";
import LeadDetailPage from "./pages/LeadDetailPage";
import PropiedadesPage from "./pages/PropiedadesPage";
import PropiedadFormPage from "./pages/PropiedadFormPage";
import EmpresasPage from "./pages/EmpresasPage";
import EmpresaFormPage from "./pages/EmpresaFormPage";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />

        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Shell />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard"                        element={<DashboardPage />} />
          <Route path="propiedades"                      element={<PropiedadesPage />} />
          <Route path="propiedades/nueva"                element={<PropiedadFormPage />} />
          <Route path="propiedades/:id/editar"           element={<PropiedadFormPage />} />
          <Route path="leads"                            element={<LeadsPage />} />
          <Route path="leads/:id"                        element={<LeadDetailPage />} />
          <Route path="empresas"                         element={<EmpresasPage />} />
          <Route path="empresas/:id/editar"              element={<EmpresaFormPage />} />
        </Route>

        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
}