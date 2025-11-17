import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Calendar, AlertCircle, CheckCircle } from "lucide-react"

export function SignupInfo() {
  return (
    <div className="space-y-6">
      {/* Registration Details */}
      <Card className="diplomatic-shadow border-0 bg-white/90">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2 text-gray-900">
            <Calendar className="h-5 w-5 text-blue-600" />
            <span>Registration Details</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div className="text-gray-800 font-medium">Registration Fees:</div>
            <div className="grid grid-cols-1 gap-2 ml-4">
              <div className="flex items-center justify-between">
                <span className="text-gray-700">Delegates:</span>
                <Badge className="bg-[#B22222] text-white border-0">170 AED</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-700">Chairs:</span>
                <Badge className="bg-blue-600 text-white border-0">100 AED</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-700">Admin Staff:</span>
                <Badge className="bg-green-600 text-white border-0">70 AED</Badge>
              </div>
            </div>
          </div>
          <div className="space-y-3">
            <div className="text-gray-800 font-medium">Registration Deadlines:</div>
            <div className="grid grid-cols-1 gap-2 ml-4">
              <div className="flex items-center justify-between">
                <span className="text-gray-700">Delegates: January 10th 2026</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-700">Chairs: December 20th 2025</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-700">Admin Staff: December 20th 2025</span>
              </div>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-gray-800">Conference Dates:</span>
            <span className="text-gray-600">February 14-15, 2026</span>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <span className="text-gray-800">Venue:</span>
            <div className="text-right space-y-1">
              <span className="text-gray-600 block">
                UKCBC - Academic City, Dubai
              </span>
              <a
                href="https://maps.app.goo.gl/jx4SsR7r58oauhedA"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm font-medium text-[#B22222] hover:underline"
              >
                View in Google Maps
              </a>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* What's Included */}
      <Card className="diplomatic-shadow border-0 bg-white/90">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2 text-gray-900">
            <CheckCircle className="h-5 w-5 text-green-600" />
            <span>What's Included</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-3">
            {[
              "Access to all committee sessions",
              "Welcome reception and networking events",
              "Lunch and refreshments all three days",
              "Conference materials and resources",
              "Certificate of participation",
              "Awards ceremony and recognition",
              "Professional photography",
              "Networking opportunities with delegates",
            ].map((item, index) => (
              <li key={index} className="flex items-start space-x-2">
                <div className="w-1.5 h-1.5 bg-blue-600 rounded-full mt-2 flex-shrink-0"></div>
                <span className="text-gray-700">{item}</span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      {/* Important Notes */}
      <Card className="diplomatic-shadow border-0 bg-white/90">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2 text-gray-900">
            <AlertCircle className="h-5 w-5 text-orange-600" />
            <span>Important Notes</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
            <p className="text-sm text-gray-800">
              <strong>Committee Assignment:</strong> We'll do our best to accommodate your committee preferences, but
              assignments are not guaranteed and depend on availability.
            </p>
          </div>
          <div className="p-3 bg-green-50 rounded-lg border border-green-200">
            <p className="text-sm text-gray-800">
              <strong>Dress Code:</strong> Business formal attire is required for all conference sessions. Cultural
              attire is welcomed when appropriate.
            </p>
          </div>
          <div className="p-3 bg-orange-50 rounded-lg border border-orange-200">
            <p className="text-sm text-gray-800">
              <strong>Cancellation Policy:</strong> Refunds are available until February 1, 2026. After this date, no
              refunds will be processed.
            </p>
          </div>
          <div className="p-3 bg-red-50 rounded-lg border border-red-200">
            <p className="text-sm text-gray-800">
              <strong>Proof of Payment:</strong> Upload your receipt anytime on the {" "}
              <Link href="/proof-of-payment" className="font-semibold text-[#B22222] underline-offset-4 hover:underline">
                Proof of Payment page
              </Link>{" "}
              if you need to send it after registering.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Contact Information */}
      <Card className="bg-gradient-to-r from-blue-600 to-purple-600 text-white diplomatic-shadow border-0">
        <CardHeader>
          <CardTitle className="text-white">Need Help?</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-blue-100">Have questions about registration or the conference? We're here to help!</p>
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <span className="text-sm text-blue-100">Email:</span>
              <span className="text-sm font-medium text-white">conference@vofmun.org</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-sm text-blue-100">Response Time:</span>
              <span className="text-sm font-medium text-white">1-5 business days</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
