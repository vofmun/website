"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardAction } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import {
  Send,
  Info,
  Users,
  Crown,
  Settings,
  Loader2,
  Plus,
  Trash2,
  Sparkles,
  UploadCloud,
  X,
  Building2,
} from "lucide-react"
import { Tooltip, TooltipProvider, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { toast } from "sonner"
import { CountrySelect } from "@/components/country-select"
import { PhoneInput } from "@/components/phone-input"
import { SchoolSelect } from "@/components/school-select"
import { AIExperienceModal } from "@/components/ai-experience-modal"
import { FileText, Shield, AlertCircle } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import {
  findReferralSuggestions,
  getReferralCodeEntry,
  isValidReferralCode,
  normalizeReferralCode,
} from "@/lib/referral-codes"

type Role = "delegate" | "chair" | "admin" | null

type DelegateFormState = {
  experience: string
  committee1: string
  committee2: string
  committee3: string
  referralCodes: string[]
}

type ChairExperience = {
  conference: string
  position: string
  year: string
  description: string
}

type ChairFormState = {
  experiences: ChairExperience[]
  committee1: string
  committee2: string
  committee3: string
  crisisBackroomInterest: string
  whyBestFit: string
  successfulCommittee: string
  strengthWeakness: string
  crisisResponse: string
  availability: string
}

type AdminExperience = {
  role: string
  organization: string
  year: string
  description: string
}

type AdminFormState = {
  experiences: AdminExperience[]
  skills: string[]
  whyAdmin: string
  relevantExperience: string
  previousAdmin: "yes" | "no" | ""
  understandsRole: "yes" | "no" | ""
}

type ReferralFeedbackEntry = {
  type: "success" | "info" | "error"
  message: string
}

const createInitialFormData = () => ({
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  nationality: "",
  phoneCountry: "AE",
  school: "",
  grade: "",
  dietaryType: "",
  dietaryOther: "",
  hasAllergies: "",
  allergiesDetails: "",
  emergencyContact: "",
  emergencyPhone: "",
  emergencyPhoneCountry: "AE",
  agreeTerms: false,
  dateOfBirth: "",
  role: "",
  experience: "",
  institution: "",
})

const createInitialDelegateData = (): DelegateFormState => ({
  experience: "",
  committee1: "",
  committee2: "",
  committee3: "",
  referralCodes: [""],
})

const createInitialChairData = (): ChairFormState => ({
  experiences: [{ conference: "", position: "", year: "", description: "" }],
  committee1: "",
  committee2: "",
  committee3: "",
  crisisBackroomInterest: "",
  whyBestFit: "",
  successfulCommittee: "",
  strengthWeakness: "",
  crisisResponse: "",
  availability: "",
})

const createInitialAdminData = (): AdminFormState => ({
  experiences: [{ role: "", organization: "", year: "", description: "" }],
  skills: [],
  whyAdmin: "",
  relevantExperience: "",
  previousAdmin: "",
  understandsRole: "",
})

export function SignupFormNew() {
  const [selectedRole, setSelectedRole] = useState<Role>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showSuccessModal, setShowSuccessModal] = useState(false)
  const [showAIModal, setShowAIModal] = useState(false)
  const [lastSubmittedRole, setLastSubmittedRole] = useState<Role | null>(null)

  const stripePaymentUrl = process.env.NEXT_PUBLIC_STRIPE_PAYMENT_URL ?? ""
  const hasStripePaymentLink = stripePaymentUrl.trim().length > 0

  const [errors, setErrors] = useState<Record<string, string>>({})

  const [formData, setFormData] = useState(createInitialFormData)

  const [hasPaid, setHasPaid] = useState<"yes" | "no" | "">("")
  const [paymentFullName, setPaymentFullName] = useState("")
  const [paymentProofFile, setPaymentProofFile] = useState<File | null>(null)
  const [paymentProofPreview, setPaymentProofPreview] = useState<string | null>(null)
  const [isDragActive, setIsDragActive] = useState(false)
  const [hasEditedFullName, setHasEditedFullName] = useState(false)
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const [lastPaymentStatus, setLastPaymentStatus] = useState<"yes" | "no" | null>(null)

  const [delegateData, setDelegateData] = useState<DelegateFormState>(createInitialDelegateData)

  const [chairData, setChairData] = useState<ChairFormState>(createInitialChairData)

  const [adminData, setAdminData] = useState<AdminFormState>(createInitialAdminData)

  const [referralFeedback, setReferralFeedback] = useState<Record<number, ReferralFeedbackEntry>>({})

  const committeeChoices = [
    { key: "committee1" as const, label: "First Choice", required: true },
    { key: "committee2" as const, label: "Second Choice", required: false },
    { key: "committee3" as const, label: "Third Choice", required: false },
  ]

  const paymentProofIsPdf =
    !!paymentProofFile &&
    (paymentProofFile.type === "application/pdf" ||
      paymentProofFile.name.toLowerCase().endsWith(".pdf"))

  const paymentProofIsImage = !!paymentProofFile && paymentProofFile.type.startsWith("image/")

  useEffect(() => {
    const combinedName = [formData.firstName, formData.lastName]
      .filter(Boolean)
      .join(" ")
      .trim()

    if (!hasEditedFullName) {
      setPaymentFullName(combinedName)
    }
  }, [formData.firstName, formData.lastName, hasEditedFullName])

  useEffect(() => {
    return () => {
      if (paymentProofPreview) {
        URL.revokeObjectURL(paymentProofPreview)
      }
    }
  }, [paymentProofPreview])

  useEffect(() => {
    if (hasPaid === "no") {
      if (paymentProofPreview) {
        URL.revokeObjectURL(paymentProofPreview)
      }
      setPaymentProofFile(null)
      setPaymentProofPreview(null)
      setIsDragActive(false)
      setPaymentFullName("")
      setHasEditedFullName(false)
      setErrors((prev) => {
        const { paymentFullName, paymentProof, paymentStatus, ...rest } = prev
        return rest
      })
    }
  }, [hasPaid, paymentProofPreview])

  const fileToDataURL = (file: File) =>
    new Promise<string>((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result as string)
      reader.onerror = () => reject(new Error("Unable to read file"))
      reader.readAsDataURL(file)
    })

  const clearError = (key: string) => {
    setErrors((prev) => {
      if (!prev[key]) return prev
      const { [key]: _removed, ...rest } = prev
      return rest
    })
  }

  const handlePaymentProofSelect = (file: File) => {
    const isImage = file.type.startsWith("image/")
    const isPdf =
      file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf")

    if (!isImage && !isPdf) {
      setErrors((prev) => ({
        ...prev,
        paymentProof: "Please upload a PNG, JPG, HEIC, or PDF file.",
      }))
      return
    }

    if (paymentProofPreview) {
      URL.revokeObjectURL(paymentProofPreview)
    }

    setPaymentProofFile(file)
    setPaymentProofPreview(isImage ? URL.createObjectURL(file) : null)
    clearError("paymentProof")
  }

  const resetPaymentProof = () => {
    if (paymentProofPreview) {
      URL.revokeObjectURL(paymentProofPreview)
    }
    setPaymentProofFile(null)
    setPaymentProofPreview(null)
    setIsDragActive(false)
  }

  const resetFullRegistrationForm = () => {
    setFormData(createInitialFormData())
    setDelegateData(createInitialDelegateData())
    setChairData(createInitialChairData())
    setAdminData(createInitialAdminData())
    setSelectedRole(null)
    setHasPaid("")
    setPaymentFullName("")
    setHasEditedFullName(false)
    resetPaymentProof()
    setErrors({})
    setReferralFeedback({})
  }

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    event.stopPropagation()
    if (!isDragActive) {
      setIsDragActive(true)
    }
  }

  const handleDragLeave = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    event.stopPropagation()
    setIsDragActive(false)
  }

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    event.stopPropagation()
    setIsDragActive(false)

    const file = event.dataTransfer.files && event.dataTransfer.files[0]
    if (file) {
      handlePaymentProofSelect(file)
    }
  }

  const clearReferralFeedbackForIndex = (index: number) => {
    setReferralFeedback((prev) => {
      if (!(index in prev)) return prev
      const { [index]: _removed, ...rest } = prev
      return rest
    })
  }

  const addReferralCode = () => {
    setDelegateData((prev) => ({
      ...prev,
      referralCodes: [...prev.referralCodes, ""],
    }))
  }

  const updateReferralCode = (index: number, value: string) => {
    const normalizedValue = value.toUpperCase()
    setDelegateData((prev) => {
      const nextCodes = [...prev.referralCodes]
      nextCodes[index] = normalizedValue
      return { ...prev, referralCodes: nextCodes }
    })

    clearReferralFeedbackForIndex(index)
  }

  const removeReferralCode = (index: number) => {
    setDelegateData((prev) => {
      const updatedCodes = prev.referralCodes.filter((_, i) => i !== index)
      setReferralFeedback((current) => {
        if (Object.keys(current).length === 0) return current
        const next: Record<number, ReferralFeedbackEntry> = {}
        updatedCodes.forEach((_, newIndex) => {
          const sourceIndex = newIndex < index ? newIndex : newIndex + 1
          if (current[sourceIndex]) {
            next[newIndex] = current[sourceIndex]
          }
        })
        return next
      })
      return {
        ...prev,
        referralCodes: updatedCodes,
      }
    })
  }

  const handleReferralBlur = (index: number) => {
    const rawCode = delegateData.referralCodes[index] ?? ""
    if (!rawCode.trim()) {
      clearReferralFeedbackForIndex(index)
      return
    }

    const normalizedCode = normalizeReferralCode(rawCode)
    if (normalizedCode !== rawCode) {
      updateReferralCode(index, normalizedCode)
    }

    if (isValidReferralCode(normalizedCode)) {
      const owner = getReferralCodeEntry(normalizedCode)?.owner
      setReferralFeedback((prev) => ({
        ...prev,
        [index]: {
          type: "success",
          message: owner ? `Referral code belongs to ${owner}.` : "Referral code looks good.",
        },
      }))
      return
    }

    const suggestions = findReferralSuggestions(normalizedCode, 1)
    if (suggestions.length === 1) {
      const suggestion = suggestions[0]
      updateReferralCode(index, suggestion.code)
      setReferralFeedback((prev) => ({
        ...prev,
        [index]: {
          type: "info",
          message: `Autocorrected to ${suggestion.code} (${suggestion.owner}).`,
        },
      }))
      toast.info("Referral code autocorrected", {
        description: `We updated your code to ${suggestion.code} (${suggestion.owner}).`,
        duration: 3500,
      })
      return
    }

    if (suggestions.length > 1) {
      const suggestionText = suggestions.map((entry) => `${entry.code} (${entry.owner})`).join(" or ")
      setReferralFeedback((prev) => ({
        ...prev,
        [index]: {
          type: "info",
          message: `Did you mean ${suggestionText}?`,
        },
      }))
      return
    }

    setReferralFeedback((prev) => ({
      ...prev,
      [index]: {
        type: "error",
        message: "We couldn't find a matching referral code.",
      },
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    e.stopPropagation()

    setErrors({})
    const newErrors: Record<string, string> = {}

    try {
      // Personal Information Validation
      if (!formData.firstName.trim()) {
        newErrors.firstName = "First name is required"
      }
      if (!formData.lastName.trim()) {
        newErrors.lastName = "Last name is required"
      }
      if (!formData.email.trim()) {
        newErrors.email = "Email is required"
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
        newErrors.email = "Please enter a valid email address"
      }
      if (!formData.phone.trim()) {
        newErrors.phone = "Phone number is required"
      }
      if (!formData.nationality) {
        newErrors.nationality = "Nationality is required"
      }

      // Academic Information Validation
      if (!formData.school.trim()) {
        newErrors.school = "School/Institution is required"
      }
      if (!formData.grade) {
        newErrors.grade = "Please select your grade/year"
      }

      // Additional Information Validation
      if (!formData.dietaryType) {
        newErrors.dietaryType = "Please select your dietary preference"
      }
      if (formData.dietaryType === "other" && !formData.dietaryOther.trim()) {
        newErrors.dietaryOther = "Please specify your dietary requirement"
      }
      if (!formData.hasAllergies) {
        newErrors.hasAllergies = "Please indicate if you have any allergies"
      }
      if (formData.hasAllergies === "yes" && !formData.allergiesDetails.trim()) {
        newErrors.allergiesDetails = "Please provide details about your allergies"
      }

      // Emergency Contact Validation
      if (!formData.emergencyContact.trim()) {
        newErrors.emergencyContact = "Emergency contact name is required"
      }
      if (!formData.emergencyPhone.trim()) {
        newErrors.emergencyPhone = "Emergency contact phone is required"
      }

      // Terms and Conditions Validation
      if (!formData.agreeTerms) {
        newErrors.agreeTerms = "You must agree to the terms and conditions"
      }

      // Role Selection Validation
      if (!selectedRole) {
        newErrors.roleSelection = "Please select a role to apply for"
      }

      // Role-specific validation
      if (selectedRole === "delegate") {
        if (!delegateData.experience) {
          newErrors.experience = "Please select your MUN experience level"
        }
        if (!delegateData.committee1) {
          newErrors.committee1 = "Please select your first committee choice"
        }
      }

      if (selectedRole === "chair") {
        // Updated validation for chair role
        if (!chairData.committee1) {
          newErrors.chairRolePreferences = "Please select your first committee choice"
        }
        if (!chairData.crisisBackroomInterest) {
          newErrors.chairCrisisBackroomInterest = "Please indicate your interest in the Crisis Backroom Staff"
        }
        if (!chairData.whyBestFit.trim()) {
          newErrors.chairWhyBestFit = "Please explain why you are the best fit for this role"
        } else if (chairData.whyBestFit.length < 50) {
          newErrors.chairWhyBestFit = "Please provide at least 50 characters explaining why you are the best fit"
        }
        if (!chairData.successfulCommittee.trim()) {
          newErrors.chairSuccessfulCommittee = "Please share your thoughts on what makes a committee successful"
        } else if (chairData.successfulCommittee.length < 50) {
          newErrors.chairSuccessfulCommittee =
            "Please provide at least 50 characters on what makes a committee successful"
        }
        if (!chairData.strengthWeakness.trim()) {
          newErrors.chairStrengthWeakness = "Please describe your strengths and weaknesses as a leader"
        } else if (chairData.strengthWeakness.length < 50) {
          newErrors.chairStrengthWeakness =
            "Please provide at least 50 characters describing your strengths and weaknesses"
        }
        if (chairData.crisisBackroomInterest === "yes") {
          if (!chairData.crisisResponse.trim()) {
            newErrors.chairCrisisResponse = "Please describe your approach to the crisis response scenario"
          } else if (chairData.crisisResponse.length < 50) {
            newErrors.chairCrisisResponse = "Please provide at least 50 characters for the crisis response scenario"
          }
          if (!chairData.availability.trim()) {
            newErrors.chairAvailability = "Please confirm your availability and communication approach"
          } else if (chairData.availability.length < 50) {
            newErrors.chairAvailability =
              "Please provide at least 50 characters for your availability and communication"
          }
        }
      }

      if (selectedRole === "admin") {
        if (!adminData.relevantExperience.trim()) {
          newErrors.adminExperience = "Relevant experience is required"
        }
        if (!adminData.previousAdmin) {
          newErrors.previousAdmin = "Please indicate if you have been an admin before"
        }
        if (!adminData.understandsRole) {
          newErrors.understandsRole = "Please confirm your understanding of the role and availability"
        }
      }

      if (!hasPaid) {
        newErrors.paymentStatus = "Please let us know if you've already paid"
      }

      if (hasPaid === "yes") {
        if (!paymentFullName.trim()) {
          newErrors.paymentFullName = "Please enter the payer's full name"
        }

        if (!paymentProofFile) {
          newErrors.paymentProof = "Please upload proof of payment before submitting"
        }
      }

      if (Object.keys(newErrors).length > 0) {
        setErrors(newErrors)

        // Scroll to first error field
        const firstErrorKey = Object.keys(newErrors)[0]
        const errorElement = document.querySelector(`[data-testid*="${firstErrorKey}"], [name="${firstErrorKey}"], #${firstErrorKey}`)
        if (errorElement) {
          errorElement.scrollIntoView({ behavior: 'smooth', block: 'center' })
          // Focus the element if it's an input
          if (errorElement instanceof HTMLInputElement || errorElement instanceof HTMLTextAreaElement || errorElement instanceof HTMLSelectElement) {
            setTimeout(() => errorElement.focus(), 500)
          }
        }

        toast.error(`Please fix ${Object.keys(newErrors).length} error${Object.keys(newErrors).length > 1 ? 's' : ''} below`, {
          description: "All required fields must be completed before submission."
        })
        return
      }

      setIsSubmitting(true)

      let paymentProofDataUrl: string | null = null
      if (paymentProofFile) {
        paymentProofDataUrl = await fileToDataURL(paymentProofFile)
      }

      const sanitizedDelegateData =
        selectedRole === "delegate"
          ? {
              ...delegateData,
              referralCodes: delegateData.referralCodes
                .map((code) => code.trim())
                .filter((code) => code.length > 0),
            }
          : null

      const submitData = {
        formData,
        selectedRole,
        delegateData: sanitizedDelegateData,
        chairData: selectedRole === "chair" ? chairData : null,
        adminData: selectedRole === "admin" ? adminData : null,
        referralCodes: sanitizedDelegateData?.referralCodes ?? [],
        paymentStatus: hasPaid,
        paymentConfirmation:
          hasPaid === "yes" && paymentProofDataUrl && selectedRole
            ? {
                fullName: paymentFullName.trim(),
                role: selectedRole,
                fileName: paymentProofFile?.name ?? "payment-proof",
                mimeType: paymentProofFile?.type ?? "application/octet-stream",
                dataUrl: paymentProofDataUrl,
              }
            : null,
      }

      const response = await fetch("/api/signup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(submitData),
      })

      const result = await response.json()

      if (response.ok) {
        setLastSubmittedRole(selectedRole)
        setLastPaymentStatus(hasPaid === "yes" ? "yes" : hasPaid === "no" ? "no" : null)

        setShowSuccessModal(true)

        toast.success(`Registration Successful!`, {
          description:
            hasPaid === "yes"
              ? `Your ${selectedRole} application and payment confirmation have been submitted successfully.`
              : hasPaid === "no"
                ? `Your ${selectedRole} application has been submitted. Please remember to complete payment and upload proof later.`
                : `Your ${selectedRole} application has been submitted successfully.`,
          duration: 4000,
        })

        resetFullRegistrationForm()

      } else {
        // Handle specific HTTP status codes
        if (response.status === 409) {
          toast.error("Email Already Registered", {
            description:
              "An account with this email address already exists. Please use a different email or contact support if you believe this is an error.",
            duration: 6000,
          })
        } else if (response.status === 400) {
          if (result?.status === "invalid_referral_codes") {
            const invalidEntries = Array.isArray(result?.suggestions) ? result.suggestions : []

            setReferralFeedback((prev) => {
              const next = { ...prev }
              delegateData.referralCodes.forEach((code, index) => {
                const normalizedCode = normalizeReferralCode(code)
                const matchingEntry = invalidEntries.find((entry: any) => entry.code === normalizedCode)
                if (!matchingEntry) return

                const hasSuggestions = Array.isArray(matchingEntry.suggestions) && matchingEntry.suggestions.length > 0
                const suggestionText = hasSuggestions
                  ? `Did you mean ${matchingEntry.suggestions
                      .map((suggestion: any) => `${suggestion.code} (${suggestion.owner})`)
                      .join(" or ")}?`
                  : "We couldn't find that referral code."

                next[index] = {
                  type: hasSuggestions ? "info" : "error",
                  message: suggestionText,
                }
              })
              return next
            })

            toast.error("Referral code not recognized", {
              description: result?.message || "Please double-check your referral codes before submitting.",
              duration: 6000,
            })
          } else {
            toast.error("Invalid Information", {
              description: result?.message || "Please check your information and try again.",
              duration: 6000,
            })
          }
        } else {
          toast.error("Registration Failed", {
            description: result.message || "Something went wrong. Please try again.",
            duration: 6000,
          })
        }
      }
    } catch (error: any) {
      console.error("Registration error:", error)
      toast.error("Network Error", {
        description: "Unable to submit registration. Please check your connection and try again.",
        duration: 6000,
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleInputChange = (field: keyof typeof formData, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const addChairExperience = () => {
    setChairData((prev) => ({
      ...prev,
      experiences: [...prev.experiences, { conference: "", position: "", year: "", description: "" }],
    }))
  }

  const removeChairExperience = (index: number) => {
    setChairData((prev) => {
      const newExperiences = [...prev.experiences]
      newExperiences.splice(index, 1)
      return {
        ...prev,
        experiences: newExperiences,
      }
    })
  }

  const updateChairExperience = (index: number, field: string, value: string) => {
    setChairData((prev) => ({
      ...prev,
      experiences: prev.experiences.map((exp, i) => (i === index ? { ...exp, [field]: value } : exp)),
    }))
  }

  const addAdminExperience = () => {
    setAdminData((prev) => ({
      ...prev,
      experiences: [...prev.experiences, { role: "", organization: "", year: "", description: "" }],
    }))
  }

  const removeAdminExperience = (index: number) => {
    setAdminData((prev) => {
      const newExperiences = [...prev.experiences]
      newExperiences.splice(index, 1)
      return {
        ...prev,
        experiences: newExperiences,
      }
    })
  }

  const updateAdminExperience = (index: number, field: string, value: string) => {
    setAdminData((prev) => ({
      ...prev,
      experiences: prev.experiences.map((exp, i) => (i === index ? { ...exp, [field]: value } : exp)),
    }))
  }

  const handleAIChairExperiences = (experiences: any[]) => {
    setChairData((prev) => ({
      ...prev,
      experiences: experiences.map((exp) => ({
        conference: exp.conference || "",
        position: exp.position || "",
        year: exp.year || "",
        description: exp.description || "",
      })),
    }))
  }

  const handleAIAdminExperiences = (experiences: any[]) => {
    setAdminData((prev) => ({
      ...prev,
      experiences: experiences.map((exp) => ({
        role: exp.role || "",
        organization: exp.organization || "",
        year: exp.year || "",
        description: exp.description || "",
      })),
    }))
  }

  const roleCards = [
    {
      role: "delegate" as Role,
      title: "Delegate",
      icon: Users,
      price: "170 AED",
      details:
        "Delegates are the main participants who represent countries or organizations in various UN committees. You will research positions, debate issues, and work on resolutions.",
    },
    {
      role: "chair" as Role,
      title: "Chair",
      icon: Crown,
      price: "100 AED",
      details:
        "Chairs facilitate committee sessions, ensure proper procedure, and help guide delegates through debates. Requires prior MUN experience and leadership skills.",
    },
    {
      role: "admin" as Role,
      title: "Admin",
      icon: Settings,
      price: "70 AED",
      details:
        "Admins work behind the scenes to ensure smooth conference operations. Roles include tech support, logistics coordination, media coverage, and delegate affairs.",
    },
  ]

  const successModal = (
    <Dialog
      open={showSuccessModal}
      onOpenChange={(open) => {
        setShowSuccessModal(open)
        if (!open) {
          setLastSubmittedRole(null)
          setLastPaymentStatus(null)
        }
      }}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-green-600">Registration Successful!</DialogTitle>

          <DialogDescription className="space-y-3 pt-2">
            <p>
              Your {roleCards.find((r) => r.role === lastSubmittedRole)?.title.toLowerCase() ?? "application"} application has
              been submitted successfully.
            </p>

            <div className="rounded-md border border-green-200 bg-green-50 p-3 text-sm">
              <p className="font-medium text-green-900">Next steps: payment & confirmation</p>
              <p className="text-green-800">Fee: {roleCards.find((r) => r.role === lastSubmittedRole)?.price ?? "—"}</p>
              <p className="text-green-800">
                {lastPaymentStatus === "yes"
                  ? "Thanks for confirming your payment. Our finance team will verify your receipt within two business days."
                  : lastPaymentStatus === "no"
                    ? hasStripePaymentLink
                      ? "You still need to complete your payment. Use the secure Stripe checkout link below or follow the instructions in your confirmation email."
                      : "You still need to complete your payment. Follow the instructions in your confirmation email to finalize it."
                    : hasStripePaymentLink
                      ? "Use the secure Stripe checkout link below to complete your payment."
                      : "You'll receive a confirmation email with payment instructions shortly."}
              </p>
              <p className="text-green-800">
                {lastPaymentStatus === "no" ? (
                  <>
                    When you have your receipt, upload it on the{" "}
                    <Link href="/proof-of-payment" className="font-semibold text-[#B22222] underline-offset-4 hover:underline">
                      Proof of Payment page
                    </Link>{" "}
                    so we can verify your registration without delay.
                  </>
                ) : (
                  "Keep a copy of your payment confirmation for your records."
                )}
              </p>
            </div>

            <ul className="list-disc pl-5 space-y-1 text-sm text-gray-700">
              <li>Check your inbox (and spam) for the payment email.</li>
              <li>
                Need help? Email <a href="mailto:conference@vofmun.org" className="underline">conference@vofmun.org</a>.
              </li>
            </ul>
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col sm:flex-row justify-center items-center gap-3 pt-4">
          {hasStripePaymentLink && lastPaymentStatus !== "yes" && (
            <Button asChild className="bg-[#635BFF] hover:bg-[#4B46C2] text-white w-full sm:w-auto">
              <a href={stripePaymentUrl} target="_blank" rel="noopener noreferrer">
                Pay via Stripe
              </a>
            </Button>
          )}
          <Button onClick={() => setShowSuccessModal(false)} className="bg-green-600 hover:bg-green-700 w-full sm:w-auto">
            Got it, thanks!
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )

  if (!selectedRole) {
    return (
      <>
        <Card className="w-full max-w-2xl mx-auto diplomatic-shadow border-0 bg-white/90">
          <CardHeader className="space-y-3 sm:space-y-4 p-4 sm:p-6" style={{ paddingBottom: "0px" }}>
          <CardTitle className="text-xl sm:text-2xl font-serif text-center text-gray-900">
            Register for VOFMUN 2026
          </CardTitle>
          <CardDescription className="text-center text-gray-600 text-sm sm:text-base">
            Join the conversation that shapes tomorrow's world
          </CardDescription>
        </CardHeader>
        <CardContent className="p-4 sm:p-6" style={{ paddingTop: "0px" }}>
          <Alert className="mb-6 bg-blue-50 border-blue-200 text-blue-900">
            <Building2 className="h-5 w-5" />
            <AlertTitle>Registering a school delegation?</AlertTitle>
            <AlertDescription className="text-blue-800 space-y-2">
              <p>
                Schools can submit a consolidated delegation application with spreadsheet uploads via our dedicated signup form.
              </p>
              <Button
                asChild
                size="sm"
                variant="outline"
                className="border-blue-300 text-blue-800 hover:bg-blue-100"
              >
                <Link href="/signup/school">Go to School Delegation Signup</Link>
              </Button>
            </AlertDescription>
          </Alert>
          <div className="text-center mb-4 sm:mb-8">
            <h2 className="text-lg sm:text-xl font-semibold text-gray-800 mb-2">Choose Your Role</h2>
            <p className="text-gray-600 text-sm sm:text-base">Select the role you'd like to apply for at VOFMUN 2026</p>
          </div>

          <div className="grid md:grid-cols-3 gap-4 sm:gap-6">
            {roleCards.map((card) => {
              const IconComponent = card.icon
              return (
                <div
                  key={card.role}
                  className="relative border-2 border-gray-200 rounded-xl p-4 sm:p-6 cursor-pointer transition-all duration-300 hover:border-[#B22222] hover:shadow-lg hover:scale-105 group flex flex-col"
                  onClick={() => setSelectedRole(card.role)}
                  data-testid={`select-role-${card.role}`}
                >
                  <div className="text-center flex flex-col h-full">
                    <div className="inline-flex items-center justify-center w-12 h-12 sm:w-16 sm:h-16 bg-[#B22222] rounded-full mb-3 sm:mb-4 group-hover:scale-110 transition-transform">
                      <IconComponent className="h-6 sm:h-8 w-6 sm:w-8 text-white" />
                    </div>

                    <h3 className="text-lg sm:text-xl font-bold text-gray-800 mb-2">{card.title}</h3>

                    <div className="flex items-center justify-center gap-2 mb-3">
                      <span className="text-xl sm:text-2xl font-bold text-[#B22222]">{card.price}</span>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Info className="h-4 w-4 text-gray-400 hover:text-[#B22222] cursor-help" />
                          </TooltipTrigger>
                          <TooltipContent className="max-w-xs p-3" data-testid={`tooltip-${card.role}`}>
                            <p className="text-sm">{card.details}</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>

                    <p className="text-sm text-gray-600 mb-4 flex-1">{card.description}</p>

                    <Button
                      className="flex w-full bg-[#B22222] hover:bg-[#B22222] text-white text-xs py-2 sm:py-2.5 mt-auto"
                      data-testid={`button-${card.role}`}
                    >
                      Select
                    </Button>
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>
      {successModal}
      </>
    )
  }

  return (
    <>
      <Card className="w-full max-w-2xl mx-auto diplomatic-shadow border-0 bg-white/90 py-0 gap-0">
        <CardHeader className="px-4 sm:px-6 py-4 sm:py-6 border-b border-gray-200 bg-white/95">
          <CardTitle className="text-xl sm:text-2xl font-serif text-gray-900">
            {roleCards.find((r) => r.role === selectedRole)?.title} Registration
        </CardTitle>
        <CardAction>
          <Button
            variant="outline"
            size="sm"
            onClick={() => !showSuccessModal && setSelectedRole(null)}
            disabled={showSuccessModal}
            className="text-gray-600 hover:text-gray-800"
            data-testid="button-back-to-role-selection"
          >
            Change Role
          </Button>
        </CardAction>
      </CardHeader>
      <CardContent className="space-y-4 sm:space-y-6 py-6 px-4 sm:px-6">
        <form onSubmit={handleSubmit} className="space-y-4 sm:space-6">
          {/* Personal Information - Common for all roles */}
          <div className="space-y-3 sm:space-4">
            <h3 className="text-lg sm:text-xl font-serif font-semibold text-primary">Personal Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
              <div className="space-y-1.5 sm:space-y-2">
                <Label htmlFor="firstName" className="text-xs sm:text-sm font-medium text-gray-700">
                  First Name <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="firstName"
                  value={formData.firstName}
                  onChange={(e) => handleInputChange("firstName", e.target.value)}
                  data-testid="input-firstName"
                  className={`text-sm sm:text-base py-2 sm:py-2.5 ${errors.firstName ? "border-red-500" : ""}`}
                  placeholder="Enter your first name"
                />
                {errors.firstName && <p className="text-sm text-red-500">{errors.firstName}</p>}
              </div>
              <div className="space-y-1.5 sm:space-y-2">
                <Label htmlFor="lastName" className="text-xs sm:text-sm font-medium text-gray-700">
                  Last Name <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="lastName"
                  value={formData.lastName}
                  onChange={(e) => handleInputChange("lastName", e.target.value)}
                  data-testid="input-lastName"
                  className={`text-sm sm:text-base py-2 sm:py-2.5 ${errors.lastName ? "border-red-500" : ""}`}
                  placeholder="Enter your last name"
                />
                {errors.lastName && <p className="text-sm text-red-500">{errors.lastName}</p>}
              </div>
            </div>
            <div className="space-y-1.5 sm:space-y-2">
              <Label htmlFor="email" className="text-xs sm:text-sm font-medium text-gray-700">
                Email Address <span className="text-red-500">*</span>
              </Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange("email", e.target.value)}
                data-testid="input-email"
                className={`text-sm sm:text-base py-2 sm:py-2.5 ${errors.email ? "border-red-500" : ""}`}
                placeholder="Enter your email address"
              />
              {errors.email && <p className="text-sm text-red-500">{errors.email}</p>}
            </div>
            <div className="space-y-1.5 sm:space-y-2">
              <Label htmlFor="nationality" className="text-xs sm:text-sm font-medium text-gray-700">
                Nationality <span className="text-red-500">*</span>
              </Label>
              <CountrySelect
                value={formData.nationality}
                onValueChange={(value) => handleInputChange("nationality", value)}
                placeholder="Select your nationality"
                data-testid="select-nationality"
                error={errors.nationality}
              />
            </div>
            <div className="space-y-1.5 sm:space-y-2">
              <Label htmlFor="phone" className="text-xs sm:text-sm font-medium text-gray-700">
                Phone Number <span className="text-red-500">*</span>
              </Label>
              <PhoneInput
                value={formData.phone}
                onChange={(value) => handleInputChange("phone", value || "")}
                countryCode={formData.phoneCountry}
                onCountryChange={(countryCode) => handleInputChange("phoneCountry", countryCode)}
                placeholder="Enter your phone number"
                data-testid="input-phone"
                error={errors.phone}
              />
            </div>
          </div>

          {/* Academic Information - Common for all roles */}
          <div className="space-y-3 sm:space-4">
            <h3 className="text-lg sm:text-xl font-serif font-semibold text-primary">Academic Information</h3>
            <div className="space-y-1.5 sm:space-y-2">
              <Label htmlFor="school" className="text-xs sm:text-sm font-medium text-gray-700">
                School/Institution <span className="text-red-500">*</span>
              </Label>
              <SchoolSelect
                value={formData.school}
                onValueChange={(value) => handleInputChange("school", value)}
                placeholder="Enter your school/institution"
                error={!!errors.school}
                data-testid="select-school"
              />
              {errors.school && <p className="text-sm text-red-500">{errors.school}</p>}
            </div>
            <div className="space-y-1.5 sm:space-y-2">
              <Label htmlFor="grade" className="text-xs sm:text-sm font-medium text-gray-700">
                Grade/Year <span className="text-red-500">*</span>
              </Label>
              <Select onValueChange={(value) => handleInputChange("grade", value)} value={formData.grade}>
                <SelectTrigger
                  data-testid="select-grade"
                  className={`text-xs sm:text-sm h-9 sm:h-10 ${errors.grade ? "border-red-500" : ""}`}
                >
                  <SelectValue placeholder="Select your grade/year" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="6">Grade 6/Year 7</SelectItem>
                  <SelectItem value="7">Grade 7/Year 8</SelectItem>
                  <SelectItem value="8">Grade 8/Year 9</SelectItem>
                  <SelectItem value="9">Grade 9/Year 10</SelectItem>
                  <SelectItem value="10">Grade 10/Year 11</SelectItem>
                  <SelectItem value="11">Grade 11/Year 12</SelectItem>
                  <SelectItem value="12">Grade 12/Year 13</SelectItem>
                  <SelectItem value="university">University</SelectItem>
                </SelectContent>
              </Select>
              {errors.grade && <p className="text-sm text-red-500">{errors.grade}</p>}
            </div>
          </div>

          {selectedRole === "delegate" && (
            <div className="space-y-4 sm:space-6">
              <h3 className="text-lg sm:text-xl font-serif font-semibold text-primary">Delegate Application</h3>

              <div className="space-y-3 sm:space-4">
                <Label>
                  Previous MUN Experience <span className="text-red-500">*</span>
                </Label>
                <RadioGroup
                  value={delegateData.experience}
                  onValueChange={(value) => setDelegateData((prev) => ({ ...prev, experience: value }))}
                  data-testid="radiogroup-experience"
                  className="space-y-1"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="none" id="exp-none" />
                    <Label htmlFor="exp-none">0-3 conferences</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="beginner" id="exp-beginner" />
                    <Label htmlFor="exp-beginner">4-8 conferences</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="intermediate" id="exp-intermediate" />
                    <Label htmlFor="exp-intermediate">9-15 conferences</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="advanced" id="exp-advanced" />
                    <Label htmlFor="exp-advanced">15+ conferences</Label>
                  </div>
                </RadioGroup>
                {errors.experience && <p className="text-sm text-red-500">{errors.experience}</p>}
              </div>

              <div className="space-y-3 sm:space-4">
                <h4 className="text-md sm:text-lg font-semibold text-gray-700">Committee Preferences</h4>
                <p className="text-sm text-muted-foreground">Please rank your top 3 committee preferences.</p>
                {committeeChoices.map(({ key, label, required }) => (
                  <div key={key} className="space-y-1.5 sm:space-y-2">
                    <div>
                      <Label htmlFor={key} className="text-xs sm:text-sm font-medium text-gray-700">
                        {label}
                        {required && <span className="text-red-500"> *</span>}
                      </Label>
                      <Select
                        onValueChange={(value) => setDelegateData((p) => ({ ...p, [key]: value }))}
                        value={delegateData[key]}
                      >
                        <SelectTrigger
                          id={key}
                          data-testid={`select-${key}`}
                          className="text-xs sm:text-sm h-9 sm:h-10"
                        >
                          <SelectValue placeholder={`Select your ${label.toLowerCase()}`} />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem
                            value="ga1"
                            disabled={
                              [delegateData.committee1, delegateData.committee2, delegateData.committee3].includes(
                                "ga1",
                              ) && delegateData[key] !== "ga1"
                            }
                          >
                            General Assembly (GA1) - Beginner
                          </SelectItem>
                          <SelectItem
                            value="unodc"
                            disabled={
                              [delegateData.committee1, delegateData.committee2, delegateData.committee3].includes(
                                "unodc",
                              ) && delegateData[key] !== "unodc"
                            }
                          >
                            UNODC - Intermediate
                          </SelectItem>
                          <SelectItem
                            value="ecosoc"
                            disabled={
                              [delegateData.committee1, delegateData.committee2, delegateData.committee3].includes(
                                "ecosoc",
                              ) && delegateData[key] !== "ecosoc"
                            }
                          >
                            ECOSOC - Intermediate
                          </SelectItem>
                          <SelectItem
                            value="who"
                            disabled={
                              [delegateData.committee1, delegateData.committee2, delegateData.committee3].includes(
                                "who",
                              ) && delegateData[key] !== "who"
                            }
                          >
                            WHO - Beginner
                          </SelectItem>
                          <SelectItem
                            value="uncstd"
                            disabled={
                              [delegateData.committee1, delegateData.committee2, delegateData.committee3].includes(
                                "uncstd",
                              ) && delegateData[key] !== "uncstd"
                            }
                          >
                            UNCSTD - Advanced
                          </SelectItem>
                          <SelectItem
                            value="icj"
                            disabled={
                              [delegateData.committee1, delegateData.committee2, delegateData.committee3].includes(
                                "icj",
                              ) && delegateData[key] !== "icj"
                            }
                          >
                            ICJ - Special Procedure
                          </SelectItem>
                          <SelectItem
                            value="icrcc"
                            disabled={
                              [delegateData.committee1, delegateData.committee2, delegateData.committee3].includes(
                                "icrcc",
                              ) && delegateData[key] !== "icrcc"
                            }
                          >
                            ICRCC - Crisis
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                ))}
              </div>

              <div className="space-y-3 sm:space-4">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <h4 className="text-md sm:text-lg font-semibold text-gray-700">Referral Codes (Optional)</h4>
                    <p className="text-sm text-muted-foreground">
                      Enter referral codes shared with you by any secretariat members. Add multiple codes if you have more than one.
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addReferralCode}
                    className="flex items-center gap-2"
                    data-testid="button-add-referral-code"
                  >
                    <Plus className="h-4 w-4" />
                    Add Code
                  </Button>
                </div>
                <div className="space-y-2">
                  {delegateData.referralCodes.map((code, index) => {
                    const feedback = referralFeedback[index]
                    const feedbackColor =
                      feedback?.type === "error"
                        ? "text-red-600"
                        : feedback?.type === "success"
                          ? "text-green-600"
                          : "text-amber-600"
                    return (
                      <div key={index} className="flex flex-col gap-1 sm:flex-row sm:items-center sm:gap-2">
                        <div className="flex-1">
                          <Input
                            value={code}
                            onChange={(e) => updateReferralCode(index, e.target.value)}
                            onBlur={() => handleReferralBlur(index)}
                            placeholder="Enter referral code"
                            className="flex-1"
                            data-testid={`input-referral-code-${index}`}
                          />
                          {feedback && (
                            <p className={`mt-1 text-xs ${feedbackColor}`}>{feedback.message}</p>
                          )}
                        </div>
                        {delegateData.referralCodes.length > 1 && (
                          <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            onClick={() => removeReferralCode(index)}
                            className="h-9 w-9 text-red-500 border-red-200 hover:bg-red-50"
                            aria-label={`Remove referral code ${index + 1}`}
                            data-testid={`button-remove-referral-code-${index}`}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          )}

          {selectedRole === "chair" && (
            <div className="space-y-4 sm:space-6">
              <h3 className="text-lg sm:text-xl font-serif font-semibold text-primary">Chair Application</h3>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label>
                    Relevant Experience <span className="text-red-500">*</span>
                  </Label>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setShowAIModal(true)}
                      className="flex items-center gap-2 bg-purple-50 border-purple-200 hover:bg-purple-100 text-purple-700"
                      data-testid="button-ai-chair-experience"
                    >
                      <Sparkles className="h-4 w-4" />
                      AI Auto-Fill
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={addChairExperience}
                      className="flex items-center gap-2 bg-transparent"
                      data-testid="button-add-chair-experience"
                    >
                      <Plus className="h-4 w-4" />
                      Add Experience
                    </Button>
                  </div>
                </div>

                {chairData.experiences.map((exp, index) => (
                  <div key={index} className="border rounded-lg p-4 sm:p-5 space-y-4 relative">
                    {chairData.experiences.length > 1 && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => removeChairExperience(index)}
                        className="absolute top-2 right-2 h-8 w-8 p-0 z-10 bg-white hover:bg-red-50 border-red-200 hover:border-red-300"
                        data-testid={`button-remove-chair-experience-${index}`}
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    )}

                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 sm:w-[93%]">
                      <div className="sm:col-span-2">
                        <Label htmlFor={`chair-conference-${index}`}>Conference/Event Name <span className="text-red-500">*</span></Label>
                        <Input
                          id={`chair-conference-${index}`}
                          value={exp.conference}
                          onChange={(e) => updateChairExperience(index, "conference", e.target.value)}
                          placeholder="e.g., VOFMUN 2023"
                          data-testid={`input-chair-conference-${index}`}
                        />
                      </div>
                      <div className="sm:col-span-2">
                        <Label>
                          Position <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          value={exp.position}
                          onChange={(e) => updateChairExperience(index, "position", e.target.value)}
                          placeholder="e.g. Chair, Delegate, Deputy Chair"
                          data-testid={`input-chair-position-${index}`}
                          className="text-sm sm:text-base py-2 sm:py-2.5"
                        />
                      </div>
                    </div>
                    <div>
                      <Label htmlFor={`chair-year-${index}`}>Year <span className="text-red-500">*</span> </Label>
                      <Input
                        id={`chair-year-${index}`}
                        value={exp.year}
                        onChange={(e) => updateChairExperience(index, "year", e.target.value)}
                        placeholder="e.g., 2023"
                        data-testid={`input-chair-year-${index}`}
                      />
                    </div>
                    <div>
                      <Label htmlFor={`chair-description-${index}`}>Description <span className="text-red-500">*</span> </Label>
                      <Textarea
                        id={`chair-description-${index}`}
                        value={exp.description}
                        onChange={(e) => updateChairExperience(index, "description", e.target.value)}
                        placeholder="Describe your responsibilities and achievements in this role..."
                        className="min-h-[100px]"
                        data-testid={`textarea-chair-description-${index}`}
                      />
                    </div>
                  </div>
                ))}
              </div>

              <div className="space-y-3 sm:space-4">
                <h4 className="text-md sm:text-lg font-semibold text-gray-700">Committee Preferences</h4>
                <p className="text-sm text-muted-foreground">
                  Please rank your top 3 committee preferences for chairing.
                </p>
                {[1, 2, 3].map((num) => (
                  <div key={num} className="space-y-1.5 sm:space-y-2">
                    <div>
                      <Label htmlFor={`chair-committee${num}`} className="text-xs sm:text-sm font-medium text-gray-700">
                        {num === 1 ? (
                          <>
                            First Choice <span className="text-red-500">*</span>
                          </>
                        ) : num === 2 ? (
                          "Second Choice"
                        ) : (
                          "Third Choice"
                        )}
                      </Label>
                      <Select
                        onValueChange={(value) => setChairData((p) => ({ ...p, [`committee${num}`]: value }))}
                        value={chairData[`committee${num}` as 'committee1' | 'committee2' | 'committee3']}
                      >
                        <SelectTrigger
                          data-testid={`select-chair-committee${num}`}
                          className="text-xs sm:text-sm h-9 sm:h-10"
                        >
                          <SelectValue
                            placeholder={`Select your ${num === 1 ? "first" : num === 2 ? "second" : "third"} choice`}
                          />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem
                            value="ga1"
                            disabled={
                              [chairData.committee1, chairData.committee2, chairData.committee3].includes("ga1") &&
                              chairData[`committee${num}` as keyof typeof chairData] !== "ga1"
                            }
                          >
                            General Assembly (GA1) - Beginner
                          </SelectItem>
                          <SelectItem
                            value="unodc"
                            disabled={
                              [chairData.committee1, chairData.committee2, chairData.committee3].includes("unodc") &&
                              chairData[`committee${num}` as keyof typeof chairData] !== "unodc"
                            }
                          >
                            UNODC - Intermediate
                          </SelectItem>
                          <SelectItem
                            value="ecosoc"
                            disabled={
                              [chairData.committee1, chairData.committee2, chairData.committee3].includes("ecosoc") &&
                              chairData[`committee${num}` as keyof typeof chairData] !== "ecosoc"
                            }
                          >
                            ECOSOC - Intermediate
                          </SelectItem>
                          <SelectItem
                            value="who"
                            disabled={
                              [chairData.committee1, chairData.committee2, chairData.committee3].includes("who") &&
                              chairData[`committee${num}` as keyof typeof chairData] !== "who"
                            }
                          >
                            WHO - Beginner
                          </SelectItem>
                          <SelectItem
                            value="uncstd"
                            disabled={
                              [chairData.committee1, chairData.committee2, chairData.committee3].includes("uncstd") &&
                              chairData[`committee${num}` as keyof typeof chairData] !== "uncstd"
                            }
                          >
                            UNCSTD - Advanced
                          </SelectItem>
                          <SelectItem
                            value="icj"
                            disabled={
                              [chairData.committee1, chairData.committee2, chairData.committee3].includes("icj") &&
                              chairData[`committee${num}` as keyof typeof chairData] !== "icj"
                            }
                          >
                            ICJ - Advanced
                          </SelectItem>
                          <SelectItem
                            value="icrcc"
                            disabled={
                              [chairData.committee1, chairData.committee2, chairData.committee3].includes("icrcc") &&
                              chairData[`committee${num}` as keyof typeof chairData] !== "icrcc"
                            }
                          >
                            ICRCC - Intermediate
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                ))}
              </div>

              <div className="space-y-4">
                <h4 className="text-md font-semibold text-gray-800">Section 1</h4>

                <div className="space-y-2">
                  <Label>
                    Would you be interested in being a part of the Crisis Backroom Staff?{" "}
                    <span className="text-red-500">*</span>
                  </Label>
                  <p className="text-sm text-gray-600 mb-3">
                    Main responsibilities include managing the ICRCC Committee's flow along with the Crisis Director,
                    operating and planning ICRCC updates, and handling directives and updates for the committee. A
                    complete list of responsibilities can be found at the start of the form.
                  </p>
                  <div className="flex gap-4">
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="crisisBackroom"
                        value="yes"
                        checked={chairData.crisisBackroomInterest === "yes"}
                        onChange={(e) => setChairData((prev) => ({ ...prev, crisisBackroomInterest: e.target.value }))}
                        className="mr-2"
                      />
                      Yes
                    </label>
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="crisisBackroom"
                        value="no"
                        checked={chairData.crisisBackroomInterest === "no"}
                        onChange={(e) => setChairData((prev) => ({ ...prev, crisisBackroomInterest: e.target.value }))}
                        className="mr-2"
                      />
                      No
                    </label>
                  </div>
                  {errors.chairCrisisBackroomInterest && (
                    <p className="text-sm text-red-500">{errors.chairCrisisBackroomInterest}</p>
                  )}
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="text-md font-semibold text-gray-800">Section 2</h4>
                <p className="text-sm text-gray-600 italic">
                  Try to keep all answers concise and short, preferably around 200 words. Extremely long-winded
                  responses will be disregarded.
                </p>

                <div className="space-y-2">
                  <Label>
                    Why do you believe you are the best fit for this role? <span className="text-red-500">*</span>
                  </Label>
                  <Textarea
                    value={chairData.whyBestFit}
                    onChange={(e) => setChairData((prev) => ({ ...prev, whyBestFit: e.target.value }))}
                    placeholder="Explain why you are the best fit for this chair role..."
                    className={`min-h-[100px] ${errors.chairWhyBestFit ? "border-red-500" : ""}`}
                  />
                  {errors.chairWhyBestFit && <p className="text-sm text-red-500">{errors.chairWhyBestFit}</p>}
                  <p className="text-xs text-gray-500">{chairData.whyBestFit.length} characters</p>
                </div>

                <div className="space-y-2">
                  <Label>
                    In your opinion, what makes an MUN committee successful? <span className="text-red-500">*</span>
                  </Label>
                  <p className="text-sm text-gray-600">
                    Feel free to share any ideas or strategies you have in mind to make the VOFMUN experience both
                    educational and engaging for delegates
                  </p>
                  <Textarea
                    value={chairData.successfulCommittee}
                    onChange={(e) => setChairData((prev) => ({ ...prev, successfulCommittee: e.target.value }))}
                    placeholder="Share your thoughts on what makes a successful MUN committee..."
                    className={`min-h-[100px] ${errors.chairSuccessfulCommittee ? "border-red-500" : ""}`}
                  />
                  {errors.chairSuccessfulCommittee && (
                    <p className="text-sm text-red-500">{errors.chairSuccessfulCommittee}</p>
                  )}
                  <p className="text-xs text-gray-500">{chairData.successfulCommittee.length} characters</p>
                </div>

                <div className="space-y-2">
                  <Label>
                    What is your greatest strength and your greatest weakness as a chair and leader?{" "}
                    <span className="text-red-500">*</span>
                  </Label>
                  <Textarea
                    value={chairData.strengthWeakness}
                    onChange={(e) => setChairData((prev) => ({ ...prev, strengthWeakness: e.target.value }))}
                    placeholder="Describe your greatest strength and weakness as a leader..."
                    className={`min-h-[100px] ${errors.chairStrengthWeakness ? "border-red-500" : ""}`}
                  />
                  {errors.chairStrengthWeakness && (
                    <p className="text-sm text-red-500">{errors.chairStrengthWeakness}</p>
                  )}
                  <p className="text-xs text-gray-500">{chairData.strengthWeakness.length} characters</p>
                </div>
              </div>

              <div className="p-2 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-start gap-1">
                  <AlertCircle className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <h4 className="font-sm text-green-900">Important Documents for Chairs</h4>
                    <p className="text-xs text-green-700">
                      Make sure you understand the responsibilites of being a chair:
                    </p>
                    <div className="flex flex-wrap gap-4">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => window.open("/pdfs/Responsibilities.pdf", "_blank")}
                        className="bg-white border-green-300 hover:bg-green-50 text-green-800 hover:cursor-pointer hover:text-green-900 text-xs"
                      >
                        Chair Responsibilities
                      </Button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Section 3 - Crisis Backroom Staff Questions (conditional) */}
              {chairData.crisisBackroomInterest === "yes" && (
                <div className="space-y-4 border-t pt-4">
                  <h4 className="text-md font-semibold text-gray-800">Section 3 - Crisis Backroom Staff Questions</h4>
                  <p className="text-sm text-gray-600 italic">
                    Only if Yes was chosen for Question 2. Try to keep all answers concise and short, preferably around
                    200 words. Extremely long-winded responses will be disregarded.
                  </p>

                  <div className="space-y-2">
                    <Label>
                      Crisis Response Scenario <span className="text-red-500">*</span>
                    </Label>
                    <p className="text-sm text-gray-600 mb-3">
                      Crisis backroom staff need to respond quickly and creatively to unexpected developments.
                      <br />
                      <br />
                      Imagine a delegate unexpectedly sends you a crisis note to launch a hostile action in the
                      committee, and you need to provide the urgent crisis update within 10 minutes to the entire
                      committee.
                      <br />
                      <br />
                      How would you approach generating and managing this update?
                    </p>
                    <Textarea
                      value={chairData.crisisResponse}
                      onChange={(e) => setChairData((prev) => ({ ...prev, crisisResponse: e.target.value }))}
                      placeholder="Describe your approach to handling this crisis scenario..."
                      className={`min-h-[120px] ${errors.chairCrisisResponse ? "border-red-500" : ""}`}
                    />
                    {errors.chairCrisisResponse && <p className="text-sm text-red-500">{errors.chairCrisisResponse}</p>}
                    <p className="text-xs text-gray-500">{chairData.crisisResponse.length} characters</p>
                  </div>

                  <div className="space-y-2">
                    <Label>
                      Availability and Communication <span className="text-red-500">*</span>
                    </Label>
                    <p className="text-sm text-gray-600 mb-3">
                      Crisis committees often require real-time collaboration and rapid responses.
                      <br />
                      <br />
                      Are you available for all conference sessions, and how would you ensure timely and clear
                      communication with the Chairs and other backroom staff?
                    </p>
                    <Textarea
                      value={chairData.availability}
                      onChange={(e) => setChairData((prev) => ({ ...prev, availability: e.target.value }))}
                      placeholder="Confirm your availability and describe your communication approach..."
                      className={`min-h-[100px] ${errors.chairAvailability ? "border-red-500" : ""}`}
                    />
                    {errors.chairAvailability && <p className="text-sm text-red-500">{errors.chairAvailability}</p>}
                    <p className="text-xs text-gray-500">{chairData.availability.length} characters</p>
                  </div>
                </div>
              )}


            </div>
          )}

          {selectedRole === "admin" && (
            <div className="space-y-4 sm:space-6">
              <h3 className="text-lg sm:text-xl font-serif font-semibold text-primary">Admin Application</h3>


              <div className="space-y-1.5 sm:space-y-2">
                <Label htmlFor="adminExperience">
                  Describe/list all relevant experience you have that is applicable to the role of Admin staff{" "}
                  <span className="text-red-500">*</span>
                </Label>
                <Textarea
                  id="adminExperience"
                  value={adminData.relevantExperience || ""}
                  onChange={(e) => setAdminData((prev) => ({ ...prev, relevantExperience: e.target.value }))}
                  placeholder="Please describe your relevant experience for the Admin staff role..."
                  className={`min-h-[120px] text-sm sm:text-base ${errors.adminExperience ? "border-red-500" : ""}`}
                  data-testid="textarea-admin-experience"
                />
                {errors.adminExperience && <p className="text-sm text-red-500">{errors.adminExperience}</p>}
              </div>

              <div className="space-y-1.5 sm:space-y-2">
                <Label>
                  Have you been an Admin before? <span className="text-red-500">*</span>
                </Label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="previousAdmin"
                      value="yes"
                      checked={adminData.previousAdmin === "yes"}
                      onChange={(e) => setAdminData((prev) => ({ ...prev, previousAdmin: e.target.value as "yes" | "no" }))}
                      className="text-primary"
                    />
                    <span className="text-sm sm:text-base">Yes</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="previousAdmin"
                      value="no"
                      checked={adminData.previousAdmin === "no"}
                      onChange={(e) => setAdminData((prev) => ({ ...prev, previousAdmin: e.target.value as "yes" | "no" }))}
                      className="text-primary"
                    />
                    <span className="text-sm sm:text-base">No</span>
                  </label>
                </div>
                {errors.previousAdmin && <p className="text-sm text-red-500">{errors.previousAdmin}</p>}
              </div>

              <div className="space-y-1.5 sm:space-y-2">
                <Label>
                  Do you understand the roles and responsibilities of an Admin, and confirm you will be available to
                  attend the conference for all committee sessions? <span className="text-red-500">*</span>
                </Label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="understandsRole"
                      value="yes"
                      checked={adminData.understandsRole === "yes"}
                      onChange={(e) => setAdminData((prev) => ({ ...prev, understandsRole: e.target.value as "yes" | "no" }))}
                      className="text-primary"
                    />
                    <span className="text-sm sm:text-base">Yes, I understand and confirm my availability</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="understandsRole"
                      value="no"
                      checked={adminData.understandsRole === "no"}
                      onChange={(e) => setAdminData((prev) => ({ ...prev, understandsRole: e.target.value as "yes" | "no" }))}
                      className="text-primary"
                    />
                    <span className="text-sm sm:text-base">No</span>
                  </label>
                </div>
                {errors.understandsRole && <p className="text-sm text-red-500">{errors.understandsRole}</p>}
              </div>

              <div className="p-2 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-start gap-1">
                  <AlertCircle className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <h4 className="font-sm text-green-900">Important Documents for Admins</h4>
                    <p className="text-xs text-green-700">
                      Make sure you understand the responsibilites of being an admin:
                    </p>
                    <div className="flex flex-wrap gap-4">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => window.open("/pdfs/Responsibilities.pdf", "_blank")}
                        className="bg-white border-green-300 hover:bg-green-50 text-green-800 hover:cursor-pointer hover:text-green-900 text-xs"
                      >
                        Admin Responsibilities
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Additional Information - Common for all roles */}
          <div className="space-y-3 sm:space-4">
            <h3 className="text-lg sm:text-xl font-serif font-semibold text-primary">Additional Information</h3>
            <div className="space-y-3 sm:space-4">

              <div className="space-y-1.5 sm:space-y-2">
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <h4 className="font-medium text-blue-900">Dietary Accommodations</h4>
                      <p className="text-sm text-blue-700 mt-1">
                        No beef or pork will be served to respect cultural and religious practices. All meals will
                        accommodate various dietary preferences as specified during registration.
                      </p>
                    </div>
                  </div>
                </div>
                <Label>
                  Dietary Preferences <span className="text-red-500">*</span>
                </Label>

                <RadioGroup
                  value={formData.dietaryType}
                  onValueChange={(value) => handleInputChange("dietaryType", value)}
                  data-testid="radiogroup-dietary-type"
                  className="space-y-1"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="vegetarian" id="diet-veg" />
                    <Label htmlFor="diet-veg">Vegetarian</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="non-vegetarian" id="diet-non-veg" />
                    <Label htmlFor="diet-non-veg">Non-Vegetarian</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="other" id="diet-other" />
                    <Label htmlFor="diet-other">Other</Label>
                  </div>
                </RadioGroup>
                {errors.dietaryType && <p className="text-sm text-red-500">{errors.dietaryType}</p>}
                {formData.dietaryType === "other" && (
                  <div className="ml-4 sm:ml-6 space-y-1.5 sm:space-y-2">
                    <Label htmlFor="dietaryOther">Please specify</Label>
                    <Input
                      id="dietaryOther"
                      value={formData.dietaryOther}
                      onChange={(e) => handleInputChange("dietaryOther", e.target.value)}
                      placeholder="e.g. Vegan, Halal, Kosher, etc."
                      data-testid="input-dietary-other"
                      className={`text-sm sm:text-base py-2 sm:py-2.5 ${errors.dietaryOther ? "border-red-500" : ""}`}
                    />
                    {errors.dietaryOther && <p className="text-sm text-red-500">{errors.dietaryOther}</p>}
                  </div>
                )}
              </div>

              <div className="space-y-1.5 sm:space-y-2">
                <Label>
                  Do you have any allergies VOFMUN should be aware of? <span className="text-red-500">*</span>
                </Label>
                <RadioGroup
                  value={formData.hasAllergies}
                  onValueChange={(value) => handleInputChange("hasAllergies", value)}
                  data-testid="radiogroup-allergies"
                  className="space-y-1"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="yes" id="allergies-yes" />
                    <Label htmlFor="allergies-yes">Yes</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="no" id="allergies-no" />
                    <Label htmlFor="allergies-no">No</Label>
                  </div>
                </RadioGroup>
                {errors.hasAllergies && <p className="text-sm text-red-500">{errors.hasAllergies}</p>}
                {formData.hasAllergies === "yes" && (
                  <div className="ml-4 sm:ml-6 space-y-1.5 sm:space-y-2">
                    <Label htmlFor="allergiesDetails">Please list your allergies</Label>
                    <Textarea
                      id="allergiesDetails"
                      value={formData.allergiesDetails}
                      onChange={(e) => handleInputChange("allergiesDetails", e.target.value)}
                      placeholder="Please list any food allergies or medical conditions we should be aware of..."
                      data-testid="textarea-allergies-details"
                      className={`text-sm sm:text-base ${errors.allergiesDetails ? "border-red-500" : ""}`}
                    />
                    {errors.allergiesDetails && <p className="text-sm text-red-500">{errors.allergiesDetails}</p>}
                  </div>
                )}
              </div>
            </div>
            <div className="space-y-3 sm:space-4">
              <div className="space-y-1.5 sm:space-y-2">
                <Label htmlFor="emergencyContact" className="text-xs sm:text-sm font-medium text-gray-700">
                  Emergency Contact Name <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="emergencyContact"
                  value={formData.emergencyContact}
                  onChange={(e) => handleInputChange("emergencyContact", e.target.value)}
                  data-testid="input-emergency-contact"
                  className={`text-sm sm:text-base py-2 sm:py-2.5 ${errors.emergencyContact ? "border-red-500" : ""}`}
                  placeholder="Enter emergency contact name"
                />
                {errors.emergencyContact && <p className="text-sm text-red-500">{errors.emergencyContact}</p>}
              </div>
              <div className="space-y-1.5 sm:space-y-2">
                <Label htmlFor="emergencyPhone" className="text-xs sm:text-sm font-medium text-gray-700">
                  Emergency Contact Phone <span className="text-red-500">*</span>
                </Label>
                <PhoneInput
                  value={formData.emergencyPhone}
                  onChange={(value) => handleInputChange("emergencyPhone", value || "")}
                  countryCode={formData.emergencyPhoneCountry}
                  onCountryChange={(countryCode) => handleInputChange("emergencyPhoneCountry", countryCode)}
                  placeholder="Enter emergency contact phone"
                  data-testid="input-emergency-phone"
                  error={errors.emergencyPhone}
                />
              </div>
            </div>
          </div>

          {/* Payment Confirmation */}
          <div className="space-y-3 sm:space-4">
            <h3 className="text-lg sm:text-xl font-serif font-semibold text-primary">Payment Confirmation</h3>
            <div className="space-y-1.5 sm:space-y-2">
              <Label className="text-xs sm:text-sm font-medium text-gray-700">
                Have you already paid the conference fee? <span className="text-red-500">*</span>
              </Label>
              <RadioGroup
                value={hasPaid || undefined}
                onValueChange={(value) => {
                  setHasPaid(value as "yes" | "no")
                  clearError("paymentStatus")
                }}
                className="flex flex-col sm:flex-row gap-3"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="yes" id="has-paid-yes" />
                  <Label htmlFor="has-paid-yes" className="text-sm text-gray-700">
                    Yes, I've already paid
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="no" id="has-paid-no" />
                  <Label htmlFor="has-paid-no" className="text-sm text-gray-700">
                    Not yet
                  </Label>
                </div>
              </RadioGroup>
              {errors.paymentStatus && <p className="text-sm text-red-500">{errors.paymentStatus}</p>}
            </div>

            {hasPaid === "yes" && (
              <>
                <p className="text-sm text-gray-600">
                  Please upload a clear image or PDF of your payment receipt. This helps us verify registrations quickly.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                  <div className="space-y-1.5 sm:space-y-2">
                    <Label htmlFor="paymentFullName" className="text-xs sm:text-sm font-medium text-gray-700">
                      Full Name on Payment <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="paymentFullName"
                      value={paymentFullName}
                      onChange={(event) => {
                        setPaymentFullName(event.target.value)
                        setHasEditedFullName(true)
                        clearError("paymentFullName")
                      }}
                      placeholder="Full Name (as used in signup)"
                      data-testid="input-payment-full-name"
                      className={`text-sm sm:text-base py-2 sm:py-2.5 ${errors.paymentFullName ? "border-red-500" : ""}`}
                    />
                    {errors.paymentFullName && <p className="text-sm text-red-500">{errors.paymentFullName}</p>}
                  </div>

                </div>

                <div className="space-y-2">
                  <Label className="text-xs sm:text-sm font-medium text-gray-700">
                    Upload Proof of Payment <span className="text-red-500">*</span>
                  </Label>
                  <div
                    className={`relative flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-6 text-center transition-colors duration-200 cursor-pointer ${
                      isDragActive
                        ? "border-[#B22222] bg-[#B22222]/5"
                        : errors.paymentProof
                          ? "border-red-500 bg-red-50"
                          : paymentProofFile
                            ? "border-green-500 bg-green-50"
                            : "border-gray-300 bg-white"
                    }`}
                    onDragOver={handleDragOver}
                    onDragEnter={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    {isDragActive && (
                      <div className="absolute inset-0 rounded-xl bg-[#B22222]/10 backdrop-blur-[1px] flex flex-col items-center justify-center pointer-events-none">
                        <UploadCloud className="h-10 w-10 text-[#B22222] animate-bounce" />
                        <p className="mt-2 text-sm font-semibold text-[#B22222]">Drop file to upload</p>
                      </div>
                    )}

                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*,application/pdf"
                      className="hidden"
                      onChange={(event) => {
                        const file = event.target.files?.[0]
                        if (file) {
                          handlePaymentProofSelect(file)
                        }
                        event.target.value = ""
                      }}
                    />

                    {paymentProofFile ? (
                      paymentProofIsImage && paymentProofPreview ? (
                        <div className="w-full flex flex-col items-center space-y-3">
                          <div className="relative w-full max-w-xs overflow-hidden rounded-lg border border-green-200 bg-white shadow-sm">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={paymentProofPreview}
                              alt="Payment proof preview"
                              className="h-48 w-full object-cover"
                            />
                            <button
                              type="button"
                              onClick={(event) => {
                                event.stopPropagation()
                                resetPaymentProof()
                              }}
                              className="absolute top-2 right-2 inline-flex items-center space-x-1 rounded-full bg-red-600 px-3 py-1 text-xs font-medium text-white shadow"
                            >
                              <X className="h-3 w-3" />
                              <span>Remove</span>
                            </button>
                          </div>
                          <p className="text-sm font-medium text-gray-700">{paymentProofFile?.name}</p>
                          <p className="text-xs text-gray-500">Click or drop another file to replace your upload.</p>
                        </div>
                      ) : (
                        <div className="w-full flex flex-col items-center space-y-3">
                          <div className="relative flex w-full max-w-xs flex-col items-center rounded-lg border border-green-200 bg-white p-6 text-center shadow-sm">
                            <FileText className="h-12 w-12 text-[#B22222]" />
                            <p className="mt-3 text-sm font-semibold text-gray-700">
                              Payment proof {paymentProofIsPdf ? "PDF" : "file"} uploaded
                            </p>
                            <button
                              type="button"
                              onClick={(event) => {
                                event.stopPropagation()
                                resetPaymentProof()
                              }}
                              className="mt-4 inline-flex items-center space-x-1 rounded-full bg-red-600 px-3 py-1 text-xs font-medium text-white shadow"
                            >
                              <X className="h-3 w-3" />
                              <span>Remove</span>
                            </button>
                          </div>
                          <p className="text-sm font-medium text-gray-700 text-center">{paymentProofFile?.name}</p>
                          <p className="text-xs text-gray-500 text-center">Click or drop another file to replace your upload.</p>
                        </div>
                      )
                    ) : (
                      <div className="flex flex-col items-center space-y-3">
                        <UploadCloud className="h-10 w-10 text-[#B22222]" />
                        <p className="text-sm text-gray-700">
                          Drag & drop your payment proof file here, or <span className="font-semibold text-[#B22222]">browse</span>
                        </p>
                        <p className="text-xs text-gray-500">Accepted formats: PNG, JPG, HEIC, PDF • Max size 10MB</p>
                      </div>
                    )}
                  </div>
                  {errors.paymentProof && <p className="text-sm text-red-500">{errors.paymentProof}</p>}
                </div>
              </>
            )}

            {hasPaid === "no" && (
              <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800 space-y-2">
                <p>You indicated you have not paid yet. That's okay but please complete your payment after submitting your application.</p>
                <p>
                  Once you have your receipt, visit the{" "}
                  <Link href="/proof-of-payment" className="font-semibold text-[#B22222] underline-offset-4 hover:underline">
                    Proof of Payment page
                  </Link>{" "}
                  to upload it for verification.
                </p>
              </div>
            )}
          </div>

          {/* Terms and Conditions */}
          <div className="space-y-3 sm:space-4">
            <h3 className="text-lg sm:text-xl font-serif font-semibold text-primary">Terms & Conditions</h3>
            <div className="space-y-3">
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 space-y-3">
                <h4 className="font-semibold text-amber-800">Important Documents</h4>
                <p className="text-sm text-amber-700">
                  Please review these documents before submitting your application:
                </p>
                <div className="flex flex-wrap gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => window.open("/pdfs/T&Cs.pdf", "_blank")}
                    className="bg-white border-amber-300 hover:bg-amber-50 text-amber-800 hover:cursor-pointer hover:text-amber-900"
                  >
                    Terms & Conditions
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => window.open("/pdfs/CoConduct.pdf", "_blank")}
                    className="bg-white border-amber-300 hover:bg-amber-50 text-amber-800 hover:cursor-pointer hover:text-amber-900"
                  >
                    Code of Conduct
                  </Button>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <Checkbox
                  id="agreeTerms"
                  checked={formData.agreeTerms}
                  onCheckedChange={(checked) => handleInputChange("agreeTerms", checked)}
                  data-testid="checkbox-agree-terms"
                  className={errors.agreeTerms ? "border-red-500 [&>svg]:border-red-500" : ""}
                />
                <Label htmlFor="agreeTerms" className="text-sm leading-relaxed">
                  I agree to the VOFMUN terms and conditions, code of conduct, and conference rules.{" "}
                  <span className="text-red-500">*</span>
                </Label>
              </div>
              {errors.agreeTerms && <p className="text-sm text-red-500 ml-6">{errors.agreeTerms}</p>}
            </div>
          </div>

          <Button
            type="submit"
            size="lg"
            className="w-full vofmun-gradient hover:opacity-90 text-sm sm:text-base py-2 sm:py-3"
            disabled={isSubmitting}
            data-testid="button-submit-registration"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Submitting Registration...
              </>
            ) : (
              <>
                <Send className="mr-2 h-5 w-5" />
                Submit {roleCards.find((r) => r.role === selectedRole)?.title} Registration
              </>
            )}
          </Button>
        </form>
      </CardContent>
      </Card>

      {successModal}

      {/* AI Experience Modal */}
      <AIExperienceModal
        isOpen={showAIModal}
        onClose={() => setShowAIModal(false)}
        roleType={selectedRole as "chair" | "admin"}
        onExperiencesParsed={selectedRole === "chair" ? handleAIChairExperiences : handleAIAdminExperiences}
      />
    </>
  )
}
