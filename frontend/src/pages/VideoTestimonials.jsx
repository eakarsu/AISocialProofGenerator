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

function VideoTestimonials() {
  const { user } = useAuth()
  const {
    data, loading, total, page, totalPages, search, sortBy, sortOrder, filters, selectedIds,
    setPage, setSearch, handleSort, handleFilterChange, toggleSelect, toggleSelectAll, clearSelection, refetch
  } = useResourceData('video-testimonials')
  const [selectedItem, setSelectedItem] = useState(null)
  const [showNewModal, setShowNewModal] = useState(false)
  const [editData, setEditData] = useState(null)
  const [generating, setGenerating] = useState(false)

  const columns = [
    { key: 'customer_name', label: 'Customer' },
    { key: 'company', label: 'Company' },
    { key: 'role', label: 'Role' },
    {
      key: 'duration',
      label: 'Duration',
      render: (value) => (
        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
          {value || 'N/A'}
        </span>
      )
    },
    {
      key: 'ai_summary',
      label: 'Summary',
      render: (value) => (
        <span className="text-sm text-slate-500">
          {value?.substring(0, 60)}...
        </span>
      )
    },
    {
      key: 'status',
      label: 'Status',
      render: (value) => (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
          value === 'published' ? 'bg-green-100 text-green-800' :
          value === 'ready' ? 'bg-blue-100 text-blue-800' :
          'bg-yellow-100 text-yellow-800'
        }`}>
          {value || 'draft'}
        </span>
      )
    }
  ]

  const detailFields = [
    { key: 'customer_name', label: 'Customer Name' },
    { key: 'company', label: 'Company' },
    { key: 'role', label: 'Role' },
    {
      key: 'video_url',
      label: 'Video URL',
      render: (value) => value ? (
        <a href={value} target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:text-indigo-800 underline">
          {value}
        </a>
      ) : '-'
    },
    { key: 'duration', label: 'Duration' },
    { key: 'original_transcript', label: 'Original Transcript' },
    { key: 'ai_edited_transcript', label: 'AI Edited Transcript' },
    { key: 'ai_highlights', label: 'Key Highlights' },
    { key: 'ai_summary', label: 'AI Summary' },
    { key: 'tags', label: 'Tags' },
    {
      key: 'rating',
      label: 'Rating',
      render: (value) => `${value}/5 stars`
    },
    {
      key: 'status',
      label: 'Status',
      render: (value) => (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
          value === 'published' ? 'bg-green-100 text-green-800' :
          value === 'ready' ? 'bg-blue-100 text-blue-800' :
          'bg-yellow-100 text-yellow-800'
        }`}>
          {value || 'draft'}
        </span>
      )
    },
    { key: 'created_at', label: 'Created', render: (value) => new Date(value).toLocaleDateString() }
  ]

  const formFields = [
    { key: 'customer_name', label: 'Customer Name', required: true, placeholder: 'John Doe' },
    { key: 'company', label: 'Company', required: true, placeholder: 'Acme Inc.' },
    { key: 'role', label: 'Role', placeholder: 'CEO' },
    { key: 'video_url', label: 'Video URL', placeholder: 'https://videos.example.com/testimonial.mp4' },
    { key: 'thumbnail_url', label: 'Thumbnail URL', placeholder: 'https://images.example.com/thumb.jpg' },
    { key: 'duration', label: 'Duration', placeholder: '2:34' },
    { key: 'original_transcript', label: 'Original Transcript', type: 'textarea', placeholder: 'Enter the raw video transcript...' },
    { key: 'ai_edited_transcript', label: 'AI Edited Transcript', type: 'textarea', placeholder: 'Click "Generate with AI" to process the transcript' },
    { key: 'ai_highlights', label: 'Key Highlights', type: 'textarea', placeholder: 'Key quotes and highlights (comma-separated)' },
    { key: 'ai_summary', label: 'AI Summary', type: 'textarea', placeholder: 'Brief summary of the video testimonial' },
    { key: 'tags', label: 'Tags', placeholder: 'enterprise, productivity, technology' },
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
    },
    {
      key: 'status',
      label: 'Status',
      type: 'select',
      options: [
        { value: 'draft', label: 'Draft' },
        { value: 'ready', label: 'Ready' },
        { value: 'published', label: 'Published' }
      ]
    }
  ]

  const exampleData = [
    {
      label: 'CEO Interview',
      icon: '🎬',
      data: {
        customer_name: 'Amanda Foster',
        company: 'Pinnacle Software',
        role: 'CEO',
        video_url: 'https://videos.example.com/pinnacle-testimonial.mp4',
        thumbnail_url: 'https://images.example.com/pinnacle-thumb.jpg',
        duration: '3:42',
        original_transcript: 'When we first started looking at solutions for our growing team, we knew we needed something that could scale with us. We tried a few options but nothing really clicked until we found this platform. Within the first month, our team adoption rate was over 90 percent, which is unheard of for us. The AI features have been particularly impressive. What used to take our content team an entire day now gets done in about two hours. And the quality is actually better. I think the biggest surprise was how much it improved cross-team collaboration. Departments that rarely worked together are now sharing insights daily.',
        tags: 'enterprise, scaling, AI, collaboration',
        rating: '5',
        status: 'draft'
      }
    },
    {
      label: 'Product Manager',
      icon: '🎥',
      data: {
        customer_name: 'James Liu',
        company: 'RapidDeploy',
        role: 'Head of Product',
        video_url: 'https://videos.example.com/rapiddeploy-review.mp4',
        thumbnail_url: 'https://images.example.com/rapiddeploy-thumb.jpg',
        duration: '2:18',
        original_transcript: 'As a product manager, I need tools that help me move fast without breaking things. This platform does exactly that. We integrated it into our sprint workflow and immediately saw improvements. Our release cycle went from every two weeks to continuous deployment. The automated testing features caught bugs that our manual QA process was missing. I estimate its saved us about 15 engineering hours per sprint, which we can now invest in building new features instead of fixing old ones.',
        tags: 'product management, CI/CD, automation, testing',
        rating: '5',
        status: 'ready'
      }
    },
    {
      label: 'Customer Success',
      icon: '📹',
      data: {
        customer_name: 'Priya Sharma',
        company: 'GrowthLab Analytics',
        role: 'Director of Customer Success',
        video_url: 'https://videos.example.com/growthlab-story.mp4',
        thumbnail_url: 'https://images.example.com/growthlab-thumb.jpg',
        duration: '4:15',
        original_transcript: 'Our churn rate was our biggest problem last year. Customers would sign up, use the product for a month, and then leave because they could not figure out the advanced features. After we implemented this platform, we built an onboarding flow that reduced our time to first value from 14 days to 3 days. Customer retention improved by 40 percent in just one quarter. But the real game changer was the AI-powered health scoring. We can now predict which accounts are at risk weeks before they would have churned, giving our team time to intervene. Its completely transformed how we approach customer success.',
        tags: 'customer success, retention, onboarding, health scoring',
        rating: '5',
        status: 'published'
      }
    }
  ]

  const filterOptions = [
    { key: 'status', label: 'All Statuses', options: [
      { value: 'draft', label: 'Draft' }, { value: 'ready', label: 'Ready' }, { value: 'published', label: 'Published' }
    ]},
    { key: 'rating', label: 'All Ratings', options: [
      { value: '5', label: '5 Stars' }, { value: '4', label: '4 Stars' },
      { value: '3', label: '3 Stars' }, { value: '2', label: '2 Stars' }, { value: '1', label: '1 Star' }
    ]}
  ]

  const handleSubmit = async (formData, isEdit) => {
    try {
      if (isEdit) {
        await axios.put(`${API_URL}/video-testimonials/${formData.id}`, formData)
        toast.success('Video testimonial updated successfully')
      } else {
        await axios.post(`${API_URL}/video-testimonials`, formData)
        toast.success('Video testimonial created successfully')
      }
      refetch()
      setEditData(null)
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to save video testimonial')
      throw error
    }
  }

  const handleDelete = async (id) => {
    try {
      await axios.delete(`${API_URL}/video-testimonials/${id}`)
      toast.success('Video testimonial deleted successfully')
      refetch()
      setSelectedItem(null)
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to delete video testimonial')
      throw error
    }
  }

  const handleBulkDelete = async () => {
    if (!window.confirm(`Delete ${selectedIds.length} video testimonials?`)) return
    try {
      await axios.delete(`${API_URL}/video-testimonials/bulk`, { data: { ids: selectedIds } })
      toast.success(`${selectedIds.length} video testimonials deleted`)
      clearSelection()
      refetch()
    } catch (error) {
      toast.error('Failed to delete selected items')
    }
  }

  const handleExportCsv = () => {
    window.open(`${API_URL}/video-testimonials/export/csv`, '_blank')
    toast.success('CSV export started')
  }

  const handleExportPdf = () => {
    window.open(`${API_URL}/video-testimonials/export/pdf`, '_blank')
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
      const response = await axios.post(`${API_URL}/ai/edit-video-testimonial`, {
        original_transcript: formData.original_transcript || '',
        customer_name: formData.customer_name || '',
        company: formData.company || '',
        role: formData.role || '',
        video_url: formData.video_url || '',
        duration: formData.duration || ''
      })
      return response.data
    } catch (error) {
      console.error('Error generating video testimonial:', error)
      throw error
    } finally {
      setGenerating(false)
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Video Testimonials</h1>
          <p className="text-slate-500 mt-1 text-sm">Manage and edit video testimonials with AI</p>
        </div>
        <button onClick={() => setShowNewModal(true)} className="btn-primary">
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          New Video Testimonial
        </button>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="flex-1">
          <SearchBar value={search} onChange={setSearch} placeholder="Search video testimonials..." />
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
        title="Video Testimonial Details"
        data={selectedItem}
        fields={detailFields}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />

      <NewItemModal
        isOpen={showNewModal}
        onClose={handleCloseModal}
        title="Create New Video Testimonial"
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

export default VideoTestimonials
