import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { connectToDatabase } from "@/lib/mongodb";
import { sendEmail } from "@/lib/email";
import crypto from "crypto";

export async function POST(req: NextRequest) {
  try {
    const { name, email, password } = await req.json();

    if (!name || !email || !password) {
      return NextResponse.json(
        { message: "Missing required fields" },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { message: "Password must be at least 6 characters" },
        { status: 400 }
      );
    }

    const { db } = await connectToDatabase();

    const existingUser = await db.collection("users").findOne({ email });
    if (existingUser) {
      return NextResponse.json(
        { message: "User already exists" },
        { status: 409 }
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    const verificationToken = crypto.randomBytes(32).toString('hex');
    const verificationTokenExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    const result = await db.collection("users").insertOne({
      name,
      email,
      password: hashedPassword,
      emailVerified: false,
      verificationToken,
      verificationTokenExpires,
      createdAt: new Date(),
    });

    try {
      const verificationUrl = `${process.env.NEXTAUTH_URL}/auth/verify-email?token=${verificationToken}`;
      
      await sendEmail({
        to: email,
        subject: "Verify your AGFE account",
        html: generateVerificationEmail(verificationUrl, name),
        text: `Hi ${name},\n\nPlease verify your email address by clicking this link: ${verificationUrl}\n\nThis link will expire in 24 hours.\n\nIf you didn't create an account, please ignore this email.\n\nBest regards,\nAGFE Team`
      });
    } catch (emailError) {
      console.error("Failed to send verification email:", emailError);
    }

    return NextResponse.json(
      { 
        message: "User created successfully. Please check your email to verify your account.",
        userId: result.insertedId 
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

function generateVerificationEmail(verificationUrl: string, userName: string) {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Verify Your AGFE Account</title>
      </head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #1BE1FF 0%, #1B9AFF 100%); padding: 30px; border-radius: 12px; text-align: center; margin-bottom: 30px;">
          <h1 style="color: white; margin: 0; font-size: 28px; font-weight: bold;">AGFE</h1>
          <p style="color: white; margin: 10px 0 0 0; opacity: 0.9;">Welcome to A Guide for Everything</p>
        </div>
        
        <div style="background: #f8f9fa; padding: 25px; border-radius: 8px; margin-bottom: 25px;">
          <h2 style="color: #333; margin-top: 0;">Welcome, ${userName}! 🎉</h2>
          <p style="margin: 15px 0;">Thank you for signing up for AGFE! To complete your registration and start creating amazing AI-powered guides, please verify your email address.</p>
        </div>

        <div style="text-align: center; margin: 30px 0;">
          <a href="${verificationUrl}" style="display: inline-block; background: linear-gradient(135deg, #1BE1FF 0%, #1B9AFF 100%); color: white; text-decoration: none; padding: 15px 30px; border-radius: 8px; font-weight: bold; font-size: 16px;">Verify Email Address</a>
        </div>

        <div style="background: #fff; border: 1px solid #e9ecef; padding: 25px; border-radius: 8px; margin-bottom: 25px;">
          <h3 style="color: #333; margin-top: 0;">What's next?</h3>
          <p style="margin: 15px 0;">Once you verify your email, you'll be able to:</p>
          <ul style="margin: 15px 0; padding-left: 20px;">
            <li>Create comprehensive AI-powered guides on any topic</li>
            <li>Save and organize your guides privately or share them publicly</li>
            <li>Access advanced AI models for guide generation</li>
            <li>Export your guides and manage your content</li>
          </ul>
        </div>

        <div style="background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 6px; margin-bottom: 25px;">
          <p style="margin: 0; color: #856404;"><strong>⏰ Important:</strong> This verification link will expire in 24 hours. If you need a new link, you can request one from the login page.</p>
        </div>

        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e9ecef; text-align: center; color: #666; font-size: 14px;">
          <p>If you didn't create an account with AGFE, please ignore this email.</p>
          <p>Need help? Visit <a href="https://agfe.tech" style="color: #1BE1FF;">agfe.tech</a></p>
        </div>
      </body>
    </html>
  `;
}
