import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { sendEmail, generatePasswordResetEmail } from '@/lib/email';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';

export async function POST(req: NextRequest) {
  try {
    const { email, token, newPassword } = await req.json();

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    const { db } = await connectToDatabase();

    if (!token && !newPassword) {
      const user = await db.collection('users').findOne({ email });
      
      if (!user) {
        return NextResponse.json({
          message: 'If an account with that email exists, you will receive a password reset link.'
        });
      }

      const resetToken = crypto.randomBytes(32).toString('hex');
      const resetTokenExpiry = new Date(Date.now() + 3600000); 

      await db.collection('users').updateOne(
        { email },
        {
          $set: {
            resetToken,
            resetTokenExpiry,
            updatedAt: new Date()
          }
        }
      );      
      const resetUrl = `${process.env.NEXTAUTH_URL}/auth/reset-password?token=${resetToken}&email=${encodeURIComponent(email)}`;
      const { html, text } = generatePasswordResetEmail(resetUrl, email);
      
      try {
        await sendEmail({
          to: email,
          subject: 'Reset Your Password - AGFE',
          html,
          text
        });
        console.log(`Password reset email sent to ${email}`);
      } catch (emailError) {
        console.error('Failed to send email:', emailError);

      }
      
      return NextResponse.json({
        message: 'Password reset link has been sent to your email',
        ...(process.env.NODE_ENV === 'development' && {
          resetToken,
          resetUrl
        })
      });
    }

    if (token && newPassword) {
      if (newPassword.length < 6) {
        return NextResponse.json(
          { error: 'Password must be at least 6 characters long' },
          { status: 400 }
        );
      }

      const user = await db.collection('users').findOne({
        email,
        resetToken: token,
        resetTokenExpiry: { $gt: new Date() }
      });

      if (!user) {
        return NextResponse.json(
          { error: 'Invalid or expired reset token' },
          { status: 400 }
        );
      }

      const hashedPassword = await bcrypt.hash(newPassword, 12);

      await db.collection('users').updateOne(
        { email },
        {
          $set: {
            password: hashedPassword,
            updatedAt: new Date()
          },
          $unset: {
            resetToken: "",
            resetTokenExpiry: ""
          }
        }
      );

      return NextResponse.json({
        message: 'Password has been reset successfully'
      });
    }

    return NextResponse.json(
      { error: 'Invalid request' },
      { status: 400 }
    );

  } catch (error) {
    console.error('Forgot password error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
