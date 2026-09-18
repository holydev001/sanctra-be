import { Octokit } from '@octokit/rest';

export function createGitHubClient(auth: string): Octokit {
  return new Octokit({ auth });
}
