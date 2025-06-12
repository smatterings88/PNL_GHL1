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

    console.log('Searching for exact email match:', email);

    // Step 1: Use the exact email lookup endpoint (not fuzzy search)
    const findResponse = await fetch(
      `https://rest.gohighlevel.com/v1/contacts?locationId=${locationId}&email=${encodeURIComponent(email)}`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${jwt}`,
          'Content-Type': 'application/json',
        },
      }
    );

    console.log('Find response status:', findResponse.status);

    if (!findResponse.ok) {
      const errorText = await findResponse.text();
      console.error('Find request failed:', findResponse.status, errorText);
      throw new Error(`Find request failed: ${findResponse.statusText}`);
    }

    const findData = await findResponse.json();
    console.log('Find response data:', JSON.stringify(findData, null, 2));
    
    // Step 2: Extract contacts array and find exact email match
    const { contacts } = findData;
    
    if (!contacts || contacts.length === 0) {
      console.log('No contacts found for email:', email);
      return NextResponse.json(
        { found: false, message: 'Contact not found' },
        { status: 404 }
      );
    }

    // Find the contact with the exact email match (double-check)
    const target = contacts.find(c => c.email === email);
    
    if (!target) {
      console.log('No exact email match found among contacts:', contacts.map(c => c.email));
      return NextResponse.json(
        { found: false, message: `No contact exactly matching ${email}` },
        { status: 404 }
      );
    }

    console.log('Found exact match - Contact ID:', target.id, 'Name:', target.firstName, target.lastName, 'Email:', target.email);

    // Step 3: Update the contact with custom field using correct payload structure
    const updatePayload = {
      customField: {
        pnl_referral_code: 'found'
      }
    };

    console.log('Updating contact with payload:', JSON.stringify(updatePayload, null, 2));

    const updateResponse = await fetch(
      `https://rest.gohighlevel.com/v1/contacts/${target.id}`,
      {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${jwt}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatePayload),
      }
    );

    // Step 4: Log and verify the update response
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
          id: target.id,
          email: target.email,
          name: `${target.firstName || ''} ${target.lastName || ''}`.trim() || 'N/A'
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
