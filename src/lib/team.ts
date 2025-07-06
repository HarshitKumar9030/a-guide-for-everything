import { connectToDatabase } from '@/lib/mongodb';

export interface TeamMember {
  id: string;
  email: string;
  name: string;
  role: string;
  joinedAt: Date;
  status: string;
}

export async function getUserTeamMembers(userEmail: string): Promise<TeamMember[]> {
  try {
    const { db } = await connectToDatabase();
    
    // Find user by email
    const user = await db.collection('users').findOne({ email: userEmail });
    if (!user) {
      return [];
    }

    const userId = user._id.toString();
    
    // Get teams where user is owner or member
    const teams = await db.collection('teams').find({
      $or: [
        { ownerId: userId },
        { 'members.userId': userId }
      ]
    }).toArray();

    const allMembers: TeamMember[] = [];
    const seenEmails = new Set<string>();
    
    for (const team of teams) {
      // Add owner as member
      const owner = await db.collection('users').findOne({ _id: team.ownerId });
      if (owner && !seenEmails.has(owner.email) && owner.email !== userEmail) {
        seenEmails.add(owner.email);
        allMembers.push({
          id: team.ownerId,
          email: owner.email,
          name: owner.name || owner.email,
          role: 'owner',
          joinedAt: team.createdAt || new Date(),
          status: 'active'
        });
      }
      
      // Add team members
      if (team.members) {
        for (const member of team.members) {
          if (member.status === 'active' && !seenEmails.has(member.email) && member.email !== userEmail) {
            seenEmails.add(member.email);
            allMembers.push({
              id: member.userId,
              email: member.email,
              name: member.name || member.email,
              role: member.role || 'member',
              joinedAt: member.joinedAt || new Date(),
              status: member.status || 'active'
            });
          }
        }
      }
    }
    
    return allMembers;
  } catch (error) {
    console.error('Error getting team members:', error);
    return [];
  }
}

export async function isUserInTeam(userEmail: string, targetEmail: string): Promise<boolean> {
  const teamMembers = await getUserTeamMembers(userEmail);
  return teamMembers.some(member => member.email === targetEmail);
}

export async function getTeamMemberEmails(userEmail: string): Promise<string[]> {
  const teamMembers = await getUserTeamMembers(userEmail);
  return teamMembers.map(member => member.email);
}
