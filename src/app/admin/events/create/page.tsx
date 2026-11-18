"use client"

import { useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { ArrowLeft, ArrowRight, Check, Globe, Plus, Save, Trash2 } from "lucide-react"
import AdminPageShell from "@/components/admin/AdminPageShell"
import { Panel, buttonClass, cx } from "@/components/admin/ui"
import EventCarouselComposer from "@/components/events/EventCarouselComposer"
import { toast } from "sonner"

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
      toast.error("Please fill in field name and label")
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

  const carouselDefaults = useMemo(
    () => ({
      headline: formData.title,
      subtitle: formData.description.slice(0, 90),
      category: formData.category,
      metaLine: [
        formData.eventDate
          ? new Date(formData.eventDate + "T12:00:00").toLocaleDateString(
              undefined,
              { weekday: "short", month: "short", day: "numeric" }
            )
          : "",
        formData.eventStartTime && formData.eventEndTime
          ? `${formData.eventStartTime} – ${formData.eventEndTime}`
          : "",
        formData.location,
      ]
        .filter(Boolean)
        .join(" · "),
    }),
    [
      formData.title,
      formData.description,
      formData.category,
      formData.eventDate,
      formData.eventStartTime,
      formData.eventEndTime,
      formData.location,
    ]
  )

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
        toast.error("Failed to create event")
      }
    } catch (error) {
      console.error("Error creating event:", error)
      toast.error("Error creating event")
    } finally {
      setLoading(false)
    }
  }

  const renderStep1 = () => (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold tracking-tight text-ink">Basic Information</h2>

      <div>
        <label className="mb-1.5 block text-sm font-medium text-ink-soft">
          Event Title *
        </label>
        <input
          type="text"
          className="h-10 w-full rounded-lg border border-line bg-surface px-3 text-sm text-ink shadow-card outline-none transition placeholder:text-subtle focus:border-brand-300 focus:ring-4 focus:ring-brand-100"
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          placeholder="SAT Prep Workshop: Mastering Math"
        />
      </div>

      <div>
        <label className="mb-1.5 block text-sm font-medium text-ink-soft">
          Description *
        </label>
        <textarea
          className="w-full rounded-lg border border-line bg-surface px-3 py-2 text-sm text-ink shadow-card outline-none transition placeholder:text-subtle focus:border-brand-300 focus:ring-4 focus:ring-brand-100 h-32"
          value={formData.description}
          onChange={(e) =>
            setFormData({ ...formData, description: e.target.value })
          }
          placeholder="Join our expert tutors for an intensive SAT math preparation session..."
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-ink-soft">
            Category *
          </label>
          <select
            className="h-10 w-full rounded-lg border border-line bg-surface px-3 text-sm text-ink shadow-card outline-none transition placeholder:text-subtle focus:border-brand-300 focus:ring-4 focus:ring-brand-100"
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
          <label className="mb-1.5 block text-sm font-medium text-ink-soft">
            Event Date *
          </label>
          <input
            type="date"
            className="h-10 w-full rounded-lg border border-line bg-surface px-3 text-sm text-ink shadow-card outline-none transition placeholder:text-subtle focus:border-brand-300 focus:ring-4 focus:ring-brand-100"
            value={formData.eventDate}
            onChange={(e) =>
              setFormData({ ...formData, eventDate: e.target.value })
            }
          />
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-ink-soft">
            Event Start Time *
          </label>
          <select
            className="h-10 w-full rounded-lg border border-line bg-surface px-3 text-sm text-ink shadow-card outline-none transition placeholder:text-subtle focus:border-brand-300 focus:ring-4 focus:ring-brand-100"
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
          <label className="mb-1.5 block text-sm font-medium text-ink-soft">
            Event End Time *
          </label>
          <select
            className="h-10 w-full rounded-lg border border-line bg-surface px-3 text-sm text-ink shadow-card outline-none transition placeholder:text-subtle focus:border-brand-300 focus:ring-4 focus:ring-brand-100"
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
          <label className="mb-1.5 block text-sm font-medium text-ink-soft">
            Location *
          </label>
          <input
            type="text"
            className="h-10 w-full rounded-lg border border-line bg-surface px-3 text-sm text-ink shadow-card outline-none transition placeholder:text-subtle focus:border-brand-300 focus:ring-4 focus:ring-brand-100"
            value={formData.location}
            onChange={(e) =>
              setFormData({ ...formData, location: e.target.value })
            }
            placeholder="Online (Zoom) or Physical Address"
          />
        </div>

        <div className="md:col-span-2 rounded-xl border border-line bg-white p-4 shadow-sm">
          <EventCarouselComposer
            value={formData.image}
            onChange={(image) => setFormData((prev) => ({ ...prev, image }))}
            defaults={carouselDefaults}
          />
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-ink-soft">
            Max Participants
          </label>
          <input
            type="number"
            className="h-10 w-full rounded-lg border border-line bg-surface px-3 text-sm text-ink shadow-card outline-none transition placeholder:text-subtle focus:border-brand-300 focus:ring-4 focus:ring-brand-100"
            value={formData.maxParticipants}
            onChange={(e) =>
              setFormData({ ...formData, maxParticipants: e.target.value })
            }
            placeholder="Leave empty for unlimited"
          />
        </div>

        <div className="md:col-span-2">
          <label className="mb-1.5 block text-sm font-medium text-ink-soft">
            Registration Deadline
          </label>
          <input
            type="datetime-local"
            className="h-10 w-full rounded-lg border border-line bg-surface px-3 text-sm text-ink shadow-card outline-none transition placeholder:text-subtle focus:border-brand-300 focus:ring-4 focus:ring-brand-100"
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
      <h2 className="text-lg font-semibold tracking-tight text-ink">Registration Form Builder</h2>

      <div className="bg-brand-50 p-4 rounded-lg">
        <p className="text-sm text-ink-soft">
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
          <div key={key} className="rounded-lg border border-line bg-surface-muted/60 p-4">
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
        <h3 className="mb-3 text-sm font-semibold text-ink">Custom Fields</h3>

        {/* Existing Custom Fields */}
        {formData.customFields.length > 0 && (
          <div className="space-y-2 mb-4">
            {formData.customFields.map((field) => (
              <div
                key={field.id}
                className="flex items-center justify-between rounded-lg border border-line bg-surface px-3 py-2"
              >
                <div>
                  <div className="font-medium">{field.label}</div>
                  <div className="text-sm text-muted">
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
        <div className="space-y-3 rounded-lg border border-line bg-surface-muted/60 p-4">
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
      <h2 className="text-lg font-semibold tracking-tight text-ink">Pricing & Payment</h2>

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
              <label className="mb-1.5 block text-sm font-medium text-ink-soft">
                Registration Fee ($) *
              </label>
              <input
                type="number"
                step="0.01"
                className="h-10 w-full rounded-lg border border-line bg-surface px-3 text-sm text-ink shadow-card outline-none transition placeholder:text-subtle focus:border-brand-300 focus:ring-4 focus:ring-brand-100"
                value={formData.registrationFee}
                onChange={(e) =>
                  setFormData({ ...formData, registrationFee: e.target.value })
                }
                placeholder="50.00"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-ink-soft">
                Early Bird Fee ($)
              </label>
              <input
                type="number"
                step="0.01"
                className="h-10 w-full rounded-lg border border-line bg-surface px-3 text-sm text-ink shadow-card outline-none transition placeholder:text-subtle focus:border-brand-300 focus:ring-4 focus:ring-brand-100"
                value={formData.earlyBirdFee}
                onChange={(e) =>
                  setFormData({ ...formData, earlyBirdFee: e.target.value })
                }
                placeholder="35.00"
              />
            </div>

            {formData.earlyBirdFee && (
              <div className="md:col-span-2">
                <label className="mb-1.5 block text-sm font-medium text-ink-soft">
                  Early Bird Deadline
                </label>
                <input
                  type="datetime-local"
                  className="h-10 w-full rounded-lg border border-line bg-surface px-3 text-sm text-ink shadow-card outline-none transition placeholder:text-subtle focus:border-brand-300 focus:ring-4 focus:ring-brand-100"
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
      <h2 className="text-lg font-semibold tracking-tight text-ink">Additional Details</h2>

      <div>
        <label className="mb-1.5 block text-sm font-medium text-ink-soft">
          Target Audience
        </label>
        <input
          type="text"
          className="h-10 w-full rounded-lg border border-line bg-surface px-3 text-sm text-ink shadow-card outline-none transition placeholder:text-subtle focus:border-brand-300 focus:ring-4 focus:ring-brand-100"
          value={formData.targetAudience}
          onChange={(e) =>
            setFormData({ ...formData, targetAudience: e.target.value })
          }
          placeholder="High school students preparing for SAT"
        />
      </div>

      <div>
        <label className="mb-1.5 block text-sm font-medium text-ink-soft">
          Requirements/Prerequisites
        </label>
        <textarea
          className="w-full rounded-lg border border-line bg-surface px-3 py-2 text-sm text-ink shadow-card outline-none transition placeholder:text-subtle focus:border-brand-300 focus:ring-4 focus:ring-brand-100 h-24"
          value={formData.requirements}
          onChange={(e) =>
            setFormData({ ...formData, requirements: e.target.value })
          }
          placeholder="Basic algebra knowledge recommended"
        />
      </div>

      <div>
        <label className="mb-1.5 block text-sm font-medium text-ink-soft">
          Agenda/Schedule
        </label>
        <textarea
          className="w-full rounded-lg border border-line bg-surface px-3 py-2 text-sm text-ink shadow-card outline-none transition placeholder:text-subtle focus:border-brand-300 focus:ring-4 focus:ring-brand-100 h-32"
          value={formData.agenda}
          onChange={(e) =>
            setFormData({ ...formData, agenda: e.target.value })
          }
          placeholder="10:00 - 10:30: Introduction&#10;10:30 - 11:30: Core concepts&#10;11:30 - 12:00: Q&A"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-ink-soft">
            Contact Email
          </label>
          <input
            type="email"
            className="h-10 w-full rounded-lg border border-line bg-surface px-3 text-sm text-ink shadow-card outline-none transition placeholder:text-subtle focus:border-brand-300 focus:ring-4 focus:ring-brand-100"
            value={formData.contactEmail}
            onChange={(e) =>
              setFormData({ ...formData, contactEmail: e.target.value })
            }
            placeholder="events@acharyaes.com"
          />
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-ink-soft">
            Contact Phone
          </label>
          <input
            type="tel"
            className="h-10 w-full rounded-lg border border-line bg-surface px-3 text-sm text-ink shadow-card outline-none transition placeholder:text-subtle focus:border-brand-300 focus:ring-4 focus:ring-brand-100"
            value={formData.contactPhone}
            onChange={(e) =>
              setFormData({ ...formData, contactPhone: e.target.value })
            }
            placeholder="+1 (555) 123-4567"
          />
        </div>
      </div>

      <div>
        <label className="mb-1.5 block text-sm font-medium text-ink-soft">
          Tags (comma-separated)
        </label>
        <input
          type="text"
          className="h-10 w-full rounded-lg border border-line bg-surface px-3 text-sm text-ink shadow-card outline-none transition placeholder:text-subtle focus:border-brand-300 focus:ring-4 focus:ring-brand-100"
          value={formData.tags}
          onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
          placeholder="SAT, Math, Test Prep, Workshop"
        />
      </div>
    </div>
  )

  const renderStep5 = () => (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold tracking-tight text-ink">Review & Publish</h2>

      <div className="bg-brand-50 p-4 rounded-lg">
        <p className="text-sm text-ink-soft mb-4">
          Review your event details below. You can save as draft or publish
          directly to your website.
        </p>
      </div>

      <div className="space-y-3 rounded-lg border border-line bg-surface-muted/60 p-5">
        <div>
          <div className="text-sm font-medium text-muted">Event Title</div>
          <div className="text-lg font-semibold">{formData.title}</div>
        </div>
        <div>
          <div className="text-sm font-medium text-muted">Category</div>
          <div>{formData.category}</div>
        </div>
        <div>
          <div className="text-sm font-medium text-muted">Date & Time</div>
          <div>
            {formData.eventDate} from {formData.eventStartTime} to {formData.eventEndTime}
          </div>
        </div>
        <div>
          <div className="text-sm font-medium text-muted">Location</div>
          <div>{formData.location}</div>
        </div>
        <div>
          <div className="text-sm font-medium text-muted">
            Registration Fee
          </div>
          <div>
            {formData.requiresPayment
              ? `$${formData.registrationFee}`
              : "Free"}
          </div>
        </div>
        <div>
          <div className="text-sm font-medium text-muted">
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

  const STEPS = ["Basic info", "Registration form", "Pricing", "Details", "Publish"]

  return (
    <AdminPageShell
      moduleId="events"
      title="Create Event"
      description="Set up the event, its registration form and pricing, then publish it."
      parent={{ label: "Events", href: "/admin/events" }}
    >
      <div className="mx-auto max-w-4xl space-y-5">
        {/* Progress Steps */}
        <ol className="flex items-center gap-2 overflow-x-auto rounded-card border border-line bg-surface px-4 py-3 shadow-card">
          {STEPS.map((label, index) => {
            const n = index + 1
            const done = step > n
            const current = step === n
            return (
              <li key={label} className="flex shrink-0 items-center gap-2">
                {index > 0 && <span aria-hidden className={cx("mr-1 h-px w-6 sm:w-10", done || current ? "bg-brand-300" : "bg-line-strong")} />}
                <span
                  className={cx(
                    "flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold",
                    current && "bg-brand-700 text-white",
                    done && "bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-100",
                    !current && !done && "bg-surface-muted text-muted ring-1 ring-inset ring-line",
                  )}
                  aria-current={current ? "step" : undefined}
                >
                  {done ? <Check className="h-3.5 w-3.5" /> : n}
                </span>
                <span className={cx("text-sm", current ? "font-medium text-ink" : "text-muted")}>{label}</span>
              </li>
            )
          })}
        </ol>

        {/* Form Content */}
        <Panel>
          <div className="p-6">
            {step === 1 && renderStep1()}
            {step === 2 && renderStep2()}
            {step === 3 && renderStep3()}
            {step === 4 && renderStep4()}
            {step === 5 && renderStep5()}
          </div>

          {/* Navigation Buttons */}
          <div className="flex items-center justify-between gap-2 border-t border-line bg-surface-muted/60 px-6 py-3">
            <button type="button" onClick={() => setStep(Math.max(1, step - 1))} disabled={step === 1} className={buttonClass("secondary")}>
              <ArrowLeft className="h-4 w-4" /> Previous
            </button>
            <div className="flex gap-2">
              {step < 5 ? (
                <button type="button" onClick={() => setStep(step + 1)} disabled={!isStepValid()} className={buttonClass("primary")}>
                  Next step <ArrowRight className="h-4 w-4" />
                </button>
              ) : (
                <>
                  <button type="button" onClick={() => handleSubmit(false)} disabled={loading} className={buttonClass("secondary")}>
                    <Save className="h-4 w-4" /> Save as draft
                  </button>
                  <button type="button" onClick={() => handleSubmit(true)} disabled={loading} className={buttonClass("primary")}>
                    <Globe className="h-4 w-4" /> Publish event
                  </button>
                </>
              )}
            </div>
          </div>
        </Panel>
      </div>
    </AdminPageShell>
  )
}
