import { useState, useEffect } from 'react';
import { 
  Users, 
  GraduationCap, 
  FileText,
  TrendingUp,
  Calendar,
  UserCheck,
  UserX,
  AlertCircle,
  BookOpen
} from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { dashboardService } from '../services/dashboard.js';

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [classPerformance, setClassPerformance] = useState([]);
  const [examAbsentData, setExamAbsentData] = useState([]);
  const [classWiseAbsentData, setClassWiseAbsentData] = useState({});
  const [subjectStats, setSubjectStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      setError('');
      
      const [statsData, performanceData, classWiseData, subjectData] = await Promise.all([
        dashboardService.getDashboardStats(),
        dashboardService.getClassPerformanceOverview(),
        dashboardService.getClassWiseAbsentData(),
        dashboardService.getSubjectStats()
      ]);

      setStats(statsData);
      setClassPerformance(Array.isArray(performanceData) ? performanceData : []);
      setExamAbsentData(Array.isArray(statsData?.examAbsentData) ? statsData.examAbsentData : []);
      setClassWiseAbsentData(classWiseData || {});
      setSubjectStats(subjectData);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      setError('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md">
          <div className="flex items-center">
            <AlertCircle className="text-red-500 mr-3" size={20} />
            <p className="text-red-700">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  // Inline pie chart component
  const ClassPieChart = ({ examName, className, classData }) => {
    if (!classData || typeof classData !== 'object') {
      return (
        <div className="w-full h-64 flex items-center justify-center text-gray-500">
          <div className="text-center">
            <p className="text-sm">No data available</p>
          </div>
        </div>
      );
    }

    const data = [
      { name: 'Present', value: classData.presentCount || 0, color: '#10b981' },
      { name: 'Partial Absent', value: classData.partialAbsent || 0, color: '#f59e0b' },
      { name: 'Full Absent', value: classData.fullAbsent || 0, color: '#ef4444' }
    ];

    const RADIAN = Math.PI / 180;
    const renderCustomizedLabel = ({
      cx, cy, midAngle, innerRadius, outerRadius, percent
    }) => {
      const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
      const x = cx + radius * Math.cos(-midAngle * RADIAN);
      const y = cy + radius * Math.sin(-midAngle * RADIAN);

      if (percent < 0.05) return null;

      return (
        <text 
          x={x} 
          y={y} 
          fill="white" 
          textAnchor={x > cx ? 'start' : 'end'} 
          dominantBaseline="central"
          className="text-xs font-semibold"
        >
          {`${(percent * 100).toFixed(0)}%`}
        </text>
      );
    };

    const CustomTooltip = ({ active, payload }) => {
      if (active && payload && payload.length) {
        const totalStudents = classData.totalStudents || 0;
        const percentage = totalStudents > 0 ? ((payload[0].value / totalStudents) * 100).toFixed(1) : 0;
        return (
          <div className="bg-white p-2 border border-gray-200 rounded shadow-lg">
            <p className="text-sm font-medium">{`${payload[0].name}: ${payload[0].value}`}</p>
            <p className="text-xs text-gray-500">
              {`${percentage}%`}
            </p>
          </div>
        );
      }
      return null;
    };

    return (
      <div className="w-full h-64">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={renderCustomizedLabel}
              outerRadius={80}
              fill="#8884d8"
              dataKey="value"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
            <Legend 
              verticalAlign="bottom" 
              height={36}
              formatter={(value, entry) => (
                <span className="text-xs">{value}: {entry.payload.value}</span>
              )}
            />
          </PieChart>
        </ResponsiveContainer>
        
        <div className="mt-2 text-center">
          <p className="text-xs text-gray-500">
            Total: {classData.totalStudents || 0} students
          </p>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6">
            <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
            <p className="text-gray-600 mt-1">School management overview and analytics</p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 sm:gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div className="bg-blue-100 rounded-lg p-3">
                <GraduationCap className="text-blue-600" size={24} />
              </div>
              <span className="text-sm text-gray-500 font-medium">Total</span>
            </div>
            <div className="text-3xl font-bold text-gray-900">{stats?.totalClasses || 0}</div>
            <div className="text-sm text-gray-600 mt-1">Classes</div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div className="bg-green-100 rounded-lg p-3">
                <Users className="text-green-600" size={24} />
              </div>
              <span className="text-sm text-gray-500 font-medium">Total</span>
            </div>
            <div className="text-3xl font-bold text-gray-900">{stats?.totalStudents || 0}</div>
            <div className="text-sm text-gray-600 mt-1">Students</div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div className="bg-purple-100 rounded-lg p-3">
                <Calendar className="text-purple-600" size={24} />
              </div>
              <span className="text-sm text-gray-500 font-medium">Total</span>
            </div>
            <div className="text-3xl font-bold text-gray-900">{stats?.totalExams || 0}</div>
            <div className="text-sm text-gray-600 mt-1">Exams</div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div className="bg-indigo-100 rounded-lg p-3">
                <BookOpen className="text-indigo-600" size={24} />
              </div>
              <span className="text-sm text-gray-500 font-medium">Unique</span>
            </div>
            <div className="text-3xl font-bold text-gray-900">{subjectStats?.uniqueSubjectCount || 0}</div>
            <div className="text-sm text-gray-600 mt-1">Subjects</div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div className="bg-orange-100 rounded-lg p-3">
                <TrendingUp className="text-orange-600" size={24} />
              </div>
              <span className="text-sm text-gray-500 font-medium">Average</span>
            </div>
            <div className="text-3xl font-bold text-gray-900">{stats?.overallAbsentStats?.avgTotalAbsent || 0}</div>
            <div className="text-sm text-gray-600 mt-1">Absent per Exam</div>
          </div>
        </div>

        {/* Two Column Layout */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 lg:gap-8 mb-8">
          {/* Class Distribution */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center mb-6">
              <Users className="text-gray-600 mr-3" size={20} />
              <h2 className="text-lg font-semibold text-gray-900">Class Distribution</h2>
            </div>
            
            {classPerformance.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No class data available
              </div>
            ) : (
              <div className="space-y-4">
                {classPerformance && classPerformance.length > 0 && classPerformance.map((classData, index) => {
                  const maxStudents = Math.max(...classPerformance.map(c => c.totalStudents || 0));
                  const barWidth = maxStudents > 0 ? (classData.totalStudents / maxStudents) * 100 : 0;
                  
                  return (
                    <div key={index} className="flex items-center">
                      <div className="w-20 flex-shrink-0 text-sm font-medium text-gray-700">
                        {classData._id}
                      </div>
                      <div className="flex-1 mx-4">
                        <div className="bg-gray-200 rounded-full h-6 relative overflow-hidden">
                          <div 
                            className="bg-gradient-to-r from-blue-500 to-blue-600 h-full rounded-full transition-all duration-500 flex items-center justify-end pr-2"
                            style={{ width: `${barWidth}%` }}
                          >
                            {barWidth > 20 && (
                              <span className="text-white text-xs font-medium">
                                {classData.totalStudents}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="w-24 flex-shrink-0 text-right text-sm text-gray-600">
                        {classData.totalStudents} students
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Attendance Summary */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center mb-6">
              <UserCheck className="text-gray-600 mr-3" size={20} />
              <h2 className="text-lg font-semibold text-gray-900">Attendance Summary</h2>
            </div>
            
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <UserCheck className="text-green-600 mx-auto mb-2" size={24} />
                <div className="text-2xl font-bold text-green-700">
                  {stats?.overallAbsentStats?.avgPresent || 0}
                </div>
                <div className="text-sm text-green-600">Avg Present</div>
              </div>
              
              <div className="text-center p-4 bg-amber-50 rounded-lg">
                <AlertCircle className="text-amber-600 mx-auto mb-2" size={24} />
                <div className="text-2xl font-bold text-amber-700">
                  {stats?.overallAbsentStats?.avgPartialAbsent || 0}
                </div>
                <div className="text-sm text-amber-600">Avg Partial</div>
              </div>
              
              <div className="text-center p-4 bg-red-50 rounded-lg">
                <UserX className="text-red-600 mx-auto mb-2" size={24} />
                <div className="text-2xl font-bold text-red-700">
                  {stats?.overallAbsentStats?.avgFullAbsent || 0}
                </div>
                <div className="text-sm text-red-600">Avg Full Absent</div>
              </div>
            </div>

            {/* Subject Statistics - Compact Version */}
            <div className="border-t pt-4">
              <div className="flex items-center mb-4">
                <BookOpen className="text-gray-600 mr-2" size={16} />
                <h3 className="text-sm font-semibold text-gray-900">Subject Overview</h3>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-3 bg-indigo-50 rounded-lg">
                  <div className="text-xl font-bold text-indigo-700">
                    {subjectStats?.uniqueSubjectCount || 0}
                  </div>
                  <div className="text-xs text-indigo-600">Unique Subjects</div>
                </div>
                
                <div className="p-3 bg-gray-50 rounded-lg">
                  <div className="text-xs font-medium text-gray-700 mb-1">All Subjects:</div>
                  <div className="flex flex-wrap gap-1">
                    {subjectStats?.uniqueSubjects && Array.isArray(subjectStats.uniqueSubjects) && subjectStats.uniqueSubjects.map((subject, index) => (
                      <span key={index} className="inline-block px-1 py-0.5 text-xs bg-white text-gray-600 rounded">
                        {subject}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Exam-wise Absent Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
          <div className="flex items-center mb-6">
            <FileText className="text-gray-600 mr-3" size={20} />
            <h2 className="text-lg font-semibold text-gray-900">Exam-wise Attendance</h2>
          </div>
          
          {examAbsentData.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No exam data available
            </div>
          ) : (
            <div className="overflow-x-auto overflow-y-hidden">
              <div className="min-w-full">
                <table className="w-full min-w-[600px]">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-2 sm:px-4 text-xs sm:text-sm font-semibold text-gray-700 whitespace-nowrap">Exam Name</th>
                    <th className="text-center py-3 px-2 sm:px-4 text-xs sm:text-sm font-semibold text-gray-700 whitespace-nowrap">Total</th>
                    <th className="text-center py-3 px-2 sm:px-4 text-xs sm:text-sm font-semibold text-green-600 whitespace-nowrap">Present</th>
                    <th className="text-center py-3 px-2 sm:px-4 text-xs sm:text-sm font-semibold text-amber-600 whitespace-nowrap">Partial</th>
                    <th className="text-center py-3 px-2 sm:px-4 text-xs sm:text-sm font-semibold text-red-600 whitespace-nowrap">Full Absent</th>
                    <th className="text-center py-3 px-2 sm:px-4 text-xs sm:text-sm font-semibold text-gray-700 whitespace-nowrap">Total Absent</th>
                  </tr>
                </thead>
                <tbody>
                  {examAbsentData && Array.isArray(examAbsentData) && examAbsentData.map((exam, index) => (
                    <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-2 sm:px-4 text-xs sm:text-sm font-medium text-gray-900 whitespace-nowrap">{exam.examName}</td>
                      <td className="py-3 px-2 sm:px-4 text-xs sm:text-sm text-gray-600 text-center whitespace-nowrap">{exam.totalStudents}</td>
                      <td className="py-3 px-2 sm:px-4 text-xs sm:text-sm text-green-600 text-center font-medium whitespace-nowrap">{exam.presentCount}</td>
                      <td className="py-3 px-2 sm:px-4 text-xs sm:text-sm text-amber-600 text-center font-medium whitespace-nowrap">{exam.partialAbsent}</td>
                      <td className="py-3 px-2 sm:px-4 text-xs sm:text-sm text-red-600 text-center font-medium whitespace-nowrap">{exam.fullAbsent}</td>
                      <td className="py-3 px-2 sm:px-4 text-xs sm:text-sm text-gray-700 text-center font-semibold whitespace-nowrap">{exam.totalAbsent}</td>
                    </tr>
                  ))}
                  {stats?.overallAbsentStats && (
                    <tr className="bg-gray-50 font-semibold">
                      <td className="py-3 px-4 text-sm text-gray-900">Average per Exam</td>
                      <td className="py-3 px-4 text-sm text-gray-700 text-center">{stats.overallAbsentStats.avgTotalStudents}</td>
                      <td className="py-3 px-4 text-sm text-green-700 text-center">{stats.overallAbsentStats.avgPresent}</td>
                      <td className="py-3 px-4 text-sm text-amber-700 text-center">{stats.overallAbsentStats.avgPartialAbsent}</td>
                      <td className="py-3 px-4 text-sm text-red-700 text-center">{stats.overallAbsentStats.avgFullAbsent}</td>
                      <td className="py-3 px-4 text-sm text-gray-900 text-center">{stats.overallAbsentStats.avgTotalAbsent}</td>
                    </tr>
                  )}
                </tbody>
              </table>
              </div>
            </div>
          )}
        </div>

        {/* Class-wise Charts - Each class shows 3 exam pie charts */}
        {Object.keys(classWiseAbsentData).length > 0 && Object.keys(classWiseAbsentData).length > 0 && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center mb-6">
              <GraduationCap className="text-gray-600 mr-3" size={20} />
              <h2 className="text-lg font-semibold text-gray-900">Class-wise Attendance Analysis</h2>
            </div>
            
            {/* Get all unique classes and sort them */}
            {(() => {
              if (!classWiseAbsentData || typeof classWiseAbsentData !== 'object') {
                return <div className="text-center py-8 text-gray-500">No class-wise data available</div>;
              }

              const allClasses = new Set();
              Object.values(classWiseAbsentData).forEach(examData => {
                if (examData && examData.classes && typeof examData.classes === 'object') {
                  Object.keys(examData.classes).forEach(className => {
                    allClasses.add(className);
                  });
                }
              });
              
              const sortedClasses = Array.from(allClasses).sort((a, b) => {
                // Sort order: LKG, UKG, I, II, III, IV, V
                const order = ['LKG', 'UKG', 'I', 'II', 'III', 'IV', 'V'];
                const aIndex = order.indexOf(a);
                const bIndex = order.indexOf(b);
                return aIndex - bIndex;
              });
              
              return sortedClasses.map(className => (
                <div key={className} className="mb-8">
                  <h3 className="text-base font-semibold text-gray-800 mb-4 pb-2 border-b border-gray-200">
                    Class {className}
                  </h3>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                    {classWiseAbsentData && Object.entries(classWiseAbsentData).map(([examName, examData]) => {
                      if (!examData || !examData.classes || typeof examData.classes !== 'object') {
                        return null;
                      }
                      const classData = examData.classes[className];
                      if (!classData) return null;
                      
                      return (
                        <div key={`${className}-${examName}`} className="text-center">
                          <h4 className="text-sm font-medium text-gray-600 mb-3">
                            {examName.split(' ')[0]} Exam
                          </h4>
                          <ClassPieChart
                            examName={examName}
                            className={className}
                            classData={classData}
                          />
                        </div>
                      );
                    })}
                  </div>
                </div>
              ));
            })()}
          </div>
        )}
      </div>
    </div>
  );
}
