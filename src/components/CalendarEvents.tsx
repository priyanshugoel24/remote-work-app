'use client'
import { useEffect, useState } from "react";
import { useUser, useAuth } from "@clerk/nextjs";
import toast from 'react-hot-toast';

const CalendarEvents = () => {
  const { user, isSignedIn } = useUser();
  const { getToken } = useAuth(); 
  interface Event {
    id: string;
    summary: string;
    start: {
      dateTime?: string;
    };
  }

  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isSignedIn) {
      fetchEvents();
    }
  }, [isSignedIn]);

  const fetchEvents = async () => {
    try {
      if (!user) return;

      const token = await getToken({ template: "google" });

      const response = await fetch(`/api/google-calendar?token=${token}`, {
        method : "GET",
      });
      if (!response.ok) throw new Error("Failed to fetch events");

      const data = await response.json();
      setEvents(data.events || []);
    } catch (err : any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!isSignedIn) {
    return <p>Please sign in to view your calendar events.</p>;
  }

  if (loading) return <p>Loading events...</p>;
  if (error) return <p>Error: {error}</p>;

  return (
    <div className="p-4 bg-white rounded-lg shadow-md">
      <h2 className="text-lg font-semibold mb-3">Upcoming Events</h2>
      {events.length === 0 ? (
        <p>No upcoming events.</p>
      ) : (
        <ul className="list-disc pl-4">
          {events.map((event) => (
            <li key={event.id} className="mb-2">
              <strong>{event.summary}</strong> -{" "}
              {event.start?.dateTime
                ? new Date(event.start.dateTime).toLocaleString()
                : "All day"}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export const handleCreateEvent = async (eventData: any) => {
  const promise = fetch('/api/google-calendar/create', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(eventData),
  }).then(async (res) => {
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to create event');
    return data; // Should include { id: string, event: object }
  });

  return toast.promise(promise, {
    loading: 'Creating event...',
    success: 'Event created successfully!',
    error: (err) => `Error: ${err.message}`,
  });
};

export const handleUpdateEvent = async (eventData: any) => {
  const promise = fetch('/api/google-calendar/update', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(eventData),
  }).then(async (res) => {
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to update event');
    return data;
  });

  return toast.promise(promise, {
    loading: 'Updating event...',
    success: 'Event updated successfully!',
    error: (err) => `Error: ${err.message}`,
  });
};

export const handleDeleteEvent = async (eventId: string) => {
  const promise = fetch(`/api/google-calendar/delete?id=${eventId}`, {
    method: 'DELETE',
  }).then(async (res) => {
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to delete event');
    return data;
  });

  return toast.promise(promise, {
    loading: 'Deleting event...',
    success: 'Event deleted successfully!',
    error: (err) => `Error: ${err.message}`,
  });
};

export default CalendarEvents;