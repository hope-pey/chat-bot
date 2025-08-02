
function getElementSafely(id) {
    const element = document.getElementById(id);
    if (!element) {
        console.warn(`Element with id '${id}' not found`);
    }
    return element;
}


let currentChatId = null;
let chats = [];
let isTyping = false;
let searchQuery = '';


const sidebar = getElementSafely('sidebar');
const chatHistory = getElementSafely('chatHistory');
const chatContainer = getElementSafely('chatContainer');
const messageInput = getElementSafely('messageInput');
const sendBtn = getElementSafely('sendBtn');
const newChatBtn = getElementSafely('newChatBtn');
const menuBtn = getElementSafely('menuBtn');
const sidebarToggle = getElementSafely('sidebarToggle');
const welcomeMessage = getElementSafely('welcomeMessage');


document.addEventListener('DOMContentLoaded', function() {

    setTimeout(() => {
        loadChats();
        setupEventListeners();
        
 
        const searchInputCheck = document.getElementById('searchInput');
        console.log('Search input element:', searchInputCheck);
        

    showWelcomeScreen();
        
   
        setTimeout(() => {
            const searchInputRetry = document.getElementById('searchInput');
            if (searchInputRetry && !searchInputRetry.hasAttribute('data-initialized')) {
                searchInputRetry.setAttribute('data-initialized', 'true');
                searchInputRetry.addEventListener('input', function() {
                    searchQuery = this.value.toLowerCase();
                    console.log('Search query (delayed):', searchQuery);
                    filterChatHistory();
                });
                console.log('Search input initialized with delay');
            }
        }, 100);
    }, 50);
});


function setupEventListeners() {
    console.log('Setting up event listeners...');

    if (sendBtn) {
        sendBtn.addEventListener('click', sendMessage);
        console.log('Send button event listener added');
    } else {
        console.warn('Send button not found');
    }
    
    if (messageInput) {
        messageInput.addEventListener('keydown', function(e) {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
            }
        });


        messageInput.addEventListener('input', autoResizeTextarea);
        console.log('Message input event listeners added');
    } else {
        console.warn('Message input not found');
    }

    if (newChatBtn) {
        newChatBtn.addEventListener('click', createNewChat);
        console.log('New chat button event listener added');
    } else {
        console.warn('New chat button not found');
    }


    if (menuBtn) {
        menuBtn.addEventListener('click', toggleSidebar);
    }
    if (sidebarToggle) {
        sidebarToggle.addEventListener('click', toggleSidebar);
    }


    document.querySelectorAll('.suggestion-card').forEach(card => {
        card.addEventListener('click', function() {
            const text = this.querySelector('span').textContent;
            messageInput.value = text;
            messageInput.focus();
        });
    });

    
    const searchInputElement = document.getElementById('searchInput');
    if (searchInputElement) {
        searchInputElement.addEventListener('input', function() {
            searchQuery = this.value.toLowerCase();
            console.log('Search query:', searchQuery); // Debug
            filterChatHistory();
        });
        console.log('Search input initialized successfully');
    } else {
        console.log('Search input not found during setup');
    }
}

function autoResizeTextarea() {
    messageInput.style.height = 'auto';
    messageInput.style.height = Math.min(messageInput.scrollHeight, 200) + 'px';
}


function createNewChat() {
    const chatId = Date.now().toString();
    const newChat = {
        id: chatId,
        title: 'New chat',
        messages: [],
        createdAt: new Date().toISOString()
    };
    
    chats.unshift(newChat);
    currentChatId = chatId;
    
    updateChatHistory();
    clearChatContainer();
    saveChats();
    

    messageInput.focus();
}


function showWelcomeMessage() {
    clearChatContainer();
    currentChatId = null;
    saveChats();
}


async function sendMessage() {
    const message = messageInput.value.trim();
    if (!message || isTyping) return;


    if (!currentChatId) {
        createNewChat();
    }

    const currentChat = chats.find(chat => chat.id === currentChatId);
    if (!currentChat) return;

    addMessageToChat('user', message);
    messageInput.value = '';
    autoResizeTextarea();

    showTypingIndicator();
    isTyping = true;

    setTimeout(() => {
        hideTypingIndicator();
        const aiResponse = generateAIResponse(message);
        addMessageToChat('assistant', aiResponse);
        isTyping = false;
        
      
        if (currentChat.messages.length === 2) {
            updateChatTitle(message);
        }
    }, 1000 + Math.random() * 2000);
}


function addMessageToChat(role, content) {
    const currentChat = chats.find(chat => chat.id === currentChatId);
    if (!currentChat) return;

    const message = {
        id: Date.now().toString(),
        role: role,
        content: content,
        timestamp: new Date().toISOString()
    };

    currentChat.messages.push(message);
    displayMessage(message);
    saveChats();
    

    welcomeMessage.style.display = 'none';
    chatContainer.classList.add('has-messages');
}


function displayMessage(message) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${message.role}`;
    messageDiv.innerHTML = `
        <div class="message-avatar">
            ${message.role === 'user' ? 'U' : 'A'}
        </div>
        <div class="message-content">
            <div class="message-text">${escapeHtml(message.content)}</div>
        </div>
    `;
    
    chatContainer.appendChild(messageDiv);
    scrollToBottom();
}


function showTypingIndicator() {
    const typingDiv = document.createElement('div');
    typingDiv.className = 'message assistant typing-message';
    typingDiv.id = 'typingIndicator';
    typingDiv.innerHTML = `
        <div class="message-avatar">A</div>
        <div class="message-content">
            <div class="typing-indicator">
                <div class="typing-dot"></div>
                <div class="typing-dot"></div>
                <div class="typing-dot"></div>
            </div>
        </div>
    `;
    
    chatContainer.appendChild(typingDiv);
    scrollToBottom();
}

function hideTypingIndicator() {
    const typingIndicator = document.getElementById('typingIndicator');
    if (typingIndicator) {
        typingIndicator.remove();
    }
}


function updateChatTitle(firstMessage) {
    const currentChat = chats.find(chat => chat.id === currentChatId);
    if (!currentChat) return;

 
    const words = firstMessage.split(' ').slice(0, 6);
    const title = words.join(' ') + (firstMessage.split(' ').length > 6 ? '...' : '');
    
    currentChat.title = title;
    updateChatHistory();
    saveChats();
}

function loadChat(chatId) {
    const chat = chats.find(c => c.id === chatId);
    if (!chat) return;

    currentChatId = chatId;
    clearChatContainer();
    

    chat.messages.forEach(message => {
        displayMessage(message);
    });
    
   
    updateActiveChatInSidebar();
    
    
    if (chat.messages.length > 0) {
        welcomeMessage.style.display = 'none';
        chatContainer.classList.add('has-messages');
    } else {
        welcomeMessage.style.display = 'flex';
        chatContainer.classList.remove('has-messages');
    }
}

function showWelcomeScreen() {
    currentChatId = null;
    clearChatContainer();
    updateActiveChatInSidebar();
    saveChats();
}


function filterChatHistory() {
    const chatItems = document.querySelectorAll('.chat-history-item');
    console.log('Found chat items:', chatItems.length, 'Search query:', searchQuery); 
    let visibleCount = 0;
    
    chatItems.forEach(item => {
        const titleSpan = item.querySelector('.chat-title');
        if (titleSpan) {
            const title = titleSpan.textContent.toLowerCase();
            
            if (searchQuery === '' || title.includes(searchQuery)) {
                item.style.display = 'flex';
                visibleCount++;
            } else {
                item.style.display = 'none';
            }
        }
    });
    
    console.log('Visible chats:', visibleCount); 
    

    const noResultsMsg = document.querySelector('.no-results');
    if (searchQuery && visibleCount === 0) {
        if (!noResultsMsg) {
            const msg = document.createElement('div');
            msg.className = 'no-results';
            msg.textContent = 'No chats found matching "' + searchQuery + '"';
            msg.style.cssText = `
                padding: 12px;
                text-align: center;
                color: #6b7280;
                font-size: 14px;
                font-style: italic;
            `;
            chatHistory.appendChild(msg);
        }
    } else if (noResultsMsg) {
        noResultsMsg.remove();
    }
}


function updateChatHistory() {
    chatHistory.innerHTML = '<div class="history-header">Chats</div>';
    
    chats.forEach(chat => {
        const chatItem = document.createElement('div');
        chatItem.className = 'chat-history-item';
        chatItem.dataset.chatId = chat.id;
        chatItem.innerHTML = `
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M20 2H4c-1.1 0-1.99.9-1.99 2L2 22l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-2 12H6v-2h12v2zm0-3H6V9h12v2zm0-3H6V6h12v2z" fill="currentColor"/>
            </svg>
            <span class="chat-title">${escapeHtml(chat.title)}</span>
            <button class="edit-btn" onclick="editChatTitle('${chat.id}')">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z" fill="currentColor"/>
                </svg>
            </button>
            <button class="delete-btn" onclick="deleteChat('${chat.id}')">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z" fill="currentColor"/>
                </svg>
            </button>
        `;
        
        chatItem.addEventListener('click', (e) => {
            if (!e.target.closest('.edit-btn') && !e.target.closest('.delete-btn')) {
                loadChat(chat.id);
            }
        });
        chatHistory.appendChild(chatItem);
    });
    
    updateActiveChatInSidebar();
    filterChatHistory();
}


function updateActiveChatInSidebar() {
    document.querySelectorAll('.chat-history-item').forEach(item => {
        item.classList.remove('active');
        if (item.dataset.chatId === currentChatId) {
            item.classList.add('active');
        }
    });
}


function clearChatContainer() {
    chatContainer.innerHTML = '';
    welcomeMessage.style.display = 'flex';
    chatContainer.classList.remove('has-messages');
}


function toggleSidebar() {
    sidebar.classList.toggle('open');
}


function scrollToBottom() {
    chatContainer.scrollTop = chatContainer.scrollHeight;
}


function saveChats() {
    localStorage.setItem('chatbot_chats', JSON.stringify(chats));
    localStorage.setItem('chatbot_current_chat', currentChatId);
}


function loadChats() {
    const savedChats = localStorage.getItem('chatbot_chats');
    const savedCurrentChat = localStorage.getItem('chatbot_current_chat');
    
    if (savedChats) {
        chats = JSON.parse(savedChats);
    }
    
    if (savedCurrentChat && chats.find(c => c.id === savedCurrentChat)) {
        currentChatId = savedCurrentChat;
        loadChat(currentChatId);
    }
    
    updateChatHistory();
}


function generateAIResponse(userMessage) {
    const responses = [
        "I understand you're asking about that. Let me help you with that.",
        "That's an interesting question! Here's what I can tell you about it.",
        "I'd be happy to help you with that. Let me provide some information.",
        "Great question! Let me break this down for you.",
        "I can help you with that. Here's what you need to know.",
        "That's a good point. Let me explain this in detail.",
        "I understand what you're looking for. Here's my response.",
        "Thanks for asking! Here's what I can share about that topic."
    ];
    
    // Simple keyword-based responses
    if (userMessage.toLowerCase().includes('hello') || userMessage.toLowerCase().includes('hi')) {
        return "Hello! How can I help you today?";
    }
    
    if (userMessage.toLowerCase().includes('thank')) {
        return "You're welcome! Is there anything else I can help you with?";
    }
    
    if (userMessage.toLowerCase().includes('story') || userMessage.toLowerCase().includes('creative')) {
        return "I'd be happy to help you write a creative story! What kind of story would you like to create? What genre or theme interests you?";
    }
    
    if (userMessage.toLowerCase().includes('code') || userMessage.toLowerCase().includes('debug')) {
        return "I can help you with coding and debugging! What programming language are you working with, and what specific issue are you facing?";
    }
    
    if (userMessage.toLowerCase().includes('explain') || userMessage.toLowerCase().includes('concept')) {
        return "I'd be glad to explain that concept for you! Could you provide more details about what specifically you'd like me to explain?";
    }
    
    if (userMessage.toLowerCase().includes('poem')) {
        return "I'd love to help you write a poem! What style or theme would you like? Are you thinking of a specific type of poem like a haiku, sonnet, or free verse?";
    }
    

    return responses[Math.floor(Math.random() * responses.length)] + " " + 
           "This is a simulated response from BioMindGPT. In a real implementation, you would connect this to an actual AI API.";
}


function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}


window.addEventListener('resize', function() {
    if (window.innerWidth > 768) {
        sidebar.classList.remove('open');
    }
});


document.addEventListener('click', function(e) {
    if (window.innerWidth <= 768) {
        if (!sidebar.contains(e.target) && !menuBtn.contains(e.target)) {
            sidebar.classList.remove('open');
        }
    }
}); 


function editChatTitle(chatId) {
    const chat = chats.find(c => c.id === chatId);
    if (!chat) return;

    const chatItem = document.querySelector(`[data-chat-id="${chatId}"]`);
    const titleSpan = chatItem.querySelector('.chat-title');
    const currentTitle = titleSpan.textContent;
    
 
    const input = document.createElement('input');
    input.type = 'text';
    input.value = currentTitle;
    input.className = 'title-edit-input';
    input.style.cssText = `
        background: #ffffff;
        border: 2px solid #667eea;
        border-radius: 4px;
        padding: 4px 8px;
        font-size: 14px;
        color: #1a1a1a;
        outline: none;
        width: 100%;
        max-width: 150px;
    `;
    
 
    titleSpan.style.display = 'none';
    titleSpan.parentNode.insertBefore(input, titleSpan);
    input.focus();
    input.select();
    
 
    function saveTitle() {
        const newTitle = input.value.trim() || 'Untitled';
        chat.title = newTitle;
        titleSpan.textContent = newTitle;
        titleSpan.style.display = 'inline';
        
    
        if (input && input.parentNode) {
            input.remove();
        }
        saveChats();
    }

    function cancelEdit() {
        titleSpan.style.display = 'inline';
        
 
        if (input && input.parentNode) {
            input.remove();
        }
    }
    
    input.addEventListener('blur', saveTitle);
    input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            saveTitle();
        } else if (e.key === 'Escape') {
            cancelEdit();
        }
    });
} 


function deleteChat(chatId) {
    const chat = chats.find(c => c.id === chatId);
    if (!chat) return;

   
    const confirmed = confirm(`Are you sure you want to delete "${chat.title}"? This action cannot be undone.`);
    
    if (confirmed) {
  
        chats = chats.filter(c => c.id !== chatId);
        
   
        if (currentChatId === chatId) {
            if (chats.length > 0) {
                currentChatId = chats[0].id;
                loadChat(currentChatId);
            } else {
                createNewChat();
            }
        }
        
        updateChatHistory();
        saveChats();
        
        console.log(`Chat "${chat.title}" deleted successfully`);
    }
} 