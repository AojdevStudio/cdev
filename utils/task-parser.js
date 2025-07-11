#!/usr/bin/env node

/**
 * Task Parser - Universal task format detection and parsing
 * 
 * Supports multiple input formats:
 * - Markdown checklists (- [ ] format)
 * - Numbered lists (1. task)
 * - Plain text lists
 * - JSON arrays
 * - Linear issue descriptions
 * - Direct text input
 */

const fs = require('node:fs').promises;
const path = require('node:path');

class TaskParser {
  constructor() {
    this.supportedFormats = [
      'markdown-checklist',
      'numbered-list',
      'plain-text',
      'json-array',
      'linear-issue',
      'direct-text'
    ];
  }

  /**
   * Parse input and detect format automatically
   */
  async parse(input) {
    console.log('🔍 Detecting task format...');
    
    // Check if input is a file path
    if (await this.isFilePath(input)) {
      return await this.parseFile(input);
    }
    
    // Check if input is a Linear issue ID
    if (this.isLinearIssueId(input)) {
      return await this.parseLinearIssue(input);
    }
    
    // Otherwise, treat as direct text input
    return this.parseText(input);
  }

  /**
   * Check if input is a file path
   */
  async isFilePath(input) {
    try {
      // Check if it looks like a file path and exists
      if (input.includes('/') || input.includes('\\') || input.endsWith('.md') || input.endsWith('.txt') || input.endsWith('.json')) {
        const fullPath = path.isAbsolute(input) ? input : path.join(process.cwd(), input);
        await fs.access(fullPath);
        return true;
      }
    } catch {
      // Not a file or doesn't exist
    }
    return false;
  }

  /**
   * Check if input is a Linear issue ID
   */
  isLinearIssueId(input) {
    // Linear issue IDs typically follow patterns like: ABC-123, PROJECT-456
    return /^[A-Z]+-\d+$/i.test(input) || /^linear-\d+$/i.test(input);
  }

  /**
   * Parse a file based on its content
   */
  async parseFile(filePath) {
    const fullPath = path.isAbsolute(filePath) ? filePath : path.join(process.cwd(), filePath);
    const content = await fs.readFile(fullPath, 'utf8');
    const extension = path.extname(fullPath).toLowerCase();
    
    console.log(`📄 Parsing file: ${path.basename(fullPath)}`);
    
    // Detect format based on extension and content
    if (extension === '.json') {
      return this.parseJsonContent(content, fullPath);
    } else if (extension === '.md') {
      return this.parseMarkdownContent(content, fullPath);
    } else {
      return this.parseTextContent(content, fullPath);
    }
  }

  /**
   * Parse JSON content
   */
  parseJsonContent(content, source) {
    try {
      const data = JSON.parse(content);
      
      // Handle different JSON structures
      if (Array.isArray(data)) {
        return {
          format: 'json-array',
          source: source,
          tasks: data.map(item => this.normalizeTask(item)),
          metadata: {
            totalTasks: data.length
          }
        };
      } else if (data.tasks && Array.isArray(data.tasks)) {
        return {
          format: 'json-object',
          source: source,
          tasks: data.tasks.map(item => this.normalizeTask(item)),
          metadata: data.metadata || { totalTasks: data.tasks.length }
        };
      } else {
        throw new Error('Unsupported JSON structure');
      }
    } catch (error) {
      console.error('Failed to parse JSON:', error.message);
      // Fallback to text parsing
      return this.parseTextContent(content, source);
    }
  }

  /**
   * Parse Markdown content
   */
  parseMarkdownContent(content, source) {
    const lines = content.split('\n');
    const tasks = [];
    let currentSection = '';
    let taskIndex = 0;
    
    for (const line of lines) {
      // Detect section headers
      if (line.match(/^#+\s+(.+)/)) {
        currentSection = line.replace(/^#+\s+/, '').trim();
        continue;
      }
      
      // Parse checkbox items: - [ ] task or - [x] completed task
      const checkboxMatch = line.match(/^\s*-\s*\[([ x])\]\s*(.+)/i);
      if (checkboxMatch) {
        taskIndex++;
        tasks.push({
          id: `task_${taskIndex}`,
          text: checkboxMatch[2].trim(),
          completed: checkboxMatch[1].toLowerCase() === 'x',
          section: currentSection,
          type: 'checklist',
          raw: line
        });
        continue;
      }
      
      // Parse numbered items: 1. task or 1) task
      const numberedMatch = line.match(/^\s*\d+[.)]\s*(.+)/);
      if (numberedMatch) {
        taskIndex++;
        tasks.push({
          id: `task_${taskIndex}`,
          text: numberedMatch[1].trim(),
          completed: false,
          section: currentSection,
          type: 'numbered',
          raw: line
        });
        continue;
      }
      
      // Parse bullet points: - task or * task
      const bulletMatch = line.match(/^\s*[-*]\s+(?!\[)(.+)/);
      if (bulletMatch) {
        taskIndex++;
        tasks.push({
          id: `task_${taskIndex}`,
          text: bulletMatch[1].trim(),
          completed: false,
          section: currentSection,
          type: 'bullet',
          raw: line
        });
      }
    }
    
    return {
      format: 'markdown-checklist',
      source: source,
      tasks: tasks,
      metadata: {
        totalTasks: tasks.length,
        completedTasks: tasks.filter(t => t.completed).length,
        sections: [...new Set(tasks.map(t => t.section).filter(s => s))]
      }
    };
  }

  /**
   * Parse plain text content
   */
  parseTextContent(content, source) {
    const lines = content.split('\n').filter(line => line.trim());
    const tasks = [];
    let taskIndex = 0;
    
    for (const line of lines) {
      // Skip comments or headers
      if (line.startsWith('#') || line.startsWith('//')) {
        continue;
      }
      
      // Remove common prefixes and clean up
      const cleanedLine = line
        .replace(/^[-*]\s+/, '')
        .replace(/^\d+[.)]\s*/, '')
        .replace(/^\[\s*\]\s*/, '')
        .replace(/^\[x\]\s*/i, '')
        .trim();
      
      if (cleanedLine) {
        taskIndex++;
        tasks.push({
          id: `task_${taskIndex}`,
          text: cleanedLine,
          completed: line.toLowerCase().includes('[x]'),
          type: 'text',
          raw: line
        });
      }
    }
    
    return {
      format: 'plain-text',
      source: source,
      tasks: tasks,
      metadata: {
        totalTasks: tasks.length
      }
    };
  }

  /**
   * Parse direct text input
   */
  parseText(text) {
    // Split by common delimiters
    const delimiters = ['\n', ',', ';', '|'];
    let tasks = [text];
    
    for (const delimiter of delimiters) {
      if (text.includes(delimiter)) {
        tasks = text.split(delimiter).map(t => t.trim()).filter(t => t);
        break;
      }
    }
    
    return {
      format: 'direct-text',
      source: 'input',
      tasks: tasks.map((task, index) => ({
        id: `task_${index + 1}`,
        text: task,
        completed: false,
        type: 'direct'
      })),
      metadata: {
        totalTasks: tasks.length
      }
    };
  }

  /**
   * Parse Linear issue
   */
  async parseLinearIssue(issueId) {
    console.log(`🔗 Parsing Linear issue: ${issueId}`);
    
    // Try to load from cache
    const cacheFile = path.join(process.cwd(), '.linear-cache', `${issueId}.json`);
    try {
      const cacheData = await fs.readFile(cacheFile, 'utf8');
      const issue = JSON.parse(cacheData);
      
      // Extract tasks from description
      const tasks = this.extractTasksFromLinearDescription(issue.description || issue.title);
      
      return {
        format: 'linear-issue',
        source: issueId,
        tasks: tasks,
        metadata: {
          issueId: issue.identifier || issueId,
          title: issue.title,
          totalTasks: tasks.length
        }
      };
    } catch (error) {
      console.warn(`⚠️  Could not load Linear issue from cache: ${error.message}`);
      
      // Fallback to treating the ID as a task itself
      return {
        format: 'linear-issue',
        source: issueId,
        tasks: [{
          id: 'task_1',
          text: `Implement ${issueId}`,
          completed: false,
          type: 'linear'
        }],
        metadata: {
          issueId: issueId,
          totalTasks: 1
        }
      };
    }
  }

  /**
   * Extract tasks from Linear issue description
   */
  extractTasksFromLinearDescription(description) {
    if (!description) return [];
    
    // Use markdown parser for Linear descriptions
    const result = this.parseMarkdownContent(description, 'linear-description');
    return result.tasks;
  }

  /**
   * Normalize task object
   */
  normalizeTask(item) {
    if (typeof item === 'string') {
      return {
        id: `task_${Date.now()}_${Math.random().toString(36).substring(7)}`,
        text: item,
        completed: false,
        type: 'normalized'
      };
    }
    
    return {
      id: item.id || `task_${Date.now()}_${Math.random().toString(36).substring(7)}`,
      text: item.text || item.content || item.description || item.name || JSON.stringify(item),
      completed: item.completed || item.done || false,
      type: item.type || 'normalized',
      ...item
    };
  }

  /**
   * Group tasks by section or category
   */
  groupTasks(parsedResult) {
    const groups = {};
    
    for (const task of parsedResult.tasks) {
      const section = task.section || 'General';
      if (!groups[section]) {
        groups[section] = [];
      }
      groups[section].push(task);
    }
    
    return groups;
  }

  /**
   * Convert parsed tasks to a simple array of strings
   */
  toSimpleArray(parsedResult) {
    return parsedResult.tasks.map(task => task.text);
  }

  /**
   * Get task statistics
   */
  getStatistics(parsedResult) {
    const stats = {
      total: parsedResult.tasks.length,
      completed: parsedResult.tasks.filter(t => t.completed).length,
      pending: parsedResult.tasks.filter(t => !t.completed).length,
      byType: {},
      bySection: {}
    };
    
    // Count by type
    for (const task of parsedResult.tasks) {
      const type = task.type || 'unknown';
      stats.byType[type] = (stats.byType[type] || 0) + 1;
      
      if (task.section) {
        stats.bySection[task.section] = (stats.bySection[task.section] || 0) + 1;
      }
    }
    
    return stats;
  }
}

module.exports = { TaskParser };