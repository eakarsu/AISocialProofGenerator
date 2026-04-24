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

function CustomerQuotes() {
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
  } = useResourceData('customer-quotes')

  const [selectedItem, setSelectedItem] = useState(null)
  const [showNewModal, setShowNewModal] = useState(false)
  const [editData, setEditData] = useState(null)
  const [generating, setGenerating] = useState(false)

  const columns = [
    { key: 'customer_name', label: 'Customer' },
    { key: 'company', label: 'Company' },
    { key: 'use_case', label: 'Use Case' },
    {
      key: 'polished_quote',
      label: 'Quote',
      render: (value, row) => (
        <span className="text-sm text-slate-500 italic">
          "{(value || row.original_quote)?.substring(0, 60)}..."
        </span>
      )
    }
  ]

  const detailFields = [
    { key: 'customer_name', label: 'Customer Name' },
    { key: 'company', label: 'Company' },
    { key: 'use_case', label: 'Use Case' },
    { key: 'original_quote', label: 'Original Quote', render: (value) => `"${value}"` },
    { key: 'polished_quote', label: 'Polished Quote', render: (value) => value ? `"${value}"` : 'N/A' },
    { key: 'created_at', label: 'Created', render: (value) => new Date(value).toLocaleDateString() }
  ]

  const formFields = [
    { key: 'customer_name', label: 'Customer Name', required: true, placeholder: 'John Smith' },
    { key: 'company', label: 'Company', required: true, placeholder: 'Acme Corporation' },
    { key: 'use_case', label: 'Use Case', placeholder: 'Enterprise' },
    { key: 'original_quote', label: 'Original Quote', type: 'textarea', required: true, placeholder: 'This product changed how we do business...' },
    { key: 'polished_quote', label: 'AI Polished Quote', type: 'textarea', placeholder: 'Click "Generate with AI" to polish the quote' }
  ]

  const exampleData = [
    {
      label: 'Tech Executive',
      icon: '💼',
      data: {
        customer_name: 'David Morrison',
        company: 'NexGen Solutions',
        use_case: 'Enterprise SaaS',
        original_quote: 'We tried three other platforms before finding this one. Within a week of switching, our team was more productive than they had been in months. The AI capabilities are not just a gimmick, they genuinely transform how we work.'
      }
    },
    {
      label: 'Marketing Director',
      icon: '📣',
      data: {
        customer_name: 'Lisa Nakamura',
        company: 'BrightPath Marketing',
        use_case: 'Content Marketing',
        original_quote: 'This tool has completely changed our content strategy. We went from publishing 4 blog posts a month to 20, all while maintaining quality. Our organic traffic tripled in just 3 months.'
      }
    },
    {
      label: 'Small Business',
      icon: '🏠',
      data: {
        customer_name: 'Carlos Rivera',
        company: 'Rivera Design Studio',
        use_case: 'Small Business',
        original_quote: 'As a small business owner, every minute and dollar counts. This platform pays for itself ten times over each month. Its like having an extra team member who never sleeps and always delivers quality work.'
      }
    }
  ]

  const filterOptions = [
    { key: 'use_case', label: 'All Use Cases', options: [
      { value: 'Enterprise', label: 'Enterprise' }, { value: 'Startup', label: 'Startup' },
      { value: 'Marketing', label: 'Marketing' }, { value: 'Technology', label: 'Technology' },
      { value: 'Analytics', label: 'Analytics' }, { value: 'Creative', label: 'Creative' },
      { value: 'Finance', label: 'Finance' }, { value: 'Healthcare', label: 'Healthcare' },
      { value: 'Retail', label: 'Retail' }, { value: 'Education', label: 'Education' }
    ]}
  ]

  const handleSubmit = async (formData, isEdit) => {
    try {
      if (isEdit) {
        await axios.put(`${API_URL}/customer-quotes/${formData.id}`, formData)
        toast.success('Customer quote updated successfully')
      } else {
        await axios.post(`${API_URL}/customer-quotes`, formData)
        toast.success('Customer quote created successfully')
      }
      refetch()
      setEditData(null)
    } catch (error) {
      console.error('Error saving customer quote:', error)
      toast.error(error.response?.data?.error || error.response?.data?.message || 'Failed to save customer quote')
      throw error
    }
  }

  const handleDelete = async (id) => {
    try {
      await axios.delete(`${API_URL}/customer-quotes/${id}`)
      toast.success('Customer quote deleted successfully')
      refetch()
      setSelectedItem(null)
    } catch (error) {
      console.error('Error deleting customer quote:', error)
      toast.error(error.response?.data?.error || error.response?.data?.message || 'Failed to delete customer quote')
      throw error
    }
  }

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return
    if (!confirm(`Are you sure you want to delete ${selectedIds.length} customer quote${selectedIds.length > 1 ? 's' : ''}?`)) return
    try {
      await axios.delete(`${API_URL}/customer-quotes/bulk`, { data: { ids: selectedIds } })
      toast.success(`${selectedIds.length} customer quote${selectedIds.length > 1 ? 's' : ''} deleted`)
      clearSelection()
      refetch()
    } catch (error) {
      console.error('Error bulk deleting customer quotes:', error)
      toast.error(error.response?.data?.error || error.response?.data?.message || 'Failed to delete customer quotes')
    }
  }

  const handleExportCsv = () => {
    window.open(`${API_URL}/customer-quotes/export/csv`, '_blank')
  }

  const handleExportPdf = () => {
    window.open(`${API_URL}/customer-quotes/export/pdf`, '_blank')
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
      const response = await axios.post(`${API_URL}/ai/polish-quote`, {
        original_quote: formData.original_quote || '',
        customer_name: formData.customer_name || '',
        company: formData.company || '',
        use_case: formData.use_case || ''
      })
      return response.data
    } catch (error) {
      console.error('Error polishing quote:', error)
      throw error
    } finally {
      setGenerating(false)
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Customer Quotes</h1>
          <p className="text-slate-500 mt-1 text-sm">Manage short, impactful customer quotes</p>
        </div>
        <button
          onClick={() => setShowNewModal(true)}
          className="btn-primary"
        >
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          New Quote
        </button>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="flex-1">
          <SearchBar value={search} onChange={setSearch} placeholder="Search customer quotes..." />
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
        title="Customer Quote Details"
        data={selectedItem}
        fields={detailFields}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />

      <NewItemModal
        isOpen={showNewModal}
        onClose={handleCloseModal}
        title="Create New Customer Quote"
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

export default CustomerQuotes
