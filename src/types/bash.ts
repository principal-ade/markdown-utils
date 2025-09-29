export interface BashCommand {
  command: string;
  description?: string;
  line: number;
}

// Options for bash command execution
export interface BashCommandOptions {
  /** Unique identifier for the command execution */
  id?: string;
  /** Whether to show output in terminal */
  showInTerminal?: boolean;
  /** Current working directory for command execution */
  cwd?: string;
  /** Whether to run command in background */
  background?: boolean;
}

// Result from bash command execution
export type BashCommandResult = unknown;