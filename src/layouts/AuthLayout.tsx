import React, { useEffect, useRef } from 'react';
import { Outlet } from 'react-router-dom';
import gsap from 'gsap';
import { Sparkles } from 'lucide-react';

const AuthLayout: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const leftPanelRef = useRef<HTMLDivElement>(null);
  const rightPanelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Initial animations
    const tl = gsap.timeline();

    tl.fromTo(
      leftPanelRef.current,
      { opacity: 0, x: -50 },
      { opacity: 1, x: 0, duration: 0.8, ease: 'power2.out' }
    )
      .fromTo(
        rightPanelRef.current,
        { opacity: 0, x: 50 },
        { opacity: 1, x: 0, duration: 0.8, ease: 'power2.out' },
        '-=0.5'
      );

    // Floating animation for decorative elements
    gsap.to('.floating-element', {
      y: -10,
      duration: 2,
      repeat: -1,
      yoyo: true,
      ease: 'power1.inOut',
      stagger: 0.3,
    });

    return () => {
      tl.kill();
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="min-h-screen flex bg-background"
    >
      {/* Left Panel - Branding */}
      <div
        ref={leftPanelRef}
        className="hidden lg:flex lg:w-1/2 xl:w-5/12 relative overflow-hidden"
      >
        {/* Background Gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary/90 to-primary/70" />

        {/* Decorative Elements */}
        <div className="absolute inset-0 overflow-hidden">
          {/* Floating circles */}
          <div className="floating-element absolute top-20 left-20 w-32 h-32 bg-white/10 rounded-full blur-xl" />
          <div className="floating-element absolute top-40 right-20 w-24 h-24 bg-white/10 rounded-full blur-lg" />
          <div className="floating-element absolute bottom-40 left-40 w-40 h-40 bg-white/5 rounded-full blur-2xl" />
          <div className="floating-element absolute bottom-20 right-40 w-28 h-28 bg-white/10 rounded-full blur-xl" />

          {/* Grid pattern */}
          <div
            className="absolute inset-0 opacity-10"
            style={{
              backgroundImage: `
                linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
                linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)
              `,
              backgroundSize: '50px 50px'
            }}
          />
        </div>

        {/* Content */}
        <div className="relative z-10 flex flex-col justify-center px-12 xl:px-16">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-bold text-white">Gupio DMP</span>
          </div>

          <h1 className="text-4xl xl:text-5xl font-bold text-white mb-6 leading-tight">
            Transform Your
            <br />
            Digital Marketing
          </h1>

          <p className="text-lg text-white/80 mb-8 max-w-md">
            All-in-one platform to manage campaigns, generate AI content,
            track analytics, and grow your business.
          </p>

          {/* Feature List */}
          <div className="space-y-4">
            {[
              'AI-Powered Content Generation',
              'Multi-Platform Publishing',
              'Advanced Analytics Dashboard',
              'Lead Management & CRM',
              'SEO & AEO Optimization'
            ].map((feature, index) => (
              <div key={index} className="flex items-center gap-3">
                <div className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center">
                  <svg
                    className="w-3 h-3 text-white"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={3}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                </div>
                <span className="text-white/90">{feature}</span>
              </div>
            ))}
          </div>

          {/* Stats */}
          <div className="mt-12 pt-8 border-t border-white/20 grid grid-cols-3 gap-6">
            <div>
              <div className="text-3xl font-bold text-white">10K+</div>
              <div className="text-sm text-white/70">Active Users</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-white">500K+</div>
              <div className="text-sm text-white/70">Posts Created</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-white">98%</div>
              <div className="text-sm text-white/70">Satisfaction</div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Panel - Form */}
      <div
        ref={rightPanelRef}
        className="flex-1 flex flex-col justify-center items-center p-6 lg:p-12"
      >
        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <div className="lg:hidden flex items-center justify-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold">Gupio DMP</span>
          </div>

          <Outlet />
        </div>

        {/* Footer */}
        <div className="mt-auto pt-8 text-center text-sm text-muted-foreground">
          <p>
            By continuing, you agree to our{' '}
            <a href="#" className="text-primary hover:underline">
              Terms of Service
            </a>{' '}
            and{' '}
            <a href="#" className="text-primary hover:underline">
              Privacy Policy
            </a>
          </p>
          <p className="mt-2">
            © 2026 Gupio DMP. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
};

export default AuthLayout;
