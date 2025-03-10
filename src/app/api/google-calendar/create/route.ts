import { NextRequest, NextResponse } from "next/server";
import { google } from "googleapis";
import { currentUser, clerkClient } from "@clerk/nextjs/server";

const VALID_COLOR_IDS = new Set(['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11']);
interface EventRequest {
    title: string;
    start: string;
    end: string;
    description?: string;
    color?: string;
}

export async function POST(req: NextRequest) {
  try {
    const user = await currentUser();
    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

     // Parse and validate request body
     const body = await req.json();
     const eventData: EventRequest = {
       title: body.title,
       start: body.start,
       end: body.end,
       description: body.description,
       color: body.color,
     };
 
     // Validate dates
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
        { error: "No Google account connected or missing permissions" },
        { status: 400 }
      );
    }

    // Initialize Google OAuth client
    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET
    );
        
    oauth2Client.setCredentials({
      access_token: token
    });

    // Initialize Calendar API
    const calendar = google.calendar({
      version: 'v3',
      auth: oauth2Client
    });

    // Create base event object without color
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

    // Only add colorId if it's valid
    if (eventData.color) {
      const colorId = getValidColorId(eventData.color);
      if (colorId) {
        event.colorId = colorId;
      }
    }

    try {
      const response = await calendar.events.insert({
        calendarId: 'primary',
        requestBody: event,
        conferenceDataVersion: 0
      });

      return NextResponse.json({
        id: response.data.id,
        message: "Event created successfully",
        event: response.data
      });
    } catch (calendarError: any) {
      console.error("Google Calendar API Error:", calendarError);
      return NextResponse.json(
        { 
          error: "Failed to create event",
          details: calendarError.errors?.[0]?.message 
        },
        { status: 400 }
      );
    }
  } catch (error: any) {
    console.error("Server Error:", error);
    return NextResponse.json(
      { error: "Failed to create calendar event" },
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
  const exactMatch = Object.entries(colorMap).find(([hex]) => 
    hex.toLowerCase() === normalizedColor
  );

  return exactMatch ? exactMatch[1] : undefined;
}