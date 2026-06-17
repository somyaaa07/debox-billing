// src/pages/auth/ForgotPasswordPage.jsx
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowLeft, Mail, CheckCircle2 } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../services/api';
import { forgotPasswordSchema } from '../../utils/validations';
import { motion } from 'framer-motion';

/* ─── Shared glass card styles (mirrors LoginPage) ─── */
const cardStyle = {
  background: `linear-gradient(
    145deg,
    rgba(255,255,255,0.22) 0%,
    rgba(255,255,255,0.08) 40%,
    rgba(200,220,255,0.06) 70%,
    rgba(255,255,255,0.11) 100%
  )`,
  backdropFilter: 'blur(40px) saturate(180%) brightness(1.1)',
  WebkitBackdropFilter: 'blur(40px) saturate(180%) brightness(1.1)',
  border: '1px solid rgba(255,255,255,0.28)',
  borderRadius: '28px',
  padding: '2rem 2rem 1.75rem',
  position: 'relative',
  overflow: 'hidden',
  boxShadow: `
    0 2px 0px rgba(255,255,255,0.35) inset,
    0 -1px 0px rgba(255,255,255,0.08) inset,
    1px 0 0px rgba(255,255,255,0.15) inset,
    -1px 0 0px rgba(255,255,255,0.15) inset,
    0 20px 60px rgba(0,0,30,0.45),
    0 4px 20px rgba(0,0,0,0.3)
  `,
};

export default function ForgotPasswordPage() {
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({ resolver: zodResolver(forgotPasswordSchema) });

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      await api.post('/auth/forgot-password', data);
      setSubmitted(true);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#000',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <motion.div
        initial={{ opacity: 0, y: 28, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        style={{ width: '100%', maxWidth: '420px', position: 'relative', zIndex: 2 }}
      >
        <div style={cardStyle}>
          {/* Top gloss sheen */}
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: '50%',
              pointerEvents: 'none',
              background:
                'linear-gradient(180deg, rgba(255,255,255,0.13) 0%, rgba(255,255,255,0) 100%)',
              borderRadius: '28px 28px 60% 60% / 28px 28px 40px 40px',
            }}
          />

          {submitted ? (
            /* ── Success state ── */
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
              style={{ textAlign: 'center', padding: '1rem 0 0.5rem' }}
            >
              <div
                style={{
                  width: '60px',
                  height: '60px',
                  background: 'rgba(52,211,153,0.15)',
                  border: '1px solid rgba(52,211,153,0.3)',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 1.25rem',
                }}
              >
                <CheckCircle2 size={28} color="rgba(52,211,153,0.9)" />
              </div>
              <h2
                style={{
                  margin: '0 0 6px',
                  fontSize: '22px',
                  fontWeight: 700,
                  color: '#ffffff',
                  letterSpacing: '-0.02em',
                }}
              >
                Check your email
              </h2>
              <p
                style={{
                  margin: '0 0 2rem',
                  fontSize: '14px',
                  color: 'rgba(255,255,255,0.45)',
                  lineHeight: 1.55,
                }}
              >
                We've sent a password reset link to your email address.
              </p>
              <Link
                to="/login"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  width: '100%',
                  padding: '11px 16px',
                  background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                  border: 'none',
                  borderRadius: '10px',
                  fontSize: '14px',
                  fontWeight: 600,
                  color: '#ffffff',
                  textDecoration: 'none',
                  boxShadow: '0 4px 16px rgba(59,130,246,0.35)',
                }}
              >
                <ArrowLeft size={15} /> Back to login
              </Link>
            </motion.div>
          ) : (
            /* ── Form state ── */
            <>
              <div
                style={{
                  width: '42px',
                  height: '42px',
                  background: 'rgba(255,255,255,0.08)',
                  border: '1px solid rgba(255,255,255,0.15)',
                  borderRadius: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '1.25rem',
                }}
              >
                <Mail size={20} color="rgba(255,255,255,0.7)" />
              </div>

              <h2
                style={{
                  margin: '0 0 4px',
                  fontSize: '24px',
                  fontWeight: 700,
                  color: '#ffffff',
                  letterSpacing: '-0.02em',
                }}
              >
                Reset password
              </h2>
              <p
                style={{
                  margin: '0 0 1.75rem',
                  fontSize: '14px',
                  color: 'rgba(255,255,255,0.45)',
                }}
              >
                Enter your email and we'll send a reset link.
              </p>

              <form
                onSubmit={handleSubmit(onSubmit)}
                style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}
              >
                <div>
                  <label
                    style={{
                      display: 'block',
                      marginBottom: '6px',
                      fontSize: '12px',
                      fontWeight: 500,
                      color: 'rgba(255,255,255,0.6)',
                      letterSpacing: '0.04em',
                      textTransform: 'uppercase',
                    }}
                  >
                    Email Address
                  </label>
                  <input
                    {...register('email')}
                    type="email"
                    placeholder="you@example.com"
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      background: 'rgba(255,255,255,0.07)',
                      border: `1px solid ${
                        errors.email ? 'rgba(239,68,68,0.7)' : 'rgba(255,255,255,0.12)'
                      }`,
                      borderRadius: '10px',
                      fontSize: '14px',
                      color: '#ffffff',
                      outline: 'none',
                      boxSizing: 'border-box',
                      transition: 'border-color 0.15s, background 0.15s',
                    }}
                    onFocus={(e) => {
                      e.target.style.background = 'rgba(255,255,255,0.1)';
                      e.target.style.borderColor = 'rgba(99,179,237,0.5)';
                    }}
                    onBlur={(e) => {
                      e.target.style.background = 'rgba(255,255,255,0.07)';
                      e.target.style.borderColor = errors.email
                        ? 'rgba(239,68,68,0.7)'
                        : 'rgba(255,255,255,0.12)';
                    }}
                  />
                  {errors.email && (
                    <p style={{ margin: '4px 0 0', fontSize: '12px', color: 'rgba(239,68,68,0.9)' }}>
                      {errors.email.message}
                    </p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  style={{
                    width: '100%',
                    padding: '11px 16px',
                    background: loading
                      ? 'rgba(59,130,246,0.5)'
                      : 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                    border: 'none',
                    borderRadius: '10px',
                    fontSize: '14px',
                    fontWeight: 600,
                    color: '#ffffff',
                    cursor: loading ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    boxShadow: loading ? 'none' : '0 4px 16px rgba(59,130,246,0.35)',
                    transition: 'opacity 0.15s, transform 0.1s',
                    marginTop: '4px',
                  }}
                  onMouseEnter={(e) => { if (!loading) e.currentTarget.style.opacity = '0.9'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.opacity = '1'; }}
                  onMouseDown={(e) => { if (!loading) e.currentTarget.style.transform = 'scale(0.99)'; }}
                  onMouseUp={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
                >
                  {loading ? 'Sending…' : 'Send reset link'}
                </button>
              </form>

              <Link
                to="/login"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  marginTop: '1.25rem',
                  fontSize: '13px',
                  color: 'rgba(255,255,255,0.4)',
                  textDecoration: 'none',
                  transition: 'color 0.15s',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.color = 'rgba(255,255,255,0.7)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.color = 'rgba(255,255,255,0.4)'; }}
              >
                <ArrowLeft size={13} /> Back to login
              </Link>
            </>
          )}

          {/* Bottom tint */}
          <div
            style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              height: '30%',
              pointerEvents: 'none',
              background:
                'linear-gradient(0deg, rgba(120,170,255,0.07) 0%, transparent 100%)',
              borderRadius: '0 0 28px 28px',
            }}
          />
        </div>
      </motion.div>
    </div>
  );
}