// src/App.jsx
import React, { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useParams, useNavigate } from 'react-router-dom';
import useAuthStore from '../store/authStore';
import Layout from '../components/layout/Layout';
import ProtectedRoute from '../components/common/ProtectedRoute';

// Auth pages
import LoginPage from '../pages/auth/Login';
import ForgotPasswordPage from '../pages/auth/ForgetPasswordPage';
import ResetPasswordPage from '../pages/auth/ResetPasswordPage';

// App pages
import DashboardPage from '../pages/dashboard/DashboardPage';
import ClientsPage from '../pages/clients/ClientPage';
import ClientDetailPage from '../pages/clients/ClientDetailPage';
import QuotationsPage from '../pages/quotations/QuotationPage';
import QuotationFormPage from '../pages/quotations/QuotationFormPage';
import QuotationDetailPage from '../pages/quotations/QuotationDetailPage';
import PurchaseOrdersPage from '../pages/purchase-orders/PurchaseOrdersPage';
import PurchaseOrderFormPage from '../pages/purchase-orders/PurchaseOrderFormPage';
import PurchaseOrderDetailPage from '../pages/purchase-orders/PurchaseOrderDetailPage';
import ProformaInvoicesPage from '../pages/proforma-invoices/ProformaInvoices';
import ProformaInvoiceFormPage from '../pages/proforma-invoices/ProformaInvoiceFormPage';
import ProformaInvoiceDetailPage from '../pages/proforma-invoices/ProformaInvoiceDetailPage';
import FinalInvoicesPage from '../pages/final-invoices/FinalInvoicesPage';
import FinalInvoiceFormPage from '../pages/final-invoices/FinalInvoicesFormPage';
import FinalInvoiceDetailPage from '../pages/final-invoices/FinalInvoicesDetailPage';
import PaymentsPage from '../pages/payments/PaymentsPage';
import PaymentFormPage from '../pages/payments/PaymentFormPage';
import ReportsPage from '../pages/reports/ReportsPage';
import SettingsPage from '../pages/settings/SettingsPage';
import ProductPage from '../pages/settings/ProductsPage';
import ProfilePage from '../pages/settings/ProfilePage';
// ─── Wrappers ─────────────────────────────────────────────────────────────────

function QuotationDetailWrapper() {
  const { id } = useParams();
  const navigate = useNavigate();
  return (
    <QuotationDetailPage
      quotationId={id}
      onBack={() => navigate("/quotations")}
      onEdit={(q) => navigate(`/quotations/${q.id}/edit`)}
    />
  );
}

function PurchaseOrdersPageWrapper() {
  const navigate = useNavigate();
  return (
    <PurchaseOrdersPage
      onView={(po) => navigate(`/purchase-orders/${po.id}`)}
      onCreate={() => navigate("/purchase-orders/new")}
      onEdit={(po) => navigate(`/purchase-orders/${po.id}/edit`)}
    />
  );
}

function PurchaseOrderDetailWrapper() {
  const { id } = useParams();
  const navigate = useNavigate();
  return (
    <PurchaseOrderDetailPage
      poId={id}
      onBack={() => navigate("/purchase-orders")}
      onEdit={(po) => navigate(`/purchase-orders/${po.id}/edit`)}
    />
  );
}

function FinalInvoicesPageWrapper() {
  const navigate = useNavigate();
  return (
    <FinalInvoicesPage
      onView={(inv) => navigate(`/final-invoices/${inv.id}`)}
      onCreate={() => navigate("/final-invoices/new")}
      onEdit={(inv) => navigate(`/final-invoices/${inv.id}/edit`)}
      onRecordPayment={(inv) => navigate(`/payments/new?invoiceId=${inv.id}`)}
    />
  );
}

function FinalInvoiceDetailWrapper() {
  const { id } = useParams();
  const navigate = useNavigate();
  return (
    <FinalInvoiceDetailPage
      invoiceId={id}
      onBack={() => navigate("/final-invoices")}
      onEdit={(inv) => navigate(`/final-invoices/${inv.id}/edit`)}
    />
  );
}

// ─── App ──────────────────────────────────────────────────────────────────────

export default function App() {
  const { isAuthenticated, fetchMe } = useAuthStore();

  useEffect(() => {
    if (isAuthenticated) fetchMe();
  }, [isAuthenticated]);

  return (
    <Routes>
      {/* Public routes */}
      <Route path="/login" element={!isAuthenticated ? <LoginPage /> : <Navigate to="/" replace />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />

      {/* Protected routes */}
      <Route element={<ProtectedRoute />}>
        <Route element={<Layout />}>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<DashboardPage />} />

          <Route path="/clients" element={<ClientsPage />} />
          <Route path="/clients/:id" element={<ClientDetailPage />} />

          <Route path="/quotations" element={<QuotationsPage />} />
          <Route path="/quotations/new" element={<QuotationFormPage />} />
          <Route path="/quotations/:id" element={<QuotationDetailWrapper />} />
          <Route path="/quotations/:id/edit" element={<QuotationFormPage />} />

          <Route path="/purchase-orders" element={<PurchaseOrdersPageWrapper />} />
          <Route path="/purchase-orders/new" element={<PurchaseOrderFormPage />} />
          <Route path="/purchase-orders/:id" element={<PurchaseOrderDetailWrapper />} />
          <Route path="/purchase-orders/:id/edit" element={<PurchaseOrderFormPage />} />

          <Route path="/proforma-invoices" element={<ProformaInvoicesPage />} />
          <Route path="/proforma-invoices/new" element={<ProformaInvoiceFormPage />} />
          <Route path="/proforma-invoices/:id" element={<ProformaInvoiceDetailPage />} />
          <Route path="/proforma-invoices/:id/edit" element={<ProformaInvoiceFormPage />} />

          <Route path="/final-invoices" element={<FinalInvoicesPageWrapper />} />
          <Route path="/final-invoices/new" element={<FinalInvoiceFormPage />} />
          <Route path="/final-invoices/:id" element={<FinalInvoiceDetailWrapper />} />
          <Route path="/final-invoices/:id/edit" element={<FinalInvoiceFormPage />} />

          <Route path="/payments" element={<PaymentsPage />} />
          <Route path="/payments/new" element={<PaymentFormPage />} />

          <Route path="/reports" element={<ReportsPage />} />
          <Route path="/settings" element={<SettingsPage />} />

          <Route path="/profile" element={<ProfilePage/>}/>
          <Route path="/settings/products" element={<ProductPage/>}/>


                  </Route>
      </Route>

      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}