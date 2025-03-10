import { NextRequest, NextResponse } from "next/server";
import { google } from "googleapis";
import { currentUser, clerkClient } from "@clerk/nextjs/server";

export async function DELETE(req: NextRequest) {
  try {
    const user = await currentUser();
    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    // Get the event ID from query params
    const url = new URL(req.url);
    const id = url.searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: "Event ID is required" },
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

    try {
      // Delete the event
      await calendar.events.delete({
        calendarId: 'primary',
        eventId: id
      });

      return NextResponse.json({
        message: "Event deleted successfully"
      });
    } catch (calendarError: any) {
      console.error("Google Calendar API Error:", calendarError);

      if (calendarError.code === 401 || calendarError.code === 403) {
        return NextResponse.json(
          { error: "Calendar access denied. Please check permissions." },
          { status: 403 }
        );
      } else if (calendarError.code === 404) {
        return NextResponse.json(
          { error: "Event not found" },
          { status: 404 }
        );
      }

      throw calendarError;
    }
  } catch (error: any) {
    console.error("Server Error:", error);
        
    return NextResponse.json(
      { error: "Failed to delete calendar event" },
      { status: 500 }
    );
  }
}