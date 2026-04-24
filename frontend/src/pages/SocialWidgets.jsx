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

function SocialWidgets() {
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
  } = useResourceData('social-widgets')

  const [selectedItem, setSelectedItem] = useState(null)
  const [showNewModal, setShowNewModal] = useState(false)
  const [editData, setEditData] = useState(null)
  const [generating, setGenerating] = useState(false)

  const columns = [
    { key: 'title', label: 'Title' },
    {
      key: 'widget_type',
      label: 'Type',
      render: (value) => (
        <span className="px-2 py-1 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
          {value?.replace(/_/g, ' ')}
        </span>
      )
    },
    {
      key: 'content',
      label: 'Content',
      render: (value) => (
        <span className="text-sm text-slate-500">
          {value?.substring(0, 50)}...
        </span>
      )
    },
    {
      key: 'stats_json',
      label: 'Stats',
      render: (value) => {
        if (!value) return '-'
        const stats = typeof value === 'string' ? JSON.parse(value) : value
        const firstKey = Object.keys(stats)[0]
        return firstKey ? `${firstKey}: ${stats[firstKey]}` : '-'
      }
    }
  ]

  const detailFields = [
    { key: 'title', label: 'Title' },
    { key: 'widget_type', label: 'Widget Type' },
    { key: 'content', label: 'Content' },
    {
      key: 'stats_json',
      label: 'Statistics',
      render: (value) => {
        if (!value) return 'N/A'
        const stats = typeof value === 'string' ? JSON.parse(value) : value
        return Object.entries(stats).map(([k, v]) => `${k}: ${JSON.stringify(v)}`).join('\n')
      }
    },
    { key: 'created_at', label: 'Created', render: (value) => new Date(value).toLocaleDateString() }
  ]

  const formFields = [
    { key: 'title', label: 'Title', required: true, placeholder: 'Trusted by Thousands' },
    {
      key: 'widget_type',
      label: 'Widget Type',
      type: 'select',
      required: true,
      options: [
        { value: 'customer_count', label: 'Customer Count' },
        { value: 'rating_badge', label: 'Rating Badge' },
        { value: 'social_proof', label: 'Social Proof' },
        { value: 'recent_activity', label: 'Recent Activity' },
        { value: 'testimonial_carousel', label: 'Testimonial Carousel' },
        { value: 'trust_badges', label: 'Trust Badges' },
        { value: 'comparison', label: 'Comparison' },
        { value: 'awards', label: 'Awards' },
        { value: 'live_stats', label: 'Live Stats' }
      ]
    },
    { key: 'content', label: 'Content', type: 'textarea', required: true, placeholder: 'Join over 10,000 satisfied customers...' }
  ]

  const exampleData = [
    {
      label: 'Customer Count',
      icon: '👥',
      data: {
        title: 'Trusted by 10,000+ Companies Worldwide',
        widget_type: 'customer_count',
        content: 'Join over 10,000 companies across 45 countries who trust our platform to power their growth. From startups to Fortune 500 enterprises, teams of all sizes rely on us every day.'
      }
    },
    {
      label: 'Rating Badge',
      icon: '🏆',
      data: {
        title: 'Rated #1 on G2 for 3 Years Running',
        widget_type: 'rating_badge',
        content: 'With a 4.8/5 rating from over 2,000 verified reviews, we are consistently ranked as the top solution in our category. Recognized as a Leader in the G2 Grid for Enterprise Software.'
      }
    },
    {
      label: 'Live Activity',
      icon: '⚡',
      data: {
        title: 'See What Teams Are Building Right Now',
        widget_type: 'recent_activity',
        content: 'In the last 24 hours: 1,247 projects launched, 89,000 AI generations completed, 3,400 new team members onboarded. Our platform processes over 2 million requests daily with 99.99% uptime.'
      }
    }
  ]

  const filterOptions = [
    {
      key: 'widget_type',
      label: 'All Types',
      options: [
        { value: 'customer_count', label: 'Customer Count' },
        { value: 'rating_badge', label: 'Rating Badge' },
        { value: 'social_proof', label: 'Social Proof' },
        { value: 'recent_activity', label: 'Recent Activity' },
        { value: 'testimonial_carousel', label: 'Testimonial Carousel' },
        { value: 'trust_badges', label: 'Trust Badges' },
        { value: 'comparison', label: 'Comparison' },
        { value: 'awards', label: 'Awards' },
        { value: 'live_stats', label: 'Live Stats' }
      ]
    }
  ]

  const handleSubmit = async (formData, isEdit) => {
    try {
      if (isEdit) {
        await axios.put(`${API_URL}/social-widgets/${formData.id}`, formData)
        toast.success('Widget updated successfully')
      } else {
        await axios.post(`${API_URL}/social-widgets`, formData)
        toast.success('Widget created successfully')
      }
      refetch()
      setEditData(null)
    } catch (error) {
      console.error('Error saving social widget:', error)
      toast.error(error.response?.data?.error || error.response?.data?.message || 'Failed to save widget')
      throw error
    }
  }

  const handleDelete = async (id) => {
    try {
      await axios.delete(`${API_URL}/social-widgets/${id}`)
      toast.success('Widget deleted successfully')
      refetch()
      setSelectedItem(null)
    } catch (error) {
      console.error('Error deleting social widget:', error)
      toast.error(error.response?.data?.error || error.response?.data?.message || 'Failed to delete widget')
      throw error
    }
  }

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return
    try {
      await axios.delete(`${API_URL}/social-widgets/bulk`, { data: { ids: selectedIds } })
      toast.success(`${selectedIds.length} widgets deleted`)
      clearSelection()
      refetch()
    } catch (error) {
      console.error('Error bulk deleting social widgets:', error)
      toast.error(error.response?.data?.error || error.response?.data?.message || 'Failed to delete widgets')
    }
  }

  const handleExportCsv = () => {
    window.open('http://localhost:5001/api/social-widgets/export/csv', '_blank')
  }

  const handleExportPdf = () => {
    window.open('http://localhost:5001/api/social-widgets/export/pdf', '_blank')
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
      const response = await axios.post(`${API_URL}/ai/generate-widget`, {
        widget_type: formData.widget_type || '',
        title: formData.title || '',
        content: formData.content || ''
      })
      return response.data
    } catch (error) {
      console.error('Error generating social widget:', error)
      throw error
    } finally {
      setGenerating(false)
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Social Widgets</h1>
          <p className="text-slate-500 mt-1 text-sm">Manage embeddable social proof widgets</p>
        </div>
        <button
          onClick={() => setShowNewModal(true)}
          className="btn-primary"
        >
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          New Widget
        </button>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="flex-1">
          <SearchBar value={search} onChange={setSearch} placeholder="Search widgets..." />
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
        title="Social Widget Details"
        data={selectedItem}
        fields={detailFields}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />

      <NewItemModal
        isOpen={showNewModal}
        onClose={handleCloseModal}
        title="Create New Social Widget"
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

export default SocialWidgets
