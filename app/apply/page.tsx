"use client"

import type React from "react"

import { useState } from "react"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { CheckCircle2, Building2, Mail, User, Briefcase } from "lucide-react"

export default function ApplyPage() {
  const [submitted, setSubmitted] = useState(false)
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    company: "",
    role: "",
    loanAmount: "",
    purpose: "",
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // Here you would handle the form submission
    console.log("[v0] Apply form submitted:", formData)
    setSubmitted(true)
  }

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center px-6 py-20">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="glass-strong rounded-3xl p-12 max-w-md text-center"
        >
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-emerald-500/20 mb-6">
            <CheckCircle2 className="h-10 w-10 text-emerald-500" />
          </div>
          <h2 className="text-3xl font-bold mb-4">Application Submitted!</h2>
          <p className="text-muted-foreground mb-6">
            Thank you for your interest in Legasi. Our team will review your application and get back to you within
            24-48 hours.
          </p>
          <Button className="w-full" onClick={() => (window.location.href = "/")}>
            Return Home
          </Button>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="min-h-screen py-20 px-6">
      <div className="container mx-auto max-w-3xl">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
          <div className="text-center mb-12">
            <h1 className="text-5xl font-black mb-4">Apply for Access</h1>
            <p className="text-xl text-muted-foreground">
              Join institutional lenders and borrowers on the Legasi platform
            </p>
          </div>

          <div className="glass-strong rounded-3xl p-10">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="fullName" className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    Full Name *
                  </Label>
                  <Input
                    id="fullName"
                    required
                    value={formData.fullName}
                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                    placeholder="John Doe"
                    className="glass"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email" className="flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    Email Address *
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="john@company.com"
                    className="glass"
                  />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="company" className="flex items-center gap-2">
                    <Building2 className="h-4 w-4" />
                    Company / Organization *
                  </Label>
                  <Input
                    id="company"
                    required
                    value={formData.company}
                    onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                    placeholder="Acme Corp"
                    className="glass"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="role" className="flex items-center gap-2">
                    <Briefcase className="h-4 w-4" />
                    Your Role *
                  </Label>
                  <Input
                    id="role"
                    required
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                    placeholder="CEO, CFO, Treasurer"
                    className="glass"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="loanAmount">Estimated Loan Amount (USD)</Label>
                <Input
                  id="loanAmount"
                  type="number"
                  value={formData.loanAmount}
                  onChange={(e) => setFormData({ ...formData, loanAmount: e.target.value })}
                  placeholder="50000"
                  className="glass"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="purpose">Loan Purpose *</Label>
                <Textarea
                  id="purpose"
                  required
                  rows={4}
                  value={formData.purpose}
                  onChange={(e) => setFormData({ ...formData, purpose: e.target.value })}
                  placeholder="Describe how you plan to use the loan and your collateral strategy..."
                  className="glass resize-none"
                />
              </div>

              <Button
                type="submit"
                size="lg"
                className="w-full gap-2 bg-gradient-to-r from-violet-600 to-cyan-600 hover:from-violet-700 hover:to-cyan-700 text-white rounded-full h-14 text-lg"
              >
                Submit Application
              </Button>
            </form>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
