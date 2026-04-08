"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Plus, Trash2, Save, Globe } from "lucide-react"

interface CustomField {
  id: string
  name: string
  label: string
  type: string
  required: boolean
  options?: string[]
  placeholder?: string
  helpText?: string
}

// Time options for dropdown
const TIME_OPTIONS = [
  "12:00 AM", "12:30 AM", "01:00 AM", "01:30 AM", "02:00 AM", "02:30 AM",
  "03:00 AM", "03:30 AM", "04:00 AM", "04:30 AM", "05:00 AM", "05:30 AM",
  "06:00 AM", "06:30 AM", "07:00 AM", "07:30 AM", "08:00 AM", "08:30 AM",
  "09:00 AM", "09:30 AM", "10:00 AM", "10:30 AM", "11:00 AM", "11:30 AM",
  "12:00 PM", "12:30 PM", "01:00 PM", "01:30 PM", "02:00 PM", "02:30 PM",
  "03:00 PM", "03:30 PM", "04:00 PM", "04:30 PM", "05:00 PM", "05:30 PM",
  "06:00 PM", "06:30 PM", "07:00 PM", "07:30 PM", "08:00 PM", "08:30 PM",
  "09:00 PM", "09:30 PM", "10:00 PM", "10:30 PM", "11:00 PM", "11:30 PM",
]

export default function CreateEventPage() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [uploadingImage, setUploadingImage] = useState(false)

  const [formData, setFormData] = useState({
    // Step 1: Basic Information
    title: "",
    description: "",
    category: "Workshop",
    eventDate: "",
    eventStartTime: "09:00 AM",
    eventEndTime: "10:00 AM",
    location: "",
    image: "",
    maxParticipants: "",
    registrationDeadline: "",

    // Step 2: Registration Form Config
    registrationFormConfig: {
      studentPhone: "required",
      studentGrade: "required",
      schoolName: "optional",
      parentPhone: "required",
      specialRequirements: "optional",
    },
    customFields: [] as CustomField[],

    // Step 3: Pricing
    registrationFee: "0",
    earlyBirdFee: "",
    earlyBirdDeadline: "",
    requiresPayment: false,

    // Step 4: Additional Details
    targetAudience: "",
    requirements: "",
    agenda: "",
    contactEmail: "",
    contactPhone: "",
    tags: "",

    // Step 5: Publishing
    isPublished: false,
    isFeatured: false,
  })

  const [newField, setNewField] = useState<CustomField>({
    id: "",
    name: "",
    label: "",
    type: "text",
    required: false,
    options: [],
    placeholder: "",
    helpText: "",
  })

  const handleAddCustomField = () => {
    if (!newField.name || !newField.label) {
      alert("Please fill in field name and label")
      return
    }

    const field: CustomField = {
      ...newField,
      id: Date.now().toString(),
    }

    setFormData({
      ...formData,
      customFields: [...formData.customFields, field],
    })

    setNewField({
      id: "",
      name: "",
      label: "",
      type: "text",
      required: false,
      options: [],
      placeholder: "",
      helpText: "",
    })
  }

  const handleRemoveCustomField = (id: string) => {
    setFormData({
      ...formData,
      customFields: formData.customFields.filter((f) => f.id !== id),
    })
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp"]
    if (!allowedTypes.includes(file.type)) {
      alert("Please upload an image file (JPEG, PNG, GIF, or WebP)")
      return
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024
    if (file.size > maxSize) {
      alert("Image size must be less than 5MB")
      return
    }

    setUploadingImage(true)
    try {
      const formData = new FormData()
      formData.append("file", file)

      const response = await fetch("/api/admin/events/upload-image", {
        method: "POST",
        body: formData,
      })

      if (response.ok) {
        const data = await response.json()
        setFormData((prev) => ({ ...prev, image: data.fileUrl }))
      } else {
        const error = await response.json()
        alert(error.error || "Failed to upload image")
      }
    } catch (error) {
      console.error("Error uploading image:", error)
      alert("Failed to upload image")
    } finally {
      setUploadingImage(false)
    }
  }

  const handleSubmit = async (publish: boolean) => {
    setLoading(true)
    try {
      const payload = {
        ...formData,
        eventTime: `${formData.eventStartTime} - ${formData.eventEndTime}`, // Combine times
        maxParticipants: formData.maxParticipants
          ? parseInt(formData.maxParticipants)
          : null,
        registrationFee: parseFloat(formData.registrationFee) || 0,
        earlyBirdFee: formData.earlyBirdFee
          ? parseFloat(formData.earlyBirdFee)
          : null,
        tags: formData.tags ? formData.tags.split(",").map((t) => t.trim()) : [],
        isPublished: publish,
      }

      const response = await fetch("/api/admin/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      if (response.ok) {
        const data = await response.json()
        router.push(`/admin/events/${data.id}`)
      } else {
        alert("Failed to create event")
      }
    } catch (error) {
      console.error("Error creating event:", error)
      alert("Error creating event")
    } finally {
      setLoading(false)
    }
  }

  const renderStep1 = () => (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">Basic Information</h2>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Event Title *
        </label>
        <input
          type="text"
          className="w-full px-4 py-2 border rounded-lg"
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          placeholder="SAT Prep Workshop: Mastering Math"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Description *
        </label>
        <textarea
          className="w-full px-4 py-2 border rounded-lg h-32"
          value={formData.description}
          onChange={(e) =>
            setFormData({ ...formData, description: e.target.value })
          }
          placeholder="Join our expert tutors for an intensive SAT math preparation session..."
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Category *
          </label>
          <select
            className="w-full px-4 py-2 border rounded-lg"
            value={formData.category}
            onChange={(e) =>
              setFormData({ ...formData, category: e.target.value })
            }
          >
            <option value="Workshop">Workshop</option>
            <option value="Seminar">Seminar</option>
            <option value="Webinar">Webinar</option>
            <option value="Bootcamp">Bootcamp</option>
            <option value="Conference">Conference</option>
            <option value="Meetup">Meetup</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Event Date *
          </label>
          <input
            type="date"
            className="w-full px-4 py-2 border rounded-lg"
            value={formData.eventDate}
            onChange={(e) =>
              setFormData({ ...formData, eventDate: e.target.value })
            }
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Event Start Time *
          </label>
          <select
            className="w-full px-4 py-2 border rounded-lg"
            value={formData.eventStartTime}
            onChange={(e) =>
              setFormData({ ...formData, eventStartTime: e.target.value })
            }
          >
            {TIME_OPTIONS.map((time) => (
              <option key={time} value={time}>
                {time}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Event End Time *
          </label>
          <select
            className="w-full px-4 py-2 border rounded-lg"
            value={formData.eventEndTime}
            onChange={(e) =>
              setFormData({ ...formData, eventEndTime: e.target.value })
            }
          >
            {TIME_OPTIONS.map((time) => (
              <option key={time} value={time}>
                {time}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Location *
          </label>
          <input
            type="text"
            className="w-full px-4 py-2 border rounded-lg"
            value={formData.location}
            onChange={(e) =>
              setFormData({ ...formData, location: e.target.value })
            }
            placeholder="Online (Zoom) or Physical Address"
          />
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Event Image
          </label>
          
          {/* Image Preview */}
          {formData.image && (
            <div className="mb-3">
              <div className="relative inline-block">
                <img
                  src={formData.image}
                  alt="Event preview"
                  className="h-32 w-auto rounded-lg border shadow-sm"
                />
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, image: "" })}
                  className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 shadow-md"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* Upload Options */}
          <div className="space-y-3">
            {/* File Upload */}
            <div>
              <label className="block">
                <div className="flex items-center gap-2 px-4 py-2 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-colors">
                  {uploadingImage ? (
                    <div className="flex items-center gap-2 text-blue-600">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
                      <span className="text-sm font-medium">Uploading...</span>
                    </div>
                  ) : (
                    <>
                      <Plus className="w-5 h-5 text-gray-400" />
                      <span className="text-sm text-gray-600">
                        Click to upload image (Max 5MB)
                      </span>
                    </>
                  )}
                </div>
                <input
                  type="file"
                  accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                  onChange={handleImageUpload}
                  className="hidden"
                  disabled={uploadingImage}
                />
              </label>
              <p className="text-xs text-gray-500 mt-1">
                Supported formats: JPEG, PNG, GIF, WebP
              </p>
            </div>

            {/* OR Divider */}
            <div className="flex items-center gap-3">
              <div className="flex-1 border-t border-gray-300"></div>
              <span className="text-xs text-gray-500 font-medium">OR</span>
              <div className="flex-1 border-t border-gray-300"></div>
            </div>

            {/* URL Input */}
            <div>
              <input
                type="text"
                className="w-full px-4 py-2 border rounded-lg"
                value={formData.image}
                onChange={(e) =>
                  setFormData({ ...formData, image: e.target.value })
                }
                placeholder="Paste image URL here"
                disabled={uploadingImage}
              />
              <p className="text-xs text-gray-500 mt-1">
                Or paste a direct link to an image
              </p>
            </div>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Max Participants
          </label>
          <input
            type="number"
            className="w-full px-4 py-2 border rounded-lg"
            value={formData.maxParticipants}
            onChange={(e) =>
              setFormData({ ...formData, maxParticipants: e.target.value })
            }
            placeholder="Leave empty for unlimited"
          />
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Registration Deadline
          </label>
          <input
            type="datetime-local"
            className="w-full px-4 py-2 border rounded-lg"
            value={formData.registrationDeadline}
            onChange={(e) =>
              setFormData({
                ...formData,
                registrationDeadline: e.target.value,
              })
            }
          />
        </div>
      </div>
    </div>
  )

  const renderStep2 = () => (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Registration Form Builder</h2>

      <div className="bg-blue-50 p-4 rounded-lg">
        <p className="text-sm text-gray-700">
          Configure which standard fields are required, optional, or hidden in
          the registration form. Student Name and Email are always required.
        </p>
      </div>

      <div className="space-y-4">
        {[
          { key: "studentPhone", label: "Student Phone" },
          { key: "studentGrade", label: "Student Grade" },
          { key: "schoolName", label: "School Name" },
          { key: "parentPhone", label: "Parent Phone" },
          { key: "specialRequirements", label: "Special Requirements" },
        ].map(({ key, label }) => (
          <div key={key} className="bg-white p-4 rounded-lg border">
            <div className="font-medium mb-2">{label}</div>
            <div className="flex gap-4">
              {["required", "optional", "hidden"].map((option) => (
                <label key={option} className="flex items-center gap-2">
                  <input
                    type="radio"
                    name={key}
                    value={option}
                    checked={
                      formData.registrationFormConfig[
                        key as keyof typeof formData.registrationFormConfig
                      ] === option
                    }
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        registrationFormConfig: {
                          ...formData.registrationFormConfig,
                          [key]: e.target.value,
                        },
                      })
                    }
                  />
                  <span className="capitalize">{option}</span>
                </label>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="border-t pt-6">
        <h3 className="text-xl font-semibold mb-4">Custom Fields</h3>

        {/* Existing Custom Fields */}
        {formData.customFields.length > 0 && (
          <div className="space-y-2 mb-4">
            {formData.customFields.map((field) => (
              <div
                key={field.id}
                className="bg-gray-50 p-3 rounded-lg flex justify-between items-center"
              >
                <div>
                  <div className="font-medium">{field.label}</div>
                  <div className="text-sm text-gray-600">
                    Type: {field.type} | {field.required ? "Required" : "Optional"}
                  </div>
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => handleRemoveCustomField(field.id)}
                >
                  <Trash2 className="w-4 h-4 text-red-600" />
                </Button>
              </div>
            ))}
          </div>
        )}

        {/* Add New Field */}
        <div className="bg-white p-4 rounded-lg border space-y-3">
          <h4 className="font-medium">Add Custom Field</h4>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium mb-1">
                Field Name (camelCase) *
              </label>
              <input
                type="text"
                className="w-full px-3 py-2 border rounded"
                value={newField.name}
                onChange={(e) =>
                  setNewField({ ...newField, name: e.target.value })
                }
                placeholder="currentSATScore"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                Label (Display Text) *
              </label>
              <input
                type="text"
                className="w-full px-3 py-2 border rounded"
                value={newField.label}
                onChange={(e) =>
                  setNewField({ ...newField, label: e.target.value })
                }
                placeholder="Current SAT Math Score"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                Field Type
              </label>
              <select
                className="w-full px-3 py-2 border rounded"
                value={newField.type}
                onChange={(e) =>
                  setNewField({ ...newField, type: e.target.value })
                }
              >
                <option value="text">Text</option>
                <option value="textarea">Textarea</option>
                <option value="number">Number</option>
                <option value="email">Email</option>
                <option value="tel">Phone</option>
                <option value="date">Date</option>
                <option value="select">Select Dropdown</option>
                <option value="radio">Radio Buttons</option>
                <option value="checkbox">Checkboxes</option>
              </select>
            </div>

            <div className="flex items-center">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={newField.required}
                  onChange={(e) =>
                    setNewField({ ...newField, required: e.target.checked })
                  }
                />
                <span className="text-sm font-medium">Required Field</span>
              </label>
            </div>

            {(newField.type === "select" ||
              newField.type === "radio" ||
              newField.type === "checkbox") && (
              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-1">
                  Options (comma-separated)
                </label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border rounded"
                  placeholder="Option 1, Option 2, Option 3"
                  onChange={(e) =>
                    setNewField({
                      ...newField,
                      options: e.target.value.split(",").map((o) => o.trim()),
                    })
                  }
                />
              </div>
            )}

            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-1">
                Placeholder Text
              </label>
              <input
                type="text"
                className="w-full px-3 py-2 border rounded"
                value={newField.placeholder}
                onChange={(e) =>
                  setNewField({ ...newField, placeholder: e.target.value })
                }
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-1">
                Help Text
              </label>
              <input
                type="text"
                className="w-full px-3 py-2 border rounded"
                value={newField.helpText}
                onChange={(e) =>
                  setNewField({ ...newField, helpText: e.target.value })
                }
              />
            </div>
          </div>

          <Button onClick={handleAddCustomField} variant="outline">
            <Plus className="w-4 h-4 mr-2" />
            Add Field
          </Button>
        </div>
      </div>
    </div>
  )

  const renderStep3 = () => (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">Pricing & Payment</h2>

      <div>
        <label className="flex items-center gap-2 mb-4">
          <input
            type="checkbox"
            checked={formData.requiresPayment}
            onChange={(e) =>
              setFormData({ ...formData, requiresPayment: e.target.checked })
            }
          />
          <span className="font-medium">This event requires payment</span>
        </label>
      </div>

      {formData.requiresPayment && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Registration Fee ($) *
              </label>
              <input
                type="number"
                step="0.01"
                className="w-full px-4 py-2 border rounded-lg"
                value={formData.registrationFee}
                onChange={(e) =>
                  setFormData({ ...formData, registrationFee: e.target.value })
                }
                placeholder="50.00"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Early Bird Fee ($)
              </label>
              <input
                type="number"
                step="0.01"
                className="w-full px-4 py-2 border rounded-lg"
                value={formData.earlyBirdFee}
                onChange={(e) =>
                  setFormData({ ...formData, earlyBirdFee: e.target.value })
                }
                placeholder="35.00"
              />
            </div>

            {formData.earlyBirdFee && (
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Early Bird Deadline
                </label>
                <input
                  type="datetime-local"
                  className="w-full px-4 py-2 border rounded-lg"
                  value={formData.earlyBirdDeadline}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      earlyBirdDeadline: e.target.value,
                    })
                  }
                />
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )

  const renderStep4 = () => (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">Additional Details</h2>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Target Audience
        </label>
        <input
          type="text"
          className="w-full px-4 py-2 border rounded-lg"
          value={formData.targetAudience}
          onChange={(e) =>
            setFormData({ ...formData, targetAudience: e.target.value })
          }
          placeholder="High school students preparing for SAT"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Requirements/Prerequisites
        </label>
        <textarea
          className="w-full px-4 py-2 border rounded-lg h-24"
          value={formData.requirements}
          onChange={(e) =>
            setFormData({ ...formData, requirements: e.target.value })
          }
          placeholder="Basic algebra knowledge recommended"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Agenda/Schedule
        </label>
        <textarea
          className="w-full px-4 py-2 border rounded-lg h-32"
          value={formData.agenda}
          onChange={(e) =>
            setFormData({ ...formData, agenda: e.target.value })
          }
          placeholder="10:00 - 10:30: Introduction&#10;10:30 - 11:30: Core concepts&#10;11:30 - 12:00: Q&A"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Contact Email
          </label>
          <input
            type="email"
            className="w-full px-4 py-2 border rounded-lg"
            value={formData.contactEmail}
            onChange={(e) =>
              setFormData({ ...formData, contactEmail: e.target.value })
            }
            placeholder="events@acharyaes.com"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Contact Phone
          </label>
          <input
            type="tel"
            className="w-full px-4 py-2 border rounded-lg"
            value={formData.contactPhone}
            onChange={(e) =>
              setFormData({ ...formData, contactPhone: e.target.value })
            }
            placeholder="+1 (555) 123-4567"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Tags (comma-separated)
        </label>
        <input
          type="text"
          className="w-full px-4 py-2 border rounded-lg"
          value={formData.tags}
          onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
          placeholder="SAT, Math, Test Prep, Workshop"
        />
      </div>
    </div>
  )

  const renderStep5 = () => (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">Review & Publish</h2>

      <div className="bg-blue-50 p-4 rounded-lg">
        <p className="text-sm text-gray-700 mb-4">
          Review your event details below. You can save as draft or publish
          directly to your website.
        </p>
      </div>

      <div className="bg-white p-6 rounded-lg border space-y-3">
        <div>
          <div className="text-sm font-medium text-gray-500">Event Title</div>
          <div className="text-lg font-semibold">{formData.title}</div>
        </div>
        <div>
          <div className="text-sm font-medium text-gray-500">Category</div>
          <div>{formData.category}</div>
        </div>
        <div>
          <div className="text-sm font-medium text-gray-500">Date & Time</div>
          <div>
            {formData.eventDate} from {formData.eventStartTime} to {formData.eventEndTime}
          </div>
        </div>
        <div>
          <div className="text-sm font-medium text-gray-500">Location</div>
          <div>{formData.location}</div>
        </div>
        <div>
          <div className="text-sm font-medium text-gray-500">
            Registration Fee
          </div>
          <div>
            {formData.requiresPayment
              ? `$${formData.registrationFee}`
              : "Free"}
          </div>
        </div>
        <div>
          <div className="text-sm font-medium text-gray-500">
            Custom Fields
          </div>
          <div>{formData.customFields.length} custom fields configured</div>
        </div>
      </div>

      <div className="space-y-2">
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={formData.isFeatured}
            onChange={(e) =>
              setFormData({ ...formData, isFeatured: e.target.checked })
            }
          />
          <span>Feature this event on the homepage (requires publishing)</span>
        </label>
      </div>
    </div>
  )

  const isStepValid = () => {
    switch (step) {
      case 1:
        return (
          formData.title &&
          formData.description &&
          formData.category &&
          formData.eventDate &&
          formData.eventStartTime &&
          formData.eventEndTime &&
          formData.location
        )
      case 2:
        return true
      case 3:
        return !formData.requiresPayment || formData.registrationFee
      case 4:
        return true
      case 5:
        return true
      default:
        return false
    }
  }

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={() => router.push("/admin/events")}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
        <h1 className="text-3xl font-bold">Create New Event</h1>
      </div>

      {/* Progress Steps */}
      <div className="bg-white p-6 rounded-lg shadow-sm">
        <div className="flex justify-between items-center mb-4">
          {[
            "Basic Info",
            "Registration Form",
            "Pricing",
            "Details",
            "Publish",
          ].map((label, index) => (
            <div
              key={index}
              className={`flex-1 text-center ${
                step === index + 1
                  ? "text-blue-600 font-semibold"
                  : "text-gray-400"
              }`}
            >
              <div
                className={`w-8 h-8 mx-auto rounded-full flex items-center justify-center mb-2 ${
                  step === index + 1
                    ? "bg-blue-600 text-white"
                    : step > index + 1
                    ? "bg-green-500 text-white"
                    : "bg-gray-200"
                }`}
              >
                {step > index + 1 ? "✓" : index + 1}
              </div>
              <div className="text-xs">{label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Form Content */}
      <div className="bg-white p-6 rounded-lg shadow-sm">
        {step === 1 && renderStep1()}
        {step === 2 && renderStep2()}
        {step === 3 && renderStep3()}
        {step === 4 && renderStep4()}
        {step === 5 && renderStep5()}
      </div>

      {/* Navigation Buttons */}
      <div className="flex justify-between">
        <Button
          variant="outline"
          onClick={() => setStep(Math.max(1, step - 1))}
          disabled={step === 1}
        >
          Previous
        </Button>

        <div className="flex gap-2">
          {step < 5 ? (
            <Button onClick={() => setStep(step + 1)} disabled={!isStepValid()}>
              Next Step
            </Button>
          ) : (
            <>
              <Button
                variant="outline"
                onClick={() => handleSubmit(false)}
                disabled={loading}
              >
                <Save className="w-4 h-4 mr-2" />
                Save as Draft
              </Button>
              <Button onClick={() => handleSubmit(true)} disabled={loading}>
                <Globe className="w-4 h-4 mr-2" />
                Publish Event
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
