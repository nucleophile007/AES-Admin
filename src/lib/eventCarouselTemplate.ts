/** Fixed carousel card template for the main-site event carousel.
 * Dimensions are locked like a QR code — always export at this size. */

export const EVENT_CAROUSEL = {
  width: 1200,
  height: 675,
  aspectLabel: "16:9",
  mimeType: "image/png" as const,
  fileName: "event-carousel.png",
} as const

export type EventCarouselPersonId = "person-1" | "person-2" | "person-3" | "person-4"

export interface EventCarouselPerson {
  id: EventCarouselPersonId
  label: string
  role: string
  src: string
}

/** Curated people — selectable only from this fixed set */
export const EVENT_CAROUSEL_PEOPLE: EventCarouselPerson[] = [
  {
    id: "person-1",
    label: "Mentor A",
    role: "Educator",
    src: "/event-templates/people/person-1.png",
  },
  {
    id: "person-2",
    label: "Mentor B",
    role: "Guide",
    src: "/event-templates/people/person-2.png",
  },
  {
    id: "person-3",
    label: "Mentor C",
    role: "Advisor",
    src: "/event-templates/people/person-3.png",
  },
  {
    id: "person-4",
    label: "Student",
    role: "Learner",
    src: "/event-templates/people/person-4.png",
  },
]

export interface EventCarouselDraft {
  brand: string
  category: string
  headline: string
  subtitle: string
  points: string[]
  metaLine: string
  cta: string
  personId: EventCarouselPersonId
}

export const DEFAULT_CAROUSEL_DRAFT: EventCarouselDraft = {
  brand: "Acharya",
  category: "Workshop",
  headline: "",
  subtitle: "",
  points: ["", "", ""],
  metaLine: "",
  cta: "Register now",
  personId: "person-1",
}

export function getCarouselPerson(id: EventCarouselPersonId): EventCarouselPerson {
  return (
    EVENT_CAROUSEL_PEOPLE.find((p) => p.id === id) ?? EVENT_CAROUSEL_PEOPLE[0]
  )
}

/** Soft limit so text fits the fixed canvas without overflow */
export const CAROUSEL_LIMITS = {
  headline: 56,
  subtitle: 90,
  point: 72,
  maxPoints: 4,
  metaLine: 80,
  cta: 24,
  brand: 24,
  category: 28,
} as const
