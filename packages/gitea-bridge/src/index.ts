/**
 * @forge-git/gitea-bridge
 *
 * Typed client for the Gitea API.
 * Wraps the Gitea REST API with strong types + error handling.
 *
 * Gitea API docs: https://docs.gitea.com/api/1.21/overview
 */

// ─── Types ──────────────────────────────────────────────────────────────────

export type {
  GiteaOpts,
  GiteaUser,
  GiteaOrg,
  CreateOrgRequest,
  GiteaRepo,
  CreateRepoRequest,
  RepoKey,
  Webhook,
  BranchProtection,
  OrgMember,
  Team,
  ForgeGitOrg,
  ForgeGitMember,
  ForgeGitWorkflow,
  ForgeGitPreview,
  PullRequest,
  Issue,
  Release,
  Branch,
  Commit,
  SearchResult,
  Notification,
  NotificationCount,
  Comment,
  TreeEntry,
} from './types'

// ─── User ───────────────────────────────────────────────────────────────────

export {
  getCurrentUser,
  getUser,
  updateCurrentUser,
} from './user'

// ─── Repositories + Keys + Branch Protection ────────────────────────────────

export {
  listUserRepos,
  listOrgRepos,
  getRepo,
  createRepo,
  createOrgRepo,
  deleteRepo,
  listRepoKeys,
  addRepoKey,
  deleteRepoKey,
  getBranchProtection,
  setBranchProtection,
} from './repo'

// ─── Organizations + Members + Teams ────────────────────────────────────────

export {
  listOrgs,
  getOrg,
  createOrg,
  updateOrg,
  listOrgMembers,
  addOrgMember,
  removeOrgMember,
  listOrgTeams,
  createTeam,
  getTeam,
  deleteTeam,
  updateTeam,
  listTeamMembers,
  addTeamMember,
  removeTeamMember,
  listTeamRepos,
} from './org'

// ─── Pull Requests ──────────────────────────────────────────────────────────

export {
  listPullRequests,
  getPullRequest,
  createPullRequest,
  updatePullRequest,
  mergePullRequest,
} from './pr'

// ─── Issues ─────────────────────────────────────────────────────────────────

export {
  listIssues,
  getIssue,
  createIssue,
  updateIssue,
} from './issue'

// ─── Releases ───────────────────────────────────────────────────────────────

export {
  listReleases,
  getRelease,
  getLatestRelease,
  createRelease,
} from './release'

// ─── Branches + Commits ─────────────────────────────────────────────────────

export {
  listBranches,
  getBranch,
  listCommits,
  getCommit,
} from './branch'

// ─── Search ─────────────────────────────────────────────────────────────────

export {
  searchRepos,
  searchIssues,
} from './search'

// ─── Notifications ──────────────────────────────────────────────────────────

export {
  listNotifications,
  markNotificationRead,
  markAllNotificationsRead,
} from './notification'

// ─── Comments ────────────────────────────────────────────────────────────────

export {
  listIssueComments,
  createIssueComment,
  deleteIssueComment,
} from './comment'

// ─── Webhooks ───────────────────────────────────────────────────────────────

export {
  listWebhooks,
  createWebhook,
  deleteWebhook,
} from './webhook'

// ─── Tree / Blob ────────────────────────────────────────────────────────────

export {
  getTree,
  getBlob,
} from './tree'
