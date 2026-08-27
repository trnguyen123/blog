import { useEffect, useState, useCallback } from 'react';
import { authorStatsService } from '../services/authorStatsService';

export function useAuthorDashboard() {
  const [overview, setOverview] = useState(null);
  const [topPosts, setTopPosts] = useState([]);
  const [pendingComments, setPendingComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [overviewData, posts, pending] = await Promise.all([
        authorStatsService.getOverview(),
        authorStatsService.getTopPosts(4),
        authorStatsService.getPendingComments(5),
      ]);

      setOverview(overviewData);
      setTopPosts(posts || []);
      setPendingComments(pending || []);
      setError(null);
    } catch (err) {
      setError(err.message || 'Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { overview, topPosts, pendingComments, loading, error, refetch: fetchData };
}