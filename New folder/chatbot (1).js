  const chatBox = document.getElementById("chatBox");
  const chatInput = document.getElementById("chatInput");
  const sendBtn = document.getElementById("sendBtn");
  const newChatBtn = document.getElementById("newChatBtn");
  const chatHistory = document.getElementById("chatHistory");
  const sidebar = document.getElementById("sidebar");
  const sidebarToggle = document.getElementById("sidebarToggle");
  const toggleSidebarBtn = document.getElementById("toggleSidebarBtn");
  const imageInput = document.getElementById("imageInput");
  const fileInput = document.getElementById("fileInput");
  const previewArea = document.getElementById("previewArea");
  const scrollToBottomBtn = document.getElementById("scrollToBottomBtn");
  const darkModeToggle = document.getElementById("darkModeToggle");
  const clearChatsBtn = document.getElementById("clearChatsBtn");
  const imageBtn = document.getElementById("imageBtn");
  const fileBtn = document.getElementById("fileBtn");
  const micBtn = document.getElementById("micBtn");
  const messageContainer = document.getElementById("messageContainer");
  const inputBox = document.getElementById("inputBox");

  // State variables
  let isWaitingForResponse = false;
  let currentChatId = Date.now();
  let chatSessions = [];
  let messageHistory = [];
  let darkMode = false;
  const BACKEND_URL = "http://192.168.2.134:8001"; 
  // Voice recognition variables
  let recognition = null;
  let isRecording = false;
  let recordingIndicator = null;
  let recognitionTimeout = null;

  // Sample chat history data - Updated for hospital care
  let sampleChats = [
    { id: 1, title: "Anemia risk assessment" },
    { id: 2, title: "Lab test results: Hemoglobin 11.2" },
    { id: 3, title: "Schedule appointment with Dr. Smith" },
    { id: 4, title: "Iron supplement reminders" },
    { id: 5, title: "Fatigue and dizziness symptoms" }
  ];


  

  // Initialize the app
  function init() {
    loadChatHistory();
    setupEventListeners();
    autoResizeTextarea();
    checkScrollPosition();
    updateSidebarState();
    loadInitialMessages();
    initVoiceRecognition();
    
    // Check for saved dark mode preference
    const savedDarkMode = localStorage.getItem('darkMode');
    if (savedDarkMode !== null) {
      darkMode = savedDarkMode === 'true';
    } else {
      darkMode = false; // Default to light mode
    }
    
    // Apply dark mode setting
    if (darkMode) {
      document.body.classList.remove('light-mode');
    } else {
      document.body.classList.add('light-mode');
    }
    
    updateDarkModeButton();
  }

  // Load initial welcome messages - UPDATED with new hospital care text
  function loadInitialMessages() {
    const welcomeMessage = "👋 Hello! I'm MEDIMETA-AI, your intelligent hospital care assistant.\n\nI can help you with:\n\n• 🩸 Anemia risk assessment & symptom guidance\n• 📋 Lab test reports (Hemoglobin, RBC, Iron levels)\n• 🏥 Appointment scheduling & doctor availability\n• 💊 Treatment plans & medication reminders\n• 📊 Health monitoring & recovery tracking\n• ⚠️ Emergency symptom guidance\n\nHow can I assist you with your healthcare needs today?";
    appendMessage(welcomeMessage, 'text', false);
  }

  // Initialize voice recognition
  function initVoiceRecognition() {
    // Check if browser supports webkitSpeechRecognition
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      recognition = new SpeechRecognition();
      
      // Configure recognition
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = 'en-US';
      recognition.maxAlternatives = 1;
      
      // Event handlers
      recognition.onstart = handleRecognitionStart;
      recognition.onend = handleRecognitionEnd;
      recognition.onerror = handleRecognitionError;
      recognition.onresult = handleRecognitionResult;
    } else {
      console.log('Voice recognition not supported in this browser');
      // Disable mic button if not supported
      if (micBtn) {
        micBtn.title = 'Voice input not supported in this browser';
        micBtn.style.opacity = '0.5';
        micBtn.style.cursor = 'not-allowed';
      }
    }
  }

  // Handle recognition start
  function handleRecognitionStart() {
    isRecording = true;
    micBtn.classList.add('recording');
    inputBox.classList.add('recording');
    
    // Show recording indicator
    showRecordingIndicator();
    
    // Clear any existing timeout
    if (recognitionTimeout) {
      clearTimeout(recognitionTimeout);
    }
    
    // Auto-stop after 10 seconds of silence
    recognitionTimeout = setTimeout(() => {
      if (isRecording) {
        stopRecording();
      }
    }, 10000);
  }

  // Handle recognition end
  function handleRecognitionEnd() {
    isRecording = false;
    micBtn.classList.remove('recording');
    inputBox.classList.remove('recording');
    
    // Remove recording indicator
    if (recordingIndicator) {
      recordingIndicator.remove();
      recordingIndicator = null;
    }
    
    // Clear timeout
    if (recognitionTimeout) {
      clearTimeout(recognitionTimeout);
      recognitionTimeout = null;
    }
  }

  // Handle recognition error
  function handleRecognitionError(event) {
    console.error('Recognition error:', event.error);
    
    let errorMessage = '';
    switch(event.error) {
      case 'no-speech':
        errorMessage = 'No speech detected. Please try again.';
        break;
      case 'audio-capture':
        errorMessage = 'No microphone found. Please check your microphone.';
        break;
      case 'not-allowed':
        errorMessage = 'Microphone access denied. Please allow microphone access.';
        break;
      case 'network':
        errorMessage = 'Network error. Please check your connection.';
        break;
      default:
        errorMessage = `Voice recognition error: ${event.error}`;
    }
    
    // Show error message
    appendMessage(`🎤 ${errorMessage}`, 'text', false);
    
    stopRecording();
  }

  // Handle recognition result
  function handleRecognitionResult(event) {
    const lastResult = event.results[event.results.length - 1];
    const transcript = lastResult[0].transcript;
    
    if (lastResult.isFinal) {
      // Final transcript - set to input and send
      chatInput.value = transcript;
      chatInput.style.height = "auto";
      chatInput.style.height = (chatInput.scrollHeight) + "px";
      
      // Stop recording
      stopRecording();
      
      // Auto-send after a short delay
      setTimeout(() => {
        sendMessage();
      }, 500);
    } else {
      // Interim results - update input with transcription
      chatInput.value = transcript;
      chatInput.style.height = "auto";
      chatInput.style.height = (chatInput.scrollHeight) + "px";
      
      // Update recording indicator with live transcription
      updateRecordingIndicator(transcript);
    }
  }

  // Show recording indicator
  function showRecordingIndicator() {
    if (recordingIndicator) {
      recordingIndicator.remove();
    }
    
    recordingIndicator = document.createElement('div');
    recordingIndicator.className = 'recording-indicator';
    recordingIndicator.innerHTML = `
      <span class="dot"></span>
      <span>Listening...</span>
      <div class="voice-wave">
        <span></span><span></span><span></span><span></span><span></span>
      </div>
      <button onclick="stopRecording()" style="background: none; border: none; color: white; margin-left: 8px; cursor: pointer;">
        <i class="fas fa-times"></i>
      </button>
    `;
    
    inputBox.appendChild(recordingIndicator);
  }

  // Update recording indicator with live transcription
  function updateRecordingIndicator(transcript) {
    if (recordingIndicator) {
      const textSpan = recordingIndicator.querySelector('span:nth-child(2)');
      if (textSpan && transcript) {
        textSpan.textContent = transcript.length > 20 ? transcript.substring(0, 20) + '...' : transcript;
      }
    }
  }

  // Start recording
  function startRecording() {
    if (!recognition) {
      appendMessage("🎤 Voice recognition is not supported in your browser. Please use Chrome, Edge, or Safari.", 'text', false);
      return;
    }
    
    if (isRecording) {
      stopRecording();
      return;
    }
    
    try {
      recognition.start();
    } catch (error) {
      console.error('Failed to start recognition:', error);
      appendMessage("🎤 Failed to start voice recording. Please try again.", 'text', false);
    }
  }

  // Stop recording
  window.stopRecording = function() {
    if (recognition && isRecording) {
      recognition.stop();
    }
  };

  // Load sample chat history
  function loadChatHistory() {
    chatHistory.innerHTML = '';
    
    // Load from localStorage if available
    const savedChats = localStorage.getItem('chatHistory');
    if (savedChats) {
      try {
        chatSessions = JSON.parse(savedChats);
      } catch (e) {
        chatSessions = [...sampleChats];
      }
    } else {
      chatSessions = [...sampleChats];
    }
    
    chatSessions.forEach(chat => {
      addChatToHistory(chat.title, chat.id);
    });
  }

  // Add chat to history
  function addChatToHistory(title, id = Date.now()) {
    const chatItem = document.createElement("button");
    chatItem.className = "history-item";
    chatItem.dataset.id = id;
    chatItem.innerHTML = `
      <i class="fas fa-comment-alt"></i>
      <span>${title.length > 30 ? title.substring(0, 30) + "..." : title}</span>
    `;
    chatItem.addEventListener("click", () => loadChat(title));
    chatHistory.appendChild(chatItem);
  }

  // Set up event listeners
  function setupEventListeners() {
    sendBtn.addEventListener("click", sendMessage);
    
    chatInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
      }
    });
    
    newChatBtn.addEventListener("click", startNewChat);
    sidebarToggle.addEventListener("click", toggleSidebar);
    toggleSidebarBtn.addEventListener("click", toggleSidebarCollapse);
    
    imageBtn.addEventListener("click", () => imageInput.click());
    fileBtn.addEventListener("click", () => fileInput.click());
    micBtn.addEventListener("click", startRecording);
    
    imageInput.addEventListener("change", handleImageUpload);
    fileInput.addEventListener("change", handleFileUpload);
    
    chatBox.addEventListener("scroll", checkScrollPosition);
    scrollToBottomBtn.addEventListener("click", scrollToBottom);
    
    darkModeToggle.addEventListener("click", toggleDarkMode);
    
    if (clearChatsBtn) {
      clearChatsBtn.addEventListener("click", clearAllChats);
    }
    
    // Account button
    const accountBtn = document.getElementById("accountBtn");
    if (accountBtn) {
      accountBtn.addEventListener("click", () => {
        appendMessage("👤 Account settings would open here. This is a demo version.", 'text', false);
      });
    }
  }

  // Toggle dark mode
  function toggleDarkMode() {
    darkMode = !darkMode;
    if (darkMode) {
      document.body.classList.remove('light-mode');
    } else {
      document.body.classList.add('light-mode');
    }
    
    updateDarkModeButton();
    
    // Save preference
    localStorage.setItem('darkMode', darkMode);
  }

  // Update dark mode button text and icon
  function updateDarkModeButton() {
    const icon = darkModeToggle.querySelector('i');
    const span = darkModeToggle.querySelector('span');
    
    if (darkMode) {
      icon.className = 'fas fa-sun';
      span.textContent = 'Light mode';
    } else {
      icon.className = 'fas fa-moon';
      span.textContent = 'Dark mode';
    }
  }

  // Clear all chats
  function clearAllChats() {
    if (confirm('Are you sure you want to clear all conversations?')) {
      localStorage.removeItem('chatHistory');
      chatSessions = [];
      chatHistory.innerHTML = '';
      startNewChat();
    }
  }

  // Toggle sidebar for mobile
  function toggleSidebar() {
    sidebar.classList.toggle("open");
  }

  // Toggle sidebar collapse/expand
  function toggleSidebarCollapse() {
    sidebar.classList.toggle("collapsed");
    const isCollapsed = sidebar.classList.contains("collapsed");
    toggleSidebarBtn.innerHTML = isCollapsed 
      ? '<i class="fas fa-chevron-right"></i><span>Expand sidebar</span>'
      : '<i class="fas fa-chevron-left"></i><span>Collapse sidebar</span>';
  }

  // Update sidebar state based on window size
  function updateSidebarState() {
    if (window.innerWidth <= 1200) {
      sidebar.classList.remove("collapsed");
      sidebar.classList.remove("open");
    }
  }

  // Auto-resize textarea
  function autoResizeTextarea() {
    chatInput.addEventListener("input", function() {
      this.style.height = "auto";
      this.style.height = (this.scrollHeight) + "px";
    });
  }

  // Send message function
  function sendMessage() {
    if (isWaitingForResponse) return;
    
    const message = chatInput.value.trim();
    const previewItems = previewArea.querySelectorAll(".preview-item");
    
    if (message || previewItems.length > 0) {
      // Add user message
      if (message) {
        appendMessage(message, 'text', true);
        messageHistory.push({ role: 'user', content: message, type: 'text' });
      }
      
      // Add any attachments
      previewItems.forEach(item => {
        const type = item.dataset.type;
        const src = item.querySelector("img, video")?.src || "";
        const previewDiv = item.querySelector(".preview-filename") || item.querySelector("span");
        const filename = previewDiv ? previewDiv.textContent : "file";
        appendMessage(filename, type, true, src);
        messageHistory.push({ role: 'user', content: filename, type: type, src: src });
      });
      
      // Clear input and preview
      chatInput.value = '';
      chatInput.style.height = "auto";
      previewArea.innerHTML = '';
      
      // Process with AI
      processWithAI(message || "Media message");
    }
  }

  // Process message with AI - Updated for hospital care
  // ===== REAL AI PROCESSING (FASTAPI + GEMINI + RAG) =====
async function processWithAI(userMessage) {
  if (isWaitingForResponse) return;

  isWaitingForResponse = true;
  sendBtn.innerHTML = '<div class="spinner"></div>';
  sendBtn.disabled = true;

  const typingDiv = showTypingIndicator();

  try {
    // Check if JSON report uploaded
    if (!patientReportLoaded) {
      removeTypingIndicator(typingDiv);
      appendMessage(
        "⚠️ Please upload your medical JSON report first using the file button 📎",
        'text',
        false
      );
      isWaitingForResponse = false;
      sendBtn.innerHTML = '<i class="fas fa-paper-plane"></i>';
      sendBtn.disabled = false;
      return;
    }

    // Call backend chatbot endpoint
    const response = await fetch(`${BACKEND_URL}/chat`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        message: userMessage
      })
    });

    const data = await response.json();

    removeTypingIndicator(typingDiv);

    if (data.status === "success") {
      appendMessage(data.reply, 'text', false);
      messageHistory.push({ role: 'assistant', content: data.reply, type: 'text' });

      // Save chat title (first user message)
      if (messageHistory.length <= 2) {
        saveToChatHistory(userMessage);
      }
    } else {
      appendMessage("⚠️ " + (data.reply || data.message), 'text', false);
    }

  } catch (error) {
    console.error("Backend Error:", error);
    removeTypingIndicator(typingDiv);
    appendMessage(
      "❌ Cannot connect to AI server. Make sure FastAPI is running on port 8000.",
      'text',
      false
    );
  }

  isWaitingForResponse = false;
  sendBtn.innerHTML = '<i class="fas fa-paper-plane"></i>';
  sendBtn.disabled = false;
}


  // Get random response from category
  function getRandomResponse(category) {
    const responses = aiResponses[category] || aiResponses.general;
    return responses[Math.floor(Math.random() * responses.length)];
  }

  // Append message to chat
  function appendMessage(content, type = 'text', isUser = false, src = '') {
    const messageDiv = document.createElement("div");
    messageDiv.className = `chat-message ${isUser ? 'user-message' : 'bot-message'}`;
    
    // Create avatar
    const avatarDiv = document.createElement("div");
    avatarDiv.className = `avatar ${isUser ? 'user-avatar' : 'bot-avatar'}`;
    avatarDiv.innerHTML = isUser ? '<i class="fas fa-user"></i>' : '<i class="fas fa-robot"></i>';
    
    // Create message content
    const contentDiv = document.createElement("div");
    contentDiv.className = "message-content";
    
    if (type === 'text') {
      // Simple markdown parsing
      let formattedContent = content
        .replace(/```([\s\S]*?)```/g, '<pre><code>$1</code></pre>')
        .replace(/`([^`]+)`/g, '<code>$1</code>')
        .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
        .replace(/\*([^*]+)\*/g, '<em>$1</em>')
        .replace(/•/g, '•'); // Keep bullet points
      
      // Split by newlines and wrap in paragraphs
      const paragraphs = formattedContent.split('\n');
      let htmlContent = '';
      
      for (let para of paragraphs) {
        if (para.trim()) {
          if (para.startsWith('•') || para.startsWith('-')) {
            htmlContent += `<p style="margin-left: 20px;">${para}</p>`;
          } else if (para.includes('**') || para.includes('*')) {
            htmlContent += `<p>${para}</p>`;
          } else {
            htmlContent += `<p>${para}</p>`;
          }
        }
      }
      
      contentDiv.innerHTML = htmlContent;
    } 
    else if (type === 'image') {
      const imgContainer = document.createElement("div");
      imgContainer.style.position = "relative";
      imgContainer.style.display = "inline-block";
      
      const img = document.createElement("img");
      img.src = src || content;
      img.className = "preview-img";
      img.alt = "Attached image";
      
      imgContainer.appendChild(img);
      contentDiv.appendChild(imgContainer);
    } 
    else if (type === 'video') {
      const videoContainer = document.createElement("div");
      
      const video = document.createElement("video");
      video.src = src || content;
      video.controls = true;
      video.style.maxWidth = "100%";
      video.style.maxHeight = "300px";
      video.style.borderRadius = "8px";
      
      videoContainer.appendChild(video);
      contentDiv.appendChild(videoContainer);
    }
    else if (type === 'file') {
      const fileLink = document.createElement("a");
      fileLink.href = src || '#';
      fileLink.textContent = `📎 Download ${content}`;
      fileLink.download = content;
      fileLink.className = "file-download";
      
      fileLink.addEventListener('mouseenter', () => {
        fileLink.style.backgroundColor = "var(--hover-bg)";
      });
      
      fileLink.addEventListener('mouseleave', () => {
        fileLink.style.backgroundColor = "var(--code-bg)";
      });
      
      contentDiv.appendChild(fileLink);
    }
    
    // Create message actions for bot messages
    if (!isUser) {
      const actionsDiv = document.createElement("div");
      actionsDiv.className = "message-actions";
      actionsDiv.innerHTML = `
        <button class="action-btn" onclick="copyToClipboard(this)"><i class="far fa-copy"></i> Copy</button>
        <button class="action-btn" onclick="likeMessage(this)"><i class="far fa-thumbs-up"></i> Like</button>
        <button class="action-btn" onclick="dislikeMessage(this)"><i class="far fa-thumbs-down"></i> Dislike</button>
      `;
      contentDiv.appendChild(actionsDiv);
    }
    
    // Assemble message
    messageDiv.appendChild(avatarDiv);
    messageDiv.appendChild(contentDiv);
    messageContainer.appendChild(messageDiv);
    
    // Scroll to bottom
    scrollToBottom();
  }

  // Copy message to clipboard
  window.copyToClipboard = function(button) {
    const messageContent = button.closest('.message-content').cloneNode(true);
    const actions = messageContent.querySelector('.message-actions');
    if (actions) actions.remove();
    
    const textToCopy = messageContent.textContent || messageContent.innerText;
    
    navigator.clipboard.writeText(textToCopy).then(() => {
      const originalHTML = button.innerHTML;
      button.innerHTML = '<i class="fas fa-check"></i> Copied!';
      button.disabled = true;
      
      setTimeout(() => {
        button.innerHTML = originalHTML;
        button.disabled = false;
      }, 2000);
    }).catch(err => {
      console.error('Failed to copy: ', err);
      alert('Failed to copy text');
    });
  };

  // Like message
  window.likeMessage = function(button) {
    const icon = button.querySelector('i');
    icon.className = 'fas fa-thumbs-up';
    button.style.color = '#10a37f';
    
    // Disable all action buttons in this group
    const actions = button.closest('.message-actions');
    const buttons = actions.querySelectorAll('button');
    buttons.forEach(btn => {
      btn.disabled = true;
    });
    
    // Show feedback
    const messageContent = button.closest('.message-content');
    const feedbackDiv = document.createElement('div');
    feedbackDiv.style.marginTop = '8px';
    feedbackDiv.style.fontSize = '12px';
    feedbackDiv.style.color = '#10a37f';
    feedbackDiv.innerHTML = 'Thanks for your feedback! 👍';
    messageContent.appendChild(feedbackDiv);
  };

  // Dislike message
  window.dislikeMessage = function(button) {
    const icon = button.querySelector('i');
    icon.className = 'fas fa-thumbs-down';
    button.style.color = '#ef4444';
    
    // Disable all action buttons in this group
    const actions = button.closest('.message-actions');
    const buttons = actions.querySelectorAll('button');
    buttons.forEach(btn => {
      btn.disabled = true;
    });
    
    // Show feedback input
    const messageContent = button.closest('.message-content');
    const feedbackDiv = document.createElement('div');
    feedbackDiv.style.marginTop = '8px';
    feedbackDiv.innerHTML = `
      <div style="display: flex; gap: 8px;">
        <input type="text" placeholder="Tell us how to improve..." 
               style="flex: 1; padding: 8px; border-radius: 4px; 
                      border: 1px solid var(--border-color); 
                      background: var(--input-bg); color: var(--text-color);">
        <button onclick="submitFeedback(this)" 
                style="padding: 8px 12px; background: var(--primary-color); 
                       color: white; border: none; border-radius: 4px; cursor: pointer;">
          Submit
        </button>
      </div>
    `;
    messageContent.appendChild(feedbackDiv);
  };

  // Submit feedback
  window.submitFeedback = function(button) {
    const input = button.previousElementSibling;
    const feedback = input.value;
    
    if (feedback.trim()) {
      const feedbackDiv = button.closest('div[style*="margin-top"]');
      feedbackDiv.innerHTML = '<p style="color: #ef4444; margin: 0;">Thanks for your feedback! We\'ll improve. 👎</p>';
      
      setTimeout(() => {
        if (feedbackDiv.parentNode) {
          feedbackDiv.remove();
        }
      }, 3000);
    } else {
      input.placeholder = 'Please enter feedback';
      input.style.borderColor = '#ef4444';
    }
  };

  // Show typing indicator
  function showTypingIndicator() {
    const typingDiv = document.createElement("div");
    typingDiv.className = "chat-message bot-message typing-indicator-container";
    
    const avatarDiv = document.createElement("div");
    avatarDiv.className = "avatar bot-avatar";
    avatarDiv.innerHTML = '<i class="fas fa-robot"></i>';
    
    const contentDiv = document.createElement("div");
    contentDiv.className = "message-content";
    
    const typingIndicator = document.createElement("div");
    typingIndicator.className = "typing-indicator";
    typingIndicator.innerHTML = `
      <div class="typing-dot"></div>
      <div class="typing-dot"></div>
      <div class="typing-dot"></div>
    `;
    
    contentDiv.appendChild(typingIndicator);
    typingDiv.appendChild(avatarDiv);
    typingDiv.appendChild(contentDiv);
    messageContainer.appendChild(typingDiv);
    
    scrollToBottom();
    
    return typingDiv;
  }

  // Remove typing indicator
  function removeTypingIndicator(typingDiv) {
    if (typingDiv && typingDiv.parentNode) {
      typingDiv.parentNode.removeChild(typingDiv);
    }
  }

  // Handle image upload
  function handleImageUpload(e) {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert('File size too large. Please upload images under 5MB.');
        return;
      }
      
      if (!file.type.startsWith('image/')) {
        alert('Please upload an image file.');
        return;
      }
      
      const reader = new FileReader();
      reader.onload = function(event) {
        addPreviewItem(event.target.result, 'image', file.name);
      };
      reader.readAsDataURL(file);
    }
    e.target.value = '';
  }

  // Handle file upload
  // ===== JSON REPORT UPLOAD (ONLY ONCE) =====
async function handleFileUpload(e) {
  const file = e.target.files[0];
  if (!file) return;

  // Allow ONLY JSON medical report
  if (!file.name.endsWith(".json")) {
    appendMessage("⚠️ Please upload a valid JSON medical report file.", 'text', false);
    e.target.value = '';
    return;
  }

  try {
    const text = await file.text();
    const jsonData = JSON.parse(text);

    appendMessage("📄 Uploading medical report to AI...", 'text', false);

    // Send JSON to backend (INIT SESSION)
    const response = await fetch(`${BACKEND_URL}/init-session`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        patient_json: jsonData
      })
    });

    const result = await response.json();

    if (result.status === "success") {
      patientReportLoaded = true;
      appendMessage(
        "🩺 Patient report loaded successfully!\nYou can now ask about:\n• Diet plan\n• Lifestyle\n• Anemia risk\n• Medications\n• Do’s & Don’ts",
        'text',
        false
      );
    } else {
      appendMessage("❌ Failed to load medical report.", 'text', false);
    }

  } catch (err) {
    console.error("JSON Error:", err);
    appendMessage("❌ Invalid JSON file format. Please upload correct report JSON.", 'text', false);
  }

  e.target.value = '';
}

  // Add preview item
  function addPreviewItem(src, type, filename) {
    const previewItem = document.createElement("div");
    previewItem.className = "preview-item";
    previewItem.dataset.type = type;
    
    if (type === 'image') {
      previewItem.innerHTML = `
        <div style="position: relative; display: inline-block;">
          <img src="${src}" class="preview-img" alt="Preview">
          <button class="remove-preview" onclick="removePreview(this.parentNode.parentNode)">×</button>
          <div class="preview-filename">${filename}</div>
        </div>
      `;
    } else {
      previewItem.innerHTML = `
        <div style="display: flex; align-items: center; gap: 8px; padding: 8px 12px; 
                    background: var(--input-bg); border: 1px solid var(--border-color); 
                    border-radius: 8px; position: relative;">
          <i class="fas fa-file-alt" style="font-size: 20px; color: var(--text-secondary);"></i>
          <span style="flex: 1; color: var(--text-color); font-size: 14px;">${filename}</span>
          <button class="remove-preview" onclick="removePreview(this.parentNode.parentNode)">×</button>
        </div>
      `;
    }
    
    previewArea.appendChild(previewItem);
  }

  // Remove preview item
  window.removePreview = function(previewItem) {
    previewItem.remove();
  };

  // Start new chat
  function startNewChat() {
    chatInput.value = '';
    previewArea.innerHTML = '';
    messageContainer.innerHTML = '';
    messageHistory = [];
    
    loadInitialMessages();
    
    // Update current chat ID
    currentChatId = Date.now();
  }

  // Save to chat history
  function saveToChatHistory(firstMessage) {
    const chatExists = chatSessions.some(chat => chat.title === firstMessage);
    
    if (!chatExists && firstMessage) {
      const newChat = {
        id: currentChatId,
        title: firstMessage.length > 30 ? firstMessage.substring(0, 30) + "..." : firstMessage
      };
      
      chatSessions.unshift(newChat);
      if (chatSessions.length > 10) chatSessions.pop();
      
      // Save to localStorage
      localStorage.setItem('chatHistory', JSON.stringify(chatSessions));
      
      // Add to UI
      addChatToHistory(newChat.title, newChat.id);
    }
  }

  // Load chat from history
  function loadChat(topic) {
    startNewChat();
    chatInput.value = topic;
    chatInput.focus();
  }

  // Scroll to bottom
  function scrollToBottom() {
    chatBox.scrollTop = chatBox.scrollHeight;
  }

  // Check scroll position
  function checkScrollPosition() {
    const scrollThreshold = 100;
    const isNearBottom = chatBox.scrollHeight - chatBox.scrollTop - chatBox.clientHeight < scrollThreshold;
    
    if (isNearBottom) {
      scrollToBottomBtn.classList.remove("visible");
    } else {
      scrollToBottomBtn.classList.add("visible");
    }
  }

  // Initialize the app
  init();

  // Handle window resize
  window.addEventListener("resize", updateSidebarState);