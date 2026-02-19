import React, { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Home, ArrowLeft } from 'lucide-react';
import gsap from 'gsap';

const NotFound: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Animate the 404 text
    gsap.fromTo(
      '.error-404',
      { opacity: 0, scale: 0.5 },
      { opacity: 1, scale: 1, duration: 0.8, ease: 'back.out(1.7)' }
    );

    gsap.fromTo(
      '.error-message',
      { opacity: 0, y: 20 },
      { opacity: 1, y: 0, duration: 0.6, delay: 0.3, ease: 'power2.out' }
    );

    gsap.fromTo(
      '.error-actions',
      { opacity: 0, y: 20 },
      { opacity: 1, y: 0, duration: 0.6, delay: 0.5, ease: 'power2.out' }
    );

    // Floating animation for decorative elements
    gsap.to('.floating-dot', {
      y: -15,
      duration: 2,
      repeat: -1,
      yoyo: true,
      ease: 'power1.inOut',
      stagger: 0.2,
    });
  }, []);

  return (
    <div
      ref={containerRef}
      className="min-h-screen flex items-center justify-center bg-background relative overflow-hidden"
    >
      {/* Decorative Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="floating-dot absolute top-20 left-20 w-4 h-4 rounded-full bg-primary/20" />
        <div className="floating-dot absolute top-40 right-32 w-6 h-6 rounded-full bg-primary/10" />
        <div className="floating-dot absolute bottom-32 left-40 w-8 h-8 rounded-full bg-primary/15" />
        <div className="floating-dot absolute bottom-20 right-20 w-5 h-5 rounded-full bg-primary/20" />
        <div className="floating-dot absolute top-1/2 left-10 w-3 h-3 rounded-full bg-primary/10" />
        <div className="floating-dot absolute top-1/3 right-16 w-7 h-7 rounded-full bg-primary/15" />
      </div>

      {/* Content */}
      <div ref={textRef} className="text-center px-4 relative z-10">
        {/* 404 */}
        <div className="error-404 mb-8">
          <h1 className="text-9xl font-bold text-primary tracking-tighter">
            404
          </h1>
        </div>

        {/* Message */}
        <div className="error-message space-y-4 max-w-md mx-auto">
          <h2 className="text-2xl font-semibold">Page Not Found</h2>
          <p className="text-muted-foreground">
            Oops! The page you're looking for doesn't exist. It might have been moved,
            deleted, or you entered the wrong URL.
          </p>
        </div>

        {/* Actions */}
        <div className="error-actions flex flex-col sm:flex-row items-center justify-center gap-4 mt-8">
          <Button asChild size="lg">
            <Link to="/dashboard">
              <Home className="mr-2 h-5 w-5" />
              Go to Dashboard
            </Link>
          </Button>
          <Button variant="outline" size="lg" onClick={() => window.history.back()}>
            <ArrowLeft className="mr-2 h-5 w-5" />
            Go Back
          </Button>
        </div>

        {/* Help Links */}
        <div className="mt-12 text-sm text-muted-foreground">
          <p>
            Need help? Contact{' '}
            <a href="#" className="text-primary hover:underline">
              Support
            </a>{' '}
            or visit our{' '}
            <a href="#" className="text-primary hover:underline">
              Help Center
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
