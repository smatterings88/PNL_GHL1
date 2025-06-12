import { NextRequest, NextResponse } from 'next/server';

// Force this API route to always run at request-time
export const dynamic = 'force-dynamic';

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

    console.log('Searching for contact with email:', email);

    // Step 1: Use the exact email lookup endpoint
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

    console.log('Search response status:', searchResponse.status);

    if (!searchResponse.ok) {
      const errorText = await searchResponse.text();
      console.error('Search failed:', searchResponse.status, errorText);
      throw new Error(`Search failed: ${searchResponse.statusText}`);
    }

    const searchData = await searchResponse.json();
    console.log('Search response data:', JSON.stringify(searchData, null, 2));
    
    // Check if any contacts were found
    if (!searchData.contacts || searchData.contacts.length === 0) {
      console.log('No contacts found for email:', email);
      return NextResponse.json(
        { found: false, message: 'Contact not found' },
        { status: 404 }
      );
    }

    // Get the first matching contact
    const contact = searchData.contacts[0];
    console.log('Found contact:', contact.id, contact.email);

    // Step 2: Update the contact with custom field using correct payload structure
    const updatePayload = {
      customField: {
        pnl_referral_code: 'found'
      }
    };

    console.log('Updating contact with payload:', JSON.stringify(updatePayload, null, 2));

    const updateResponse = await fetch(
      `https://rest.gohighlevel.com/v1/contacts/${contact.id}`,
      {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${jwt}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatePayload),
      }
    );

    // Step 3: Log and verify the update response
    console.log('Update response status:', updateResponse.status);
    
    const updateBody = await updateResponse.json();
    console.log('Update response body:', JSON.stringify(updateBody, null, 2));

    if (!updateResponse.ok) {
      console.error('Update failed:', updateResponse.status, updateBody);
      throw new Error(`Update failed: ${updateResponse.statusText} - ${JSON.stringify(updateBody)}`);
    }

    // Verify the update was successful
    if (updateResponse.status === 200 || updateResponse.status === 204) {
      console.log('Contact updated successfully');
      
      return NextResponse.json({
        found: true,
        message: 'Contact found and updated successfully',
        contact: {
          id: contact.id,
          email: contact.email,
          name: `${contact.firstName || ''} ${contact.lastName || ''}`.trim() || 'N/A'
        },
        updateStatus: updateResponse.status,
        updateResponse: updateBody
      });
    } else {
      throw new Error(`Unexpected update response status: ${updateResponse.status}`);
    }

  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}
