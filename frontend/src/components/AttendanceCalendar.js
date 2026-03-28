import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

const AttendanceCalendar = ({ guardId, attendanceData = [], holidays = [] }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(null);

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const daysInMonth = (date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const firstDayOfMonth = (date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const previousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const getAttendanceStatus = (day) => {
    const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    
    // Check if it's a holiday
    const isHoliday = holidays.some(h => h.date === dateStr);
    if (isHoliday) {
      return { status: 'holiday', color: 'bg-yellow-100 border-yellow-400 text-yellow-800', label: 'Holiday' };
    }

    // Check attendance
    const attendance = attendanceData.find(a => a.date === dateStr);
    if (attendance) {
      switch (attendance.status) {
        case 'present':
          return { status: 'present', color: 'bg-green-100 border-green-400 text-green-800', label: 'Present' };
        case 'absent':
          return { status: 'absent', color: 'bg-red-100 border-red-400 text-red-800', label: 'Absent' };
        case 'half_day':
          return { status: 'half_day', color: 'bg-orange-100 border-orange-400 text-orange-800', label: 'Half Day' };
        case 'late':
          return { status: 'late', color: 'bg-purple-100 border-purple-400 text-purple-800', label: 'Late' };
        default:
          return { status: 'unknown', color: 'bg-gray-100 border-gray-300 text-gray-600', label: 'Unknown' };
      }
    }

    // Future dates or no data
    const today = new Date();
    const cellDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
    if (cellDate > today) {
      return { status: 'future', color: 'bg-gray-50 border-gray-200 text-gray-400', label: 'Future' };
    }

    return { status: 'no_data', color: 'bg-gray-100 border-gray-300 text-gray-500', label: 'No Data' };
  };

  const renderCalendar = () => {
    const days = [];
    const totalDays = daysInMonth(currentDate);
    const firstDay = firstDayOfMonth(currentDate);

    // Empty cells for days before month starts
    for (let i = 0; i < firstDay; i++) {
      days.push(
        <div key={`empty-${i}`} className="aspect-square p-2"></div>
      );
    }

    // Days of the month
    for (let day = 1; day <= totalDays; day++) {
      const { status, color, label } = getAttendanceStatus(day);
      const isToday = 
        day === new Date().getDate() && 
        currentDate.getMonth() === new Date().getMonth() && 
        currentDate.getFullYear() === new Date().getFullYear();

      days.push(
        <div
          key={day}
          onClick={() => setSelectedDate(day)}
          className={`
            aspect-square p-2 border-2 rounded-lg cursor-pointer
            transition-all duration-200 hover:scale-105
            ${color}
            ${isToday ? 'ring-2 ring-blue-500 ring-offset-2' : ''}
            ${selectedDate === day ? 'ring-2 ring-blue-600 ring-offset-2' : ''}
          `}
          title={label}
        >
          <div className="flex flex-col items-center justify-center h-full">
            <span className="text-sm font-semibold">{day}</span>
            {status !== 'future' && status !== 'no_data' && (
              <span className="text-xs mt-1 font-medium">
                {status === 'present' && '✓'}
                {status === 'absent' && '✗'}
                {status === 'half_day' && '½'}
                {status === 'late' && '⏰'}
                {status === 'holiday' && '🎉'}
              </span>
            )}
          </div>
        </div>
      );
    }

    return days;
  };

  const getMonthStats = () => {
    const totalDays = daysInMonth(currentDate);
    let present = 0, absent = 0, halfDay = 0, late = 0, holidaysCount = 0;

    for (let day = 1; day <= totalDays; day++) {
      const { status } = getAttendanceStatus(day);
      if (status === 'present') present++;
      if (status === 'absent') absent++;
      if (status === 'half_day') halfDay++;
      if (status === 'late') late++;
      if (status === 'holiday') holidaysCount++;
    }

    const workingDays = totalDays - holidaysCount;
    const attendancePercentage = workingDays > 0 ? ((present + halfDay * 0.5) / workingDays * 100).toFixed(1) : 0;

    return { present, absent, halfDay, late, holidaysCount, workingDays, attendancePercentage };
  };

  const stats = getMonthStats();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <CalendarIcon className="w-6 h-6 text-blue-600" />
          <h3 className="text-xl font-bold text-gray-900">Attendance Calendar</h3>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={previousMonth}>
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <span className="text-lg font-semibold text-gray-900 min-w-[180px] text-center">
            {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
          </span>
          <Button variant="outline" size="sm" onClick={nextMonth}>
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <p className="text-xs text-green-600 font-medium">Present</p>
          <p className="text-2xl font-bold text-green-700">{stats.present}</p>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-xs text-red-600 font-medium">Absent</p>
          <p className="text-2xl font-bold text-red-700">{stats.absent}</p>
        </div>
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
          <p className="text-xs text-orange-600 font-medium">Half Day</p>
          <p className="text-2xl font-bold text-orange-700">{stats.halfDay}</p>
        </div>
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
          <p className="text-xs text-purple-600 font-medium">Late</p>
          <p className="text-2xl font-bold text-purple-700">{stats.late}</p>
        </div>
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="text-xs text-yellow-600 font-medium">Holidays</p>
          <p className="text-2xl font-bold text-yellow-700">{stats.holidaysCount}</p>
        </div>
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-xs text-blue-600 font-medium">Attendance %</p>
          <p className="text-2xl font-bold text-blue-700">{stats.attendancePercentage}%</p>
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-4 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-green-100 border-2 border-green-400 rounded"></div>
          <span className="text-gray-700">Present</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-red-100 border-2 border-red-400 rounded"></div>
          <span className="text-gray-700">Absent</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-orange-100 border-2 border-orange-400 rounded"></div>
          <span className="text-gray-700">Half Day</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-purple-100 border-2 border-purple-400 rounded"></div>
          <span className="text-gray-700">Late</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-yellow-100 border-2 border-yellow-400 rounded"></div>
          <span className="text-gray-700">Holiday</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-gray-100 border-2 border-gray-300 rounded"></div>
          <span className="text-gray-700">No Data</span>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        {/* Day headers */}
        <div className="grid grid-cols-7 gap-2 mb-2">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <div key={day} className="text-center text-sm font-semibold text-gray-600 py-2">
              {day}
            </div>
          ))}
        </div>

        {/* Calendar days */}
        <div className="grid grid-cols-7 gap-2">
          {renderCalendar()}
        </div>
      </div>

      {/* Selected Date Info */}
      {selectedDate && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="font-semibold text-blue-900 mb-2">
            {monthNames[currentDate.getMonth()]} {selectedDate}, {currentDate.getFullYear()}
          </h4>
          <div className="text-sm text-blue-800">
            {(() => {
              const { status, label } = getAttendanceStatus(selectedDate);
              const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(selectedDate).padStart(2, '0')}`;
              const attendance = attendanceData.find(a => a.date === dateStr);
              const holiday = holidays.find(h => h.date === dateStr);

              if (holiday) {
                return (
                  <div>
                    <p className="font-medium">🎉 {holiday.name}</p>
                    <p className="text-xs mt-1">{holiday.description || 'Public Holiday'}</p>
                  </div>
                );
              }

              if (attendance) {
                return (
                  <div className="space-y-1">
                    <p><span className="font-medium">Status:</span> {label}</p>
                    {attendance.shift && <p><span className="font-medium">Shift:</span> {attendance.shift}</p>}
                    {attendance.marked_by && <p><span className="font-medium">Marked by:</span> {attendance.marked_by}</p>}
                    {attendance.notes && <p><span className="font-medium">Notes:</span> {attendance.notes}</p>}
                  </div>
                );
              }

              return <p>No attendance data for this date</p>;
            })()}
          </div>
        </div>
      )}
    </div>
  );
};

export default AttendanceCalendar;
