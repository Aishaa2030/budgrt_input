export type AnalyticsProject = {
  id: string
  no?: string | null
  workDescription?: string | null
  department?: string | null
  outage?: string | null
  status?: string | null
  ecaCategory?: string | null
  contractNo?: string | null
  askBudget27?: unknown
  sourceBudget2026?: unknown
  amount2027?: unknown
}

export type ProjectBudgetAnalysis = {
  annualChange: number | null
  budgetGap: number | null
  coveragePercent: number | null
}

export type DataQualityReport = {
  missing: AnalyticsProject[]
  negative: AnalyticsProject[]
  duplicateContracts: { contractNo: string; projectNumbers: string[] }[]
}

function finiteAmount(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null
}

export function sumFiniteAmounts(values: unknown[]): number {
  return values.reduce<number>((sum, value) => sum + (finiteAmount(value) ?? 0), 0)
}

export function analyzeProject(project: AnalyticsProject): ProjectBudgetAnalysis {
  const source2026 = finiteAmount(project.sourceBudget2026)
  const amount2027 = finiteAmount(project.amount2027)
  const askBudget27 = finiteAmount(project.askBudget27)

  return {
    annualChange: source2026 !== null && amount2027 !== null ? amount2027 - source2026 : null,
    budgetGap: askBudget27 !== null && amount2027 !== null ? amount2027 - askBudget27 : null,
    coveragePercent: askBudget27 !== null && askBudget27 > 0 && amount2027 !== null
      ? (amount2027 / askBudget27) * 100
      : null,
  }
}

export function summarizeProjects(projects: AnalyticsProject[]) {
  const askBudget27 = sumFiniteAmounts(projects.map((project) => project.askBudget27))
  const amount2027 = sumFiniteAmounts(projects.map((project) => project.amount2027))
  const analyses = projects.map(analyzeProject)

  return {
    askBudget27,
    amount2027,
    budgetGap: amount2027 - askBudget27,
    projectCount: projects.length,
    deficitCount: analyses.filter((analysis) => analysis.budgetGap !== null && analysis.budgetGap < 0).length,
    coveragePercent: askBudget27 > 0 ? (amount2027 / askBudget27) * 100 : null,
  }
}

export function inspectDataQuality(projects: AnalyticsProject[]): DataQualityReport {
  const missing = projects.filter((project) => {
    const hasDescription = typeof project.workDescription === 'string' && project.workDescription.trim().length > 0
    const hasAmounts = [project.askBudget27, project.sourceBudget2026, project.amount2027]
      .every((value) => finiteAmount(value) !== null)
    return !hasDescription || !hasAmounts
  })
  const negative = projects.filter((project) => [project.askBudget27, project.sourceBudget2026, project.amount2027]
    .some((value) => {
      const amount = finiteAmount(value)
      return amount !== null && amount < 0
    }))
  const contracts = new Map<string, string[]>()

  for (const project of projects) {
    const contractNo = project.contractNo?.trim().toLocaleUpperCase()
    if (!contractNo) continue
    const projectNumbers = contracts.get(contractNo) ?? []
    projectNumbers.push(project.no || project.id)
    contracts.set(contractNo, projectNumbers)
  }

  return {
    missing,
    negative,
    duplicateContracts: [...contracts.entries()]
      .filter(([, projectNumbers]) => projectNumbers.length > 1)
      .map(([contractNo, projectNumbers]) => ({ contractNo, projectNumbers })),
  }
}