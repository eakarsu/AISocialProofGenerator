import { useState } from 'react'
import axios from 'axios'
import toast from 'react-hot-toast'
import { useResourceData } from '../hooks/useResourceData'
import { useAuth } from '../context/AuthContext'
import DataTable from '../components/DataTable'
import DetailModal from '../components/DetailModal'
import NewItemModal from '../components/NewItemModal'
import SearchBar from '../components/SearchBar'
import Pagination from '../components/Pagination'
import FilterControls from '../components/FilterControls'
import BulkActions from '../components/BulkActions'

const API_URL = 'http://localhost:5001/api'

function Testimonials() {
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
  } = useResourceData('testimonials')

  const [selectedItem, setSelectedItem] = useState(null)
  const [showNewModal, setShowNewModal] = useState(false)
  const [editData, setEditData] = useState(null)
  const [generating, setGenerating] = useState(false)

  const columns = [
    { key: 'customer_name', label: 'Customer Name' },
    { key: 'company', label: 'Company' },
    { key: 'role', label: 'Role' },
    {
      key: 'ai_enhanced_text',
      label: 'Testimonial',
      render: (value, row) => (
        <span className="text-sm text-slate-500">
          {(value || row.original_text)?.substring(0, 80)}...
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
    }
  ]

  const detailFields = [
    { key: 'customer_name', label: 'Customer Name' },
    { key: 'company', label: 'Company' },
    { key: 'role', label: 'Role' },
    { key: 'original_text', label: 'Original Testimonial' },
    { key: 'ai_enhanced_text', label: 'AI Enhanced Version' },
    {
      key: 'rating',
      label: 'Rating',
      render: (value) => `${value}/5 stars`
    },
    { key: 'created_at', label: 'Created', render: (value) => new Date(value).toLocaleDateString() }
  ]

  const formFields = [
    { key: 'customer_name', label: 'Customer Name', required: true, placeholder: 'John Doe' },
    { key: 'company', label: 'Company', required: true, placeholder: 'Acme Inc.' },
    { key: 'role', label: 'Role', placeholder: 'CEO' },
    { key: 'original_text', label: 'Original Testimonial', type: 'textarea', required: true, placeholder: 'Enter the raw customer feedback...' },
    { key: 'ai_enhanced_text', label: 'AI Enhanced Version', type: 'textarea', placeholder: 'Click "Generate with AI" to enhance the testimonial' },
    {
      key: 'rating',
      label: 'Rating',
      type: 'select',
      options: [
        { value: '5', label: '5 Stars' },
        { value: '4', label: '4 Stars' },
        { value: '3', label: '3 Stars' },
        { value: '2', label: '2 Stars' },
        { value: '1', label: '1 Star' }
      ]
    }
  ]

  const exampleData = [
    {
      label: 'SaaS Startup',
      icon: '🚀',
      data: {
        customer_name: 'Sarah Mitchell',
        company: 'CloudSync Technologies',
        role: 'VP of Engineering',
        original_text: 'We switched to this platform six months ago and the results have been incredible. Our deployment time dropped from hours to minutes and our team productivity went up by at least 40 percent. The support team is super responsive too.',
        rating: '5'
      }
    },
    {
      label: 'E-commerce',
      icon: '🛒',
      data: {
        customer_name: 'Marcus Chen',
        company: 'Urban Threads Apparel',
        role: 'Founder & CEO',
        original_text: 'Since integrating this tool into our workflow, our conversion rates have improved by 28%. The AI features saved us countless hours of manual work. I wish we had found this sooner.',
        rating: '5'
      }
    },
    {
      label: 'Healthcare',
      icon: '🏥',
      data: {
        customer_name: 'Dr. Emily Park',
        company: 'Meridian Health Group',
        role: 'Chief Digital Officer',
        original_text: 'Patient engagement improved dramatically after we started using the platform. The analytics dashboard gives us insights we never had before. Its been a game changer for our practice.',
        rating: '4'
      }
    }
  ]

  const filterOptions = [
    {
      key: 'rating',
      label: 'All Ratings',
      options: [
        { value: '5', label: '5 Stars' },
        { value: '4', label: '4 Stars' },
        { value: '3', label: '3 Stars' },
        { value: '2', label: '2 Stars' },
        { value: '1', label: '1 Star' }
      ]
    }
  ]

  const handleSubmit = async (formData, isEdit) => {
    try {
      if (isEdit) {
        await axios.put(`${API_URL}/testimonials/${formData.id}`, formData)
        toast.success('Testimonial updated successfully')
      } else {
        await axios.post(`${API_URL}/testimonials`, formData)
        toast.success('Testimonial created successfully')
      }
      refetch()
      setEditData(null)
    } catch (error) {
      console.error('Error saving testimonial:', error)
      toast.error(error.response?.data?.error || error.response?.data?.message || 'Failed to save testimonial')
      throw error
    }
  }

  const handleDelete = async (id) => {
    try {
      await axios.delete(`${API_URL}/testimonials/${id}`)
      toast.success('Testimonial deleted successfully')
      refetch()
      setSelectedItem(null)
    } catch (error) {
      console.error('Error deleting testimonial:', error)
      toast.error(error.response?.data?.error || error.response?.data?.message || 'Failed to delete testimonial')
      throw error
    }
  }

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return
    try {
      await axios.delete(`${API_URL}/testimonials/bulk`, { data: { ids: selectedIds } })
      toast.success(`${selectedIds.length} testimonials deleted`)
      clearSelection()
      refetch()
    } catch (error) {
      console.error('Error bulk deleting testimonials:', error)
      toast.error(error.response?.data?.error || error.response?.data?.message || 'Failed to delete testimonials')
    }
  }

  const handleExportCsv = () => {
    window.open('http://localhost:5001/api/testimonials/export/csv', '_blank')
  }

  const handleExportPdf = () => {
    window.open('http://localhost:5001/api/testimonials/export/pdf', '_blank')
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
      const response = await axios.post(`${API_URL}/ai/generate-testimonial`, {
        original_text: formData.original_text || '',
        customer_name: formData.customer_name || '',
        company: formData.company || '',
        role: formData.role || ''
      })
      return response.data
    } catch (error) {
      console.error('Error generating testimonial:', error)
      throw error
    } finally {
      setGenerating(false)
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Testimonials</h1>
          <p className="text-slate-500 mt-1 text-sm">Manage customer testimonials</p>
        </div>
        <button
          onClick={() => setShowNewModal(true)}
          className="btn-primary"
        >
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          New Testimonial
        </button>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="flex-1">
          <SearchBar value={search} onChange={setSearch} placeholder="Search testimonials..." />
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
        title="Testimonial Details"
        data={selectedItem}
        fields={detailFields}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />

      <NewItemModal
        isOpen={showNewModal}
        onClose={handleCloseModal}
        title="Create New Testimonial"
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

export default Testimonials
