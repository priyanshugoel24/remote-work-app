'use client'
import React, { useState, useEffect } from 'react';
import { 
  format, 
  startOfMonth, 
  endOfMonth, 
  startOfWeek, 
  endOfWeek, 
  eachDayOfInterval, 
  isSameMonth, 
  isSameDay, 
  addMonths, 
  subMonths,
  isWithinInterval
} from 'date-fns';
import { ChevronLeft, ChevronRight, Plus, X, Edit, Trash2, Calendar as CalendarIcon} from 'lucide-react';
import { handleCreateEvent, handleUpdateEvent, handleDeleteEvent } from '@/components/CalendarEvents';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";

interface CalendarEvent {
  id: string;
  title: string;
  start: string;
  end: string;
  description?: string;
  color?: string;
}

const CalendarPage: React.FC = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  
  const [formData, setFormData] = useState({
    title: '',
    start: new Date(),
    end: new Date(Date.now() + 3600000), // 1 hour from now
    description: '',
    color: '#3b82f6'
  });

  // Define fetchEvents function to be accessible throughout the component
  const fetchEvents = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/google-calendar');
      if (response.ok) {
        const data = await response.json();
        setEvents(data.events.map((event: any) => ({
          id: event.id,
          title: event.summary || 'Untitled Event',
          // Ensure dates are in ISO format
          start: event.start?.dateTime || event.start?.date,
          end: event.end?.dateTime || event.end?.date,
          description: event.description || '',
          color: getEventColor(event)
        })));
      } else {
        console.error('Failed to fetch events');
      }
    } catch (error) {
      console.error('Error fetching events:', error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch calendar events on component mount
  useEffect(() => {
    fetchEvents();
  }, []);

  // Get color based on event properties (simple implementation)
  const getEventColor = (event: any): string => {
    if (event.colorId) {
      // Map Google Calendar color IDs to hex colors
      const colorMap: Record<string, string> = {
        '1': '#7986cb', // Lavender
        '2': '#33b679', // Sage
        '3': '#8e24aa', // Grape
        '4': '#e67c73', // Flamingo
        '5': '#f6bf26', // Banana
        '6': '#f4511e', // Tangerine
        '7': '#039be5', // Peacock
        '8': '#616161', // Graphite
        '9': '#3f51b5', // Blueberry
        '10': '#0b8043', // Basil
        '11': '#d50000', // Tomato
      };
      return colorMap[event.colorId] || '#3b82f6';
    }
    return '#3b82f6'; // Default blue
  };

  // Calendar navigation
  const nextMonth = () => setCurrentDate(addMonths(currentDate, 1));
  const prevMonth = () => setCurrentDate(subMonths(currentDate, 1));
  const goToToday = () => setCurrentDate(new Date());

  // Generate calendar days
  const generateCalendarDays = () => {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart);
    const endDate = endOfWeek(monthEnd);

    return eachDayOfInterval({ start: startDate, end: endDate });
  };

  // Get events for a specific day
  const getEventsForDay = (day: Date) => {
    return events.filter(event => {
      try {
        // Handle both Date objects and ISO strings
        const eventStart = typeof event.start === 'object' ? event.start as Date : new Date(event.start);
        const eventEnd = typeof event.end === 'object' ? event.end as Date : new Date(event.end);
        
        // Create new Date objects to avoid modifying the original dates
        const startOfDay = new Date(eventStart);
        startOfDay.setHours(0, 0, 0, 0);
        
        const endOfDay = new Date(eventEnd);
        endOfDay.setHours(23, 59, 59, 999);
        
        return isWithinInterval(day, { 
          start: startOfDay,
          end: endOfDay
        });
      } catch (error) {
        console.error('Invalid date format:', event);
        return false;
      }
    });
  };

  // Handle opening the modal to create a new event
  const handleDateClick = (date: Date) => {
    setSelectedDate(date);
    setModalMode('create');
    
    const startTime = new Date(date);
    startTime.setHours(9, 0, 0, 0);
    
    const endTime = new Date(date);
    endTime.setHours(10, 0, 0, 0);
    
    setFormData({
      title: '',
      start: startTime,
      end: endTime,
      description: '',
      color: '#3b82f6'
    });
    
    setIsModalOpen(true);
  };

  // Handle opening the modal to edit an existing event
  const handleEventClick = (event: CalendarEvent) => {
    setSelectedEvent(event);
    setModalMode('edit');
    
    // Use new Date() instead of parseISO
    const startDate = new Date(event.start);
    const endDate = new Date(event.end);
    
    setFormData({
      title: event.title,
      start: startDate,
      end: endDate,
      description: event.description ?? '',
      color: event.color ?? '#3b82f6'
    });
    
    setIsModalOpen(true);
  };

  // Handle form input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement> | null, field?: string) => {
    if (e === null && field) {
      // Handle date picker changes
      return (date: Date | null) => {
        if (date) {
          setFormData(prev => ({ ...prev, [field]: date }));
        }
      };
    } else if (e) {
      // Handle regular input changes
      const { name, value } = e.target;
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  // Submit handler for create/edit event
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const eventData = {
        ...formData,
        id: modalMode === 'edit' && selectedEvent ? selectedEvent.id : undefined
      };
      
      if (modalMode === 'create') {
        await onEventCreate(eventData);
      } else {
        await onEventUpdate(eventData);
      }
      
      setIsModalOpen(false);
    } catch (error) {
      console.error('Error saving event:', error);
    }
  };

  // Delete event handler
  const handleDeleteClick = () => {
    if (selectedEvent) {
      setIsDeleteModalOpen(true);
    }
  };

  const confirmDelete = async () => {
    if (!selectedEvent) return;
    
    try {
      await onEventDelete(selectedEvent.id);
      setIsDeleteModalOpen(false);
      setIsModalOpen(false);
    } catch (error) {
      console.error('Error deleting event:', error);
    }
  };

  const onEventCreate = async (eventData: any) => {
    try {
      const response = await handleCreateEvent(eventData);
      // Optimistically add the new event to state
      const newEvent = {
        id: response.id,
        title: eventData.title,
        start: eventData.start,
        end: eventData.end,
        description: eventData.description,
        color: eventData.color
      };
      setEvents(prevEvents => [...prevEvents, newEvent]);
    } catch (error) {
      console.error('Failed to create event:', error);
      // If creation fails, refresh events to ensure consistency
      fetchEvents();
    }
  };

  const onEventUpdate = async (eventData: any) => {
    try {
      await handleUpdateEvent(eventData);
      // Optimistically update the event in state
      setEvents(prevEvents => 
        prevEvents.map(event => 
          event.id === eventData.id 
            ? {
                ...event,
                title: eventData.title,
                start: eventData.start,
                end: eventData.end,
                description: eventData.description,
                color: eventData.color
              }
            : event
        )
      );
    } catch (error) {
      console.error('Failed to update event:', error);
      // If update fails, refresh events to ensure consistency
      fetchEvents();
    }
  };

  const onEventDelete = async (eventId: string) => {
    try {
      await handleDeleteEvent(eventId);
      // Optimistically remove the event from state
      setEvents(prevEvents => 
        prevEvents.filter(event => event.id !== eventId)
      );
    } catch (error) {
      console.error('Failed to delete event:', error);
      // If deletion fails, refresh events to ensure consistency
      fetchEvents();
    }
  };

  return (
    <div className="container mx-auto p-4 dark:bg-gray-900">
      <div className="flex justify-between items-center mb-6">
        {/* Update header text */}
        <h1 className="text-2xl font-bold dark:text-white">Calendar</h1>
        
        <div className="flex items-center space-x-4">
          <button 
            onClick={goToToday}
            className="px-4 py-2 bg-gray-200 text-gray-900 dark:bg-gray-700 rounded-md hover:bg-gray-300 dark:hover:bg-gray-600 dark:text-gray-200 transition-colors"
          >
            Today
          </button>
          
          <div className="flex items-center">
            <button
              onClick={prevMonth}
              className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 dark:text-gray-200 transition-colors"
            >
              <ChevronLeft size={20} />
            </button>
            
            <h2 className="mx-4 font-semibold text-white dark:text-white">
              {format(currentDate, 'MMMM yyyy')}
            </h2>
            
            <button
              onClick={nextMonth}
              className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 dark:text-gray-200 transition-colors"
            >
              <ChevronRight size={20} />
            </button>
          </div>
          
          <button
            onClick={() => handleDateClick(new Date())}
            className="flex items-center px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
          >
            <Plus size={20} className="mr-1" />
            Create
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 dark:border-blue-400"></div>
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden border dark:border-gray-700">
          {/* Weekday headers */}
          <div className="grid grid-cols-7 border-b dark:border-gray-700">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
              <div key={day} className="py-3 text-center font-medium text-gray-700 dark:text-gray-400">
                {day}
              </div>
            ))}
          </div>
          
          {/* Calendar grid */}
          <div className="grid grid-cols-7">
            {generateCalendarDays().map((day, i) => {
              const dayEvents = getEventsForDay(day);
              const isCurrentMonth = isSameMonth(day, currentDate);
              const isToday = isSameDay(day, new Date());
              
              return (
                <div 
                  key={i}
                  onClick={() => handleDateClick(day)}
                  className={`min-h-28 p-2 border border-gray-200 dark:border-gray-700 transition-all hover:bg-gray-50 dark:hover:bg-gray-750 ${
                    isCurrentMonth ? 'text-gray-900 dark:text-gray-100' : 'text-gray-400 dark:text-gray-500'
                  } ${isToday ? 'bg-blue-50 dark:bg-blue-900/20' : ''}`}
                >
                  {/* Update day number color */}
                  <div className={`text-right mb-1 ${
                    isToday ? 'font-bold text-blue-600 dark:text-blue-400' : 'text-gray-900 dark:text-gray-300'
                  }`}>
                    {format(day, 'd')}
                  </div>
                  
                  <div className="space-y-1.5 max-h-24 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600">
                    {dayEvents.map(event => (
                      <div 
                        key={event.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEventClick(event);
                        }}
                        className="text-xs p-1.5 rounded-md truncate cursor-pointer hover:opacity-90 transition-opacity shadow-sm"
                        style={{ backgroundColor: event.color ?? '#3b82f6', color: 'white' }}
                      >
                        {format(new Date(event.start), 'HH:mm')} {event.title}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Modal Backdrop */}
      {(isModalOpen || isDeleteModalOpen) && (
        <div className="fixed inset-0 bg-black/50 dark:bg-black/70 backdrop-blur-sm flex items-center justify-center z-50">
          {/* Create/Edit Modal */}
          {isModalOpen && (
            <div className="bg-white dark:bg-gray-800 rounded-xl w-full max-w-md p-6 shadow-xl">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {modalMode === 'create' ? 'Create Event' : 'Edit Event'}
                </h3>
                <button 
                  onClick={() => setIsModalOpen(false)}
                  className="p-1.5 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 dark:text-gray-400 transition-colors"
                >
                  <X size={20} />
                </button>
              </div>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label htmlFor="title" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Title
                  </label>
                  <input
                    id="title"
                    type="text"
                    name="title"
                    value={formData.title}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 text-gray-900 bg-white border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 outline-none transition-all"
                    required
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="start-time" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Start
                    </label>
                    <div className="relative">
                      <DatePicker
                        selected={formData.start}
                        onChange={handleInputChange(null, 'start')}
                        showTimeSelect
                        dateFormat="MMMM d, yyyy h:mm aa"
                        className="w-full px-3 py-2 text-gray-900 bg-white border border-gray-300 
                          dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg 
                          focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 outline-none transition-all
                          placeholder:text-gray-500 dark:placeholder:text-gray-400"
                        wrapperClassName="w-full"
                      />
                      <CalendarIcon 
                        size={18} 
                        className="absolute right-3 top-3 text-gray-400 dark:text-gray-500 pointer-events-none" 
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label htmlFor="end-time" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      End
                    </label>
                    <div className="relative">
                      <DatePicker
                        selected={formData.end}
                        onChange={handleInputChange(null, 'end')}
                        showTimeSelect
                        dateFormat="MMMM d, yyyy h:mm aa"
                        className="w-full px-3 py-2 text-gray-900 bg-white border border-gray-300 
                          dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg 
                          focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 outline-none transition-all
                          placeholder:text-gray-500 dark:placeholder:text-gray-400"
                        wrapperClassName="w-full"
                        minDate={formData.start}
                        minTime={formData.start}
                        maxTime={new Date(new Date(formData.start).setHours(23, 59))}
                      />
                      <CalendarIcon 
                        size={18} 
                        className="absolute right-3 top-3 text-gray-400 dark:text-gray-500 pointer-events-none" 
                      />
                    </div>
                  </div>
                </div>
                
                <div>
                  <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Description
                  </label>
                  <textarea
                    id="description"
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 text-gray-900 bg-white border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 outline-none transition-all"
                    rows={3}
                  />
                </div>
                
                <div>
                  <label htmlFor="event-color" className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Color</label>
                  <input
                    id="event-color"
                    type="color"
                    name="color"
                    value={formData.color}
                    onChange={handleInputChange}
                    className="w-full h-10 p-1 border dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 outline-none transition-all"
                  />
                </div>
                
                <div className="flex justify-between mt-6">
                  {modalMode === 'edit' && (
                    <button
                      type="button"
                      onClick={handleDeleteClick}
                      className="flex items-center px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                    >
                      <Trash2 size={18} className="mr-1" />
                      Delete
                    </button>
                  )}
                  
                  <div className="flex space-x-2 ml-auto">
                    <button
                      type="button"
                      onClick={() => setIsModalOpen(false)}
                      className="px-4 py-2 text-gray-700 border border-gray-300 dark:border-gray-600 dark:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    >
                      Cancel
                    </button>
                    
                    <button
                      type="submit"
                      className="flex items-center px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                    >
                      {modalMode === 'create' ? (
                        <>
                          <Plus size={18} className="mr-1" />
                          Create
                        </>
                      ) : (
                        <>
                          <Edit size={18} className="mr-1" />
                          Update
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </form>
            </div>
          )}

          {/* Delete Modal */}
          {isDeleteModalOpen && (
            <div className="bg-white dark:bg-gray-800 rounded-xl w-full max-w-sm p-6 shadow-xl">
              <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Delete Event</h3>
              <p className="mb-6 text-gray-700 dark:text-gray-300">
                Are you sure you want to delete "{selectedEvent?.title}"?
              </p>
              
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setIsDeleteModalOpen(false)}
                  className="px-4 py-2 border dark:border-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 dark:text-gray-300 transition-colors"
                >
                  Cancel
                </button>
                
                <button
                  onClick={confirmDelete}
                  className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                >
                  Delete
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default CalendarPage;