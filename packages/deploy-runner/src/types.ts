export interface BuildJob {
  repoId: string
  orgId: string
  commitSha: string
  branch: string
  prNumber?: number
  workflowYaml?: ParsedWorkflow
}

export interface ParsedWorkflow {
  name: string
  jobs: {
    test: {
      runs_on: string
      steps: Array<{ run?: string; uses?: string; with?: Record<string, string> }>
    }
  }
}
