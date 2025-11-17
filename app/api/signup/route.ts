import { NextRequest, NextResponse } from 'next/server'
import { randomUUID } from 'crypto'

import { createClient } from '@/utils/supabase/server'
import {
  ensurePaymentProofBucketExists,
  getManualBucketSetupChecklist,
  getPaymentProofBucketName,
  PaymentProofBucketError,
} from '@/utils/supabase/storage'
import { insertUserSchema, delegateDataSchema, chairDataSchema, adminDataSchema } from '@/lib/db/schema'
import { sendPaymentConfirmedEmail, sendPaymentReminderEmail } from '@/lib/email/registration'
import {
  findReferralSuggestions,
  isValidReferralCode,
  normalizeReferralCode,
} from '@/lib/referral-codes'
import { z } from 'zod'

export const runtime = 'nodejs'

const paymentConfirmationSchema = z.object({
  fullName: z.string().min(1, 'Payment confirmation requires the payer\'s name'),
  role: z.enum(['delegate', 'chair', 'admin']),
  fileName: z.string().min(1),
  mimeType: z.string().min(1),
  dataUrl: z.string().regex(/^data:.*;base64,.+/, 'Invalid payment proof format'),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const supabase = await createClient()
    
    const rawPaymentStatus = typeof body.paymentStatus === 'string' ? body.paymentStatus : ''
    const normalizedPaymentStatus = rawPaymentStatus === 'yes' || rawPaymentStatus === 'pending' ? 'pending' : 'unpaid'

    let paymentProofUrl: string | null = null
    let paymentProofStoragePath: string | null = null
    let paymentProofFileName: string | null = null
    let paymentProofPayerName: string | null = null
    let paymentProofRole: 'delegate' | 'chair' | 'admin' | null = null
    let paymentProofUploadedAt: string | null = null

    if (rawPaymentStatus === 'yes') {
      const paymentConfirmation = paymentConfirmationSchema.parse(body.paymentConfirmation)

      const [, base64Data] = paymentConfirmation.dataUrl.split(',')
      if (!base64Data) {
        throw new Error('Invalid payment proof payload received')
      }

      const fileBuffer = Buffer.from(base64Data, 'base64')

      const rawFileName = paymentConfirmation.fileName.trim() || 'payment-proof'
      const sanitizedFileName = rawFileName.replace(/[^a-zA-Z0-9._-]/g, '_')
      const hasExtension = sanitizedFileName.includes('.')
      const mimeExtension = paymentConfirmation.mimeType.split('/')[1] || 'png'
      const fileNameWithExtension = hasExtension ? sanitizedFileName : `${sanitizedFileName}.${mimeExtension}`

      const storagePath = `proof-of-payment/${new Date().toISOString().split('T')[0]}/${randomUUID()}-${fileNameWithExtension}`

      const paymentProofBucket = getPaymentProofBucketName()

      await ensurePaymentProofBucketExists(paymentProofBucket)

      const { error: uploadError } = await supabase.storage
        .from(paymentProofBucket)
        .upload(storagePath, fileBuffer, {
          contentType: paymentConfirmation.mimeType,
          upsert: false,
        })

      if (uploadError) {
        const normalizedMessage = uploadError.message?.toLowerCase() ?? ''
        if (normalizedMessage.includes('bucket not found')) {
          const manualSetupMessage = getManualBucketSetupChecklist(paymentProofBucket)
          throw new PaymentProofBucketError(
            `Failed to upload payment proof: Supabase storage bucket "${paymentProofBucket}" was not found.\n\n${manualSetupMessage}`,
            'Payment proof uploads are temporarily unavailable while we finish setting up storage. Please try again later or contact support.'
          )
        }

        throw new Error('Failed to upload payment proof: ' + uploadError.message)
      }

      const { data: publicUrlData } = supabase.storage.from(paymentProofBucket).getPublicUrl(storagePath)

      paymentProofUrl = publicUrlData?.publicUrl ?? null
      paymentProofStoragePath = storagePath
      paymentProofFileName = fileNameWithExtension
      paymentProofPayerName = paymentConfirmation.fullName.trim()
      paymentProofRole = paymentConfirmation.role
      paymentProofUploadedAt = new Date().toISOString()
    }

    // Transform the form data to match the schema
    const transformedData = {
      email: body.formData?.email,
      firstName: body.formData?.firstName,
      lastName: body.formData?.lastName,
      phone: body.formData?.phone,
      role: body.selectedRole,
      school: body.formData?.school,
      grade: body.formData?.grade,
      dietaryType: body.formData?.dietaryType,
      dietaryOther: body.formData?.dietaryOther,
      hasAllergies: body.formData?.hasAllergies,
      allergiesDetails: body.formData?.allergiesDetails,
      emergencyContactName: body.formData?.emergencyContact,
      emergencyContactPhone: body.formData?.emergencyPhone,
      agreeTerms: body.formData?.agreeTerms,
      agreePhotos: body.formData?.agreePhotos || false,
      nationality: body.formData?.nationality?.toUpperCase() ?? null,
    }
    
    // Validate with Zod schema
    const userData = insertUserSchema.parse(transformedData)
    
    // Additional server-side validation for dietary/allergies
    if (userData.dietaryType === 'other' && !userData.dietaryOther?.trim()) {
      throw new Error('Please specify your dietary requirement')
    }
    if (userData.hasAllergies === 'yes' && !userData.allergiesDetails?.trim()) {
      throw new Error('Please provide details about your allergies')
    }

    // Process role-specific data
    let roleData = {}
    if (body.selectedRole === 'delegate') {
      const delegateDataParsed = delegateDataSchema.parse(body.delegateData)
      
      // Server-side committee duplication validation
      const committees = [delegateDataParsed.committee1, delegateDataParsed.committee2, delegateDataParsed.committee3].filter(Boolean)
      const uniqueCommittees = new Set(committees)
      if (committees.length !== uniqueCommittees.size) {
        throw new Error('Cannot select the same committee multiple times')
      }
      
      // Validate allowed committee values
      const allowedCommittees = ['ga1', 'unodc', 'ecosoc', 'who', 'icj', 'icrcc', 'uncstd']
      for (const committee of committees) {
        if (committee && !allowedCommittees.includes(committee)) {
          throw new Error('Invalid committee selection')
        }
      }
      
      roleData = delegateDataParsed
    } else if (body.selectedRole === 'chair') {
      roleData = chairDataSchema.parse(body.chairData)
    } else if (body.selectedRole === 'admin') {
      roleData = adminDataSchema.parse(body.adminData)
    }

    const incomingReferralCodes = Array.isArray(body.referralCodes)
      ? body.referralCodes
      : Array.isArray(body.delegateData?.referralCodes)
        ? body.delegateData.referralCodes
        : Array.isArray(body.chairData?.referralCodes)
          ? body.chairData.referralCodes
          : Array.isArray(body.adminData?.referralCodes)
            ? body.adminData.referralCodes
            : []

    const sanitizedReferralCodes = incomingReferralCodes
      .map((code: unknown) => (typeof code === 'string' ? normalizeReferralCode(code) : ''))
      .filter((code): code is string => code.length > 0)

    const uniqueReferralCodes = Array.from(new Set(sanitizedReferralCodes))
    const invalidReferralCodes = uniqueReferralCodes.filter((code) => !isValidReferralCode(code))

    if (invalidReferralCodes.length > 0) {
      const message = invalidReferralCodes
        .map((code) => {
          const suggestions = findReferralSuggestions(code)
          if (suggestions.length === 0) {
            return `Referral code "${code}" is not recognized.`
          }

          const suggestionText = suggestions
            .map((entry) => `${entry.code} (${entry.owner})`)
            .join(' or ')

          return `Referral code "${code}" is not recognized. Did you mean ${suggestionText}?`
        })
        .join(' ')

      return NextResponse.json(
        {
          status: 'invalid_referral_codes',
          message,
          suggestions: invalidReferralCodes.map((code) => ({
            code,
            suggestions: findReferralSuggestions(code).map((entry) => ({
              code: entry.code,
              owner: entry.owner,
            })),
          })),
        },
        { status: 400 },
      )
    }

    const referralCodesToStore = uniqueReferralCodes.length > 0 ? uniqueReferralCodes : null
    
    // Prepare the data for Supabase insertion
    const supabaseData = {
      email: userData.email,
      first_name: userData.firstName,
      last_name: userData.lastName,
      phone: userData.phone,
      role: body.selectedRole as 'delegate' | 'chair' | 'admin',
      school: userData.school,
      grade: userData.grade,
      dietary_type: userData.dietaryType,
      dietary_other: userData.dietaryOther,
      has_allergies: userData.hasAllergies,
      allergies_details: userData.allergiesDetails,
      emergency_contact_name: userData.emergencyContactName,
      emergency_contact_phone: userData.emergencyContactPhone,
      agree_terms: userData.agreeTerms,
      agree_photos: userData.agreePhotos,
      nationality: userData.nationality,
      // Add role-specific data
      delegate_data: body.selectedRole === 'delegate' ? roleData : null,
      chair_data: body.selectedRole === 'chair' ? roleData : null,
      admin_data: body.selectedRole === 'admin' ? roleData : null,
      referral_codes: referralCodesToStore,
      payment_status: normalizedPaymentStatus,
      payment_proof_url: paymentProofUrl,
      payment_proof_storage_path: paymentProofStoragePath,
      payment_proof_file_name: paymentProofFileName,
      payment_proof_payer_name: paymentProofPayerName,
      payment_proof_role: paymentProofRole,
      payment_proof_uploaded_at: paymentProofUploadedAt,
    }
    
    // Insert user data using Supabase
    const { data: newUser, error } = await supabase
      .from('users')
      .insert([supabaseData])
      .select()
      .single()
    
    if (error) {
      // Handle specific Supabase errors
      if (error.code === '23505' || error.message.includes('duplicate key')) {
        return NextResponse.json(
          { 
            message: 'An account with this email already exists',
            status: 'error'
          },
          { status: 409 }
        )
      }
      
      throw new Error('Failed to create user: ' + error.message)
    }
    
    if (userData.email && body.selectedRole) {
      const normalizedRole = body.selectedRole as 'delegate' | 'chair' | 'admin'
      try {
        if (rawPaymentStatus === 'yes') {
          await sendPaymentConfirmedEmail({
            email: userData.email,
            firstName: userData.firstName,
            lastName: userData.lastName,
            role: normalizedRole,
            paymentProofFileName,
          })
        } else if (rawPaymentStatus === 'no') {
          await sendPaymentReminderEmail({
            email: userData.email,
            firstName: userData.firstName,
            lastName: userData.lastName,
            role: normalizedRole,
          })
        }
      } catch (emailError) {
        console.error('Failed to send registration email via Resend', emailError)
      }
    }

    return NextResponse.json(
      {
        message: 'Registration submitted successfully!',
        userId: newUser.id,
        status: 'success'
      },
      { status: 201 }
    )
    
  } catch (error) {
    console.error('❌ SUPABASE SIGNUP ERROR - Complete Debug Analysis')
    console.error('🔍 Error type:', error?.constructor?.name || 'Unknown constructor')
    console.error('📝 Primary error message:', error instanceof Error ? error.message : 'Non-Error object thrown')
    console.error('🔄 Current process PID:', process.pid)
    console.error('⏰ Error timestamp:', new Date().toISOString())
    
    // Log environment variables (safely)
    console.error('🌍 Environment check:')
    console.error('  - NEXT_PUBLIC_SUPABASE_URL:', process.env.NEXT_PUBLIC_SUPABASE_URL ? 'SET' : 'MISSING')
    console.error('  - NEXT_PUBLIC_SUPABASE_ANON_KEY:', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'SET' : 'MISSING')
    
    if (error instanceof Error && error.message.includes('relation "users" does not exist')) {
      console.error('🚨 DATABASE TABLE MISSING: The users table has not been created in Supabase!')
      console.error('🔧 Solution: Run the SQL setup script in your Supabase dashboard')
    }
    
    if (error instanceof PaymentProofBucketError) {
      console.error('Payment proof bucket misconfiguration:', error.message)

      return NextResponse.json(
        {
          message: error.userFacingMessage,
          status: 'error'
        },
        { status: 500 }
      )
    }

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          message: 'Validation error',
          errors: error.errors,
          status: 'error'
        },
        { status: 400 }
      )
    }
    
    if (error instanceof Error && (
      error.message.includes('unique constraint') ||
      error.message.includes('duplicate key') ||
      error.message.includes('already exists')
    )) {
      return NextResponse.json(
        { 
          message: 'An account with this email already exists',
          status: 'error'
        },
        { status: 409 }
      )
    }
    
    return NextResponse.json(
      { 
        message: 'Internal server error. Please try again.',
        status: 'error'
      },
      { status: 500 }
    )
  }
}
