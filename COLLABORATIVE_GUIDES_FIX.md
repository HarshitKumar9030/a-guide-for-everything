# Collaborative Guides Fix

## Issue
Collaborative guides were not appearing on other team members' guides page because:
1. Collaborative guides created weren't automatically shared with team members
2. The guides page was only showing the user's own guides, not shared collaborative guides

## Fix Applied

### 1. Updated Guide Creation (`/api/guides/route.ts`)
- When creating a collaborative guide, it now automatically fetches team members and adds them to `sharedWith` array
- This ensures all team members can see the collaborative guide immediately

### 2. Updated Guides Page (`/app/guides/page.tsx`)
- Combined user's own guides with collaborative guides from team members
- Removed duplicate guides using `_id`
- Fetch collaborative guides for all users (not just Pro+ users)

### 3. Added Test Endpoint (`/api/guides/share-with-team`)
- POST endpoint to manually share any existing guide with team members
- Useful for testing and retroactively sharing existing guides

## How It Works Now

1. **Creating a collaborative guide**:
   - User creates a guide with `collaborative: true`
   - System automatically fetches their team members
   - Adds all team member emails to `sharedWith` array
   - Guide appears immediately on all team members' guides page

2. **Viewing guides**:
   - User sees their own guides + collaborative guides shared with them
   - Guides are deduplicated by `_id`
   - All filtering and search works across both sets

## Testing

1. **Create a collaborative guide**:
   - Go to guides page as a Pro+ user
   - Click "Collaborative" button to create a new collaborative guide
   - Guide should appear on all team members' guides pages

2. **Manual sharing** (for testing existing guides):
   ```bash
   curl -X POST http://localhost:3000/api/guides/share-with-team \
     -H "Content-Type: application/json" \
     -d '{"guideId": "your-guide-id"}'
   ```

3. **Verify collaborative access**:
   - Open the same guide on different browsers/accounts
   - Check that real-time collaboration works with Socket.IO server on port 3001

## Socket.IO Server

The standalone Socket.IO server (`socket-server.js`) is running on port 3001 and handles:
- Real-time text editing
- User presence (seeing other users)
- Cursor position sync
- Automatic cleanup when users disconnect

Start both servers:
```bash
# Terminal 1: Socket.IO server
npm run dev:socket

# Terminal 2: Next.js app
npm run dev
```

Or run both together:
```bash
npm run dev:all
```

## Next Steps

- Test end-to-end collaborative editing with multiple users
- Add UI indicators for collaborative vs. personal guides
- Consider adding real-time notifications when guides are shared
- Add guide permission management UI
