'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Topbar from '@/components/layout/Topbar';
import Footer from '@/components/layout/Footer';
import { CheckCircle, XCircle, Loader2, ArrowRight } from 'lucide-react';

function SecondOpinionCallbackContent() {
  const searchParams = useSearchParams();
  const reference = searchParams.get('reference') || searchParams.get('trxref');

  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [caseReference, setCaseReference] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (!reference) {
      setStatus('error');
      setErrorMsg('No payment reference found.');
      return;
    }

    async function verify() {
      try {
        const res = await fetch('/api/second-opinion/verify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ reference }),
        });
        const data = await res.json();
        if (res.ok && data.success) {
          setStatus('success');
          setCaseReference(data.caseReference || '');
        } else {
          setStatus('error');
          setErrorMsg(data.error || 'Payment verification failed.');
        }
      } catch {
        setStatus('error');
        setErrorMsg('Network error. Please try again.');
      }
    }

    verify();
  }, [reference]);

  return (
    <>
      <Topbar />
      <main className="min-h-screen bg-gray-50 pt-32 pb-16">
        <div className="max-w-lg mx-auto px-4">
          {status === 'loading' && (
            <div className="bg-white rounded-2xl border border-gray-200 p-8 text-center">
              <Loader2 className="w-12 h-12 text-[#0D1F3C] animate-spin mx-auto mb-4" />
              <h1 className="text-xl font-bold text-gray-900 mb-2">Verifying payment...</h1>
              <p className="text-gray-600">Please wait while we confirm your payment.</p>
            </div>
          )}

          {status === 'success' && (
            <div className="bg-white rounded-2xl border border-gray-200 p-8 text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">Payment confirmed</h1>
              <p className="text-gray-600 mb-6">
                Your second opinion request is now in the queue. Our secretariat will assign a
                reviewing specialist shortly.
              </p>
              {caseReference && (
                <div className="bg-gray-50 rounded-xl p-4 mb-6">
                  <p className="text-sm text-gray-500 mb-1">Case reference</p>
                  <p className="text-lg font-mono font-bold text-[#0D1F3C]">{caseReference}</p>
                </div>
              )}
              <div className="space-y-3">
                <p className="text-sm text-gray-500">
                  You will receive an email notification when your specialist has been assigned and
                  when your report is ready.
                </p>
                <Link
                  href="/second-opinion"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-[#0D1F3C] text-white rounded-xl font-semibold hover:bg-[#162d52] transition-colors"
                >
                  Back to Second Opinion <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          )}

          {status === 'error' && (
            <div className="bg-white rounded-2xl border border-gray-200 p-8 text-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <XCircle className="w-8 h-8 text-red-600" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">Payment issue</h1>
              <p className="text-gray-600 mb-6">{errorMsg}</p>
              <Link
                href="/second-opinion"
                className="inline-flex items-center gap-2 px-6 py-3 bg-[#0D1F3C] text-white rounded-xl font-semibold hover:bg-[#162d52] transition-colors"
              >
                Try again
              </Link>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}

export default function SecondOpinionCallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-[#0D1F3C]" />
        </div>
      }
    >
      <SecondOpinionCallbackContent />
    </Suspense>
  );
}
