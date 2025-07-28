import * as vscode from 'vscode';
import { spawn, ChildProcess } from 'child_process';
import * as os from 'os';

export class ClaudeTerminalManager {
    private terminal: vscode.Terminal | undefined;
    private claudeProcess: ChildProcess | undefined;
    private isWSL: boolean = false;

    constructor() {
        this.detectEnvironment();
    }

    private detectEnvironment() {
        // WSL 환경 감지
        this.isWSL = os.platform() === 'linux' && process.env.WSL_DISTRO_NAME !== undefined;
    }

    public initialize() {
        this.createClaudeTerminal();
    }

    private createClaudeTerminal() {
        // 기존 터미널이 있으면 제거
        if (this.terminal) {
            this.terminal.dispose();
        }

        // Claude Code 터미널 생성
        this.terminal = vscode.window.createTerminal({
            name: 'Claude Code Korean',
            hideFromUser: false
        });

        // Claude Code CLI 시작
        this.startClaude();
    }

    private async startClaude() {
        if (!this.terminal) return;

        try {
            // Claude Code CLI 실행
            this.terminal.sendText('claude', true);
            
            vscode.window.showInformationMessage('Claude Code Assistant Korean이 시작되었습니다!');
        } catch (error) {
            vscode.window.showErrorMessage(`Claude Code 시작 실패: ${error}`);
        }
    }

    public sendMessage(message: string) {
        if (!this.terminal) {
            this.createClaudeTerminal();
        }

        if (this.terminal) {
            // 터미널에 포커스
            this.terminal.show();
            
            // 메시지 전송 (개행 문자 추가)
            this.terminal.sendText(message, true);
        }
    }

    public clearTerminal() {
        if (this.terminal) {
            this.terminal.sendText('clear', true);
        }
    }

    public startNewSession() {
        if (this.terminal) {
            // 기존 Claude 프로세스 종료
            this.terminal.sendText('\x03', false); // Ctrl+C
            
            // 잠시 후 새 세션 시작
            setTimeout(() => {
                this.startClaude();
            }, 1000);
        }
    }

    public dispose() {
        if (this.terminal) {
            this.terminal.dispose();
        }
        
        if (this.claudeProcess) {
            this.claudeProcess.kill();
        }
    }

    // WSL 경로 변환 (Windows 경로 -> WSL 경로)
    private convertToWSLPath(windowsPath: string): string {
        if (!this.isWSL) return windowsPath;
        
        // C:\Users\... -> /mnt/c/Users/...
        return windowsPath.replace(/^([A-Z]):\\/, '/mnt/$1/').replace(/\\/g, '/').toLowerCase();
    }

    public addFilePath(filePath: string) {
        const convertedPath = this.isWSL ? this.convertToWSLPath(filePath) : filePath;
        
        if (this.terminal) {
            this.terminal.show();
            // 파일 경로를 따옴표로 감싸서 전송
            this.terminal.sendText(`"${convertedPath}"`, false);
        }
    }
}