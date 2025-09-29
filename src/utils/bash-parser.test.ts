import { describe, it, expect } from 'bun:test';
import { parseBashCommands, getCommandDisplayName } from '../index';

describe('parseBashCommands', () => {
  it('should parse simple commands', () => {
    const code = `ls -la
pwd
echo "Hello World"`;

    const commands = parseBashCommands(code);
    
    expect(commands).toHaveLength(3);
    expect(commands[0].command).toBe('ls -la');
    expect(commands[1].command).toBe('pwd');
    expect(commands[2].command).toBe('echo "Hello World"');
  });

  it('should handle comments as descriptions', () => {
    const code = `# List all files
ls -la

# Show current directory
pwd`;

    const commands = parseBashCommands(code);
    
    expect(commands).toHaveLength(2);
    expect(commands[0].description).toBe('List all files');
    expect(commands[0].command).toBe('ls -la');
    expect(commands[1].description).toBe('Show current directory');
    expect(commands[1].command).toBe('pwd');
  });

  it('should handle multiline commands with backslash', () => {
    const code = `docker run \\
  -p 3000:3000 \\
  -v /data:/data \\
  myimage`;

    const commands = parseBashCommands(code);
    
    expect(commands).toHaveLength(1);
    expect(commands[0].command).toBe('docker run -p 3000:3000 -v /data:/data myimage');
  });

  it('should handle pipe commands', () => {
    const code = `cat file.txt |
  grep "pattern" |
  sort`;

    const commands = parseBashCommands(code);
    
    expect(commands).toHaveLength(1);
    expect(commands[0].command).toBe('cat file.txt | grep "pattern" | sort');
  });

  it('should handle logical operators', () => {
    const code = `npm install &&
npm run build &&
npm test`;

    const commands = parseBashCommands(code);
    
    expect(commands).toHaveLength(1);
    expect(commands[0].command).toBe('npm install && npm run build && npm test');
  });

  it('should return empty array for empty input', () => {
    expect(parseBashCommands('')).toHaveLength(0);
    expect(parseBashCommands('   \n  \n  ')).toHaveLength(0);
  });
});

describe('getCommandDisplayName', () => {
  it('should use description if available', () => {
    const command = {
      command: 'very-long-command-with-many-arguments --flag1 --flag2',
      description: 'Short description',
      line: 1
    };
    
    expect(getCommandDisplayName(command)).toBe('Short description');
  });

  it('should truncate long descriptions', () => {
    const command = {
      command: 'cmd',
      description: 'A'.repeat(60),
      line: 1
    };
    
    expect(getCommandDisplayName(command, 50)).toBe('A'.repeat(47) + '...');
  });

  it('should use command text when no description', () => {
    const command = {
      command: 'ls -la',
      line: 1
    };
    
    expect(getCommandDisplayName(command)).toBe('ls -la');
  });

  it('should truncate long commands', () => {
    const command = {
      command: 'A'.repeat(60),
      line: 1
    };
    
    expect(getCommandDisplayName(command, 50)).toBe('A'.repeat(47) + '...');
  });
});