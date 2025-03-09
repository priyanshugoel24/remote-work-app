import { NextRequest, NextResponse } from "next/server";
import { google } from "googleapis";
import { currentUser, clerkClient } from "@clerk/nextjs/server";

export async function GET(req: NextRequest) {
  try {
    const user = await currentUser();
    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
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

    try {
      // Fetch calendar events
      const response = await calendar.events.list({
        calendarId: 'primary',
        timeMin: new Date().toISOString(),
        timeMax: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        maxResults: 10,
        singleEvents: true,
        orderBy: 'startTime',
      });

      return NextResponse.json({
        events: response.data.items || [],
        nextPageToken: response.data.nextPageToken
      });
    } catch (calendarError: any) {
      console.error("Google Calendar API Error:", calendarError);

      if (calendarError.code === 401 || calendarError.code === 403) {
        return NextResponse.json(
          { error: "Calendar access denied. Please check permissions." },
          { status: 403 }
        );
      }

      throw calendarError; // Let the outer catch handle other errors
    }
  } catch (error: any) {
    console.error("Server Error:", error);
    
    return NextResponse.json(
      { error: "Failed to fetch calendar events" },
      { status: 500 }
    );
  }
}