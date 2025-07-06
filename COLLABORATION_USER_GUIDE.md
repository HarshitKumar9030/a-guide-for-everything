# Collaborative Guides - User Guide

## Overview
Collaborative Guides allow Pro+ users to create and share guides that multiple team members can edit together in real-time. This feature includes live cursor tracking, real-time content synchronization, and team sharing capabilities.

## Features

### 🚀 **Real-time Collaboration**
- **Live Editing**: Multiple users can edit the same guide simultaneously
- **User Presence**: See who else is currently editing the guide
- **Live Cursors**: View other users' cursor positions and selections
- **Conflict Resolution**: Automatic handling of simultaneous edits

### 👥 **Team Sharing**
- **Team Access**: Share guides with your entire team
- **Individual Sharing**: Share specific guides with individual users
- **Public Sharing**: Make guides publicly accessible
- **Permission Management**: Control who can view vs edit guides

### 📁 **Organization**
- **Folders**: Organize guides into folders and subfolders
- **Folder Sharing**: Share entire folders with team members
- **Hierarchical Structure**: Create nested folder structures
- **Color Coding**: Customize folder colors for better organization

### 🤖 **AI Integration**
- **AI Writing Assistant**: Get AI suggestions while collaborating
- **Shared AI Context**: AI suggestions visible to all collaborators
- **Smart Formatting**: Automatic text formatting and improvements

## How to Use Collaborative Guides

### Step 1: Create a Collaborative Guide
1. Navigate to the **Guides** page
2. Click the **"Collaborative"** button (purple button with crown icon)
3. This creates a new guide with collaboration enabled
4. The guide will appear with a "Collaborative" badge

### Step 2: Share with Team Members
1. **Team Sharing (Automatic)**:
   - All collaborative guides are automatically visible to your team members
   - Team members can see and edit guides created by other team members
   
2. **Manual Sharing**:
   - Click the "Share" button on any guide
   - Choose sharing method:
     - **Team**: Share with all team members
     - **Email**: Share with specific email addresses
     - **Public**: Make publicly accessible

### Step 3: Real-time Editing
1. **Join a Guide**:
   - Click on any collaborative guide to start editing
   - You'll see other users currently editing in the presence indicator
   
2. **Live Collaboration**:
   - Type and see changes in real-time
   - View other users' cursors and selections
   - See typing indicators when others are actively editing
   
3. **Keyboard Shortcuts**:
   - `Ctrl+/` (or `Cmd+/`): Open help modal
   - `Ctrl+S` (or `Cmd+S`): Save guide
   - `Ctrl+Z` (or `Cmd+Z`): Undo
   - `Ctrl+Y` (or `Cmd+Y`): Redo

### Step 4: Organize with Folders
1. **Create Folders**:
   - Click "New Folder" in the guides interface
   - Choose folder name, color, and sharing settings
   
2. **Move Guides to Folders**:
   - Drag and drop guides into folders
   - Or edit guide settings to assign folder
   
3. **Share Folders**:
   - Share entire folder structures with team members
   - Nested folder permissions inherit from parent

## Team Management

### Setting Up Your Team
1. Go to **Dashboard** → **Team Management**
2. **Invite Members**:
   - Enter team member email addresses
   - Send invitations via email
   - Or create shareable invite links
   
3. **Manage Access**:
   - View all team members
   - Remove members if needed
   - Control collaboration permissions

### Team Guide Access
- **Automatic Discovery**: Team members automatically see each other's collaborative guides
- **Permission Levels**:
  - **Owner**: Full edit access, can share and delete
  - **Editor**: Can edit content, cannot delete
  - **Viewer**: Read-only access
  
- **Guide Filtering**:
  - Filter guides by "Collaborative" to see team guides
  - See guide ownership information
  - Identify which guides are shared vs personal

## Best Practices

### 📝 **Collaborative Writing**
1. **Use Clear Titles**: Make guide purposes obvious to collaborators
2. **Section Ownership**: Consider assigning sections to specific team members
3. **Regular Saves**: Auto-save is enabled, but manual saves ensure consistency
4. **Comment and Communicate**: Use the guide content to leave notes for team members

### 🎯 **Team Organization**
1. **Folder Structure**: Create logical folder hierarchies (e.g., "Projects/Web Dev/React Guides")
2. **Naming Conventions**: Use consistent naming for guides and folders
3. **Share Appropriately**: Not all guides need to be collaborative - use regular guides for personal notes

### 🔒 **Security & Privacy**
1. **Review Sharing**: Regularly review who has access to guides
2. **Team Management**: Keep team membership up to date
3. **Public Guides**: Be cautious when making guides public

## Troubleshooting

### Connection Issues
- **Socket Connection**: If real-time features aren't working, refresh the page
- **Network Problems**: Check internet connection for smooth collaboration
- **Browser Support**: Use modern browsers (Chrome, Firefox, Safari, Edge)

### Syncing Problems
- **Content Conflicts**: If edits conflict, the latest change wins
- **Lost Changes**: Auto-save prevents data loss, but save manually for important changes
- **User Presence**: If you don't see other users, they may have closed the guide

### Performance
- **Large Guides**: Very large guides may have slower real-time sync
- **Many Collaborators**: Performance may decrease with 10+ simultaneous editors
- **Browser Resources**: Close unnecessary tabs for better performance

## API Integration

For developers wanting to integrate with the collaborative features:

### Collaborative Guides API
```typescript
// Get collaborative guides
GET /api/guides/collaborative

// Share a guide
POST /api/guides/collaborative
{
  "guideId": "guide_id",
  "shareWith": "email@example.com",
  "shareType": "email" | "team" | "public"
}
```

### Folders API
```typescript
// Get folders
GET /api/folders

// Create folder
POST /api/folders
{
  "name": "Folder Name",
  "parentId": "optional_parent_id",
  "color": "#3B82F6",
  "isShared": true
}
```

### Socket.IO Events
```typescript
// Join guide collaboration
socket.emit('join-guide', {
  guideId: 'guide_id',
  userId: 'user_id',
  userName: 'User Name',
  userEmail: 'user@email.com'
});

// Content changes
socket.on('content-changed', (data) => {
  // Handle real-time content updates
});

// User presence
socket.on('user-joined', (user) => {
  // Handle user joining
});
```

## Support

Need help with collaborative features?
1. Check this guide first
2. Try the in-app help (press `Ctrl+/` in any guide)
3. Contact your team administrator
4. Report bugs through the feedback system

---

*This guide covers the collaborative features available with Pro+ subscription. Upgrade your plan to access team collaboration and real-time editing features.*
