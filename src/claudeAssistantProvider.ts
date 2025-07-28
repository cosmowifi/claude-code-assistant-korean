import * as vscode from 'vscode';

export class ClaudeAssistantProvider implements vscode.WebviewViewProvider {
    public static readonly viewType = 'claude-korean-assistant';
    private _view?: vscode.WebviewView;
    private _inputText: string = '';  // 실시간 동기화된 텍스트

    constructor(private readonly _extensionContext: vscode.ExtensionContext) {}

    public resolveWebviewView(
        webviewView: vscode.WebviewView,
        context: vscode.WebviewViewResolveContext,
        _token: vscode.CancellationToken
    ) {
        this._view = webviewView;

        webviewView.webview.options = {
            enableScripts: true,
            localResourceRoots: [this._extensionContext.extensionUri]
        };

        webviewView.webview.html = this._getHtmlForWebview(webviewView.webview);

        // 웹뷰에서 메시지 수신
        webviewView.webview.onDidReceiveMessage(
            message => {
                switch (message.type) {
                    case 'updateText':
                        this._inputText = message.value;  // 실시간 텍스트 동기화
                        break;
                    case 'sendMessage':
                        vscode.commands.executeCommand('claude-korean.sendMessage', this._inputText);
                        break;
                    case 'clearChat':
                        vscode.commands.executeCommand('claude-korean.clearChat');
                        break;
                    case 'newSession':
                        vscode.commands.executeCommand('claude-korean.newSession');
                        break;
                    case 'addFile':
                        vscode.commands.executeCommand('claude-korean.addFile');
                        break;
                    case 'addFolder':
                        vscode.commands.executeCommand('claude-korean.addFolder');
                        break;
                    case 'inputFocused':
                        vscode.commands.executeCommand('setContext', 'claude-korean.inputFocused', true);
                        break;
                    case 'inputBlurred':
                        vscode.commands.executeCommand('setContext', 'claude-korean.inputFocused', false);
                        break;
                }
            },
            undefined,
            this._extensionContext.subscriptions
        );
    }

    public clearInput() {
        if (this._view) {
            this._view.webview.postMessage({ type: 'clearInput' });
        }
    }

    public addFilePath(filePath: string) {
        if (this._view) {
            this._view.webview.postMessage({ type: 'addFilePath', path: filePath });
        }
    }

    private _getHtmlForWebview(webview: vscode.Webview) {
        return `<!DOCTYPE html>
<html lang="ko">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Claude 한글 어시스턴트</title>
    <style>
        body {
            font-family: 'Malgun Gothic', '맑은 고딕', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            margin: 0;
            padding: 10px;
            color: var(--vscode-foreground);
            background-color: var(--vscode-editor-background);
        }
        
        .container {
            display: flex;
            flex-direction: column;
            height: calc(100vh - 20px);
        }
        
        .header {
            margin-bottom: 10px;
            text-align: center;
        }
        
        .title {
            font-size: 16px;
            font-weight: bold;
            color: var(--vscode-textLink-foreground);
            margin-bottom: 5px;
        }
        
        .subtitle {
            font-size: 12px;
            color: var(--vscode-descriptionForeground);
        }
        
        .input-section {
            margin-bottom: 10px;
        }
        
        .input-container {
            position: relative;
            margin-bottom: 10px;
        }
        
        #messageInput {
            width: 100%;
            min-height: 80px;
            padding: 10px;
            border: 1px solid var(--vscode-input-border);
            border-radius: 4px;
            background-color: var(--vscode-input-background);
            color: var(--vscode-input-foreground);
            font-family: 'Malgun Gothic', '맑은 고딕', var(--vscode-editor-font-family);
            font-size: var(--vscode-editor-font-size);
            resize: vertical;
            box-sizing: border-box;
            line-height: 1.4;
        }
        
        #messageInput:focus {
            outline: none;
            border-color: var(--vscode-focusBorder);
        }
        
        .input-counter {
            position: absolute;
            bottom: 5px;
            right: 10px;
            font-size: 11px;
            color: var(--vscode-descriptionForeground);
            background: var(--vscode-editor-background);
            padding: 2px 4px;
            border-radius: 2px;
        }
        
        .buttons {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 5px;
            margin-bottom: 10px;
        }
        
        .button {
            padding: 8px 12px;
            border: 1px solid var(--vscode-button-border);
            border-radius: 4px;
            background-color: var(--vscode-button-background);
            color: var(--vscode-button-foreground);
            cursor: pointer;
            font-size: 13px;
            text-align: center;
        }
        
        .button:hover {
            background-color: var(--vscode-button-hoverBackground);
        }
        
        .button.primary {
            background-color: var(--vscode-button-background);
            color: var(--vscode-button-foreground);
            font-weight: bold;
        }
        
        .button.primary:hover {
            background-color: var(--vscode-button-hoverBackground);
        }
        
        .file-actions {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 5px;
            margin-bottom: 10px;
        }
        
        .status {
            margin-top: auto;
            padding: 8px;
            background-color: var(--vscode-badge-background);
            color: var(--vscode-badge-foreground);
            border-radius: 4px;
            font-size: 12px;
            text-align: center;
        }
        
        .template-section {
            margin-bottom: 10px;
        }
        
        .template-title {
            font-size: 13px;
            font-weight: bold;
            margin-bottom: 5px;
            color: var(--vscode-textLink-foreground);
        }
        
        .templates {
            display: flex;
            flex-direction: column;
            gap: 3px;
        }
        
        .template-btn {
            padding: 6px 8px;
            border: 1px solid var(--vscode-input-border);
            border-radius: 3px;
            background-color: var(--vscode-input-background);
            color: var(--vscode-foreground);
            cursor: pointer;
            font-size: 12px;
            text-align: left;
        }
        
        .template-btn:hover {
            background-color: var(--vscode-list-hoverBackground);
        }
        
        .korean-input-indicator {
            position: absolute;
            top: 5px;
            right: 5px;
            width: 8px;
            height: 8px;
            border-radius: 50%;
            background-color: var(--vscode-descriptionForeground);
            opacity: 0;
            transition: opacity 0.2s;
        }
        
        .korean-input-indicator.active {
            opacity: 1;
            background-color: var(--vscode-textLink-foreground);
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="title">🤖 Claude 한글 어시스턴트</div>
            <div class="subtitle">한국어 최적화 버전</div>
        </div>
        
        <div class="template-section">
            <div class="template-title">빠른 명령어</div>
            <div class="templates">
                <button class="template-btn" onclick="insertTemplate('이 코드를 리뷰해주세요')">📝 코드 리뷰</button>
                <button class="template-btn" onclick="insertTemplate('이 오류를 해결해주세요')">🐛 오류 해결</button>
                <button class="template-btn" onclick="insertTemplate('이 함수를 최적화해주세요')">⚡ 성능 최적화</button>
                <button class="template-btn" onclick="insertTemplate('테스트 코드를 작성해주세요')">🧪 테스트 생성</button>
            </div>
        </div>
        
        <div class="input-section">
            <div class="input-container">
                <textarea id="messageInput" placeholder="Claude에게 무엇을 도와달라고 할까요? (Ctrl+Enter로 전송)"></textarea>
                <div class="korean-input-indicator" id="koreanIndicator"></div>
                <div class="input-counter" id="charCounter">0자</div>
            </div>
        </div>
        
        <div class="buttons">
            <button class="button primary" onclick="sendMessage()">📤 전송</button>
            <button class="button" onclick="clearChat()">🗑️ 초기화</button>
        </div>
        
        <div class="file-actions">
            <button class="button" onclick="addFile()">📄 파일 추가</button>
            <button class="button" onclick="addFolder()">📁 폴더 추가</button>
        </div>
        
        <div class="buttons">
            <button class="button" onclick="newSession()">🆕 새 세션</button>
        </div>
        
        <div class="status" id="status">
            Claude Code CLI와 연결됨
        </div>
    </div>

    <script>
        const vscode = acquireVsCodeApi();
        const messageInput = document.getElementById('messageInput');
        const charCounter = document.getElementById('charCounter');
        const koreanIndicator = document.getElementById('koreanIndicator');
        
        let isComposing = false;
        let compositionBuffer = '';
        
        // 한국어 입력 최적화
        messageInput.addEventListener('compositionstart', (e) => {
            isComposing = true;
            koreanIndicator.classList.add('active');
        });
        
        messageInput.addEventListener('compositionupdate', (e) => {
            compositionBuffer = e.data;
        });
        
        messageInput.addEventListener('compositionend', (e) => {
            isComposing = false;
            compositionBuffer = '';
            koreanIndicator.classList.remove('active');
            updateCharCounter();
        });
        
        messageInput.addEventListener('input', (e) => {
            if (!isComposing) {
                updateCharCounter();
            }
            // 실시간으로 텍스트를 extension에 동기화
            vscode.postMessage({
                type: 'updateText',
                value: e.target.value
            });
        });
        
        messageInput.addEventListener('focus', () => {
            vscode.postMessage({ type: 'inputFocused' });
        });
        
        messageInput.addEventListener('blur', () => {
            vscode.postMessage({ type: 'inputBlurred' });
        });
        
        messageInput.addEventListener('keydown', (e) => {
            if (e.ctrlKey && e.key === 'Enter') {
                e.preventDefault();
                sendMessage();
            }
        });
        
        function updateCharCounter() {
            const length = messageInput.value.length;
            charCounter.textContent = length + '자';
        }
        
        function sendMessage() {
            // 신호만 보내고 텍스트는 이미 동기화된 것 사용
            if (messageInput.value.trim()) {
                vscode.postMessage({
                    type: 'sendMessage'
                });
                messageInput.value = '';
                updateCharCounter();
                updateStatus('메시지 전송됨');
                // 텍스트 클리어도 동기화
                vscode.postMessage({
                    type: 'updateText',
                    value: ''
                });
            }
        }
        
        function clearChat() {
            vscode.postMessage({ type: 'clearChat' });
            messageInput.value = '';
            updateCharCounter();
            updateStatus('채팅 초기화됨');
        }
        
        function newSession() {
            vscode.postMessage({ type: 'newSession' });
            updateStatus('새 세션 시작됨');
        }
        
        function addFile() {
            vscode.postMessage({ type: 'addFile' });
            updateStatus('파일 추가 중...');
        }
        
        function addFolder() {
            vscode.postMessage({ type: 'addFolder' });
            updateStatus('폴더 추가 중...');
        }
        
        function insertTemplate(template) {
            messageInput.value = template;
            messageInput.focus();
            updateCharCounter();
        }
        
        function updateStatus(message) {
            const status = document.getElementById('status');
            status.textContent = message;
            setTimeout(() => {
                status.textContent = 'Claude Code CLI와 연결됨';
            }, 2000);
        }
        
        // 웹뷰에서 메시지 수신
        window.addEventListener('message', event => {
            const message = event.data;
            switch (message.type) {
                case 'clearInput':
                    messageInput.value = '';
                    updateCharCounter();
                    break;
                case 'addFilePath':
                    const currentValue = messageInput.value;
                    const newValue = currentValue + (currentValue ? ' ' : '') + '"' + message.path + '"';
                    messageInput.value = newValue;
                    updateCharCounter();
                    messageInput.focus();
                    break;
            }
        });
        
        // 초기화
        updateCharCounter();
        messageInput.focus();
    </script>
</body>
</html>`;
    }
}