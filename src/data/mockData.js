export const mockDoctors = [
  {
    id: '1',
    name: 'Dr. Sarah Johnson',
    specialization: 'cardiology',
    rating: 4.8,
    reviews: 127,
    hospital: 'City General Hospital',
    consultationFee: 150,
    nextAvailable: 'Today 2:00 PM',
    languages: ['English', 'Spanish'],
    avatar: 'https://ui-avatars.com/api/?name=Dr+Sarah+Johnson&background=3b82f6&color=fff',
    availability: 'today',
    experience: 12,
    education: 'Harvard Medical School'
  },
  {
    id: '2',
    name: 'Dr. Michael Chen',
    specialization: 'dermatology',
    rating: 4.9,
    reviews: 89,
    hospital: 'Metro Skin Clinic',
    consultationFee: 120,
    nextAvailable: 'Tomorrow 10:30 AM',
    languages: ['English', 'Mandarin'],
    avatar: 'https://ui-avatars.com/api/?name=Dr+Michael+Chen&background=10b981&color=fff',
    availability: 'this-week',
    experience: 8,
    education: 'Stanford Medical School'
  },
  {
    id: '3',
    name: 'Dr. Emily Rodriguez',
    specialization: 'neurology',
    rating: 4.7,
    reviews: 156,
    hospital: 'Neuro Center of Excellence',
    consultationFee: 200,
    nextAvailable: 'Next Week',
    languages: ['English', 'Spanish', 'French'],
    avatar: 'https://ui-avatars.com/api/?name=Dr+Emily+Rodriguez&background=f59e0b&color=fff',
    availability: 'next-week',
    experience: 15,
    education: 'Johns Hopkins Medical School'
  },
  {
    id: '4',
    name: 'Dr. James Wilson',
    specialization: 'orthopedics',
    rating: 4.6,
    reviews: 203,
    hospital: 'Sports Medicine Institute',
    consultationFee: 180,
    nextAvailable: 'Today 4:00 PM',
    languages: ['English'],
    avatar: 'https://ui-avatars.com/api/?name=Dr+James+Wilson&background=8b5cf6&color=fff',
    availability: 'today',
    experience: 18,
    education: 'Mayo Clinic School of Medicine'
  },
  {
    id: '5',
    name: 'Dr. Lisa Thompson',
    specialization: 'pediatrics',
    rating: 4.9,
    reviews: 145,
    hospital: 'Children\'s Hospital',
    consultationFee: 130,
    nextAvailable: 'Tomorrow 9:00 AM',
    languages: ['English', 'German'],
    avatar: 'https://ui-avatars.com/api/?name=Dr+Lisa+Thompson&background=ec4899&color=fff',
    availability: 'this-week',
    experience: 10,
    education: 'University of Pennsylvania School of Medicine'
  },
  {
    id: '6',
    name: 'Dr. David Kim',
    specialization: 'psychiatry',
    rating: 4.8,
    reviews: 92,
    hospital: 'Mental Health Center',
    consultationFee: 160,
    nextAvailable: 'This Week',
    languages: ['English', 'Korean'],
    avatar: 'https://ui-avatars.com/api/?name=Dr+David+Kim&background=06b6d4&color=fff',
    availability: 'this-week',
    experience: 14,
    education: 'UCLA School of Medicine'
  },
  {
    id: '7',
    name: 'Dr. Maria Garcia',
    specialization: 'general',
    rating: 4.7,
    reviews: 178,
    hospital: 'Family Care Clinic',
    consultationFee: 100,
    nextAvailable: 'Today 11:00 AM',
    languages: ['English', 'Spanish', 'Portuguese'],
    avatar: 'https://ui-avatars.com/api/?name=Dr+Maria+Garcia&background=ef4444&color=fff',
    availability: 'today',
    experience: 9,
    education: 'University of Miami School of Medicine'
  },
  {
    id: '8',
    name: 'Dr. Robert Anderson',
    specialization: 'cardiology',
    rating: 4.6,
    reviews: 134,
    hospital: 'Heart Specialists Group',
    consultationFee: 175,
    nextAvailable: 'Next Week',
    languages: ['English'],
    avatar: 'https://ui-avatars.com/api/?name=Dr+Robert+Anderson&background=84cc16&color=fff',
    availability: 'next-week',
    experience: 20,
    education: 'Duke University School of Medicine'
  }
];

export const mockStats = [
  {
    title: 'Total Patients',
    value: '2,847',
    change: '+12.5%',
    trend: 'up',
    icon: '👥'
  },
  {
    title: 'Active Doctors',
    value: '156',
    change: '+3.2%',
    trend: 'up',
    icon: '👨‍⚕️'
  },
  {
    title: 'Appointments Today',
    value: '89',
    change: '+8.1%',
    trend: 'up',
    icon: '📅'
  },
  {
    title: 'Success Rate',
    value: '94.8%',
    change: '+1.2%',
    trend: 'up',
    icon: '✅'
  }
];

export const mockChartData = {
  appointments: [
    { month: 'Jan', appointments: 145, completed: 138 },
    { month: 'Feb', appointments: 178, completed: 165 },
    { month: 'Mar', appointments: 203, completed: 192 },
    { month: 'Apr', appointments: 234, completed: 223 },
    { month: 'May', appointments: 267, completed: 251 },
    { month: 'Jun', appointments: 289, completed: 276 }
  ],
  specializations: [
    { name: 'General Medicine', value: 35, color: '#3b82f6' },
    { name: 'Cardiology', value: 18, color: '#10b981' },
    { name: 'Dermatology', value: 12, color: '#f59e0b' },
    { name: 'Neurology', value: 10, color: '#8b5cf6' },
    { name: 'Pediatrics', value: 15, color: '#ec4899' },
    { name: 'Others', value: 10, color: '#6b7280' }
  ],
  ratings: [
    { rating: '5 Stars', count: 425, percentage: 68 },
    { rating: '4 Stars', count: 156, percentage: 25 },
    { rating: '3 Stars', count: 31, percentage: 5 },
    { rating: '2 Stars', count: 8, percentage: 1 },
    { rating: '1 Star', count: 5, percentage: 1 }
  ]
};