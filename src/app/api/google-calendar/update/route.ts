import { NextRequest, NextResponse } from "next/server";
import { google } from "googleapis";
import { currentUser, clerkClient } from "@clerk/nextjs/server";

// Valid Google Calendar color IDs
const VALID_COLOR_IDS = new Set(['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11']);

interface EventUpdateRequest {
    id: string;
    title: string;
    start: string;
    end: string;
    description?: string;
    color?: string;
}

export async function PUT(req: NextRequest) {
  try {
    const user = await currentUser();
    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    // Parse and validate request body
    const body = await req.json();
    const eventData: EventUpdateRequest = {
      id: body.id,
      title: body.title,
      start: body.start,
      end: body.end,
      description: body.description,
      color: body.color,
    };

    // Validate required fields
    if (!eventData.id || !eventData.title || !eventData.start || !eventData.end) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

     // Validate and format dates
     const startDate = new Date(eventData.start);
     const endDate = new Date(eventData.end);
 
     if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
       return NextResponse.json(
         { error: "Invalid date format" },
         { status: 400 }
       );
     }
 
     if (startDate >= endDate) {
       return NextResponse.json(
         { error: "End time must be after start time" },
         { status: 400 }
       );
     }
 

    // Get Google OAuth token from Clerk
    const clerk = await clerkClient();
    const { token } = await clerk.users.getUserOauthAccessToken(
      user.id,
      "google"
    ).then(tokens => tokens.data[0] || {});

    if (!token) {
      return NextResponse.json(
        { error: "No Google account connected" },
        { status: 400 }
      );
    }

    // Initialize OAuth client
    const oauth2Client = new google.auth.OAuth2();
    oauth2Client.setCredentials({ access_token: token });

    const calendar = google.calendar({ 
      version: 'v3',
      auth: oauth2Client 
    });

    // Create base event object
    const event: any = {
      summary: eventData.title,
      description: eventData.description ?? '',
      start: {
        dateTime: startDate.toISOString(),
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
      },
      end: {
        dateTime: endDate.toISOString(),
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
      }
    };

    // Handle color
    if (eventData.color) {
      const colorId = getValidColorId(eventData.color);
      if (colorId) {
        event.colorId = colorId;
      }
    }

    try {
      // Verify event exists
      await calendar.events.get({
        calendarId: 'primary',
        eventId: eventData.id
      });

      // Update event
      const response = await calendar.events.update({
        calendarId: 'primary',
        eventId: eventData.id,
        requestBody: event
      });

      return NextResponse.json({
        success: true,
        id: response.data.id,
        event: response.data
      });
    } catch (calendarError: any) {
      console.error('Calendar API Error:', JSON.stringify(calendarError.errors, null, 2));
      
      if (calendarError.code === 404) {
        return NextResponse.json(
          { error: "Event not found" },
          { status: 404 }
        );
      }

      return NextResponse.json(
        { 
          error: "Failed to update event",
          details: calendarError.errors?.[0]?.message 
        },
        { status: calendarError.code || 400 }
      );
    }
  } catch (error: any) {
    console.error('Server Error:', error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// Helper function to get valid color ID
function getValidColorId(color: string): string | undefined {
  const colorMap: Record<string, string> = {
    '#7986cb': '1',  // Lavender
    '#33b679': '2',  // Sage
    '#8e24aa': '3',  // Grape
    '#e67c73': '4',  // Flamingo
    '#f6bf26': '5',  // Banana
    '#f4511e': '6',  // Tangerine
    '#039be5': '7',  // Peacock
    '#616161': '8',  // Graphite
    '#3f51b5': '9',  // Blueberry
    '#0b8043': '10', // Basil
    '#d50000': '11'  // Tomato
  };

  // If color is already a valid ID, return it
  if (VALID_COLOR_IDS.has(color)) {
    return color;
  }

  // Try to match hex color
  const normalizedColor = color.toLowerCase();
  return colorMap[normalizedColor];
}