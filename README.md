# Terraform Plan Action

This action wraps `terraform plan` to allow the plan and plan status to be posted as a status check in a pull request.  This enhances the terraform examples that uses an inline action to post a comment to a PR.

The following arguments are automatically added to `terraform plan -no-color -input=false`.  `no-color` is added since coloring won't be preserved in the output.  `-input=false` is added to prevent the action from asking for input of a missing variable.  This can cause the pipeline to pause and continue to churn billable minutes while not proceeding.

Example usage

```
- uses: HylandSoftware/terraform-plan-action@v1.1.1
  with:
    args: -var-file=./vars/vars.tfvars
    token: ${{ secrets.GITHUB_TOKEN }}
    working-directory: ${{ env.TERRAFORM_WORKING_DIRECTORY }}

```
Example 2: 
** Specify a title for the status report (required if more then one per run) 
** Specify multiple arguments to the plan as a quoted json array
```
      - uses: HylandSoftware/terraform-plan-action@v1.1.1
        with:
          args: '["-lock=false", "-var-file=./vars/vars.tfvars"]'
          token: ${{ secrets.GITHUB_TOKEN }}
          working-directory: ${{ env.TERRAFORM_WORKING_DIRECTORY }}
          report-title: Multiple Argument Run
```