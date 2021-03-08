import * as core from '@actions/core';
import { exec, ExecOptions } from '@actions/exec';
import io from '@actions/io';
import fs from 'fs';
import path from 'path';
import { createStatusCheck } from './github';
import { TerraformResults } from './terraform-results';

async function run(): Promise<void> {
  try {
    const terraformArgs: string[] = parseArgs(core.getInput('args'));
    const githubToken: string = core.getInput('token');
    const reportTitle: string = core.getInput('report-title');
    const workingDirectory: string = core.getInput('working-directory');
    const debug: boolean =
      (core.getInput('debug', { required: false }) || 'false') === 'true';
    const continueOnError: boolean =
      (core.getInput('continue-on-error', { required: false }) || 'false') ===
      'true';
    const saveDirectory: string = core.getInput('save-directory');

    const stdOut: Buffer[] = [];
    const stdErr: Buffer[] = [];

    const options: ExecOptions = {};
    options.listeners = {
      stdout: (data: Buffer) => {
        stdOut.push(data);
      },
      stderr: (data: Buffer) => {
        stdErr.push(data);
      },
    };
    options.ignoreReturnCode = true;
    options.cwd = workingDirectory;
    // don't escape the args cause
    options.windowsVerbatimArguments = true;
    if (debug) {
      if (options.env != null) {
        options.env['TF_LOG'] = 'DEBUG';
      } else {
        options.env = { TF_LOG: 'DEBUG' };
      }
    }

    core.debug(`Starting terraform plan at ${new Date().toTimeString()}`);

    const exitCode = await exec(
      'terraform',
      ['plan', '-no-color', '-input=false'].concat(terraformArgs),
      options
    );

    const output = writeBufferToString(stdOut);
    const error = writeBufferToString(stdErr);

    core.debug(`Terraform plan completed at ${new Date().toTimeString()}`);
    core.debug(`Exit Code: ${exitCode}`);
    core.debug(' ------ Standard Out from Plan -----');
    core.debug(output);
    core.debug(' ------ Standard Out from Plan -----');
    core.debug(' ------ Standard Error from Plan -----');
    core.debug(error);
    core.debug(' ------ Standard Error from Plan -----');

    if (saveDirectory !== undefined && saveDirectory.length > 0) {
      writeFile(saveDirectory, output, error);
    }

    createStatusCheck(
      githubToken,
      reportTitle,
      new TerraformResults(output, error, exitCode)
    );

    if (continueOnError === false && exitCode !== 0) {
      core.setFailed(`Terraform exited with code ${exitCode}.`);
    }
  } catch (error) {
    core.setFailed(error.message);
  }
}

async function writeFile(
  directory: string,
  output: string,
  error: string
): Promise<void> {
  await io.mkdirP(directory);
  await fs.promises.writeFile(path.join(directory, 'std.out'), output);
  await fs.promises.writeFile(path.join(directory, 'std.err'), error);
}

function writeBufferToString(data: Buffer[]): string {
  return data.map((buffer) => buffer.toString()).join('');
}

function parseArgs(args: string): string[] {
  if (args.startsWith('[')) {
    const parsedArgs = JSON.parse(`{ "value": ${args} }`);
    return parsedArgs.value;
  } else {
    return [args];
  }
}

run();
