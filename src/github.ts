import * as github from '@actions/github';
import { TerraformResults } from './terraform-results';

export async function createStatusCheck(
  accessToken: string,
  title: string,
  results: TerraformResults
): Promise<void> {
  const octokit = github.getOctokit(accessToken);

  const planSummary = getPlanSummary(results.output);
  const summary = `Terraform plan completed with exit code ${results.exitCode}. 
  
  ## ${planSummary} 
  `;

  let details = `# Terraform Plan
\`\`\`
    ${results.output}
\`\`\``;

  if (results.error.length > 0) {
    details = `${details}

# Terraform Error
\`\`\`
    ${results.error}
\`\`\``;
  }

  const context = github.context;
  const pr = context.payload.pull_request;
  await octokit.checks.create({
    head_sha: (pr && pr['head'] && pr['head'].sha) || context.sha,
    name: title,
    owner: context.repo.owner,
    repo: context.repo.repo,
    status: 'completed',
    conclusion: results.exitCode > 0 ? 'failure' : 'success',
    output: {
      title,
      summary,
      annotations: [],
      text: details,
    },
  });
}

function getPlanSummary(output: string): string {
  const planLineStart = output.indexOf('Plan:');
  if (planLineStart > 0) {
    const endOfPlanLine = output.indexOf('\n', planLineStart);
    if (endOfPlanLine > 0) {
      return output.substr(planLineStart, endOfPlanLine - planLineStart);
    } else {
      return output.substr(planLineStart);
    }
  }
  return '';
}
