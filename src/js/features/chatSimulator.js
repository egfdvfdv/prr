class ChatSimulator {
    constructor(promptBuilder) {
        this.promptBuilder = promptBuilder;
        this.chatBox = document.getElementById('chatBox');
        this.chatInput = document.getElementById('chatInput');
        this.sendBtn = document.getElementById('sendChatBtn');
        this.chatHistory = [];
        this.init();
    }

    init() {
        this.sendBtn?.addEventListener('click', () => this.sendMessage());
        this.chatInput?.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                this.sendMessage();
            }
        });
    }

    addMessage(role, content) {
        if (!this.chatBox) return;
        const msgDiv = document.createElement('div');
        msgDiv.className = `chat-msg ${role}`;
        msgDiv.textContent = content;
        this.chatBox.appendChild(msgDiv);
        this.chatBox.scrollTop = this.chatBox.scrollHeight;
    }

    sendMessage() {
        const message = this.chatInput.value.trim();
        if (!message) return;

        this.addMessage('user', message);
        this.chatHistory.push({ role: 'user', content: message });
        this.chatInput.value = '';

        // Simulate AI response
        setTimeout(() => {
            const systemPrompt = this.promptBuilder.buildFullPrompt();
            const response = `Based on the system prompt, here is a simulated response to "${message}". The full prompt has ~${systemPrompt.length} characters.`;
            this.addMessage('assistant', response);
            this.chatHistory.push({ role: 'assistant', content: response });
        }, 500);
    }
}

// Add basic styling for chat messages
const chatStyle = document.createElement('style');
chatStyle.textContent = `
    .chat-msg {
        padding: var(--space-sm) var(--space-md);
        border-radius: var(--radius-lg);
        margin-bottom: var(--space-sm);
        max-width: 80%;
        line-height: 1.4;
    }
    .chat-msg.user {
        background: var(--primary-500);
        color: white;
        margin-left: auto;
        border-bottom-right-radius: var(--radius-xs);
    }
    .chat-msg.assistant {
        background: var(--bg-tertiary);
        color: var(--text-primary);
        margin-right: auto;
        border-bottom-left-radius: var(--radius-xs);
    }
`;
document.head.appendChild(chatStyle);
