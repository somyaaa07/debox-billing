// hooks/useDocumentList.js
import { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';

/**
 * Generic paginated list hook.
 * Calls service.getAll({ page, limit, search, ...filters })
 * Expects backend response: { success, data: [...], pagination: { currentPage, totalPages, totalItems, itemsPerPage } }
 */
export default function useDocumentList(service, defaultFilters = {}) {
  const [data,       setData]       = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading,    setLoading]    = useState(true);
  const [search,     setSearch]     = useState('');
  const [page,       setPage]       = useState(1);
  const [filters,    setFilters]    = useState(defaultFilters);

  const fetch = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit: 10, search, ...filters };
      // Remove empty string filters so backend doesn't filter on blank values
      Object.keys(params).forEach(k => {
        if (params[k] === '' || params[k] === null || params[k] === undefined) {
          delete params[k];
        }
      });

      const res = await service.getAll(params);

      // Backend returns: { success: true, data: [...], pagination: {...} }
      setData(res.data?.data       || []);
      setPagination(res.data?.pagination || null);
    } catch (err) {
      console.error('useDocumentList fetch error:', err);
      toast.error(err.response?.data?.message || 'Failed to load data');
      setData([]);
    } finally {
      setLoading(false);
    }
  }, [page, search, JSON.stringify(filters)]);

  // Fetch on param changes
  useEffect(() => { fetch(); }, [fetch]);

  // Reset to page 1 when search or filters change
  const handleSearch = useCallback((val) => {
    setSearch(val);
    setPage(1);
  }, []);

  const handleFilters = useCallback((newFilters) => {
    setFilters(newFilters);
    setPage(1);
  }, []);

  return {
    data,
    pagination,
    loading,
    search,
    setSearch:  handleSearch,   // use this instead of raw setSearch
    page,
    setPage,
    filters,
    setFilters: handleFilters,  // use this instead of raw setFilters
    refresh:    fetch,
  };
}