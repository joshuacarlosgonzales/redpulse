import { NextResponse } from 'next/server'
import { dbConnect } from '@/lib'
import mongoose from 'mongoose'
import { transporter } from '@/lib/mailer'

const TURNSTILE_SECRET_KEY = process.env.TURNSTILE_SECRET_KEY

export async function POST(request: Request) {
  try {
    await dbConnect()
    
    const body = await request.json()
    const { email, turnstileToken } = body

    // Validate email
    if (!email) {
      return NextResponse.json({
        success: false,
        error: 'Email is required'
      }, { status: 400 })
    }

    // Verify Turnstile if token is provided
    if (turnstileToken) {
      try {
        const turnstileFormData = new FormData()
        turnstileFormData.append('secret', TURNSTILE_SECRET_KEY || '')
        turnstileFormData.append('response', turnstileToken)

        const turnstileResponse = await fetch(
          'https://challenges.cloudflare.com/turnstile/v0/siteverify',
          {
            method: 'POST',
            body: turnstileFormData,
          }
        )

        const turnstileResult = await turnstileResponse.json()

        if (!turnstileResult.success) {
          console.error('Turnstile verification failed:', turnstileResult)
          return NextResponse.json({
            success: false,
            error: 'Security verification failed. Please try again.'
          }, { status: 400 })
        }
      } catch (turnstileError) {
        console.error('Turnstile verification error:', turnstileError)
        return NextResponse.json({
          success: false,
          error: 'Security verification failed. Please try again.'
        }, { status: 400 })
      }
    }

    // Get native MongoDB connection
    const db = mongoose.connection.db
    if (!db) {
      return NextResponse.json({
        success: false,
        error: 'Database connection error'
      }, { status: 500 })
    }

    const cleanEmail = email.trim().toLowerCase()
    const usersCollection = db.collection('users')

    // Find the user by email (case insensitive)
    let user = await usersCollection.findOne({ email: cleanEmail })
    if (!user) {
      user = await usersCollection.findOne({ 
        email: { $regex: `^${cleanEmail}$`, $options: 'i' } 
      })
    }

    // Always return success even if user doesn't exist (security measure)
    if (!user) {
      console.log('User not found, but returning success for security:', cleanEmail)
      return NextResponse.json({
        success: true,
        message: 'If an account exists, a reset code has been sent',
        data: {
          email: cleanEmail,
          expiresIn: '10 minutes'
        }
      })
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString()
    const expiresAt = Date.now() + 10 * 60 * 1000 // 10 minutes

    // Store OTP in database for persistence
    const updateResult = await usersCollection.updateOne(
      { _id: user._id },
      { 
        $set: { 
          resetPasswordOTP: otp,
          resetPasswordOTPExpires: new Date(expiresAt),
          updatedAt: new Date()
        } 
      }
    )

    if (!updateResult.acknowledged) {
      console.error('Failed to store OTP in database')
      return NextResponse.json({
        success: false,
        error: 'Failed to process request. Please try again.'
      }, { status: 500 })
    }

    console.log(`✅ OTP generated for ${cleanEmail}: ${otp}`)

    // Send email with OTP using Nodemailer (Gmail)
    try {
      await transporter.sendMail({
        from: `RedPulse <${process.env.GMAIL_USER}>`,
        to: email,
        subject: 'Your Password Reset Code - RedPulse',
        html: `
          <!DOCTYPE html>
          <html>
            <head>
              <style>
                body { font-family: Arial, sans-serif; background-color: #f4f4f4; margin: 0; padding: 0; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; background-color: #ffffff; border-radius: 12px; }
                .header { background: linear-gradient(135deg, #dc2626, #b91c1c); padding: 30px; text-align: center; border-radius: 12px 12px 0 0; }
                .header h1 { color: #ffffff; margin: 0; font-size: 28px; }
                .header p { color: #fca5a5; margin: 5px 0 0; font-size: 14px; }
                .content { padding: 30px; }
                .otp-box { 
                  background: #fef2f2; 
                  border: 2px solid #dc2626; 
                  border-radius: 12px; 
                  padding: 20px; 
                  text-align: center;
                  margin: 20px 0;
                }
                .otp-code { 
                  font-size: 48px; 
                  font-weight: bold; 
                  color: #dc2626; 
                  letter-spacing: 10px;
                  font-family: 'Courier New', monospace;
                }
                .otp-label { 
                  font-size: 12px; 
                  color: #666; 
                  text-transform: uppercase; 
                  letter-spacing: 2px;
                  margin-bottom: 5px;
                }
                .info { 
                  color: #666666; 
                  font-size: 14px; 
                  line-height: 1.6;
                  margin: 10px 0;
                }
                .warning { 
                  background: #fef3c7; 
                  padding: 12px; 
                  border-radius: 8px; 
                  color: #92400e; 
                  font-size: 13px;
                  margin: 15px 0;
                }
                .footer { text-align: center; padding: 20px; color: #999; font-size: 12px; border-top: 1px solid #eee; }
              </style>
            </head>
            <body>
              <div class="container">
                <div class="header">
                  <h1>❤️ RedPulse</h1>
                  <p>Blood Donor Registry & Inventory Tracking</p>
                </div>
                <div class="content">
                  <h2 style="color: #333; margin-top: 0;">Password Reset Code</h2>
                  <p class="info">We received a request to reset your password. Use the 6-digit code below to create a new password:</p>
                  
                  <div class="otp-box">
                    <div class="otp-label">Your Verification Code</div>
                    <div class="otp-code">${otp}</div>
                  </div>
                  
                  <p class="info">This code will expire in <strong>10 minutes</strong>.</p>
                  
                  <div class="warning">
                    ⚠️ If you didn't request this, please ignore this email. 
                    Never share this code with anyone.
                  </div>
                  
                  <p class="info" style="font-size: 13px; color: #888;">
                    Enter this code on the password reset page to continue.
                  </p>
                </div>
                <div class="footer">
                  <p>© ${new Date().getFullYear()} RedPulse. All rights reserved.</p>
                  <p style="font-size: 11px;">Making blood donation easier, one heartbeat at a time.</p>
                </div>
              </div>
            </body>
          </html>
        `,
      })

      console.log(`✅ Password reset OTP sent to: ${email}`)

      return NextResponse.json({
        success: true,
        message: 'Password reset code sent to your email',
        data: {
          email: cleanEmail,
          expiresIn: '10 minutes'
        }
      })
    } catch (emailError) {
      console.error('Error sending email:', emailError)
      // Clear OTP from database if email fails
      await usersCollection.updateOne(
        { _id: user._id },
        { 
          $unset: { 
            resetPasswordOTP: "",
            resetPasswordOTPExpires: "",
          } 
        }
      )
      return NextResponse.json({
        success: false,
        error: 'Failed to send email. Please try again later.'
      }, { status: 500 })
    }
  } catch (error: any) {
    console.error('Forgot password error:', error)
    return NextResponse.json({
      success: false,
      error: error.message || 'An unexpected error occurred. Please try again.'
    }, { status: 500 })
  }
}