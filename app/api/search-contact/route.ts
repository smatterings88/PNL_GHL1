import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    const jwt = process.env.NEXT_PUBLIC_GHL_JWT;
    const locationId = process.env.NEXT_PUBLIC_GHL_LOCATION_ID;

    if (!jwt || !locationId) {
      return NextResponse.json(
        { error: 'Missing GHL configuration' },
        { status: 500 }
      );
    }

    // Search for contact by email using the correct endpoint
    const searchResponse = await fetch(
      `https://rest.gohighlevel.com/v1/contacts?locationId=${locationId}&email=${encodeURIComponent(email)}`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${jwt}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!searchResponse.ok) {
      throw new Error(`Search failed: ${searchResponse.statusText}`);
    }

    const searchData = await searchResponse.json();
    
    // Check if any contacts were found
    if (!searchData.contacts || searchData.contacts.length === 0) {
      return NextResponse.json(
        { found: false, message: 'Contact not found' },
        { status: 404 }
      );
    }

    // Get the first matching contact
    const contact = searchData.contacts[0];

    // Update the contact with custom field
    const updateResponse = await fetch(
      `https://rest.gohighlevel.com/v1/contacts/${contact.id}`,
      {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${jwt}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          customFields: [
            {
              key: 'contact.pnl_referral_code',
              field_value: 'found'
            }
          ]
        }),
      }
    );

    if (!updateResponse.ok) {
      throw new Error(`Update failed: ${updateResponse.statusText}`);
    }

    return NextResponse.json({
      found: true,
      message: 'Contact found and updated successfully',
      contact: {
        id: contact.id,
        email: contact.email,
        name: `${contact.firstName || ''} ${contact.lastName || ''}`.trim() || 'N/A'
      }
    });

  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
