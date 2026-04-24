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

function Reviews() {
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
    refetch,
  } = useResourceData('reviews')

  const [selectedItem, setSelectedItem] = useState(null)
  const [showNewModal, setShowNewModal] = useState(false)
  const [editData, setEditData] = useState(null)
  const [generating, setGenerating] = useState(false)

  const filterOptions = [
    { key: 'rating', label: 'All Ratings', options: [
      { value: '5', label: '5 Stars' }, { value: '4', label: '4 Stars' },
      { value: '3', label: '3 Stars' }, { value: '2', label: '2 Stars' }, { value: '1', label: '1 Star' }
    ]},
    { key: 'sentiment', label: 'All Sentiments', options: [
      { value: 'positive', label: 'Positive' }, { value: 'neutral', label: 'Neutral' }, { value: 'negative', label: 'Negative' }
    ]}
  ]

  const columns = [
    { key: 'source', label: 'Source' },
    { key: 'customer_name', label: 'Customer' },
    {
      key: 'original_review',
      label: 'Review',
      render: (value) => (
        <span className="text-sm text-slate-500">
          {value?.substring(0, 60)}...
        </span>
      )
    },
    {
      key: 'rating',
      label: 'Rating',
      render: (value) => (
        <div className="flex items-center">
          {[...Array(5)].map((_, i) => (
            <svg
              key={i}
              className={`w-4 h-4 ${i < value ? 'text-yellow-400' : 'text-slate-200'}`}
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
          ))}
        </div>
      )
    },
    {
      key: 'sentiment',
      label: 'Sentiment',
      render: (value) => (
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
          value === 'positive' ? 'bg-green-100 text-green-800' :
          value === 'negative' ? 'bg-red-100 text-red-800' :
          'bg-slate-100 text-slate-600'
        }`}>
          {value || 'N/A'}
        </span>
      )
    }
  ]

  const detailFields = [
    { key: 'source', label: 'Source' },
    { key: 'customer_name', label: 'Customer Name' },
    { key: 'original_review', label: 'Original Review' },
    { key: 'ai_summary', label: 'AI Summary' },
    { key: 'rating', label: 'Rating', render: (value) => `${value}/5 stars` },
    { key: 'sentiment', label: 'Sentiment' },
    { key: 'created_at', label: 'Created', render: (value) => new Date(value).toLocaleDateString() }
  ]

  const formFields = [
    {
      key: 'source',
      label: 'Source',
      type: 'select',
      required: true,
      options: [
        { value: 'G2', label: 'G2' },
        { value: 'Capterra', label: 'Capterra' },
        { value: 'TrustPilot', label: 'TrustPilot' },
        { value: 'Google', label: 'Google' },
        { value: 'Other', label: 'Other' }
      ]
    },
    { key: 'customer_name', label: 'Customer Name', required: true, placeholder: 'Jane Smith' },
    { key: 'original_review', label: 'Review Content', type: 'textarea', required: true, placeholder: 'Share the review...' },
    {
      key: 'rating',
      label: 'Rating',
      type: 'select',
      required: true,
      options: [
        { value: '5', label: '5 Stars - Excellent' },
        { value: '4', label: '4 Stars - Good' },
        { value: '3', label: '3 Stars - Average' },
        { value: '2', label: '2 Stars - Poor' },
        { value: '1', label: '1 Star - Terrible' }
      ]
    },
    {
      key: 'sentiment',
      label: 'Sentiment',
      type: 'select',
      options: [
        { value: 'positive', label: 'Positive' },
        { value: 'neutral', label: 'Neutral' },
        { value: 'negative', label: 'Negative' }
      ]
    },
    { key: 'ai_summary', label: 'AI Summary', type: 'textarea', placeholder: 'Click "Generate with AI" to summarize the review' }
  ]

  const exampleData = [
    {
      label: 'G2 Review',
      icon: '⭐',
      data: {
        source: 'G2',
        customer_name: 'Alex Thompson',
        original_review: 'Been using this product for about a year now and its become essential to our workflow. The AI features are genuinely useful, not just marketing fluff. The interface could use some polish in a few areas, but the core functionality is excellent. Their customer support has been top-notch every time I have reached out. Would strongly recommend for mid-size teams.',
        rating: '5',
        sentiment: 'positive'
      }
    },
    {
      label: 'Capterra Review',
      icon: '💬',
      data: {
        source: 'Capterra',
        customer_name: 'Jennifer Walsh',
        original_review: 'Solid platform with good features for the price. Setup was straightforward and the documentation is comprehensive. We use it daily for content management and the AI suggestions have saved us hours each week. The reporting could be more detailed but overall very satisfied with our purchase.',
        rating: '4',
        sentiment: 'positive'
      }
    },
    {
      label: 'TrustPilot Review',
      icon: '🌟',
      data: {
        source: 'TrustPilot',
        customer_name: 'Robert Kim',
        original_review: 'We evaluated several options before choosing this platform. What sold us was the combination of ease of use and powerful AI capabilities. Onboarding our team of 15 took less than a day. The ROI became apparent within the first month. Integration with our existing tools was seamless.',
        rating: '5',
        sentiment: 'positive'
      }
    }
  ]

  const handleSubmit = async (formData, isEdit) => {
    try {
      const submitData = {
        ...formData,
        rating: parseInt(formData.rating)
      }
      if (isEdit) {
        await axios.put(`${API_URL}/reviews/${formData.id}`, submitData)
        toast.success('Review updated successfully')
      } else {
        await axios.post(`${API_URL}/reviews`, submitData)
        toast.success('Review created successfully')
      }
      refetch()
      setEditData(null)
    } catch (error) {
      console.error('Error saving review:', error)
      toast.error('Failed to save review')
      throw error
    }
  }

  const handleDelete = async (id) => {
    try {
      await axios.delete(`${API_URL}/reviews/${id}`)
      toast.success('Review deleted successfully')
      refetch()
      setSelectedItem(null)
    } catch (error) {
      console.error('Error deleting review:', error)
      toast.error('Failed to delete review')
      throw error
    }
  }

  const handleBulkDelete = async () => {
    try {
      await axios.delete(`${API_URL}/reviews/bulk`, { data: { ids: selectedIds } })
      toast.success(`${selectedIds.length} reviews deleted successfully`)
      clearSelection()
      refetch()
    } catch (error) {
      console.error('Error bulk deleting reviews:', error)
      toast.error('Failed to delete selected reviews')
    }
  }

  const handleExportCsv = () => {
    window.open(`${API_URL}/reviews/export/csv`, '_blank')
  }

  const handleExportPdf = () => {
    window.open(`${API_URL}/reviews/export/pdf`, '_blank')
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
      const response = await axios.post(`${API_URL}/ai/summarize-reviews`, {
        original_review: formData.original_review || '',
        source: formData.source || '',
        customer_name: formData.customer_name || ''
      })
      return response.data
    } catch (error) {
      console.error('Error generating review summary:', error)
      throw error
    } finally {
      setGenerating(false)
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Reviews</h1>
          <p className="text-slate-500 mt-1 text-sm">Manage product and service reviews</p>
        </div>
        <button
          onClick={() => setShowNewModal(true)}
          className="btn-primary"
        >
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          New Review
        </button>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="flex-1">
          <SearchBar value={search} onChange={setSearch} placeholder="Search reviews..." />
        </div>
        <FilterControls filters={filterOptions} values={filters} onChange={handleFilterChange} />
      </div>

      <div className="flex items-center justify-between mb-4">
        <BulkActions selectedCount={selectedIds.length} onBulkDelete={handleBulkDelete} onExportCsv={handleExportCsv} onExportPdf={handleExportPdf} userRole={user?.role} />
        <p className="text-sm text-slate-500">{total} total items</p>
      </div>

      <DataTable
        columns={columns}
        data={data}
        loading={loading}
        onRowClick={setSelectedItem}
        selectable
        selectedIds={selectedIds}
        onToggleSelect={toggleSelect}
        onToggleSelectAll={toggleSelectAll}
        sortBy={sortBy}
        sortOrder={sortOrder}
        onSort={handleSort}
      />

      <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />

      <DetailModal
        isOpen={!!selectedItem}
        onClose={() => setSelectedItem(null)}
        title="Review Details"
        data={selectedItem}
        fields={detailFields}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />

      <NewItemModal
        isOpen={showNewModal}
        onClose={handleCloseModal}
        title="Create New Review"
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

export default Reviews
