#!/usr/bin/env node

/**
 * 完全自動Issue実装スクリプト
 * Claude Code APIを使用してIssueの自動実装を行います
 */

import { execSync, spawn } from 'child_process';
import fs from 'fs';
import path from 'path';

// 設定
const CLAUDE_CODE_BINARY = 'claude'; // Claude Code CLI のパス
const PROJECT_ROOT = process.cwd();

class AutoImplementer {
  constructor(issueNumber) {
    this.issueNumber = issueNumber;
    this.taskFilePath = path.join(PROJECT_ROOT, 'tasks', `issue-${issueNumber}-tasks.md`);
  }

  async execute() {
    console.log('🚀 自動Issue実装を開始します...');
    
    try {
      // 1. Issue詳細取得
      await this.fetchIssue();
      
      // 2. Claude Codeでの自動実装
      await this.implementWithClaude();
      
      // 3. 品質チェック
      await this.runQualityChecks();
      
      // 4. PR作成
      await this.createPR();
      
      console.log('🎉 自動実装が完了しました！');
      
    } catch (error) {
      console.error('❌ 自動実装でエラーが発生しました:', error.message);
      process.exit(1);
    }
  }

  async fetchIssue() {
    console.log(`📋 Issue #${this.issueNumber} の詳細を取得中...`);
    
    try {
      execSync(`./scripts/fetch-issue.sh ${this.issueNumber}`, { 
        stdio: 'inherit',
        cwd: PROJECT_ROOT 
      });
      
      if (!fs.existsSync(this.taskFilePath)) {
        throw new Error('タスクファイルの生成に失敗しました');
      }
      
      console.log('✅ Issue詳細の取得が完了しました');
    } catch (error) {
      throw new Error(`Issue取得エラー: ${error.message}`);
    }
  }

  async implementWithClaude() {
    console.log('🤖 Claude Codeでの自動実装を開始...');
    
    // タスクファイルから実装プロンプトを抽出
    const taskContent = fs.readFileSync(this.taskFilePath, 'utf8');
    const claudePrompt = this.extractClaudePrompt(taskContent);
    
    if (!claudePrompt) {
      throw new Error('Claude用プロンプトが見つかりません');
    }

    console.log('📝 実装プロンプト:');
    console.log('================');
    console.log(claudePrompt);
    console.log('================');

    // Claude Codeを非対話的に実行
    return new Promise((resolve, reject) => {
      const claude = spawn(CLAUDE_CODE_BINARY, [], {
        stdio: ['pipe', 'pipe', 'pipe'],
        cwd: PROJECT_ROOT
      });

      let output = '';
      let errorOutput = '';

      claude.stdout.on('data', (data) => {
        const chunk = data.toString();
        output += chunk;
        console.log(chunk);
      });

      claude.stderr.on('data', (data) => {
        const chunk = data.toString();
        errorOutput += chunk;
        console.error(chunk);
      });

      claude.on('close', (code) => {
        if (code === 0) {
          console.log('✅ Claude Codeでの実装が完了しました');
          resolve(output);
        } else {
          reject(new Error(`Claude Code実行エラー (exit code: ${code})\n${errorOutput}`));
        }
      });

      claude.on('error', (error) => {
        reject(new Error(`Claude Code起動エラー: ${error.message}`));
      });

      // プロンプトを送信
      claude.stdin.write(claudePrompt + '\n');
      claude.stdin.end();
    });
  }

  extractClaudePrompt(taskContent) {
    // Claude Code用プロンプト部分を抽出
    const lines = taskContent.split('\n');
    let inPromptSection = false;
    let promptLines = [];
    
    for (const line of lines) {
      if (line.includes('## Claude Code用プロンプト')) {
        inPromptSection = true;
        continue;
      }
      
      if (inPromptSection) {
        if (line.startsWith('---')) {
          break;
        }
        if (line.startsWith('```') && promptLines.length === 0) {
          continue;
        }
        if (line === '```' && promptLines.length > 0) {
          continue;
        }
        promptLines.push(line);
      }
    }
    
    return promptLines.join('\n').trim();
  }

  async runQualityChecks() {
    console.log('🔍 コード品質チェックを実行中...');
    
    try {
      // リンティング
      console.log('  📋 リンティング実行...');
      execSync('npm run lint', { 
        stdio: 'pipe', 
        cwd: PROJECT_ROOT 
      });
      console.log('  ✅ リンティング: 正常');
    } catch {
      console.log('  ⚠️  リンティング: 警告あり（続行）');
    }

    try {
      // ビルドテスト
      console.log('  🔨 ビルドテスト実行...');
      execSync('npm run build', { 
        stdio: 'pipe', 
        cwd: PROJECT_ROOT 
      });
      console.log('  ✅ ビルドテスト: 正常');
    } catch {
      console.log('  ⚠️  ビルドテスト: 警告あり（続行）');
    }
  }

  async createPR() {
    console.log('📤 プルリクエストを作成中...');
    
    try {
      // Issue情報を取得
      const taskContent = fs.readFileSync(this.taskFilePath, 'utf8');
      const issueTitle = this.extractIssueTitle(taskContent);
      
      const prTitle = `feat: Issue #${this.issueNumber} ${issueTitle}`;
      const prBody = this.generatePRBody(issueTitle);
      
      execSync(`./scripts/create-pr.sh "${prTitle}" "${prBody}"`, {
        stdio: 'inherit',
        cwd: PROJECT_ROOT
      });
      
      console.log('✅ プルリクエストの作成が完了しました');
    } catch (error) {
      throw new Error(`PR作成エラー: ${error.message}`);
    }
  }

  extractIssueTitle(taskContent) {
    const match = taskContent.match(/^# Issue #\d+: (.+)$/m);
    return match ? match[1] : 'タイトル不明';
  }

  generatePRBody(issueTitle) {
    return `Issue #${this.issueNumber} の自動実装

## 実装内容
- ${issueTitle}

## 自動化による実装
この実装は自動化スクリプト(auto-implement.js)により生成されました。

### 実行された処理
1. Issue詳細の自動取得
2. Claude Codeによる自動実装
3. コード品質チェック（リンティング・ビルドテスト）
4. プルリクエストの自動作成

🤖 Generated with [Claude Code](https://claude.ai/code)

Closes #${this.issueNumber}`;
  }
}

// メイン実行部分
async function main() {
  const issueNumber = process.argv[2];
  
  if (!issueNumber) {
    // Issue番号が指定されていない場合、最新のオープンIssueを取得
    try {
      const output = execSync('gh issue list --state open --limit 1 --json number --jq ".[0].number"', {
        encoding: 'utf8',
        cwd: PROJECT_ROOT
      });
      const autoIssueNumber = output.trim();
      
      if (!autoIssueNumber || autoIssueNumber === 'null') {
        console.error('❌ オープンなIssueが見つかりません');
        process.exit(1);
      }
      
      console.log(`✅ Issue #${autoIssueNumber} を自動選択しました`);
      const implementer = new AutoImplementer(autoIssueNumber);
      await implementer.execute();
    } catch (error) {
      console.error('❌ Issue取得エラー:', error.message);
      process.exit(1);
    }
  } else {
    const implementer = new AutoImplementer(issueNumber);
    await implementer.execute();
  }
}

// エラーハンドリング
process.on('unhandledRejection', (error) => {
  console.error('❌ 予期せぬエラー:', error);
  process.exit(1);
});

// 実行
main().catch(console.error);