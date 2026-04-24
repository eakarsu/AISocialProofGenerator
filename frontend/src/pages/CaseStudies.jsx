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

function CaseStudies() {
  const { user } = useAuth()
  const {
    data, loading, total, page, totalPages, search, sortBy, sortOrder, filters, selectedIds,
    setPage, setSearch, handleSort, handleFilterChange, toggleSelect, toggleSelectAll, clearSelection, refetch
  } = useResourceData('case-studies')
  const [selectedItem, setSelectedItem] = useState(null)
  const [showNewModal, setShowNewModal] = useState(false)
  const [editData, setEditData] = useState(null)
  const [generating, setGenerating] = useState(false)

  const columns = [
    { key: 'title', label: 'Title' },
    { key: 'company', label: 'Company' },
    { key: 'industry', label: 'Industry' },
    {
      key: 'challenge',
      label: 'Challenge',
      render: (value) => (
        <span className="text-sm text-slate-500">
          {value?.substring(0, 60)}...
        </span>
      )
    },
    {
      key: 'results',
      label: 'Results',
      render: (value) => (
        <span className="text-sm text-green-600 font-medium">
          {value?.substring(0, 40)}...
        </span>
      )
    }
  ]

  const detailFields = [
    { key: 'title', label: 'Title' },
    { key: 'company', label: 'Company' },
    { key: 'industry', label: 'Industry' },
    { key: 'challenge', label: 'Challenge' },
    { key: 'solution', label: 'Solution' },
    { key: 'results', label: 'Results' },
    {
      key: 'metrics_json',
      label: 'Key Metrics',
      render: (value) => {
        if (!value) return 'N/A'
        const metrics = typeof value === 'string' ? JSON.parse(value) : value
        return Object.entries(metrics).map(([k, v]) => `${k}: ${v}`).join(', ')
      }
    },
    { key: 'created_at', label: 'Created', render: (value) => new Date(value).toLocaleDateString() }
  ]

  const formFields = [
    { key: 'title', label: 'Title', required: true, placeholder: 'How Company X Increased Revenue by 200%' },
    { key: 'company', label: 'Company', required: true, placeholder: 'Acme Inc.' },
    { key: 'industry', label: 'Industry', placeholder: 'Technology' },
    { key: 'challenge', label: 'Challenge', type: 'textarea', required: true, placeholder: 'Describe the problem the customer faced...' },
    { key: 'solution', label: 'Solution', type: 'textarea', required: true, placeholder: 'How did your product/service solve it?' },
    { key: 'results', label: 'Results', type: 'textarea', required: true, placeholder: 'What measurable outcomes were achieved?' }
  ]

  const exampleData = [
    {
      label: 'Tech Scale-Up',
      icon: '📈',
      data: {
        title: 'How DataFlow Inc. Reduced Processing Time by 70%',
        company: 'DataFlow Inc.',
        industry: 'Technology',
        challenge: 'DataFlow was processing over 2 million transactions daily but their legacy system could not keep up. Latency issues were causing customer complaints and the engineering team spent 60% of their time on firefighting instead of building new features.',
        solution: 'We implemented our real-time data pipeline solution with auto-scaling capabilities. The migration was completed in 3 phases over 8 weeks with zero downtime. Custom monitoring dashboards were set up to track performance metrics.',
        results: 'Processing time reduced by 70%, customer complaints dropped by 85%, and the engineering team reclaimed 40 hours per week. Annual infrastructure costs decreased by $120,000.'
      }
    },
    {
      label: 'Retail Chain',
      icon: '🏪',
      data: {
        title: 'FreshMart Boosts Online Sales by 150% with AI Recommendations',
        company: 'FreshMart Grocery',
        industry: 'Retail',
        challenge: 'FreshMart had 200+ stores but their online presence was underperforming. Cart abandonment was at 72% and average order value was significantly lower than in-store purchases. They lacked personalization capabilities.',
        solution: 'Deployed our AI-powered recommendation engine across their e-commerce platform. Implemented personalized product suggestions, smart bundles, and predictive inventory management integrated with their existing POS system.',
        results: 'Online sales increased by 150% within 6 months. Cart abandonment dropped to 38%. Average order value increased by 45%. Customer retention rate improved by 32%.'
      }
    },
    {
      label: 'Financial Services',
      icon: '🏦',
      data: {
        title: 'SecureBank Cuts Fraud Detection Time from Hours to Seconds',
        company: 'SecureBank Financial',
        industry: 'Financial Services',
        challenge: 'SecureBank was losing $2.3M annually to fraudulent transactions. Their manual review process took an average of 4 hours per flagged transaction, and false positive rates were at 60%, frustrating legitimate customers.',
        solution: 'Implemented our machine learning fraud detection system that analyzes transaction patterns in real-time. The system was trained on 5 years of historical data and integrates with their existing banking infrastructure.',
        results: 'Fraud detection now happens in under 2 seconds. Annual fraud losses reduced by 89% to $253K. False positive rate dropped to 8%. Customer satisfaction scores improved by 25 points.'
      }
    }
  ]

  const filterOptions = [
    { key: 'industry', label: 'All Industries', options: [
      { value: 'Technology', label: 'Technology' },
      { value: 'Retail', label: 'Retail' },
      { value: 'Healthcare', label: 'Healthcare' },
      { value: 'Financial Services', label: 'Financial Services' },
      { value: 'Manufacturing', label: 'Manufacturing' },
      { value: 'Education', label: 'Education' },
      { value: 'Logistics', label: 'Logistics' },
      { value: 'Media', label: 'Media' }
    ]}
  ]

  const handleSubmit = async (formData, isEdit) => {
    try {
      if (isEdit) {
        await axios.put(`${API_URL}/case-studies/${formData.id}`, formData)
        toast.success('Case study updated successfully')
      } else {
        await axios.post(`${API_URL}/case-studies`, formData)
        toast.success('Case study created successfully')
      }
      refetch()
      setEditData(null)
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to save case study')
      throw error
    }
  }

  const handleDelete = async (id) => {
    try {
      await axios.delete(`${API_URL}/case-studies/${id}`)
      toast.success('Case study deleted successfully')
      refetch()
      setSelectedItem(null)
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to delete case study')
      throw error
    }
  }

  const handleBulkDelete = async () => {
    if (!window.confirm(`Delete ${selectedIds.length} case studies?`)) return
    try {
      await axios.delete(`${API_URL}/case-studies/bulk`, { data: { ids: selectedIds } })
      toast.success(`${selectedIds.length} case studies deleted`)
      clearSelection()
      refetch()
    } catch (error) {
      toast.error('Failed to delete selected items')
    }
  }

  const handleExportCsv = () => {
    window.open(`${API_URL}/case-studies/export/csv`, '_blank')
    toast.success('CSV export started')
  }

  const handleExportPdf = () => {
    window.open(`${API_URL}/case-studies/export/pdf`, '_blank')
    toast.success('PDF export started')
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
      const response = await axios.post(`${API_URL}/ai/generate-case-study`, {
        company: formData.company || '',
        industry: formData.industry || '',
        challenge: formData.challenge || '',
        solution: formData.solution || '',
        results: formData.results || ''
      })
      return response.data
    } catch (error) {
      console.error('Error generating case study:', error)
      throw error
    } finally {
      setGenerating(false)
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Case Studies</h1>
          <p className="text-slate-500 mt-1 text-sm">Manage customer success stories</p>
        </div>
        <button onClick={() => setShowNewModal(true)} className="btn-primary">
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          New Case Study
        </button>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="flex-1">
          <SearchBar value={search} onChange={setSearch} placeholder="Search case studies..." />
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
        title="Case Study Details"
        data={selectedItem}
        fields={detailFields}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />

      <NewItemModal
        isOpen={showNewModal}
        onClose={handleCloseModal}
        title="Create New Case Study"
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

export default CaseStudies
