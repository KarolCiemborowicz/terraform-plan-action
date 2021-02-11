export class TerraformResults {
  constructor(
    readonly output: string,
    readonly error: string,
    readonly exitCode: number
  ) {}
}
