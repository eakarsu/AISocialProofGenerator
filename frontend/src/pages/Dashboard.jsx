import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import axios from 'axios'
import { useAuth } from '../context/AuthContext'
import FeatureCard from '../components/FeatureCard'

const API_URL = 'http://localhost:5001/api'

function Dashboard() {
  const { user } = useAuth()
  const [counts, setCounts] = useState({
    testimonials: 0,
    caseStudies: 0,
    reviews: 0,
    socialWidgets: 0,
    successMetrics: 0,
    customerQuotes: 0,
    videoTestimonials: 0
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchCounts()
  }, [])

  const fetchCounts = async () => {
    try {
      const [
        testimonials,
        caseStudies,
        reviews,
        socialWidgets,
        successMetrics,
        customerQuotes,
        videoTestimonials
      ] = await Promise.all([
        axios.get(`${API_URL}/testimonials?limit=1`).catch(() => ({ data: { total: 0 } })),
        axios.get(`${API_URL}/case-studies?limit=1`).catch(() => ({ data: { total: 0 } })),
        axios.get(`${API_URL}/reviews?limit=1`).catch(() => ({ data: { total: 0 } })),
        axios.get(`${API_URL}/social-widgets?limit=1`).catch(() => ({ data: { total: 0 } })),
        axios.get(`${API_URL}/success-metrics?limit=1`).catch(() => ({ data: { total: 0 } })),
        axios.get(`${API_URL}/customer-quotes?limit=1`).catch(() => ({ data: { total: 0 } })),
        axios.get(`${API_URL}/video-testimonials?limit=1`).catch(() => ({ data: { total: 0 } }))
      ])

      setCounts({
        testimonials: testimonials.data.total || 0,
        caseStudies: caseStudies.data.total || 0,
        reviews: reviews.data.total || 0,
        socialWidgets: socialWidgets.data.total || 0,
        successMetrics: successMetrics.data.total || 0,
        customerQuotes: customerQuotes.data.total || 0,
        videoTestimonials: videoTestimonials.data.total || 0
      })
    } catch (error) {
      console.error('Error fetching counts:', error)
    } finally {
      setLoading(false)
    }
  }

  const totalItems = Object.values(counts).reduce((a, b) => a + b, 0)

  const features = [
    { title: 'Testimonials', description: 'Customer testimonials that build trust and credibility.', count: counts.testimonials, path: '/testimonials', color: 'indigo', icon: (<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" /></svg>) },
    { title: 'Case Studies', description: 'In-depth success stories demonstrating real results.', count: counts.caseStudies, path: '/case-studies', color: 'violet', icon: (<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>) },
    { title: 'Reviews', description: 'Product reviews that help prospects decide.', count: counts.reviews, path: '/reviews', color: 'amber', icon: (<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" /></svg>) },
    { title: 'Social Widgets', description: 'Embeddable social proof widgets for your site.', count: counts.socialWidgets, path: '/social-widgets', color: 'emerald', icon: (<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" /></svg>) },
    { title: 'Success Metrics', description: 'Key numbers that prove your value proposition.', count: counts.successMetrics, path: '/success-metrics', color: 'sky', icon: (<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>) },
    { title: 'Customer Quotes', description: 'Short, impactful quotes from satisfied customers.', count: counts.customerQuotes, path: '/customer-quotes', color: 'rose', icon: (<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" /></svg>) },
    { title: 'Video Testimonials', description: 'AI-powered video testimonial editing and enhancement.', count: counts.videoTestimonials, path: '/video-testimonials', color: 'fuchsia', icon: (<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>) }
  ]

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="flex flex-col items-center space-y-3">
          <div className="w-10 h-10 border-[3px] border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
          <p className="text-sm text-slate-400 font-medium">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 p-8 lg:p-10">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wMyI+PGNpcmNsZSBjeD0iMzAiIGN5PSIzMCIgcj0iMiIvPjwvZz48L2c+PC9zdmc+')] opacity-60"></div>
        <div className="absolute top-0 right-0 w-72 h-72 bg-indigo-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4"></div>
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-violet-500/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/4"></div>
        <div className="relative">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div>
              <h1 className="text-2xl lg:text-3xl font-bold text-white">
                Welcome back{user?.name ? `, ${user.name}` : user?.email ? `, ${user.email.split('@')[0]}` : ''}
              </h1>
              <p className="text-indigo-200/80 mt-2 text-[15px] max-w-lg">
                Manage and generate AI-powered social proof content. Your content library is growing!
              </p>
            </div>
            <div className="flex items-center gap-6">
              <div className="text-center">
                <p className="text-3xl font-bold text-white">{totalItems}</p>
                <p className="text-indigo-300/70 text-xs font-medium mt-0.5">Total Items</p>
              </div>
              <div className="w-px h-10 bg-white/10"></div>
              <div className="text-center">
                <p className="text-3xl font-bold text-white">7</p>
                <p className="text-indigo-300/70 text-xs font-medium mt-0.5">Categories</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
        {features.map((feature) => (
          <Link key={feature.path} to={feature.path} className="card !p-4 text-center hover:shadow-soft hover:-translate-y-0.5 transition-all duration-200 cursor-pointer">
            <p className="text-2xl font-bold text-slate-800">{feature.count}</p>
            <p className="text-[11px] text-slate-500 font-medium mt-1 truncate">{feature.title}</p>
          </Link>
        ))}
      </div>

      <div>
        <h2 className="text-lg font-semibold text-slate-800 mb-4">Content Types</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {features.map((feature) => (
            <FeatureCard
              key={feature.path}
              title={feature.title}
              description={feature.description}
              count={feature.count}
              path={feature.path}
              icon={feature.icon}
              color={feature.color}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

export default Dashboard
