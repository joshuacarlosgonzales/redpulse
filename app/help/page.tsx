// app/help/page.tsx
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  HelpCircle,
  Search,
  MessageSquare,
  Mail,
  Phone,
  Clock,
  ChevronDown,
  ChevronRight,
  BookOpen,
  Video,
  FileText,
  AlertCircle,
  CheckCircle,
  ArrowLeft,
  Heart,
  Calendar,
  Syringe,
  Shield,
  User,
  Bell,
  Settings,
  Globe,
  Smartphone,
  Download,
  Printer,
  Send,
  LifeBuoy,
  Award,
  Users,
  Database,
  Lock,
  Server,
  Zap,
  TrendingUp,
  Star,
  ThumbsUp,
  ExternalLink,
  Copy,
  Check,
  MessageCircle,
} from 'lucide-react';

export default function HelpPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedFaq, setExpandedFaq] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [activeCategory, setActiveCategory] = useState('all');
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Get user role from localStorage
    try {
      const userStr = localStorage.getItem('user');
      if (userStr) {
        const user = JSON.parse(userStr);
        setUserRole(user.role || 'donor');
      }
    } catch (error) {
      console.error('Error getting user data:', error);
    }
    setIsLoading(false);
  }, []);

  const getDashboardPath = () => {
    if (userRole === 'admin') return '/admin/dashboard';
    if (userRole === 'hospital') return '/hospital/dashboard';
    if (userRole === 'donor') return '/donors/dashboard';
    return '/dashboard';
  };

  const handleGoBack = () => {
    const dashboardPath = getDashboardPath();
    router.push(dashboardPath);
  };

  const toggleFaq = (id: string) => {
    setExpandedFaq(expandedFaq === id ? null : id);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const categories = [
    { id: 'all', label: 'All', icon: HelpCircle },
    { id: 'getting-started', label: 'Getting Started', icon: BookOpen },
    { id: 'donating', label: 'Donating Blood', icon: Syringe },
    { id: 'account', label: 'Account & Profile', icon: User },
    { id: 'drives', label: 'Blood Drives', icon: Calendar },
    { id: 'security', label: 'Security & Privacy', icon: Shield },
  ];

  const faqs = [
    {
      id: '1',
      category: 'getting-started',
      question: 'How do I create a donor account?',
      answer: `To create a donor account:
        1. Visit the RedPulse website and click "Sign Up"
        2. Select "Donor" as your account type
        3. Fill in your personal information including full name, email, and password
        4. Complete your profile with medical information and blood type
        5. Verify your email address
        6. Wait for account approval from our team`,
    },
    {
      id: '2',
      category: 'getting-started',
      question: 'What are the eligibility requirements for blood donation?',
      answer: `To donate blood, you must:
        • Be at least 18 years old (16-17 with parental consent)
        • Weigh at least 50 kg (110 lbs)
        • Be in good general health
        • Not have had a tattoo or piercing in the last 12 months
        • Not have donated blood in the last 3 months
        • Have normal blood pressure and hemoglobin levels
        • Not be taking certain medications`,
    },
    {
      id: '3',
      category: 'donating',
      question: 'How often can I donate blood?',
      answer: `You can donate whole blood every 90 days (3 months). For plasma and platelets, you can donate more frequently:
        • Plasma: Every 2 weeks (14 days)
        • Platelets: Every 3 days (up to 24 times per year)
        Always check your eligibility status in your donor dashboard.`,
    },
    {
      id: '4',
      category: 'donating',
      question: 'What should I do before donating blood?',
      answer: `Before your donation:
        • Eat a healthy meal 2-3 hours before
        • Stay hydrated - drink extra water
        • Get a good night's sleep
        • Avoid alcohol 24 hours before
        • Bring your ID and donor card
        • Wear comfortable clothing with sleeves that can be rolled up
        • Avoid fatty foods before donation`,
    },
    {
      id: '5',
      category: 'account',
      question: 'How do I update my profile information?',
      answer: `To update your profile:
        1. Log in to your donor account
        2. Go to Settings (gear icon in the top right)
        3. Select "Profile" from the settings menu
        4. Update your information
        5. Click "Save Changes"
        
        You can update your contact information, address, medical history, and emergency contacts.`,
    },
    {
      id: '6',
      category: 'account',
      question: 'How do I reset my password?',
      answer: `To reset your password:
        1. Go to the login page
        2. Click "Forgot Password"
        3. Enter your registered email address
        4. Check your email for a password reset link
        5. Click the link and create a new password
        6. Log in with your new password
        
        If you don't receive the email, check your spam folder.`,
    },
    {
      id: '7',
      category: 'drives',
      question: 'How do I find blood drives near me?',
      answer: `To find blood drives:
        1. Log in to your donor dashboard
        2. Click on "Blood Drives" in the sidebar
        3. Use the search filters to find drives by:
           • Location (barangay, municipality, province)
           • Date (upcoming, today, this week)
           • Type (mobile, hospital, community)
        4. Click on a drive to view details
        5. Click "Register" to sign up`,
    },
    {
      id: '8',
      category: 'drives',
      question: 'Can I cancel my appointment?',
      answer: `To cancel an appointment:
        1. Go to your donor dashboard
        2. Click on "Request" or view your registered drives
        3. Find the appointment you want to cancel
        4. Click "Cancel Appointment"
        5. Confirm the cancellation
        
        Please cancel at least 24 hours in advance so others can take the slot.`,
    },
    {
      id: '9',
      category: 'security',
      question: 'How is my data protected?',
      answer: `RedPulse takes data security seriously:
        • All data is encrypted in transit and at rest
        • We use industry-standard security protocols
        • Your medical information is kept confidential
        • We comply with data protection laws
        • Two-factor authentication is available
        • You can control what information is shared
        
        View our full Privacy Policy for more details.`,
    },
    {
      id: '10',
      category: 'security',
      question: 'What information is shared with hospitals?',
      answer: `When you donate blood, we share the following with hospitals:
        • Blood type
        • Donation date and time
        • Donation ID
        • Eligibility status
        
        Your personal contact information and medical history are NOT shared without your explicit consent.`,
    },
  ];

  const filteredFaqs = searchQuery
    ? faqs.filter(faq => 
        faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
        faq.answer.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : activeCategory === 'all'
    ? faqs
    : faqs.filter(faq => faq.category === activeCategory);

  const quickActions = [
    {
      icon: MessageSquare,
      label: 'Live Chat',
      description: 'Chat with our support team',
      color: 'blue',
      onClick: () => window.open('/chat', '_blank'),
    },
    {
      icon: Mail,
      label: 'Email Support',
      description: 'support@redpulse.com',
      color: 'red',
      onClick: () => window.location.href = 'mailto:support@redpulse.com',
    },
    {
      icon: Phone,
      label: 'Call Us',
      description: '+63 (2) 8123-4567',
      color: 'green',
      onClick: () => window.location.href = 'tel:+63281234567',
    },
    {
      icon: BookOpen,
      label: 'Documentation',
      description: 'Read our guides',
      color: 'purple',
      onClick: () => router.push('/help/docs'),
    },
  ];

  const resources = [
    {
      title: 'Donor Guide',
      description: 'Complete guide for new donors',
      icon: BookOpen,
      href: '/help/donor-guide',
    },
    {
      title: 'Video Tutorials',
      description: 'Watch step-by-step guides',
      icon: Video,
      href: '/help/videos',
    },
    {
      title: 'FAQ Database',
      description: 'Search common questions',
      icon: FileText,
      href: '/help/faq',
    },
    {
      title: 'Community Forum',
      description: 'Connect with other donors',
      icon: Users,
      href: '/help/community',
    },
  ];

  // If loading, show a skeleton
  if (isLoading) {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 pt-4 pb-24 md:pb-8 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600 mx-auto"></div>
          <p className="mt-2 text-zinc-500 dark:text-zinc-400">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 pt-4 pb-24 md:pb-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={handleGoBack}
              className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition"
            >
              <ArrowLeft className="w-5 h-5 text-zinc-500" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">Help Center</h1>
              <p className="text-sm text-zinc-500 dark:text-zinc-400">Get support and find answers</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs px-3 py-1 bg-zinc-200 dark:bg-zinc-800 rounded-full text-zinc-600 dark:text-zinc-400">
              {userRole === 'admin' ? 'Admin' : userRole === 'hospital' ? 'Hospital' : 'Donor'}
            </span>
          </div>
        </div>

        {/* Search Bar */}
        <div className="mb-6">
          <div className="relative max-w-2xl">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400" />
            <input
              type="text"
              placeholder="Search for help articles, FAQs, and more..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl focus:outline-none focus:ring-2 focus:ring-red-500 dark:text-white transition"
            />
            <kbd className="absolute right-4 top-1/2 -translate-y-1/2 hidden sm:block text-xs text-zinc-400 bg-zinc-100 dark:bg-zinc-800 px-2 py-1 rounded">
              ⌘K
            </kbd>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          {quickActions.map((action) => {
            const Icon = action.icon;
            const colorClasses = {
              blue: 'bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-950/50',
              red: 'bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-950/50',
              green: 'bg-green-50 dark:bg-green-950/30 text-green-600 dark:text-green-400 hover:bg-green-100 dark:hover:bg-green-950/50',
              purple: 'bg-purple-50 dark:bg-purple-950/30 text-purple-600 dark:text-purple-400 hover:bg-purple-100 dark:hover:bg-purple-950/50',
            };
            return (
              <button
                key={action.label}
                onClick={action.onClick}
                className={`flex flex-col items-center p-4 rounded-2xl ${colorClasses[action.color as keyof typeof colorClasses]} transition text-center`}
              >
                <Icon className="w-6 h-6 mb-2" />
                <span className="text-sm font-medium">{action.label}</span>
                <span className="text-xs opacity-80 mt-0.5">{action.description}</span>
              </button>
            );
          })}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar Categories */}
          <div className="lg:col-span-1">
            <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-4 sticky top-20">
              <p className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-3">Categories</p>
              <div className="space-y-1">
                {categories.map((category) => {
                  const Icon = category.icon;
                  const isActive = activeCategory === category.id;
                  return (
                    <button
                      key={category.id}
                      onClick={() => {
                        setActiveCategory(category.id);
                        setSearchQuery('');
                      }}
                      className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition ${
                        isActive
                          ? 'bg-red-50 dark:bg-red-950/50 text-red-600 dark:text-red-400'
                          : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800'
                      }`}
                    >
                      <Icon className="w-4 h-4 flex-shrink-0" />
                      <span>{category.label}</span>
                      {isActive && <ChevronRight className="w-4 h-4 ml-auto" />}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            {/* Resources */}
            {!searchQuery && activeCategory === 'all' && (
              <div className="mb-6">
                <h2 className="text-lg font-semibold text-zinc-900 dark:text-white mb-3">Popular Resources</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {resources.map((resource) => {
                    const Icon = resource.icon;
                    return (
                      <Link
                        key={resource.title}
                        href={resource.href}
                        className="flex items-center gap-3 p-4 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl hover:border-red-300 dark:hover:border-red-700 transition"
                      >
                        <div className="h-10 w-10 rounded-xl bg-red-50 dark:bg-red-950/30 flex items-center justify-center text-red-600 dark:text-red-400 flex-shrink-0">
                          <Icon className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="font-medium text-zinc-900 dark:text-white">{resource.title}</p>
                          <p className="text-xs text-zinc-500 dark:text-zinc-400">{resource.description}</p>
                        </div>
                        <ChevronRight className="w-4 h-4 text-zinc-400 ml-auto flex-shrink-0" />
                      </Link>
                    );
                  })}
                </div>
              </div>
            )}

            {/* FAQs */}
            <div>
              <h2 className="text-lg font-semibold text-zinc-900 dark:text-white mb-3">
                {searchQuery ? 'Search Results' : 'Frequently Asked Questions'}
              </h2>
              {filteredFaqs.length === 0 ? (
                <div className="text-center py-8">
                  <Search className="w-12 h-12 text-zinc-300 mx-auto mb-3" />
                  <p className="text-zinc-500 dark:text-zinc-400">No results found for "{searchQuery}"</p>
                  <button
                    onClick={() => {
                      setSearchQuery('');
                      setActiveCategory('all');
                    }}
                    className="mt-2 text-red-600 dark:text-red-400 hover:underline text-sm"
                  >
                    Clear search
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  {filteredFaqs.map((faq) => (
                    <div
                      key={faq.id}
                      className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden"
                    >
                      <button
                        onClick={() => toggleFaq(faq.id)}
                        className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-zinc-50 dark:hover:bg-zinc-800 transition"
                      >
                        <span className="font-medium text-zinc-900 dark:text-white text-sm">
                          {faq.question}
                        </span>
                        <ChevronDown
                          className={`w-5 h-5 text-zinc-400 transition-transform flex-shrink-0 ml-4 ${
                            expandedFaq === faq.id ? 'rotate-180' : ''
                          }`}
                        />
                      </button>
                      {expandedFaq === faq.id && (
                        <div className="px-4 pb-4 text-sm text-zinc-600 dark:text-zinc-400 border-t border-zinc-200 dark:border-zinc-800 pt-3 whitespace-pre-line">
                          {faq.answer}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Contact Support Section */}
            <div className="mt-8 p-6 bg-gradient-to-r from-red-50 to-red-100/50 dark:from-red-950/30 dark:to-red-950/10 rounded-2xl border border-red-200 dark:border-red-800/50">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div className="h-10 w-10 rounded-full bg-red-200 dark:bg-red-900/50 flex items-center justify-center text-red-600 dark:text-red-400 flex-shrink-0">
                    <LifeBuoy className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-zinc-900 dark:text-white">Still need help?</h3>
                    <p className="text-sm text-zinc-600 dark:text-zinc-400">
                      Our support team is here to assist you
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => window.open('mailto:support@redpulse.com')}
                    className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-xl transition"
                  >
                    <Mail className="w-4 h-4" />
                    Email Us
                  </button>
                  <button
                    onClick={() => window.open('/chat', '_blank')}
                    className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-700 text-sm font-medium rounded-xl border border-zinc-200 dark:border-zinc-700 transition"
                  >
                    <MessageSquare className="w-4 h-4" />
                    Live Chat
                  </button>
                </div>
              </div>
            </div>

            {/* Feedback Section */}
            <div className="mt-6 p-4 bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <ThumbsUp className="w-5 h-5 text-zinc-400" />
                  <div>
                    <p className="font-medium text-zinc-900 dark:text-white">Was this help page useful?</p>
                    <p className="text-sm text-zinc-500 dark:text-zinc-400">Your feedback helps us improve</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setFeedbackSubmitted(true)}
                    className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition"
                  >
                    <ThumbsUp className="w-5 h-5 text-zinc-400 hover:text-green-600" />
                  </button>
                  <button
                    onClick={() => setFeedbackSubmitted(true)}
                    className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition"
                  >
                    <ThumbsUp className="w-5 h-5 text-zinc-400 hover:text-green-600 transform rotate-180" />
                  </button>
                </div>
              </div>
              {feedbackSubmitted && (
                <div className="mt-3 pt-3 border-t border-zinc-200 dark:border-zinc-800 flex items-center gap-2 text-green-600 dark:text-green-400">
                  <CheckCircle className="w-4 h-4" />
                  <span className="text-sm font-medium">Thank you for your feedback!</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}