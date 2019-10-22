const core = require('@actions/core');
const github = require('@actions/github');

try {
  const githubRepoToken = core.getInput('github-repo-token');
  const clubhouseToken = core.getInput('clubhouse-token');
  const clubhouseProject = core.getInput('clubhouse-project-id');

  // Get the JSON webhook payload for the event that triggered the workflow
  const { payload } = github.context;
  const { issue, action } = payload;
  const payloadString = JSON.stringify(payload, undefined, 2)
  console.log(`The event payload: ${payloadString}`);

  if (action !== 'opened' && action !== 'reopened') {
    throw new Error('This action should only be performed on opened and reopened issues.')
  }
  const client = new github.GitHub(githubRepoToken);
  closeIssue(client, issue);

  // If it's a new issues, file it in Clubhouse.
  if (action === 'opened') {
    console.log('need to import this to clubhouse....')
    importIssueToClubhouse(clubhouseToken, clubhouseProject, issue);
  }

} catch (error) {
  core.setFailed(error.message);
}

async function closeIssue(client, issue) {
  core.debug(`closing issue`);
  client.issues.update({
    owner: github.context.repo.owner,
    repo: github.context.repo.repo,
    issue_number: issue.number,
    state: 'closed'
  });

}

async function importIssueToClubhouse(clubhouseToken, clubhouseProject, issue) {
  const clubhouse = Clubhouse.create(clubhouseToken)
  const { created_at, updated_at, title, body, html_url } = issue;
  const project = await clubhouse.getProject(clubhouseProject);
  console.log(`adding to project ${project.id}`);
  await clubhouse.createStory({
    created_at, updated_at,
    story_type,
    name: title,
    description: body,
    external_id: html_url,
    project_id: project.id,
  });
}


