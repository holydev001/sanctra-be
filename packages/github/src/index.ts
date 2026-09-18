import { Octokit } from '@octokit/rest';

export function createGitHubClient(auth: string): Octokit {
  return new Octokit({ auth });
}

export interface GitHubIdentity {
  githubUserId: string;
  login: string;
  email: string | null;
  avatarUrl: string | null;
}

export async function fetchGitHubIdentity(accessToken: string): Promise<GitHubIdentity> {
  const client = createGitHubClient(accessToken);
  const [{ data: user }, { data: emails }] = await Promise.all([
    client.users.getAuthenticated(),
    client.users.listEmailsForAuthenticatedUser(),
  ]);

  const primaryEmail = emails.find((email) => email.primary && email.verified)?.email;

  return {
    githubUserId: String(user.id),
    login: user.login,
    email: user.email ?? primaryEmail ?? null,
    avatarUrl: user.avatar_url ?? null,
  };
}
