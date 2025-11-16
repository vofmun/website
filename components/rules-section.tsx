"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Download, FileText, Users, Clock, Award, AlertCircle } from "lucide-react"

const rules = [
  {
    category: "Parliamentary Procedure",
    icon: Users,
    items: [
      "All delegates must adhere to formal parliamentary procedure",
      "Motions must be properly seconded and voted upon",
      "Speaking time limits will be strictly enforced",
      "Points of order and information are permitted",
    ],
  },
  {
    category: "Dress Code",
    icon: Award,
    items: [
      "Proper business attire is required for all sessions",
      "Delegates should dress professionally and appropriately",
      "Name tags must be worn at all times during sessions",
      "Cultural attire is welcomed when appropriate",
    ],
  },
  {
    category: "Session Guidelines",
    icon: Clock,
    items: [
      "Punctuality is essential - sessions begin promptly",
      "Electronic devices should be on silent during sessions",
      "Note-passing is permitted for diplomatic communications",
      "Photography is allowed only during designated times",
    ],
  },
  {
    category: "Code of Conduct",
    icon: AlertCircle,
    items: [
      "Respectful behavior towards all participants is mandatory",
      "Harassment or discrimination will not be tolerated",
      "Delegates must remain in character during formal sessions",
      "Any violations should be reported to conference staff immediately",
    ],
  },
]

export function RulesSection() {
  return (
    <section id="rules" className="py-12 bg-[#ffecdd]">
      <div className="container mx-auto px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center space-y-4 mb-12">
            <h2 className="text-3xl md:text-4xl font-serif font-bold text-[#B22222]">Rules & Procedures</h2>
            <p className="text-lg text-gray-700">
              Essential guidelines to ensure a professional and productive conference experience for all delegates.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6 mb-8">
            {rules.map((rule, index) => {
              const IconComponent = rule.icon
              return (
                <Card key={index} className="hover:shadow-lg transition-shadow border-0 bg-white">
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-3">
                      <div className="p-2 bg-[#B22222]/10 rounded-full">
                        <IconComponent className="h-5 w-5 text-[#B22222]" />
                      </div>
                      <span className="text-xl font-serif text-[#B22222]">{rule.category}</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-3">
                      {rule.items.map((item, itemIndex) => (
                        <li key={itemIndex} className="flex items-start space-x-2">
                          <div className="w-1.5 h-1.5 bg-[#B22222] rounded-full mt-2 flex-shrink-0"></div>
                          <span className="text-gray-700 leading-relaxed">{item}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )
            })}
          </div>

          {/* Download Section */}
          <div className="grid md:grid-cols-2 gap-6">
            <Card className="bg-gradient-to-r from-[#B22222] to-[#D32F2F] text-white border-0 shadow-lg">
              <CardContent className="p-8 text-center space-y-6">
                <div className="flex justify-center">
                  <div className="p-4 bg-white/10 rounded-full">
                    <FileText className="h-8 w-8 text-white" />
                  </div>
                </div>
                <div>
                  <h3 className="text-2xl font-serif font-bold mb-2 text-white">Complete Rules & Procedures</h3>
                  <p className="text-white/90 leading-relaxed">
                    Download the comprehensive rules document for detailed information about parliamentary procedure,
                    committee-specific guidelines, and conference protocols.
                  </p>
                </div>
                <Button variant="secondary" size="lg" onClick={() => window.open("/pdfs/T&Cs.pdf", "_blank")} className="bg-white text-[#B22222] hover:bg-gray-100">
                  <Download className="h-5 w-5 mr-2" />
                  Download Full Rules PDF
                </Button>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-r from-blue-600 to-blue-700 text-white border-0 shadow-lg">
              <CardContent className="p-8 text-center space-y-6">
                <div className="flex justify-center">
                  <div className="p-4 bg-white/10 rounded-full">
                    <AlertCircle className="h-8 w-8 text-white" />
                  </div>
                </div>
                <div>
                  <h3 className="text-2xl font-serif font-bold mb-2 text-white">Code of Conduct</h3>
                  <p className="text-white/90 leading-relaxed">
                    Download the complete code of conduct document outlining expected behavior, disciplinary procedures,
                    and ethical guidelines for all conference participants.
                  </p>
                </div>
                <Button 
                  variant="secondary" 
                  size="lg" 
                  onClick={() => window.open("/pdfs/CoConduct.pdf", "_blank")}
                  className="bg-white text-blue-600 hover:bg-gray-100 hover:cursor-pointer"
                  >
                  <Download className="h-5 w-5 mr-2" />
                  Download Code of Conduct PDF
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </section>
  )
}
