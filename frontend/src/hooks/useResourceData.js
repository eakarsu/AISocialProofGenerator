import { useState, useEffect, useCallback } from 'react'
import axios from 'axios'

const API_URL = '/api'

export function recordsFromResponse(payload) {
  if (Array.isArray(payload)) return { rows: payload, total: payload.length, totalPages: 1 }
  const rows = Array.isArray(payload?.data) ? payload.data : Array.isArray(payload?.items) ? payload.items : []
  return {
    rows,
    total: Number(payload?.pagination?.total ?? payload?.total ?? rows.length),
    totalPages: Number(payload?.pagination?.totalPages ?? payload?.pagination?.total_pages ?? payload?.totalPages ?? 1),
  }
}

export function useResourceData(endpoint, { defaultLimit = 15 } = {}) {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [search, setSearch] = useState('')
  const [sortBy, setSortBy] = useState('created_at')
  const [sortOrder, setSortOrder] = useState('DESC')
  const [filters, setFilters] = useState({})
  const [selectedIds, setSelectedIds] = useState([])
  const [limit] = useState(defaultLimit)

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        sort_by: sortBy,
        sort_order: sortOrder,
      })
      if (search) params.set('search', search)
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.set(key, value)
      })

      const response = await axios.get(`${API_URL}/${endpoint}?${params}`)
      const normalized = recordsFromResponse(response.data)
      setData(normalized.rows)
      setTotal(normalized.total)
      setTotalPages(normalized.totalPages)
      setError(Array.isArray(response.data) || Array.isArray(response.data?.data) || Array.isArray(response.data?.items) ? '' : 'The records service returned an invalid list.')
    } catch (error) {
      console.error(`Error fetching ${endpoint}:`, error)
      setData([])
      setError(error.response?.data?.error || `Unable to load ${endpoint}.`)
    } finally {
      setLoading(false)
    }
  }, [endpoint, page, limit, search, sortBy, sortOrder, filters])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  useEffect(() => {
    setPage(1)
  }, [search, filters])

  const handleSort = (column) => {
    if (sortBy === column) {
      setSortOrder(prev => prev === 'ASC' ? 'DESC' : 'ASC')
    } else {
      setSortBy(column)
      setSortOrder('ASC')
    }
  }

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }))
  }

  const toggleSelect = (id) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    )
  }

  const toggleSelectAll = () => {
    if (selectedIds.length === data.length) {
      setSelectedIds([])
    } else {
      setSelectedIds(data.map(item => item.id))
    }
  }

  const clearSelection = () => setSelectedIds([])

  return {
    data,
    loading,
    error,
    total,
    page,
    totalPages,
    search,
    sortBy,
    sortOrder,
    filters,
    selectedIds,
    setPage,
    setSearch,
    handleSort,
    handleFilterChange,
    toggleSelect,
    toggleSelectAll,
    clearSelection,
    refetch: fetchData,
  }
}
