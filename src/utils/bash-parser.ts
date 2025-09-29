import { BashCommand } from '../types/bash';

/**
 * Parses a bash code block and extracts individual commands
 */
export function parseBashCommands(codeString: string): BashCommand[] {
  const lines = codeString.split('\n');
  const commands: BashCommand[] = [];
  let currentCommand = '';
  let commandStartLine = 0;
  let currentDescription = '';
  let inBackslashContinuation = false;

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i];
    const line = rawLine.trim();

    // Skip empty lines
    if (!line) {
      if (currentCommand && !inBackslashContinuation) {
        // End of current command
        commands.push({
          command: currentCommand.trim(),
          description: currentDescription || undefined,
          line: commandStartLine + 1,
        });
        currentCommand = '';
        currentDescription = '';
      }
      continue;
    }

    // Handle comments
    if (line.startsWith('#')) {
      if (!currentCommand) {
        // This is a description comment
        currentDescription = line.substring(1).trim();
      }
      continue;
    }

    // Check if this line ends with a backslash continuation
    const endsWithBackslash = rawLine.trimEnd().endsWith('\\');
    
    // If we're in a backslash continuation or this line starts one
    if (endsWithBackslash || inBackslashContinuation) {
      if (!currentCommand) {
        commandStartLine = i;
      }
      
      // Add the line content
      if (endsWithBackslash) {
        // Remove the backslash and add the content
        const content = rawLine.trimEnd().slice(0, -1).trim();
        currentCommand += (currentCommand ? ' ' : '') + content;
        inBackslashContinuation = true;
      } else {
        // This is the last line of a backslash continuation
        currentCommand += (currentCommand ? ' ' : '') + line;
        inBackslashContinuation = false;
      }
      continue;
    }

    // Check if this line is a continuation of a pipe or logical operator
    const isPipeContinuation =
      line.startsWith('|') || line.startsWith('&&') || line.startsWith('||');

    // Check if previous line ended with operators that continue to next line
    const previousLineEndsWithOperator =
      currentCommand &&
      (currentCommand.trim().endsWith('|') ||
        currentCommand.trim().endsWith('&&') ||
        currentCommand.trim().endsWith('||') ||
        currentCommand.trim().endsWith(';'));

    // Handle multiline commands (pipes, logical operators)
    if (currentCommand && (isPipeContinuation || previousLineEndsWithOperator)) {
      currentCommand += (currentCommand.endsWith(' ') ? '' : ' ') + line;
      continue;
    }

    // Start of new command
    if (currentCommand) {
      // Save previous command
      commands.push({
        command: currentCommand.trim(),
        description: currentDescription || undefined,
        line: commandStartLine + 1,
      });
      currentDescription = '';
    }

    commandStartLine = i;
    currentCommand = line;
  }

  // Don't forget the last command
  if (currentCommand) {
    commands.push({
      command: currentCommand.trim(),
      description: currentDescription || undefined,
      line: commandStartLine + 1,
    });
  }

  return commands.filter(cmd => cmd.command.length > 0);
}

/**
 * Gets a display name for a command (truncated if too long)
 */
export function getCommandDisplayName(command: BashCommand, maxLength: number = 50): string {
  if (command.description) {
    return command.description.length <= maxLength
      ? command.description
      : command.description.substring(0, maxLength - 3) + '...';
  }

  const cmdText = command.command;
  if (cmdText.length <= maxLength) {
    return cmdText;
  }

  return cmdText.substring(0, maxLength - 3) + '...';
}