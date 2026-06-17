// src/pages/clients/ClientDetailPage.jsx
import React, { useEffect, useState } from 'react';

import { motion } from "framer-motion";
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft,  Mail, MapPin, Building2, Receipt, CreditCard } from 'lucide-react';
import { clientService } from '../../services/api';
import { formatCurrency, formatDate } from '../../utils/helpers';
import StatusBadge from '../../components/common/StatusBadge';
import PageLoader from '../../components/common/Loader';

export default function ClientDetailPage() {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    clientService.getOne(id).then(({ data: res }) => setData(res.data)).finally(() => setLoading(false));
  }, [id]);

  if (loading) return <PageLoader />;
  if (!data) return <div className="text-center py-16 text-slate-400">Client not found</div>;

  const { finalInvoices = [], payments = [], ...client } = data;

  return (
    <div className="space-y-5">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#4795fe] via-[#6aa9ff] to-[#0] p-8 text-white"
      >
        <div className="absolute inset-0 bg-black/10" />

        <div className="relative flex items-center gap-4">
          <Link
            to="/clients"
            className="h-10 w-10 rounded-xl bg-white/20 backdrop-blur flex items-center justify-center hover:bg-white/30 transition"
          >
            <ArrowLeft size={18} />
          </Link>

          <div>
            <h1 className="text-xl font-bold">{client.name}</h1>
            <p className="text-blue-100 mt-1">{client.company}</p>
          </div>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Client info */}
        <motion.div
      whileHover={{ y: -4 }}
      className="bg-white rounded-3xl border border-slate-200 shadow-lg shadow-blue-100/50 p-6"
    >
    <div className="flex items-center gap-3 mb-6">
      <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-[#4795fe] to-blue-700 flex items-center justify-center text-white">
        <Building2 size={18} />
      </div>

      <div>
        <h3 className="font-bold text-slate-900">
          Contact Details
        </h3>
        <p className="text-xs text-slate-500">
          Client information
        </p>
      </div>
    </div>
    <div className="flex items-start gap-4 p-3 rounded-2xl hover:bg-blue-50 transition-all duration-300">
    <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
      <Mail size={16} className="text-[#4795fe]" />
    </div>

    <div>
      <p className="text-xs uppercase tracking-wider text-slate-400">
        Email
      </p>

      <p className="text-slate-800 font-medium">
        {client.email}
      </p>
    </div>
  </div>
  <div className="grid grid-cols-2 gap-4 mt- pt-4 border-t border-slate-100">
    <div className="rounded-2xl bg-gradient-to-r from-emerald-500 to-emerald-600 p-4 text-white">
      <p className="text-xs uppercase tracking-widest">
        Total Paid
      </p>

      <h3 className="text-sm font-semibold mt-2">
        {formatCurrency(client.totalPaid)}
      </h3>
    </div>

    <div className="rounded-2xl bg-gradient-to-r from-red-500 to-red-600 p-4 text-white">
      <p className="text-xs uppercase tracking-widest">
        Outstanding
      </p>

      <h3 className="text-sm font-bold mt-2">
        {formatCurrency(client.totalDue)}
      </h3>
    </div>
  </div>
  </motion.div>

        {/* Invoices */}
        <div className="card lg:col-span-2">
         <motion.div
            whileHover={{ y: -4 }}
            className="lg:col-span-2 bg-white rounded-3xl border border-slate-200 shadow-lg shadow-blue-100/40 overflow-hidden"
         >
            <div className="px-6 py-5 border-b bg-gradient-to-r from-blue-50 to-white flex items-center justify-between">
              <h3 className="font-bold text-slate-900 flex items-center gap-2">
                <Receipt size={18} className="text-[#4795fe]" />
                Recent Invoices
              </h3>

              <Link
                to={`/final-invoices?clientId=${id}`}
                className="px-4 py-2 rounded-xl bg-[#4795fe] text-white text-sm hover:scale-105 transition"
              >
                View All
              </Link>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs uppercase tracking-wider text-slate-500">
                      Invoice
                    </th>
                    <th className="px-6 py-4 text-left text-xs uppercase tracking-wider text-slate-500">
                      Date
                    </th>
                    <th className="px-6 py-4 text-left text-xs uppercase tracking-wider text-slate-500">
                      Total
                    </th>
                    <th className="px-6 py-4 text-left text-xs uppercase tracking-wider text-slate-500">
                      Paid
                    </th>
                    <th className="px-6 py-4 text-left text-xs uppercase tracking-wider text-slate-500">
                      Due
                    </th>
                    <th className="px-6 py-4 text-left text-xs uppercase tracking-wider text-slate-500">
                      Status
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {finalInvoices.map((inv) => (
                    <tr
                      key={inv.id}
                      className="border-t border-slate-100 hover:bg-blue-50 transition"
                    >
                      <td className="px-6 py-4">
                        <Link
                          to={`/final-invoices/${inv.id}`}
                          className="font-semibold text-[#4795fe]"
                        >
                          {inv.invoiceNumber}
                        </Link>
                      </td>

                      <td className="px-6 py-4 text-slate-500 text-sm">
                        {formatDate(inv.invoiceDate)}
                      </td>

                      <td className="px-6 py-4 font-medium">
                        {formatCurrency(inv.totalAmount)}
                      </td>

                      <td className="px-6 py-4">
                        <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-700 text-xs font-semibold">
                          {formatCurrency(inv.paidAmount)}
                        </span>
                      </td>

                      <td className="px-6 py-4">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-semibold ${
                            parseFloat(inv.dueAmount) > 0
                              ? "bg-red-100 text-red-700"
                              : "bg-slate-100 text-slate-500"
                          }`}
                        >
                          {formatCurrency(inv.dueAmount)}
                        </span>
                      </td>

                      <td className="px-6 py-4">
                        <StatusBadge status={inv.status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Payments */}
      <motion.div
      
        whileHover={{ y: -4 }}
        className="bg-white rounded-3xl border border-slate-200 shadow-lg shadow-blue-100/40 overflow-hidden"
      >
        <div className="px-6 py-5 border-b bg-gradient-to-r from-[#4795fe]/10 to-white flex items-center justify-between">
          <h3 className="font-bold text-slate-900 flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#4795fe] to-blue-700 flex items-center justify-center">
              <CreditCard size={15} className="text-white" />
            </div>
            Recent Payments
          </h3>

          <Link
            to={`/payments?clientId=${id}`}
            className="px-4 py-2 rounded-xl bg-[#4795fe] text-white text-sm font-medium hover:scale-105 transition-all duration-300"
          >
            View All
          </Link>
        </div>

        <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs uppercase tracking-wider text-slate-500">
                      Payment #
                    </th>
                    <th className="px-6 py-4 text-left text-xs uppercase tracking-wider text-slate-500">
                      Date
                    </th>
                    <th className="px-6 py-4 text-left text-xs uppercase tracking-wider text-slate-500">
                      Amount
                    </th>
                    <th className="px-6 py-4 text-left text-xs uppercase tracking-wider text-slate-500">
                      Mode
                    </th>
                    <th className="px-6 py-4 text-left text-xs uppercase tracking-wider text-slate-500">
                      Reference
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {payments.length === 0 ? (
                    <tr>
                      <td colSpan={5}>
                        <div className="py-16 text-center">
                          <CreditCard
                            size={40}
                            className="mx-auto text-slate-300 mb-3"
                          />
                          <p className="text-slate-500">
                            No payments found
                          </p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    payments.map((p) => (
                      <tr
                        key={p.id}
                        className="border-t border-slate-100 hover:bg-blue-50 transition-all duration-300"
                      >
                        <td className="px-6 py-4">
                          <span className="font-semibold text-slate-800">
                            {p.paymentNumber}
                          </span>
                        </td>

                        <td className="px-6 py-4 text-sm text-slate-500">
                          {formatDate(p.paymentDate)}
                        </td>

                        <td className="px-6 py-4">
                          <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-700 text-xs font-semibold">
                            {formatCurrency(p.amount)}
                          </span>
                        </td>

                        <td className="px-6 py-4">
                          <span className="px-3 py-1 rounded-full bg-blue-100 text-[#4795fe] text-xs font-medium capitalize">
                            {p.paymentMode?.replace("_", " ")}
                          </span>
                        </td>

                        <td className="px-6 py-4 text-slate-500">
                          {p.referenceNumber || "—"}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
        </div>
      </motion.div>
    </div>
  );
}
