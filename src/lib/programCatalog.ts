export interface SubjectGroup {
  name: string
  subjects: readonly string[]
}

export const CHAMPIONS_SUBJECT_GROUPS: readonly SubjectGroup[] = [
  {
    name: "Math",
    subjects: ["AMC 8", "AMC 10", "AMC 12"],
  },
  { name: "USPhO", subjects: [] },
  { name: "USNCO", subjects: [] },
  { name: "USABO/USMDO", subjects: [] },
]

export const PROGRAM_CATALOG = [
  {
    name: "College Prep",
    subjects: ["College Prep"],
  },
  {
    name: "AES Explorers Research Program",
    subjects: ["Ignite", "Elevate", "Transform"],
  },
  {
    name: "AES Champions",
    subjects: CHAMPIONS_SUBJECT_GROUPS.flatMap((group) => group.subjects).concat(
      CHAMPIONS_SUBJECT_GROUPS.filter((group) => !group.subjects.length).map((group) => group.name),
    ),
  },
  {
    name: "Tutoring",
    subjects: [],
  },
] as const

export const TUTORING_SUBJECT_GROUPS: readonly SubjectGroup[] = [
  {
    name: "Mathematics",
    subjects: ["IM1", "IM2", "IM3", "Pre-Calculus, AP Pre-Calculus", "AP Calculus AB", "AP Calculus BC", "AP Statistics", "Other"],
  },
  {
    name: "Physics",
    subjects: ["Regular Physics", "Honors Physics", "AP Physics I", "AP Physics II", "AP Physics C - Mechanics", "AP Physics C - E & M"],
  },
  {
    name: "Chemistry",
    subjects: ["Regular Chemistry", "Honors Chemistry", "AP Chemistry"],
  },
  {
    name: "Biology",
    subjects: ["Regular Biology", "AP Biology"],
  },
]

export const LEGACY_PROGRAM_OPTIONS = [
  "MATH Competitions",
  "Research",
] as const

export const PROGRAM_OPTIONS = [
  ...PROGRAM_CATALOG.map((program) => program.name),
  ...LEGACY_PROGRAM_OPTIONS,
] as const

export const isSingleLevelProgram = (program: string) => program === "College Prep"

export const getSubjectsForProgram = (program: string): readonly string[] => {
  if (program === "Tutoring") {
    return TUTORING_SUBJECT_GROUPS.flatMap((group) => group.subjects)
  }
  const catalogProgram = PROGRAM_CATALOG.find((item) => item.name === program)
  return catalogProgram?.subjects ?? []
}

export const getSubjectGroupsForProgram = (program: string): readonly SubjectGroup[] => {
  if (program === "Tutoring") return TUTORING_SUBJECT_GROUPS
  if (program === "AES Champions") return CHAMPIONS_SUBJECT_GROUPS
  const subjects = getSubjectsForProgram(program)
  return subjects.length ? [{ name: "Courses", subjects }] : []
}
