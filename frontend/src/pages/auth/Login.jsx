// src/pages/auth/LoginPage.jsx
import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Eye, EyeOff, Zap, ArrowRight } from 'lucide-react';
import toast from 'react-hot-toast';
import useAuthStore from '../../store/authStore';
import { loginSchema } from '../../utils/validations';
import { ButtonLoader } from '../../components/common/Loader';
import { motion } from 'framer-motion';

/* ─── Animated Net Canvas ─── */
// function NetCanvas() {
//   const canvasRef = useRef(null);
//   const animRef = useRef(null);

//   useEffect(() => {
//     const canvas = canvasRef.current;
//     if (!canvas) return;
//     const ctx = canvas.getContext('2d');

//     const resize = () => {
//       canvas.width = window.innerWidth;
//       canvas.height = window.innerHeight;
//     };
//     resize();
//     window.addEventListener('resize', resize);

//     const NODE_COUNT = 80;
//     const CONNECT_DIST = 120;
//     const nodes = Array.from({ length: NODE_COUNT }, () => ({
//       x: Math.random() * canvas.width,
//       y: Math.random() * canvas.height,
//       vx: (Math.random() - 0.5) * 0.8,
//       vy: (Math.random() - 0.5) * 0.8,
//       r: Math.random() * 1.8 + 0.9,
//     }));

//     const draw = () => {
//       ctx.clearRect(0, 0, canvas.width, canvas.height);

//       for (const n of nodes) {
//         n.x += n.vx;
//         n.y += n.vy;
//         if (n.x < 0 || n.x > canvas.width) n.vx *= -1;
//         if (n.y < 0 || n.y > canvas.height) n.vy *= -1;
//       }

//       for (let i = 0; i < nodes.length; i++) {
//         for (let j = i + 1; j < nodes.length; j++) {
//           const dx = nodes[i].x - nodes[j].x;
//           const dy = nodes[i].y - nodes[j].y;
//           const dist = Math.sqrt(dx * dx + dy * dy);
//           if (dist < CONNECT_DIST) {
//             const alpha = (1 - dist / CONNECT_DIST) * 0.4;
//             ctx.beginPath();
//             ctx.moveTo(nodes[i].x, nodes[i].y);
//             ctx.lineTo(nodes[j].x, nodes[j].y);
//             ctx.strokeStyle = `rgba(99, 179, 237, ${alpha})`;
//             ctx.lineWidth = 0.6;
//             ctx.stroke();
//           }
//         }
//       }

//       for (const n of nodes) {
//         ctx.beginPath();
//         ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2);
//         ctx.fillStyle = 'rgba(255, 255, 255, 1)';
//         ctx.fill();
//       }

//       animRef.current = requestAnimationFrame(draw);
//     };

//     draw();

//     return () => {
//       cancelAnimationFrame(animRef.current);
//       window.removeEventListener('resize', resize);
//     };
//   }, []);

//   return (
//     <canvas
//       ref={canvasRef}
//       style={{
//         position: 'fixed',
//         inset: 0,
//         width: '100%',
//         height: '100%',
//         pointerEvents: 'none',
//         zIndex: 0,
//       }}
//     />
//   );
// }

/* ─── Login Page ─── */
export default function LoginPage() {
  const [showPwd, setShowPwd] = useState(false);
  const { login, isLoading } = useAuthStore();
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: 'admin@billflow.com', password: 'admin123' },
  });

  const onSubmit = async (data) => {
    const result = await login(data.email, data.password);
    if (result.success) {
      toast.success('Welcome back!');
      navigate('/dashboard');
    } else {
      toast.error(result.message);
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
      {/* Animated net */}
      {/* <NetCanvas /> */}

   
      <motion.div
        initial={{ opacity: 0, y: 28, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        style={{ width: '100%', maxWidth: '420px', position: 'relative', zIndex: 2 }}
      >
        {/* Glass card */}
    <div
  style={{
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
  }}
> 
  <div style={{
    position: 'absolute', top: 0, left: 0, right: 0,
    height: '50%', pointerEvents: 'none',
    background: 'linear-gradient(180deg, rgba(255,255,255,0.13) 0%, rgba(255,255,255,0) 100%)',
    borderRadius: '28px 28px 60% 60% / 28px 28px 40px 40px',
  }} />
  {/* Bottom tint */}

          {/* Logo */}
          {/* <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '2rem' }}>
            <div
              style={{
                width: '42px',
                height: '42px',
                background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)',
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 16px rgba(59,130,246,0.4)',
                flexShrink: 0,
              }}
            >
              <Zap size={20} color="#fff" />
            </div>
            <div>
              <p
                style={{
                  margin: 0,
                  fontSize: '18px',
                  fontWeight: 700,
                  color: '#ffffff',
                  letterSpacing: '-0.01em',
                }}
              >
                BillFlow Pro
              </p>
              <p style={{ margin: 0, fontSize: '11px', color: 'rgba(255,255,255,0.45)' }}>
                B2B Billing Management
              </p>
            </div>
          </div> */}

          <h2
            style={{
              margin: '0 0 4px',
              fontSize: '24px',
              fontWeight: 700,
              color: '#ffffff',
              letterSpacing: '-0.02em',
            }}
          >
            Welcome back
          </h2>
          <p style={{ margin: '0 0 1.75rem', fontSize: '14px', color: 'rgba(255,255,255,0.45)' }}>
            Sign in to your account to continue
          </p>

          {/* Form */}
          <form onSubmit={handleSubmit(onSubmit)} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* Email */}
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
                placeholder="admin@billflow.com"
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  background: 'rgba(255,255,255,0.07)',
                  border: `1px solid ${errors.email ? 'rgba(239,68,68,0.7)' : 'rgba(255,255,255,0.12)'}`,
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
                  e.target.style.borderColor = errors.email ? 'rgba(239,68,68,0.7)' : 'rgba(255,255,255,0.12)';
                }}
              />
              {errors.email && (
                <p style={{ margin: '4px 0 0', fontSize: '12px', color: 'rgba(239,68,68,0.9)' }}>
                  {errors.email.message}
                </p>
              )}
            </div>

            {/* Password */}
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
                Password
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  {...register('password')}
                  type={showPwd ? 'text' : 'password'}
                  placeholder="••••••••"
                  style={{
                    width: '100%',
                    padding: '10px 42px 10px 14px',
                    background: 'rgba(255,255,255,0.07)',
                    border: `1px solid ${errors.password ? 'rgba(239,68,68,0.7)' : 'rgba(255,255,255,0.12)'}`,
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
                    e.target.style.borderColor = errors.password ? 'rgba(239,68,68,0.7)' : 'rgba(255,255,255,0.12)';
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPwd(!showPwd)}
                  style={{
                    position: 'absolute',
                    right: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    padding: 0,
                    cursor: 'pointer',
                    color: 'rgba(255,255,255,0.4)',
                    display: 'flex',
                    alignItems: 'center',
                  }}
                >
                  {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {errors.password && (
                <p style={{ margin: '4px 0 0', fontSize: '12px', color: 'rgba(239,68,68,0.9)' }}>
                  {errors.password.message}
                </p>
              )}
            </div>

            {/* Forgot password */}
            <div style={{ textAlign: 'right', marginTop: '-4px' }}>
              <Link
                to="/forgot-password"
                style={{
                  fontSize: '13px',
                  color: 'rgba(147,197,253,0.9)',
                  textDecoration: 'none',
                  fontWeight: 500,
                }}
              >
                Forgot password?
              </Link>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={isLoading}
              style={{
                width: '100%',
                padding: '11px 16px',
                background: isLoading
                  ? 'rgba(59,130,246,0.5)'
                  : 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                border: 'none',
                borderRadius: '10px',
                fontSize: '14px',
                fontWeight: 600,
                color: '#ffffff',
                cursor: isLoading ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                boxShadow: isLoading ? 'none' : '0 4px 16px rgba(59,130,246,0.35)',
                transition: 'opacity 0.15s, transform 0.1s',
                marginTop: '4px',
              }}
              onMouseEnter={(e) => { if (!isLoading) e.currentTarget.style.opacity = '0.9'; }}
              onMouseLeave={(e) => { e.currentTarget.style.opacity = '1'; }}
              onMouseDown={(e) => { if (!isLoading) e.currentTarget.style.transform = 'scale(0.99)'; }}
              onMouseUp={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
            >
              {isLoading ? <ButtonLoader /> : (<>Sign In <ArrowRight size={15} /></>)}
            </button>
          </form>

          {/* Demo credentials */}
          {/* <div
            style={{
              marginTop: '1.5rem',
              padding: '10px 14px',
              background: 'rgba(59,130,246,0.1)',
              border: '1px solid rgba(59,130,246,0.2)',
              borderRadius: '10px',
            }}
          >
            <p style={{ margin: '0 0 4px', fontSize: '11px', fontWeight: 600, color: 'rgba(147,197,253,0.9)', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
              Demo Credentials
            </p>
            <p style={{ margin: '0', fontSize: '12px', color: 'rgba(147,197,253,0.7)' }}>
              admin@billflow.com · admin123
            </p>
          </div> */}
            <div style={{
    position: 'absolute', bottom: 0, left: 0, right: 0,
    height: '30%', pointerEvents: 'none',
    background: 'linear-gradient(0deg, rgba(120,170,255,0.07) 0%, transparent 100%)',
    borderRadius: '0 0 28px 28px',
  }} />
        </div>
      </motion.div>
    </div>
  );
}