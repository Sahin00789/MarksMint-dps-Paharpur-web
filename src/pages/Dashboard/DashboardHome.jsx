import { useState, useEffect } from 'react';
import { 
  FiUsers, 
  FiBookOpen, 
  FiFileText, 
  FiUserPlus,
  FiEdit3,
  FiCalendar,
  FiCheckCircle,
  FiTrendingUp,
  FiPieChart,
  FiBarChart2
} from 'react-icons/fi';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';
import { 
  Bar, 
  Line, 
  Pie, 
  Doughnut 
} from 'react-chartjs-2';
import ClassSelectorCard from '../../components/common/ClassSelectorCard';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { 
  getDashboardStats, 
  getDashboardCharts 
} from '@services/dashboard';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);





const DashboardHome = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalStudents: 0,
    examsConducted: 0,
    resultsPublished: 0,
    pendingTasks: 0
  });
  
  // Separate loading states for better granularity
  const [loading, setLoading] = useState({
    stats: false, // Start with false to prevent blocking initial render
    charts: false
  });
  
  const [error, setError] = useState(null);
  const [selectedClass, setSelectedClass] = useState('');
  const [mounted, setMounted] = useState(false);
  
  // Fetch dashboard data
  const fetchDashboardData = async () => {
    try {
      setError(null);
      
      // Fetch stats if not already loaded
      if (loading.stats) {
        const statsResponse = await getDashboardStats();
        if (statsResponse.success) {
          setStats(statsResponse.data);
          setLoading(prev => ({ ...prev, stats: false }));
        } else {
          throw new Error(statsResponse.error || 'Failed to load dashboard stats');
        }
      }
      
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      setError(error.message || 'Failed to load dashboard data');
      toast.error(error.message || 'Failed to load dashboard data');
    } finally {
      setLoading(prev => ({ ...prev, activities: false }));
    }
  };
  
  // Initial data fetch - only after component is mounted
  useEffect(() => {
    setMounted(true);
    
    // Load data after a small delay to prevent blocking initial render
    const timer = setTimeout(() => {
      if (mounted) {
        setLoading(prev => ({ ...prev, stats: true }));
        fetchDashboardData();
      }
    }, 100);
    
    return () => {
      setMounted(false);
      clearTimeout(timer);
    };
  }, [mounted]);
  
  // Handle class selection
  const handleClassSelect = (selectedClass) => {
    setSelectedClass(selectedClass);
    // Here you could fetch data for the selected class if needed
    // fetchDataForClass(selectedClass);
  };

  const [chartData, setChartData] = useState({
    studentsByClass: { labels: [], data: [] },
    examMarks: { labels: [], data: [] },
    examStats: { labels: [], data: [] }, // Added missing examStats
    resultStats: { labels: [], data: [] }
  });

  const [quickActions] = useState([
    {
      title: 'Add New Student',
      description: 'Register a new student in the system',
      icon: FiUserPlus,
      href: '/dashboard/students',
      color: 'primary'
    },
    {
      title: 'Enter Marks',
      description: 'Enter marks for an exam',
      icon: FiEdit3,
      href: '/dashboard/marks',
      color: 'emerald'
    },
    {
      title: 'Edit Attendance',
      description: 'Update student attendance records',
      icon: FiCalendar,
      href: '/dashboard/attendance',
      color: 'blue'
    },
    {
      title: 'Configure Exams',
      description: 'Set up and manage exams',
      icon: FiBookOpen,
      href: '/dashboard/exams',
      color: 'indigo'
    },
    {
      title: 'Generate Admit Cards',
      description: 'Create admit cards for upcoming exams',
      icon: FiFileText,
      href: '/dashboard/admit-cards/generate',
      color: 'amber'
    },
    {
      title: 'Publish Results',
      description: 'Publish exam results',
      icon: FiCheckCircle,
      href: '/dashboard/results-publish',
      color: 'violet'
    }
  ]);

  // Fetch dashboard stats
  useEffect(() => {
    const fetchStats = async () => {
      console.log('Fetching dashboard stats...');
      try {
        const result = await getDashboardStats();
        console.log('Dashboard stats response:', result);
        
        if (result.success) {
          setStats({
            totalStudents: result.data.totalStudents || 0,
            examsConducted: result.data.examsConducted || 0,
            resultsPublished: result.data.resultsPublished || 0,
            pendingTasks: result.data.pendingTasks || 0,
          });
        } else {
          console.error('Error in stats response:', result.error);
          toast.error(result.error || 'Failed to load dashboard stats');
        }
      } catch (error) {
        console.error('Exception in fetchStats:', error);
        toast.error('An error occurred while loading stats');
      } finally {
        console.log('Finished loading stats');
        setLoading(prev => ({ ...prev, stats: false }));
      }
    };

    fetchStats();
  }, []);


  // Fetch chart data
  useEffect(() => {
    const fetchCharts = async () => {
      console.log('Fetching charts data...');
      try {
        const result = await getDashboardCharts();
        console.log('Charts response:', result);
        
        if (result.success) {
          const chartDataUpdate = {
            studentsByClass: {
              labels: (result.data.studentsByClass || []).map(item => item._id || 'Unknown'),
              data: (result.data.studentsByClass || []).map(item => item.count || 0)
            },
            examStats: {
              labels: (result.data.examStats || []).map(item => 
                item.examName && item.academicYear 
                  ? `${item.examName} (${item.academicYear})` 
                  : 'Unknown Exam'
              ),
              data: (result.data.examStats || []).map(item => item.subjectCount || 0)
            },
            resultStats: {
              labels: (result.data.resultStats || []).map(item => item._id || 'Unknown'),
              data: (result.data.resultStats || []).map(item => item.count || 0)
            }
          };
          
          console.log('Setting chart data:', chartDataUpdate);
          setChartData(chartDataUpdate);
        } else {
          console.error('Error in charts response:', result.error);
          toast.error(result.error || 'Failed to load chart data');
          
          // Set empty chart data on error to prevent loading state
          setChartData({
            studentsByClass: { labels: [], data: [] },
            examStats: { labels: [], data: [] },
            resultStats: { labels: [], data: [] }
          });
        }
      } catch (error) {
        console.error('Exception in fetchCharts:', error);
        toast.error('An error occurred while loading charts');
        
        // Set empty chart data on exception
        setChartData({
          studentsByClass: { labels: [], data: [] },
          examStats: { labels: [], data: [] },
          resultStats: { labels: [], data: [] }
        });
      } finally {
        console.log('Finished loading charts');
        setLoading(prev => ({ ...prev, charts: false }));
      }
    };

    fetchCharts();
  }, []);

  // Color palette with 9 distinct colors (avoiding red and similar shades)
  const classColors = [
    'rgba(70, 70, 229, 0.8)',   // indigo-600
    'rgba(16, 185, 129, 0.8)',  // emerald-500
    'rgba(99, 102, 241, 0.8)',  // indigo-500
    'rgba(245, 158, 11, 0.8)',  // amber-500
    'rgba(59, 130, 246, 0.8)',  // blue-500
    'rgba(139, 92, 246, 0.8)',  // violet-500
    'rgba(6, 182, 212, 0.8)',   // cyan-500
    'rgba(5, 150, 105, 0.8)',   // emerald-600
    'rgba(124, 58, 237, 0.8)'   // violet-600
  ];

  // Chart configurations
  const studentsByClassChart = {
    labels: chartData.studentsByClass.labels,
    datasets: [{
      label: 'Number of Students',
      data: chartData.studentsByClass.data,
      backgroundColor: chartData.studentsByClass.labels.map((_, i) => classColors[i % classColors.length]),
      borderColor: chartData.studentsByClass.labels.map((_, i) => {
        // Darker version of each color for the border
        const color = classColors[i % classColors.length];
        return color.replace('0.8', '1');
      }),
      borderWidth: 2,
      borderRadius: 6,  // More pronounced rounded corners
      borderSkipped: false,  // Apply border radius to all corners
      barPercentage: 0.7,  // Slightly thinner bars
      categoryPercentage: 0.8  // Space between bars
    }]
  };

  const examStatsChart = {
    labels: chartData?.examStats?.labels || [],
    datasets: [
      {
        label: 'Subjects per Exam',
        data: chartData?.examStats?.data || [],
        backgroundColor: 'rgba(99, 102, 241, 0.2)',
        borderColor: 'rgba(99, 102, 241, 1)',
        borderWidth: 2,
        tension: 0.3,
        fill: true,
      },
    ],
  };


  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,  // Hide legend since we'll show values on bars
      },
      tooltip: {
        mode: 'index',
        intersect: false,
        callbacks: {
          label: function(context) {
            return `${context.dataset.label}: ${context.raw}`;
          }
        }
      },
    },
    indexAxis: 'y',
    scales: {
      x: {
        beginAtZero: true,
        max: 100,
        title: {
          display: true,
          text: 'Marks %',
          font: {
            weight: 'bold'
          }
        },
        ticks: {
          callback: function(value) {
            return value + '%';
          }
        }
      },
      y: {
        title: {
          display: true,
          text: 'Exams',
          font: {
            weight: 'bold'
          }
        },
        grid: {
          display: false
        }
      }
    },
  };

  const handleQuickAction = (action) => {
    if (action.href) {
      navigate(action.href);
    }
  };

  // Check if any of the loading states are true
  const isLoading = loading.stats || loading.charts;
  
  // Show loading spinner if any data is still loading
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-8"></div>
            
            {/* Stats Grid Skeleton */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 h-32">
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mb-4"></div>
                  <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
                </div>
              ))}
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
              {/* Chart Skeletons */}
              <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 h-96">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-4"></div>
                <div className="h-full bg-gray-100 dark:bg-gray-700 rounded"></div>
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-4"></div>
                <div className="h-64 bg-gray-100 dark:bg-gray-700 rounded-full"></div>
              </div>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Activities Skeleton */}
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-4"></div>
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="flex items-start space-x-4">
                      <div className="h-10 w-10 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
                      <div className="flex-1 space-y-2">
                        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
                        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              {/* Quick Actions Skeleton - Updated for 6 actions */}
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-4"></div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {[1, 2, 3, 4, 5, 6].map((i) => (
                    <div key={i} className="h-20 bg-gray-100 dark:bg-gray-700 rounded-lg p-4">
                      <div className="flex items-center space-x-3">
                        <div className="h-8 w-8 bg-gray-200 dark:bg-gray-600 rounded-full"></div>
                        <div className="flex-1 space-y-1">
                          <div className="h-3 bg-gray-200 dark:bg-gray-600 rounded w-3/4"></div>
                          <div className="h-2 bg-gray-200 dark:bg-gray-600 rounded w-1/2"></div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Color variants for stats cards
  const statCardVariants = {
    students: 'from-indigo-500 to-blue-500',
    exams: 'from-emerald-500 to-teal-500',
    results: 'from-amber-500 to-orange-500',
    tasks: 'from-rose-500 to-pink-500'
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Dashboard Overview
            </h1>
            <p className="mt-2 text-gray-600 dark:text-gray-400">
              Welcome back! Here's what's happening with your school management system.
            </p>
          </div>
          <div className="mt-4 md:mt-0">
           
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className={`bg-gradient-to-r ${statCardVariants.students} rounded-xl shadow-sm p-6 text-white`}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-indigo-100">Total Students</p>
                <p className="mt-2 text-3xl font-bold">{stats.totalStudents}</p>
              </div>
              <div className="p-3 bg-white/20 rounded-lg">
                <FiUsers className="w-6 h-6" />
              </div>
            </div>
          </div>

          <div className={`bg-gradient-to-r ${statCardVariants.exams} rounded-xl shadow-sm p-6 text-white`}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-emerald-100">Exams Conducted</p>
                <p className="mt-2 text-3xl font-bold">{stats.examsConducted}</p>
              </div>
              <div className="p-3 bg-white/20 rounded-lg">
                <FiBookOpen className="w-6 h-6" />
              </div>
            </div>
          </div>

          <div className={`bg-gradient-to-r ${statCardVariants.results} rounded-xl shadow-sm p-6 text-white`}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-amber-100">Results Published</p>
                <p className="mt-2 text-3xl font-bold">{stats.resultsPublished}</p>
              </div>
              <div className="p-3 bg-white/20 rounded-lg">
                <FiFileText className="w-6 h-6" />
              </div>
            </div>
          </div>
        </div>

        {/* Charts Row */}
        <div className="grid w-full gap-6 mb-8">
          {/* Students by Class Chart */}
          <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Students by Class</h2>
            </div>
            <div className="h-80">
              <Bar data={studentsByClassChart} options={{
                ...chartOptions,
                indexAxis: 'x',
                barPercentage: 0.3,  // Even narrower bars
                categoryPercentage: 0.95,  // More space between categories
                maxBarThickness: 30,  // Limit maximum bar thickness
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  ...chartOptions.plugins,
                  legend: {
                    display: false
                  },
                  tooltip: {
                    callbacks: {
                      label: function(context) {
                        return `Students: ${context.raw}`;
                      }
                    }
                  }
                },
                scales: {
                  ...chartOptions.scales,
                  x: {
                    grid: {
                      display: false
                    },
                    title: {
                      display: true,
                      text: 'Class',
                      font: {
                        weight: 'bold'
                      }
                    },
                    ticks: {
                      maxRotation: 45,
                      minRotation: 45,
                      autoSkip: false
                    }
                  },
                  y: {
                    beginAtZero: true,
                    title: {
                      display: true,
                      text: 'Number of Students',
                      font: {
                        weight: 'bold'
                      }
                    },
                    ticks: {
                      precision: 0  // Show whole numbers only
                    }
                  }
                }
              }} />
            </div>
          </div>

       
        </div>

        {/* Bottom Row */}
        <div className="grid grid-cols-1 gap-6 mb-8">

          {/* Quick Actions */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
            <div className="mb-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Quick Actions</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {quickActions.map((action, index) => (
                <button
                  key={index}
                  onClick={() => handleQuickAction(action)}
                  className={`group relative p-4 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-indigo-500 dark:hover:border-indigo-500 transition-colors duration-200`}
                >
                  <div className="flex items-start">
                    <div className={`p-2 rounded-lg bg-${action.color}-100 dark:bg-${action.color}-900/30 text-${action.color}-600 dark:text-${action.color}-400`}>
                      <action.icon className="w-5 h-5" />
                    </div>
                    <div className="ml-4 text-left">
                      <h3 className="text-sm font-medium text-gray-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400">
                        {action.title}
                      </h3>
                      <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                        {action.description}
                      </p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="grid w-full gap-8">
        {/* Marks by Exam */}
       
      </div>
    </div>
  );
};

export default DashboardHome;
