// The template's sample endpoint exposed the users collection through the Local
// API (which bypasses access control by default). Use Payload's authenticated API.
export const GET = () => Response.json({ error: 'Not found' }, { status: 404 })
