import { useState, useEffect, useCallback } from 'react'
import axios from 'axios'

const API_URL = 'http://localhost:5001/api'

export function useResourceData(endpoint, { defaultLimit = 10 } = {}) {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
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
      setData(response.data.data || [])
      setTotal(response.data.total || 0)
      setTotalPages(response.data.totalPages || 1)
    } catch (error) {
      console.error(`Error fetching ${endpoint}:`, error)
      setData([])
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
