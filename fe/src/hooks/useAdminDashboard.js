import { useEffect, useState } from 'react';
import { adminDashboardService } from '../services/adminDashboardService';

export function useAdminDashboard() {
  const [overview, setOverview] = useState(null);
  const [topPosts, setTopPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isMounted = true;

    async function fetchData() {
      try {
        setLoading(true);
        const [overviewData, contentStats] = await Promise.all([
          adminDashboardService.getOverview(),
          adminDashboardService.getContentStats(4),
        ]);

        if (!isMounted) return;
        setOverview(overviewData);
        setTopPosts(contentStats.top_posts || []);
        setError(null);
      } catch (err) {
        if (isMounted) setError(err.message || 'Failed to load dashboard');
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    fetchData();
    return () => {
      isMounted = false;
    };
  }, []);

  return { overview, topPosts, loading, error };
}