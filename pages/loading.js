import { useEffect } from 'react';
import { useRouter } from 'next/router';

export default function Loading() {
  const router = useRouter();

  useEffect(() => {
    // Simulate processing time
    const timer = setTimeout(() => {
      // Navigate to result page after processing
      router.push('/result');
    }, 3000);

    return () => clearTimeout(timer);
  }, [router]);

  return (
    <div className="loading-container">
      <div className="loader">
        <div className="spinner"></div>
      </div>
      <h2 className="loading-text">Processing Your Documents...</h2>
    </div>
  );
}