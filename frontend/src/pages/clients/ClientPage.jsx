// src/pages/clients/ClientsPage.jsx
import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Edit2, Trash2, Eye, Building2 } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';
import { clientService } from '../../services/api';
import { clientSchema } from '../../utils/validations';
import { formatCurrency } from '../../utils/helpers';
import Modal from '../../components/common/Modal';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import Pagination from '../../components/common/Pagination';
import PageLoader from '../../components/common/Loader';
import EmptyState from '../../components/common/EmptyState';
import SearchBar from '../../components/common/SearchBar'; 

const INDIAN_STATES = ['Andhra Pradesh','Assam','Bihar','Delhi','Goa','Gujarat','Haryana','Himachal Pradesh','Jammu & Kashmir','Jharkhand','Karnataka','Kerala','Madhya Pradesh','Maharashtra','Manipur','Meghalaya','Mizoram','Nagaland','Odisha','Punjab','Rajasthan','Sikkim','Tamil Nadu','Telangana','Tripura','Uttar Pradesh','Uttarakhand','West Bengal'];

function ClientForm({ defaultValues, onSubmit, loading }) {
  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(clientSchema),
    defaultValues: defaultValues || { country: 'India' },
  });
  return (

    <form onSubmit={handleSubmit(onSubmit)} className="space-y-3 bg-gradient-to-br from-white via-blue-50 to-white p-6 rounded-xl shadow-xl border border-blue-100">
      {/* Form Header */}
      <div className="mb-4 pb-3 border-b-2 border-gradient-to-r border-blue-200">
        <h2 className="text-sm font-bold text-gray-900 tracking-tight">Client Information</h2>
        <p className="text-xs text-gray-500 mt-0.5">Fill in the details below</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="group">
          <label className="block text-xs font-bold text-gray-700 mb-1 uppercase tracking-wider">
            Full Name <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <input
              {...register('name')}
              className={`w-full px-3 py-2 border-2 rounded-lg text-xs font-medium transition-all duration-300 bg-gradient-to-b from-white to-blue-50 shadow-sm group-hover:shadow-md ${
                errors.name
                  ? 'border-red-500 bg-gradient-to-b from-red-50 to-red-100 text-gray-900 placeholder-red-400 focus:outline-none focus:ring-2 focus:ring-red-400 focus:shadow-lg focus:shadow-red-300'
                  : 'border-blue-300 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:shadow-lg focus:shadow-blue-200 hover:border-blue-400'
              }`}
              placeholder="Full name"
            />
            {!errors.name && (
              <div className="absolute right-3 top-2 text-blue-400 opacity-0 group-hover:opacity-100 transition-opacity">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
            )}
          </div>
          {errors.name && (
            <p className="mt-0.5 text-xs font-bold text-red-600 flex items-center gap-1">
              <span>⚠</span> {errors.name.message}
            </p>
          )}
        </div>

        <div className="group">
          <label className="block text-xs font-bold text-gray-700 mb-1 uppercase tracking-wider">
            Email <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <input
              {...register('email')}
              type="email"
              className={`w-full px-3 py-2 border-2 rounded-lg text-xs font-medium transition-all duration-300 bg-gradient-to-b from-white to-blue-50 shadow-sm group-hover:shadow-md ${
                errors.email
                  ? 'border-red-500 bg-gradient-to-b from-red-50 to-red-100 text-gray-900 placeholder-red-400 focus:outline-none focus:ring-2 focus:ring-red-400 focus:shadow-lg focus:shadow-red-300'
                  : 'border-blue-300 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:shadow-lg focus:shadow-blue-200 hover:border-blue-400'
              }`}
              placeholder="Email"
            />
            {!errors.email && (
              <div className="absolute right-3 top-2 text-blue-400 opacity-0 group-hover:opacity-100 transition-opacity">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
            )}
          </div>
          {errors.email && (
            <p className="mt-0.5 text-xs font-bold text-red-600 flex items-center gap-1">
              <span>⚠</span> {errors.email.message}
            </p>
          )}
        </div>

        <div className="group">
          <label className="block text-xs font-bold text-gray-700 mb-1 uppercase tracking-wider">
            Phone <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <input
              {...register('phone')}
              className={`w-full px-3 py-2 border-2 rounded-lg text-xs font-medium transition-all duration-300 bg-gradient-to-b from-white to-blue-50 shadow-sm group-hover:shadow-md ${
                errors.phone
                  ? 'border-red-500 bg-gradient-to-b from-red-50 to-red-100 text-gray-900 placeholder-red-400 focus:outline-none focus:ring-2 focus:ring-red-400 focus:shadow-lg focus:shadow-red-300'
                  : 'border-blue-300 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:shadow-lg focus:shadow-blue-200 hover:border-blue-400'
              }`}
              placeholder="Phone"
            />
            {!errors.phone && (
              <div className="absolute right-3 top-2 text-blue-400 opacity-0 group-hover:opacity-100 transition-opacity">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 00.948.684l1.498 4.493a1 1 0 00.502.756l2.73 1.365a1 1 0 001.006-.193l2.898-2.898a1 1 0 011.414 0l4.242 4.243a1 1 0 010 1.414l-2.898 2.898a1 1 0 00-.193 1.006l1.365 2.73a1 1 0 00.756.502l4.493 1.498a1 1 0 00.684.948V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
              </div>
            )}
          </div>
          {errors.phone && (
            <p className="mt-0.5 text-xs font-bold text-red-600 flex items-center gap-1">
              <span>⚠</span> {errors.phone.message}
            </p>
          )}
        </div>

        <div className="group">
          <label className="block text-xs font-bold text-gray-700 mb-1 uppercase tracking-wider">Company</label>
          <div className="relative">
            <input
              {...register('company')}
              className="w-full px-3 py-2 border-2 border-blue-300 rounded-lg text-xs font-medium bg-gradient-to-b from-white to-blue-50 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:shadow-lg focus:shadow-blue-200 hover:border-blue-400 transition-all duration-300 shadow-sm group-hover:shadow-md"
              placeholder="Company"
            />
            <div className="absolute right-3 top-2 text-blue-400 opacity-0 group-hover:opacity-100 transition-opacity">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
          </div>
        </div>

        <div className="group">
          <label className="block text-xs font-bold text-gray-700 mb-1 uppercase tracking-wider">
            GST {errors.gstNumber && <span className="text-red-500">*</span>}
          </label>
          <div className="relative">
            <input
              {...register('gstNumber')}
              placeholder="22AAAAA0000A1Z5"
              className={`w-full px-3 py-2 border-2 rounded-lg text-xs font-medium transition-all duration-300 bg-gradient-to-b from-white to-blue-50 shadow-sm group-hover:shadow-md ${
                errors.gstNumber
                  ? 'border-red-500 bg-gradient-to-b from-red-50 to-red-100 text-gray-900 placeholder-red-400 focus:outline-none focus:ring-2 focus:ring-red-400 focus:shadow-lg focus:shadow-red-300'
                  : 'border-blue-300 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:shadow-lg focus:shadow-blue-200 hover:border-blue-400'
              }`}
            />
          </div>
          {errors.gstNumber && (
            <p className="mt-0.5 text-xs font-bold text-red-600 flex items-center gap-1">
              <span>⚠</span> {errors.gstNumber.message}
            </p>
          )}
        </div>

        <div className="group">
          <label className="block text-xs font-bold text-gray-700 mb-1 uppercase tracking-wider">PAN</label>
          <input
            {...register('panNumber')}
            className="w-full px-3 py-2 border-2 border-blue-300 rounded-lg text-xs font-medium bg-gradient-to-b from-white to-blue-50 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:shadow-lg focus:shadow-blue-200 hover:border-blue-400 transition-all duration-300 shadow-sm group-hover:shadow-md"
            placeholder="PAN"
          />
        </div>
      </div>

      <div className="group">
        <label className="block text-xs font-bold text-gray-700 mb-1 uppercase tracking-wider">Billing Address</label>
        <textarea
          {...register('billingAddress')}
          rows={1}
          className="w-full px-3 py-2 border-2 border-blue-300 rounded-lg text-xs font-medium bg-gradient-to-b from-white to-blue-50 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:shadow-lg focus:shadow-blue-200 hover:border-blue-400 resize-none transition-all duration-300 shadow-sm group-hover:shadow-md"
          placeholder="Address"
        />
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <div className="group">
          <label className="block text-xs font-bold text-gray-700 mb-1 uppercase tracking-wider">City</label>
          <input
            {...register('city')}
            className="w-full px-3 py-2 border-2 border-blue-300 rounded-lg text-xs font-medium bg-gradient-to-b from-white to-blue-50 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:shadow-lg focus:shadow-blue-200 hover:border-blue-400 transition-all duration-300 shadow-sm group-hover:shadow-md"
            placeholder="City"
          />
        </div>

        <div className="group">
          <label className="block text-xs font-bold text-gray-700 mb-1 uppercase tracking-wider">State</label>
          <select
            {...register('state')}
            className="w-full px-3 py-2 border-2 border-blue-300 rounded-lg text-xs font-medium bg-gradient-to-b from-white to-blue-50 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:shadow-lg focus:shadow-blue-200 hover:border-blue-400 transition-all duration-300 cursor-pointer shadow-sm group-hover:shadow-md appearance-none"
          >
            <option value="">Select</option>
            {INDIAN_STATES.map(s => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>

        <div className="group">
          <label className="block text-xs font-bold text-gray-700 mb-1 uppercase tracking-wider">Pin</label>
          <input
            {...register('pincode')}
            className="w-full px-3 py-2 border-2 border-blue-300 rounded-lg text-xs font-medium bg-gradient-to-b from-white to-blue-50 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:shadow-lg focus:shadow-blue-200 hover:border-blue-400 transition-all duration-300 shadow-sm group-hover:shadow-md"
            placeholder="Pincode"
          />
        </div>
      </div>

      <div className="group">
        <label className="block text-xs font-bold text-gray-700 mb-1 uppercase tracking-wider">Notes</label>
        <textarea
          {...register('notes')}
          rows={1}
          className="w-full px-3 py-2 border-2 border-blue-300 rounded-lg text-xs font-medium bg-gradient-to-b from-white to-blue-50 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:shadow-lg focus:shadow-blue-200 hover:border-blue-400 resize-none transition-all duration-300 shadow-sm group-hover:shadow-md"
          placeholder="Notes"
        />
      </div>

      <div className="flex justify-end gap-2 pt-3 border-t-2 border-blue-100 mt-4">
        <button
          type="submit"
          disabled={loading}
          className="relative px-5 py-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed text-white font-bold text-xs rounded-lg transition-all duration-300 hover:shadow-lg hover:shadow-blue-300 active:scale-95 flex items-center gap-1.5 uppercase tracking-wider group overflow-hidden"
        >
          <span className="absolute inset-0 bg-white opacity-0 group-hover:opacity-10 transition-opacity" />
          {loading ? (
            <>
              <svg className="animate-spin h-3.5 w-3.5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span>Saving...</span>
            </>
          ) : (
            <>
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
              </svg>
              {defaultValues ? 'Update' : 'Add'}
            </>
          )}
        </button>
      </div>
    </form>
  );
}

export default function ClientsPage() {
  const [clients,      setClients]      = useState([]);
  const [pagination,   setPagination]   = useState(null);
  const [loading,      setLoading]      = useState(true);
  const [search,       setSearch]       = useState('');
  const [page,         setPage]         = useState(1);
  const [modalOpen,    setModalOpen]    = useState(false);
  const [editClient,   setEditClient]   = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [saving,       setSaving]       = useState(false);
  const [deleting,     setDeleting]     = useState(false);

  const fetchClients = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await clientService.getAll({ page, limit: 10, search });
      setClients(data.data       || []);
      setPagination(data.pagination || null);
    } catch {
      toast.error('Failed to load clients');
    } finally {
      setLoading(false);
    }
  }, [page, search]);

  useEffect(() => { fetchClients(); }, [fetchClients]);
  useEffect(() => { setPage(1); },    [search]);

  const handleSubmit = async (formData) => {
    setSaving(true);
    try {
      if (editClient) {
        await clientService.update(editClient.id, formData);
        toast.success('Client updated');
      } else {
        await clientService.create(formData);
        toast.success('Client added');
      }
      setModalOpen(false);
      setEditClient(null);
      fetchClients();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await clientService.delete(deleteTarget.id);
      toast.success('Client deleted');
      setDeleteTarget(null);
      fetchClients();
    } catch {
      toast.error('Delete failed');
    } finally {
      setDeleting(false);
    }
  };

  return (
    
    <div className="space-y-5">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight">Clients</h1>
          <p className="text-sm text-gray-500 mt-1 font-medium">Manage your business clients</p>
        </div>
        <button
          onClick={() => { setEditClient(null); setModalOpen(true); }}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-bold text-sm rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 active:scale-95 uppercase tracking-wider"
        >
          <Plus size={18} /> Add Client
        </button>
      </div>

      {/* Table card */}
      <div className="bg-white rounded-xl shadow-lg border border-blue-100 overflow-hidden">

        {/* Search bar */}
        <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-white">
          <SearchBar
            value={search}
            onChange={setSearch}
            placeholder="Search by name, email, company, GST..."
            className="max-w-sm"
          />
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <PageLoader />
          </div>
        ) : clients.length === 0 ? (
          <div className="py-12">
            <EmptyState
              icon={Building2}
              title="No clients found"
              description="Add your first client to get started"
              action={
                <button onClick={() => setModalOpen(true)} className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-bold text-sm rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 active:scale-95">
                  <Plus size={16} /> Add Client
                </button>
              }
            />
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead className="bg-gradient-to-r from-gray-50 to-blue-50 border-b-2 border-blue-100">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Client</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Contact</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">GST</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Total Paid</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Outstanding</th>
                    <th className="px-6 py-4 text-center text-xs font-bold text-gray-700 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {clients.map((c, i) => (
                    <motion.tr
                      key={c.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.03 }}
                      className="hover:bg-blue-50 transition-colors duration-150 group"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0 shadow-md">
                            {c.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className=" text-[11px] font-bold text-gray-900">{c.name}</p>
                            <p className="text-xs text-gray-500 font-medium">{c.company || '—'}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-gray-700 font-medium text-sm">{c.email}</p>
                        <p className="text-xs text-gray-500">{c.phone}</p>
                      </td>
                      <td className="px-4 py-4 text-gray-600 text-[12px] font-medium">{c.gstNumber || '—'}</td>
                      <td className="px-4 py-4">
                        <span className="text-emerald-600 font-semibold text-[13px]">{formatCurrency(c.totalPaid)}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`font-bold text-[13px] px-3 py-1.5 rounded-lg ${
                          parseFloat(c.totalDue) > 0 
                            ? 'bg-red-100 text-red-700' 
                            : 'bg-gray-100 text-gray-500'
                        }`}>
                          {formatCurrency(c.totalDue)}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-center gap-1  transition-opacity">
                          <Link
                            to={`/clients/${c.id}`}
                            className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-100 rounded-lg transition-all duration-200"
                            title="View"
                          >
                            <Eye size={16} strokeWidth={2} />
                          </Link>
                          <button
                            onClick={() => { setEditClient(c); setModalOpen(true); }}
                            className="p-2 text-gray-500 hover:text-amber-600 hover:bg-amber-100 rounded-lg transition-all duration-200"
                            title="Edit"
                          >
                            <Edit2 size={16} strokeWidth={2} />
                          </button>
                          <button
                            onClick={() => setDeleteTarget(c)}
                            className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-100 rounded-lg transition-all duration-200"
                            title="Delete"
                          >
                            <Trash2 size={16} strokeWidth={2} />
                          </button>
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="px-6 py-4 border-t border-gray-100 bg-gradient-to-r from-gray-50 to-blue-50">
              <Pagination pagination={pagination} onPageChange={setPage} />
            </div>
          </>
        )}
      </div>

      {/* Add/Edit modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => { setModalOpen(false); setEditClient(null); }}
        title={editClient ? 'Edit Client' : 'Add New Client'}
        size="lg"
        className="backdrop-blur-sm"
      >
        <div className="p-6">
          <ClientForm
            defaultValues={editClient}
            onSubmit={handleSubmit}
            loading={saving}
          />
        </div>
      </Modal>

      {/* Delete confirm */}
      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Delete Client"
        message={`Are you sure you want to delete "${deleteTarget?.name}"? This will soft-delete the client.`}
        loading={deleting}
        confirmButtonClassName="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white font-bold py-2.5 px-6 rounded-lg shadow-lg hover:shadow-xl transition-all duration-200"
      />
    </div>
  );
}