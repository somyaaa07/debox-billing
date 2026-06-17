// // src/pages/quotations/QuotationFormPage.jsx
// import React, { useEffect, useState } from 'react';
// import { useNavigate, useParams, Link } from 'react-router-dom';
// import { useForm, Controller } from 'react-hook-form';
// import { zodResolver } from '@hookform/resolvers/zod';
// import { ArrowLeft, Save } from 'lucide-react';
// import toast from 'react-hot-toast';
// import { quotationService, clientService } from '../../services/api';
// import { quotationSchema } from '../../utils/validations';
// import LineItemsEditor from '../../components/modules/LineItemsEditor';
// import PageLoader from '../../components/common/Loader';

// export default function QuotationFormPage() {
//   const { id } = useParams();
//   const navigate = useNavigate();
//   const isEdit = !!id;
//   const [loading, setLoading] = useState(isEdit);
//   const [saving, setSaving] = useState(false);
//   const [clients, setClients] = useState([]);

//   const { register, handleSubmit, control, reset, watch, formState: { errors } } = useForm({
//     resolver: zodResolver(quotationSchema),
//     defaultValues: { quotationDate: new Date().toISOString().split('T')[0], currency: 'INR', items: [{ description: '', quantity: 1, unit: 'Nos', unitPrice: 0, gstRate: 18, discount: 0 }] },
//   });

//   useEffect(() => {
//     clientService.getAll({ limit: 200 }).then(({ data }) => setClients(data.data || []));
//     if (isEdit) {
//       quotationService.getOne(id).then(({ data }) => {
//         const q = data.data;
//         reset({
//           clientId: q.clientId, quotationDate: q.quotationDate, validUntil: q.validUntil || '',
//           currency: q.currency, notes: q.notes || '', termsAndConditions: q.termsAndConditions || '',
//           items: q.items?.length ? q.items : [{ description: '', quantity: 1, unit: 'Nos', unitPrice: 0, gstRate: 18 }],
//         });
//       }).finally(() => setLoading(false));
//     }
//   }, [id]);

//   const onSubmit = async (data) => {
//     setSaving(true);
//     try {
//       if (isEdit) {
//         await quotationService.update(id, data);
//         toast.success('Quotation updated');
//       } else {
//         await quotationService.create(data);
//         toast.success('Quotation created');
//       }
//       navigate('/quotations');
//     } catch (err) {
//       toast.error(err.response?.data?.message || 'Save failed');
//     } finally { setSaving(false); }
//   };

//   if (loading) return <PageLoader />;

//   return (
//     <div className="space-y-5 max-w-5xl">
//       <div className="flex items-center gap-3">
//         <Link to="/quotations" className="btn-ghost btn-sm p-2"><ArrowLeft size={18} /></Link>
//         <div>
//           <h1 className="page-title">{isEdit ? 'Edit Quotation' : 'New Quotation'}</h1>
//           <p className="page-subtitle">Fill in the details below</p>
//         </div>
//       </div>

//       <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
//         {/* Meta */}
//         <div className="card card-body">
//           <h3 className="font-semibold text-slate-900 mb-4">Quotation Details</h3>
//           <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
//             <div className="sm:col-span-2 lg:col-span-1">
//               <label className="label">Client *</label>
//               <select {...register('clientId')} className={`input ${errors.clientId ? 'input-error' : ''}`}>
//                 <option value="">Select client...</option>
//                 {clients.map(c => <option key={c.id} value={c.id}>{c.name} {c.company ? `— ${c.company}` : ''}</option>)}
//               </select>
//               {errors.clientId && <p className="error-text">{errors.clientId.message}</p>}
//             </div>
//             <div>
//               <label className="label">Quotation Date *</label>
//               <input {...register('quotationDate')} type="date" className={`input ${errors.quotationDate ? 'input-error' : ''}`} />
//             </div>
//             <div>
//               <label className="label">Valid Until</label>
//               <input {...register('validUntil')} type="date" className="input" />
//             </div>
//             <div>
//               <label className="label">Currency</label>
//               <select {...register('currency')} className="input">
//                 <option value="INR">INR — ₹</option>
//                 <option value="USD">USD — $</option>
//                 <option value="EUR">EUR — €</option>
//               </select>
//             </div>
//           </div>
//         </div>

//         {/* Items */}
//         <div className="card card-body">
//           <h3 className="font-semibold text-slate-900 mb-4">Line Items</h3>
//           <Controller
//             name="items"
//             control={control}
//             render={({ field }) => <LineItemsEditor value={field.value} onChange={field.onChange} />}
//           />
//           {errors.items && <p className="error-text mt-2">{errors.items.message || errors.items.root?.message}</p>}
//         </div>

//         {/* Notes */}
//         <div className="card card-body">
//           <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
//             <div>
//               <label className="label">Notes</label>
//               <textarea {...register('notes')} rows={3} className="input resize-none" placeholder="Internal notes or special instructions..." />
//             </div>
//             <div>
//               <label className="label">Terms & Conditions</label>
//               <textarea {...register('termsAndConditions')} rows={3} className="input resize-none" placeholder="Payment terms, delivery conditions..." />
//             </div>
//           </div>
//         </div>

//         {/* Actions */}
//         <div className="flex justify-end gap-3">
//           <Link to="/quotations" className="btn-secondary">Cancel</Link>
//           <button type="submit" disabled={saving} className="btn-primary">
//             <Save size={16} /> {saving ? 'Saving...' : isEdit ? 'Update Quotation' : 'Create Quotation'}
//           </button>
//         </div>
//       </form>
//     </div>
//   );
// }

// src/pages/quotations/QuotationFormPage.jsx
import React, { useEffect, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
// import { FiArrowLeft, FiSave, FiAlertCircle, FiCheck } from 'react-icons/fi';

import {
  FiArrowLeft,
  FiSave,
  FiAlertCircle,
  FiFileText,
  FiUsers,
  FiEdit3,
  FiCheckCircle,
} from 'react-icons/fi';

import toast from 'react-hot-toast';
import { quotationService, clientService } from '../../services/api';
import { quotationSchema } from '../../utils/validations';
import LineItemsEditor from '../../components/modules/LineItemsEditor';
import PageLoader from '../../components/common/Loader';

export default function QuotationFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = !!id;
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [clients, setClients] = useState([]);

  const { register, handleSubmit, control, reset, watch, formState: { errors } } = useForm({
    resolver: zodResolver(quotationSchema),
    defaultValues: { 
      quotationDate: new Date().toISOString().split('T')[0], 
      currency: 'INR', 
      items: [{ description: '', quantity: 1, unit: 'Nos', unitPrice: 0, gstRate: 18, discount: 0 }] 
    },
  });

  useEffect(() => {
    clientService.getAll({ limit: 200 }).then(({ data }) => setClients(data.data || []));
    if (isEdit) {
      quotationService.getOne(id).then(({ data }) => {
        const q = data.data;
        reset({
          clientId: q.clientId, 
          quotationDate: q.quotationDate, 
          validUntil: q.validUntil || '',
          currency: q.currency, 
          notes: q.notes || '', 
          termsAndConditions: q.termsAndConditions || '',
          items: q.items?.length ? q.items : [{ description: '', quantity: 1, unit: 'Nos', unitPrice: 0, gstRate: 18 }],
        });
      }).finally(() => setLoading(false));
    }
  }, [id]);

  const onSubmit = async (data) => {
    setSaving(true);
    try {
      if (isEdit) {
        await quotationService.update(id, data);
        toast.success('Quotation updated');
      } else {
        await quotationService.create(data);
        toast.success('Quotation created');
      }
      navigate('/quotations');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Save failed');
    } finally { 
      setSaving(false); 
    }
  };

  if (loading) return <PageLoader />;

  return (
    <div style={pageWrapperS}>
      {/* Header */}
      <div style={headerS}>
        <Link to="/quotations" style={backButtonS}>
          <FiArrowLeft size={18} />
        </Link>
        <div>
          <h1 style={pageTitleS}>{isEdit ? 'Edit Quotation' : 'New Quotation'}</h1>
          <p style={pageSubtitleS}>Fill in the details below to {isEdit ? 'update the' : 'create a new'} quotation</p>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit(onSubmit)} style={formS}>
        
        {/* Quotation Details Section */}
        <div style={cardS}>
          <div style={cardHeaderS}>
            <div style={{display:'flex',alignItems:'center',gap:8}}>
              <FiUsers size={18}/>
              <h3 style={sectionTitleS}>Quotation Details</h3>
            </div>
            <span style={sectionBadgeS}>*Required fields</span>
          </div>

          <div style={formGridS}>
            {/* Client Select */}
            <div style={fieldWrapperS}>
              <label style={labelS}>
                Client <span style={requiredS}>*</span>
              </label>
              <select 
                {...register('clientId')} 
                style={{
                  ...inputS,
                  ...(errors.clientId ? inputErrorS : {})
                }}
              >
                <option value="">— Select a client —</option>
                {clients.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.name} {c.company ? `— ${c.company}` : ''}
                  </option>
                ))}
              </select>
              {errors.clientId && (
                <div style={errorMessageS}>
                  <FiAlertCircle size={14} style={{ marginRight: 6 }} />
                  {errors.clientId.message}
                </div>
              )}
            </div>

            {/* Quotation Date */}
            <div style={fieldWrapperS}>
              <label style={labelS}>
                Quotation Date <span style={requiredS}>*</span>
              </label>
              <input 
                {...register('quotationDate')} 
                type="date" 
                style={{
                  ...inputS,
                  ...(errors.quotationDate ? inputErrorS : {})
                }} 
              />
              {errors.quotationDate && (
                <div style={errorMessageS}>
                  <FiAlertCircle size={14} style={{ marginRight: 6 }} />
                  {errors.quotationDate.message}
                </div>
              )}
            </div>

            {/* Valid Until */}
            <div style={fieldWrapperS}>
              <label style={labelS}>Valid Until</label>
              <input 
                {...register('validUntil')} 
                type="date" 
                style={inputS} 
              />
            </div>

            {/* Currency */}
            <div style={fieldWrapperS}>
              <label style={labelS}>Currency</label>
              <select {...register('currency')} style={inputS}>
                <option value="INR">INR — ₹</option>
                <option value="USD">USD — $</option>
                <option value="EUR">EUR — €</option>
                <option value="GBP">GBP — £</option>
              </select>
            </div>
          </div>
        </div>

        {/* Line Items Section */}
        <div style={cardS}>
          <div style={cardHeaderS}>
            <div style={{display:'flex',alignItems:'center',gap:8}}>
              <FiFileText size={18}/>
              <h3 style={sectionTitleS}>Line Items</h3>
            </div>
            <span style={sectionBadgeS}>Add products/services</span>
          </div>

          <div style={lineItemsContainerS}>
            <Controller
              name="items"
              control={control}
              render={({ field }) => <LineItemsEditor value={field.value} onChange={field.onChange} />}
            />
          </div>

          {errors.items && (
            <div style={errorMessageS}>
              <FiAlertCircle size={14} style={{ marginRight: 6 }} />
              {errors.items.message || errors.items.root?.message}
            </div>
          )}
        </div>

        {/* Notes & Terms Section */}
        <div style={cardS}>
          <div style={cardHeaderS}>
            <div style={{display:'flex',alignItems:'center',gap:8}}>
              <FiEdit3 size={18}/>
              <h3 style={sectionTitleS}>Additional Information</h3>
            </div>          
          </div>

          <div style={notesGridS}>
            {/* Notes */}
            <div style={fieldWrapperS}>
              <label style={labelS}>Internal Notes</label>
              <textarea 
                {...register('notes')} 
                rows={4}
                placeholder="Add internal notes ..."
                style={textareaS}
              />
              <p style={fieldHintS}>These notes are for internal use only</p>
            </div>

            {/* Terms & Conditions */}
            <div style={fieldWrapperS}>
              <label style={labelS}>Terms & Conditions</label>
              <textarea 
                {...register('termsAndConditions')} 
                rows={4}
                placeholder="Payment terms, delivery conditions, warranty information..."
                style={textareaS}
              />
              <p style={fieldHintS}>These will be visible to the client</p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div style={actionsS}>
          <Link to="/quotations" style={buttonCancelS}>
            <span>Cancel</span>
          </Link>
          <button 
            type="submit" 
            disabled={saving} 
            style={{
              ...buttonPrimaryS,
              ...(saving ? { opacity: 0.6, cursor: 'not-allowed' } : {})
            }}
          >
            <FiSave size={16} />
            <span>{saving ? 'Saving...' : isEdit ? 'Update Quotation' : 'Create Quotation'}</span>
          </button>
        </div>
      </form>
    </div>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const pageWrapperS = {
  background: '#ffffff',
  minHeight: '100vh',
  padding: 'clamp(16px, 4vw, 24px)',
  paddingBottom: 48,
};

const headerS = {
  display: 'flex',
  alignItems: 'flex-start',
  gap: 16,
  marginBottom: 32,
};

const backButtonS = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: 40,
  height: 40,
  borderRadius: 8,
  background: '#f3f4f6',
  color: '#374151',
  border: 'none',
  cursor: 'pointer',
  textDecoration: 'none',
  transition: 'all 0.2s ease',
  flexShrink: 0,
  marginTop: 2,
};

const pageTitleS = {
  fontSize: 'clamp(24px, 5vw, 28px)',
  fontWeight: 800,
  margin: 0,
  color: '#111827',
  letterSpacing: '-0.5px',
};

const pageSubtitleS = {
  fontSize: 14,
  color: '#6b7280',
  margin: '8px 0 0 0',
};

const formS = {
  maxWidth: 900,
  display: 'flex',
  flexDirection: 'column',
  gap: 24,
};

const cardS = {
  background: '#ffffff',
  border: '1px solid #e5e7eb',
  borderRadius: 10,
  overflow: 'hidden',
  boxShadow: '0 1px 3px rgba(0, 0, 0, 0.08)',
};

const cardHeaderS = {
  padding: '18px 24px',
  borderBottom: '1px solid #f3f4f6',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  backgroundColor: '#fafbfc',
};

const sectionTitleS = {
  fontSize: 'clamp(15px, 2vw, 16px)',
  fontWeight: 700,
  margin: 0,
  color: '#1f2937',
};

const sectionBadgeS = {
  fontSize: 12,
  color: '#9ca3af',
  fontWeight: 500,
  letterSpacing: '0.5px',
};

const formGridS = {
  padding: 24,
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
  gap: 20,
};

const fieldWrapperS = {
  display: 'flex',
  flexDirection: 'column',
  gap: 8,
};

const labelS = {
  fontSize: 13,
  fontWeight: 600,
  color: '#374151',
  display: 'flex',
  alignItems: 'center',
  gap: 4,
};

const requiredS = {
  color: '#ef4444',
  fontSize: 14,
};

const inputS = {
  padding: '12px 14px',
  fontSize: 14,
  color: '#1f2937',
  border: '1px solid #cbd5e1',
  borderRadius: 10,
  background: '#fff',
  fontFamily: 'inherit',
  outline: 'none',
  transition: 'all .2s ease',
  width: '100%',
  boxSizing: 'border-box',
};

const inputErrorS = {
  borderColor: '#fecaca',
  backgroundColor: '#fef2f2',
};

const errorMessageS = {
  display: 'flex',
  alignItems: 'center',
  fontSize: 12,
  color: '#dc2626',
  backgroundColor: '#fee2e2',
  padding: '8px 12px',
  borderRadius: 6,
  marginTop: 4,
};

const lineItemsContainerS = {
  padding: 24,
};

const notesGridS = {
  padding: 24,
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
  gap: 24,
};

const textareaS = {
  padding: '10px 13px',
  fontSize: 14,
  color: '#1f2937',
  border: '1px solid #d1d5db',
  borderRadius: 8,
  background: '#ffffff',
  fontFamily: 'inherit',
  outline: 'none',
  resize: 'vertical',
  transition: 'all 0.2s ease',
  boxShadow: '0 1px 2px rgba(0, 0, 0, 0.02)',
  minHeight: 100,
};

const fieldHintS = {
  fontSize: 12,
  color: '#9ca3af',
  margin: 0,
  fontStyle: 'italic',
};

const actionsS = {
  display: 'flex',
  gap: 12,
  justifyContent: 'flex-end',
  paddingTop: 12,
};

const buttonCancelS = {
  padding: '10px 20px',
  fontSize: 14,
  fontWeight: 600,
  color: '#6b7280',
  background: '#f3f4f6',
  border: '1px solid #e5e7eb',
  borderRadius: 8,
  cursor: 'pointer',
  textDecoration: 'none',
  transition: 'all 0.2s ease',
  display: 'flex',
  alignItems: 'center',
  gap: 8,
};

const buttonPrimaryS = {
  padding: '10px 20px',
  fontSize: 14,
  fontWeight: 600,
  color: '#ffffff',
  background: '#3b82f6',
  border: 'none',
  borderRadius: 8,
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  gap: 8,
  transition: 'all 0.2s ease',
};
