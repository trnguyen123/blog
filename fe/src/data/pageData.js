export const pageScreens = [
  { key: 'home', label: 'Home Page' },
  { key: 'post', label: 'Post Detail' },
  { key: 'auth', label: 'Login/Register' },
  { key: 'plans', label: 'Subscription Plans' },
  { key: 'author', label: 'Author Dashboard' },
  { key: 'editor', label: 'Post Editor' },
  { key: 'moderation', label: 'Comment Moderation' },
  { key: 'categories', label: 'Categories' },
  { key: 'tags', label: 'Tags' },
  { key: 'subscription', label: 'Subscriptions' },
  { key: 'payment', label: 'Payments' },
  { key: 'admin', label: 'Super Admin Dashboard' },
  { key: 'users', label: 'User Management' },
  { key: 'logs', label: 'Activity Logs' }
];

export const homeFeatured = {
  title: 'How AI is shaping storytelling for modern publishers',
  category: 'AI Insights',
  image:
    'https://images.unsplash.com/photo-1515378791036-0648a3ef77b2?auto=format&fit=crop&w=1200&q=80',
  author: 'Mila Jensen',
  avatar:
    'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=80&q=80',
  date: 'Apr 14, 2026',
  readTime: '8 min'
};

export const homePosts = [
  {
    title: 'AI-powered writing prompts for busy authors',
    category: 'Writing',
    excerpt:
      'Discover how prompts, voice optimization, and editorial automation help authors publish smarter.',
    thumbnail:
      'https://images.unsplash.com/photo-1515378791036-0648a3ef77b2?auto=format&fit=crop&w=800&q=80',
    author: 'Noah Harper',
    date: 'Apr 13, 2026',
    readTime: '5 min',
    likes: 248,
    comments: 18
  },
  {
    title: 'Data-backed tactics for growing your blog audience',
    category: 'Growth',
    excerpt:
      'From SEO to niche communities, learn the strategies that drive meaningful reader loyalty.',
    thumbnail:
      'https://images.unsplash.com/photo-1484417894907-623942c8ee29?auto=format&fit=crop&w=800&q=80',
    author: 'Aria Flynn',
    date: 'Apr 12, 2026',
    readTime: '6 min',
    likes: 194,
    comments: 12
  },
  {
    title: 'Designing comment moderation flows with trust in mind',
    category: 'Moderation',
    excerpt:
      'Build a moderation experience that balances safety, transparency, and community health.',
    thumbnail:
      'https://images.unsplash.com/photo-1484417894907-623942c8ee29?auto=format&fit=crop&w=800&q=80',
    author: 'Lina Khan',
    date: 'Apr 10, 2026',
    readTime: '7 min',
    likes: 322,
    comments: 24
  },
  {
    title: 'Premium content models for subscription-friendly blogs',
    category: 'Business',
    excerpt:
      'Explore pricing, gating, and membership tiers that reward loyal readers without alienating new visitors.',
    thumbnail:
      'https://images.unsplash.com/photo-1515378960530-7c0da6231fb1?auto=format&fit=crop&w=800&q=80',
    author: 'Evan Park',
    date: 'Apr 09, 2026',
    readTime: '4 min',
    likes: 150,
    comments: 9
  },
  {
    title: 'Keeping authors engaged with analytics dashboards',
    category: 'Dashboard',
    excerpt:
      'A modern author experience needs actionable insights, clear workflows, and smart alerts.',
    thumbnail:
      'https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=800&q=80',
    author: 'Sage Yu',
    date: 'Apr 08, 2026',
    readTime: '6 min',
    likes: 205,
    comments: 15
  },
  {
    title: 'How to write viral newsletter hooks for your blog',
    category: 'Marketing',
    excerpt:
      'Learn the exact hook formula that increases opens, clicks, and long-term subscriber retention.',
    thumbnail:
      'https://images.unsplash.com/photo-1515378791036-0648a3ef77b2?auto=format&fit=crop&w=800&q=80',
    author: 'Nova Reed',
    date: 'Apr 07, 2026',
    readTime: '5 min',
    likes: 179,
    comments: 11
  }
];

export const trendingPosts = [
  {
    title: 'Best weekly newsletter templates',
    count: 74
  },
  {
    title: 'Setting up premium member paywalls',
    count: 58
  },
  {
    title: 'AI moderation trends for 2026',
    count: 93
  },
  {
    title: 'Designing referral campaigns',
    count: 36
  }
];

export const categories = [
  {
    name: 'AI',
    count: 32
  },
  {
    name: 'Writing',
    count: 18
  },
  {
    name: 'Monetization',
    count: 25
  },
  {
    name: 'Design',
    count: 14
  },
  {
    name: 'Security',
    count: 11
  }
];

export const tags = [
  'Editorial',
  'Community',
  'Analytics',
  'Subscriptions',
  'Productivity',
  'UX',
  'Growth',
  'Automation'
];

export const faqItems = [
  {
    question: 'Can I switch plans at any time?',
    answer:
      'Yes. You can upgrade or downgrade instantly and the billing will adjust on your next cycle.'
  },
  {
    question: 'How does AI comment moderation work?',
    answer:
      'Our AI scans every comment for toxicity, spam, and policy risk. You can review flagged content before publishing.'
  },
  {
    question: 'Is team access included in Premium?',
    answer:
      'Premium includes multi-author access, advanced collaboration tools, and API-based integrations.'
  }
];

export const authorNav = [
  {
    key: 'author',
    icon: '🏠',
    label: 'Dashboard'
  },
  {
    key: 'myposts',
    icon: '📝',
    label: 'My Posts'
  },
  {
    key: 'editor',
    icon: '✍️',
    label: 'Create Post'
  },
  {
    key: 'moderation',
    icon: '💬',
    label: 'Comments'
  },
  {
    key: 'categories',
    icon: '🗂️',
    label: 'Categories'
  },
  {
    key: 'tags',
    icon: '🏷️',
    label: 'Tags'
  },
  {
    key: 'payment',
    icon: '💳',
    label: 'Payments'
  },
  {
    key: 'auth',
    icon: '🚪',
    label: 'Logout'
  }
];

export const moderationNav = [
  {
    key: 'moderation',
    icon: '💬',
    label: 'Comment moderation'
  },
  {
    key: 'history',
    icon: '🕘',
    label: 'Review history'
  },
  {
    key: 'policy',
    icon: '📋',
    label: 'Policy settings'
  }
];

export const adminNav = [
  {
    key: 'admin',
    icon: '📊',
    label: 'Dashboard'
  },
  {
    key: 'users',
    icon: '👥',
    label: 'Users'
  },
  {
    key: 'moderation',
    icon: '💬',
    label: 'Comments'
  },
  {
    key: 'subscription',
    icon: '🏷️',
    label: 'Subscriptions'
  },
  {
    key: 'payment',
    icon: '💳',
    label: 'Payments'
  },
  {
    key: 'logs',
    icon: '📜',
    label: 'Activity Logs'
  },
  {
    key: 'requests',
    icon: '📩',
    label: 'Author Requests'
  }
];

export const authorStats = [
  {
    label: 'Total Posts',
    value: '128',
    trend: '+9%'
  },
  {
    label: 'Total Views',
    value: '342.8K',
    trend: '+14%'
  },
  {
    label: 'Total Comments',
    value: '4.2K',
    trend: '+7%'
  },
  {
    label: 'Pending Moderation',
    value: '12',
    trend: '-4%'
  }
];

export const adminStats = [
  {
    label: 'Total Users',
    value: '18,642'
  },
  {
    label: 'Active Authors',
    value: '4,117'
  },
  {
    label: 'Total Posts',
    value: '7,830'
  },
  {
    label: 'Monthly Revenue',
    value: '$96.2K'
  },
  {
    label: 'AI Accuracy Rate',
    value: '92.4%'
  },
  {
    label: 'Comments Moderated Today',
    value: '1,340'
  }
];

export const userRows = [
  {
    name: 'Maya Reeves',
    email: 'maya@inkwell.com',
    role: 'Author',
    status: 'Active',
    joined: 'Jan 2024',
    active: 'Today'
  },
  {
    name: 'Julian Cross',
    email: 'julian@inkwell.com',
    role: 'Admin',
    status: 'Active',
    joined: 'Nov 2023',
    active: '1h ago'
  },
  {
    name: 'Rhea Ortiz',
    email: 'rhea@inkwell.com',
    role: 'User',
    status: 'Banned',
    joined: 'May 2024',
    active: 'Mar 12'
  },
  {
    name: 'Noel Brooks',
    email: 'noel@inkwell.com',
    role: 'Author',
    status: 'Active',
    joined: 'Feb 2024',
    active: 'Yesterday'
  }
];

export const moderationLogs = [
  {
    preview: 'This is a low-effort spam comment.',
    toxicity: 0.18,
    spam: 0.94,
    decision: 'Rejected',
    outcome: 'Spam',
    time: '9m ago'
  },
  {
    preview: 'Amazing write-up, I learned a lot.',
    toxicity: 0.03,
    spam: 0.02,
    decision: 'Approved',
    outcome: 'Accepted',
    time: '24m ago'
  },
  {
    preview:
      'Your article is trash and your editor is clueless.',
    toxicity: 0.88,
    spam: 0.07,
    decision: 'Rejected',
    outcome: 'Toxic',
    time: '1h ago'
  },
  {
    preview:
      'Can you share more examples of the workflow?',
    toxicity: 0.12,
    spam: 0.05,
    decision: 'Approved',
    outcome: 'Accepted',
    time: '2h ago'
  }
];

export const commentItems = [
  {
    user: 'Lucas F.',
    content:
      'I really appreciate the nuance in this guide — the safety controls are clear and intuitive.',
    post: 'AI moderation trends for 2026',
    time: '2h ago',
    toxicity: 0.06,
    spam: 0.02,
    status: 'Pending'
  },
  {
    user: 'Jade N.',
    content:
      'This response feels like a bot. Please add more personalized suggestions.',
    post: 'Designing comment moderation flows',
    time: '6h ago',
    toxicity: 0.33,
    spam: 0.09,
    status: 'AI Flagged'
  },
  {
    user: 'Theo R.',
    content:
      'Can you explain how follow state is preserved across sessions?',
    post: 'How AI is shaping storytelling',
    time: '9h ago',
    toxicity: 0.09,
    spam: 0.03,
    status: 'Approved'
  }
];