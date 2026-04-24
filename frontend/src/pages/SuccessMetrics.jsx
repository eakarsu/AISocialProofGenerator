import { useState } from 'react'
import axios from 'axios'
import toast from 'react-hot-toast'
import { useAuth } from '../context/AuthContext'
import { useResourceData } from '../hooks/useResourceData'
import DataTable from '../components/DataTable'
import DetailModal from '../components/DetailModal'
import NewItemModal from '../components/NewItemModal'
import SearchBar from '../components/SearchBar'
import Pagination from '../components/Pagination'
import FilterControls from '../components/FilterControls'
import BulkActions from '../components/BulkActions'

const API_URL = 'http://localhost:5001/api'

function SuccessMetrics() {
  const { user } = useAuth()
  const {
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
    refetch
  } = useResourceData('success-metrics')

  const [selectedItem, setSelectedItem] = useState(null)
  const [showNewModal, setShowNewModal] = useState(false)
  const [editData, setEditData] = useState(null)
  const [generating, setGenerating] = useState(false)

  const columns = [
    { key: 'metric_name', label: 'Metric' },
    {
      key: 'value',
      label: 'Value',
      render: (value) => (
        <span className="text-lg font-bold text-indigo-600">{value}</span>
      )
    },
    {
      key: 'context',
      label: 'Context',
      render: (value) => (
        <span className="text-sm text-slate-500">
          {value?.substring(0, 40)}...
        </span>
      )
    },
    {
      key: 'icon',
      label: 'Icon',
      render: (value) => (
        <span className="px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
          {value || 'default'}
        </span>
      )
    }
  ]

  const detailFields = [
    { key: 'metric_name', label: 'Metric Name' },
    { key: 'value', label: 'Value' },
    { key: 'context', label: 'Context' },
    { key: 'ai_description', label: 'AI Description' },
    { key: 'icon', label: 'Icon' },
    { key: 'created_at', label: 'Created', render: (value) => new Date(value).toLocaleDateString() }
  ]

  const formFields = [
    { key: 'metric_name', label: 'Metric Name', required: true, placeholder: 'Customer Satisfaction' },
    { key: 'value', label: 'Value', required: true, placeholder: '98%' },
    { key: 'context', label: 'Context', type: 'textarea', placeholder: 'Based on post-interaction surveys' },
    { key: 'ai_description', label: 'AI Description', type: 'textarea', placeholder: 'Click "Generate with AI" to create a description' },
    {
      key: 'icon',
      label: 'Icon',
      type: 'select',
      options: [
        { value: 'star', label: 'Star' },
        { value: 'trending-up', label: 'Trending Up' },
        { value: 'clock', label: 'Clock' },
        { value: 'users', label: 'Users' },
        { value: 'shield', label: 'Shield' },
        { value: 'dollar-sign', label: 'Dollar Sign' },
        { value: 'thumbs-up', label: 'Thumbs Up' },
        { value: 'database', label: 'Database' },
        { value: 'globe', label: 'Globe' },
        { value: 'zap', label: 'Zap' },
        { value: 'rocket', label: 'Rocket' },
        { value: 'check-circle', label: 'Check Circle' }
      ]
    }
  ]

  const exampleData = [
    {
      label: 'Customer Satisfaction',
      icon: '😊',
      data: {
        metric_name: 'Customer Satisfaction Score',
        value: '96%',
        context: 'Based on quarterly NPS surveys across 2,500+ enterprise clients. Score has improved consistently for 8 consecutive quarters since implementing our AI-powered support system.',
        icon: 'star'
      }
    },
    {
      label: 'Revenue Growth',
      icon: '💰',
      data: {
        metric_name: 'Average Revenue Growth',
        value: '3.2x',
        context: 'Average revenue multiplier experienced by customers within their first 12 months of using our platform. Calculated from a cohort of 450 businesses across 15 industries.',
        icon: 'trending-up'
      }
    },
    {
      label: 'Time Saved',
      icon: '⏱️',
      data: {
        metric_name: 'Hours Saved Per Week',
        value: '23 hrs',
        context: 'Average number of hours saved per team per week by automating manual workflows. Based on time-tracking data from 800+ teams using our automation features.',
        icon: 'clock'
      }
    }
  ]

  const filterOptions = [
    {
      key: 'icon',
      label: 'All Icons',
      options: [
        { value: 'star', label: 'Star' },
        { value: 'trending-up', label: 'Trending Up' },
        { value: 'clock', label: 'Clock' },
        { value: 'users', label: 'Users' },
        { value: 'shield', label: 'Shield' },
        { value: 'dollar-sign', label: 'Dollar Sign' },
        { value: 'zap', label: 'Zap' },
        { value: 'rocket', label: 'Rocket' }
      ]
    }
  ]

  const handleSubmit = async (formData, isEdit) => {
    try {
      if (isEdit) {
        await axios.put(`${API_URL}/success-metrics/${formData.id}`, formData)
        toast.success('Success metric updated successfully')
      } else {
        await axios.post(`${API_URL}/success-metrics`, formData)
        toast.success('Success metric created successfully')
      }
      refetch()
      setEditData(null)
    } catch (error) {
      console.error('Error saving success metric:', error)
      toast.error(error.response?.data?.error || error.response?.data?.message || 'Failed to save success metric')
      throw error
    }
  }

  const handleDelete = async (id) => {
    try {
      await axios.delete(`${API_URL}/success-metrics/${id}`)
      toast.success('Success metric deleted successfully')
      refetch()
      setSelectedItem(null)
    } catch (error) {
      console.error('Error deleting success metric:', error)
      toast.error(error.response?.data?.error || error.response?.data?.message || 'Failed to delete success metric')
      throw error
    }
  }

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return
    if (!window.confirm(`Are you sure you want to delete ${selectedIds.length} success metric(s)?`)) return
    try {
      await axios.delete(`${API_URL}/success-metrics/bulk`, { data: { ids: selectedIds } })
      toast.success(`${selectedIds.length} success metrics deleted`)
      clearSelection()
      refetch()
    } catch (error) {
      console.error('Error bulk deleting success metrics:', error)
      toast.error(error.response?.data?.error || error.response?.data?.message || 'Failed to delete success metrics')
    }
  }

  const handleExportCsv = () => {
    window.open(`${API_URL}/success-metrics/export/csv`, '_blank')
  }

  const handleExportPdf = () => {
    window.open(`${API_URL}/success-metrics/export/pdf`, '_blank')
  }

  const handleEdit = (item) => {
    setSelectedItem(null)
    setEditData(item)
    setShowNewModal(true)
  }

  const handleCloseModal = () => {
    setShowNewModal(false)
    setEditData(null)
  }

  const handleAiGenerate = async (formData) => {
    setGenerating(true)
    try {
      const response = await axios.post(`${API_URL}/ai/describe-metric`, {
        metric_name: formData.metric_name || '',
        value: formData.value || '',
        context: formData.context || ''
      })
      return response.data
    } catch (error) {
      console.error('Error generating metric description:', error)
      throw error
    } finally {
      setGenerating(false)
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Success Metrics</h1>
          <p className="text-slate-500 mt-1 text-sm">Track and display key performance indicators</p>
        </div>
        <button
          onClick={() => setShowNewModal(true)}
          className="btn-primary"
        >
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          New Metric
        </button>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="flex-1">
          <SearchBar value={search} onChange={setSearch} placeholder="Search success metrics..." />
        </div>
        <FilterControls filters={filterOptions} values={filters} onChange={handleFilterChange} />
      </div>
      <div className="flex items-center justify-between mb-4">
        <BulkActions
          selectedCount={selectedIds.length}
          onBulkDelete={handleBulkDelete}
          onExportCsv={handleExportCsv}
          onExportPdf={handleExportPdf}
          userRole={user?.role}
        />
        <p className="text-sm text-slate-500">{total} total items</p>
      </div>

      <DataTable
        columns={columns}
        data={data}
        loading={loading}
        onRowClick={setSelectedItem}
        sortBy={sortBy}
        sortOrder={sortOrder}
        onSort={handleSort}
        selectable
        selectedIds={selectedIds}
        onToggleSelect={toggleSelect}
        onToggleSelectAll={toggleSelectAll}
      />

      <Pagination
        page={page}
        totalPages={totalPages}
        onPageChange={setPage}
      />

      <DetailModal
        isOpen={!!selectedItem}
        onClose={() => setSelectedItem(null)}
        title="Success Metric Details"
        data={selectedItem}
        fields={detailFields}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />

      <NewItemModal
        isOpen={showNewModal}
        onClose={handleCloseModal}
        title="Create New Success Metric"
        fields={formFields}
        onSubmit={handleSubmit}
        onAiGenerate={handleAiGenerate}
        generating={generating}
        editData={editData}
        exampleData={exampleData}
      />
    </div>
  )
}

export default SuccessMetrics
