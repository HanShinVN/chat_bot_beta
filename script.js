const chatBox = document.getElementById('chat-box');
const userInput = document.getElementById('user-input');
const sendButton = document.getElementById('send-button');
const toggleCheckbox = document.getElementById('mode-toggle-checkbox');
const logo = document.getElementById('logo');

let conversationHistory = [];

// ==== Load lịch sử nếu có ====
window.addEventListener('DOMContentLoaded', () => {
  const saved = localStorage.getItem('conversationHistory');
  if (saved) {
    conversationHistory = JSON.parse(saved);
    conversationHistory.forEach(item =>
      appendMessage(item.role, item.content)
    );
  }

  logo.src = document.body.classList.contains('dark-mode') ? 'data/logo1.png' : 'data/logo1.png';
});

// ==== Dark / Light mode toggle ====
toggleCheckbox.addEventListener("change", () => {
  document.body.classList.toggle("dark-mode");
  logo.src = document.body.classList.contains("dark-mode") ? "data/logo1.png" : "data/logo1.png";
});

// ==== Gửi tin nhắn ====
sendButton.addEventListener('click', sendMessage);
userInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') sendMessage();
});

function sendMessage() {
  const message = userInput.value.trim();
  if (!message) return;

  appendMessage('user', message);
  conversationHistory.push({ role: 'user', content: message });
  localStorage.setItem('conversationHistory', JSON.stringify(conversationHistory));
  userInput.value = '';

  getResponseFromOllama(message);
}

// ==== Hiển thị tin nhắn ====
function appendMessage(role, text) {
  const wrapper = document.createElement('div');
  wrapper.classList.add('message-wrapper');

  if (role === 'bot') {
    const logoImg = document.createElement('img');
    logoImg.src = 'data/bot.png';
    logoImg.alt = 'Bot Logo';
    logoImg.classList.add('bot-logo');
    wrapper.appendChild(logoImg);
  }

  const msg = document.createElement('div');
  msg.classList.add('message', role);
  msg.innerHTML = formatText(text);
  wrapper.appendChild(msg);
  chatBox.appendChild(wrapper);
  chatBox.scrollTop = chatBox.scrollHeight;



    // Nút xoá từng tin nhắn
    const deleteBtn = document.createElement('button');
    deleteBtn.innerHTML = '❌';
    deleteBtn.style.marginLeft = '10px';
    deleteBtn.style.cursor = 'pointer';
    deleteBtn.addEventListener('click', () => {
      wrapper.remove();
      conversationHistory = conversationHistory.filter(item => item.content !== text);
      localStorage.setItem('conversationHistory', JSON.stringify(conversationHistory));
    });

    msg.appendChild(deleteBtn);
    wrapper.appendChild(msg);
    chatBox.appendChild(wrapper);
    chatBox.scrollTop = chatBox.scrollHeight;
  }

  // Xoá toàn bộ lịch sử
  const clearAllBtn = document.createElement('button');
  clearAllBtn.textContent = '🗑️ Xóa tất cả';
  clearAllBtn.style.margin = '100px';
  clearAllBtn.addEventListener('click', () => {
    chatBox.innerHTML = '';
    conversationHistory = [];
    localStorage.removeItem('conversationHistory');
  });
  document.querySelector('.chat-header').appendChild(clearAllBtn);




// ==== Format văn bản đẹp ====
function formatText(text) {
  const lines = text.trim().split('\n');
  const numberedLines = lines.filter(line => /^\d+\.\s+/.test(line));
  if (numberedLines.length >= 2) {
    const listItems = lines.map(line => {
      const match = line.match(/^\d+\.\s+(.*)/);
      return match ? `<li>${match[1].trim()}</li>` : `<br>${line}`;
    });
    return `<ol>${listItems.join('')}</ol>`;
  }
  return text
    .replace(/([.!?])\s*/g, '$1<br><br>')
    .replace(/\n/g, '<br>');
}

// ==== Gọi tới server AI qua proxy ====
async function getResponseFromOllama(message) {
  chatBox.querySelectorAll('.bot').forEach(e => e.parentElement.remove());

  const wrapper = document.createElement('div');
  wrapper.classList.add('message-wrapper');

  const logoImg = document.createElement('img');
  logoImg.src = 'data/bot.png';
  logoImg.alt = 'Bot Logo';
  logoImg.classList.add('bot-logo');
  wrapper.appendChild(logoImg);

  const msg = document.createElement('div');
  msg.classList.add('message', 'bot');
  msg.innerHTML = '';
  wrapper.appendChild(msg);
  chatBox.appendChild(wrapper);
  chatBox.scrollTop = chatBox.scrollHeight;

  try {
    const response = await fetch('http://localhost:11434/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: "llama3.2",
        messages: conversationHistory,
        stream: true
      })
    });
    

    const reader = response.body.getReader();
    const decoder = new TextDecoder('utf-8');
    let fullReply = '';

    while (true) {
      const { value, done } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value, { stream: true });
      const lines = chunk.split('\n').filter(line => line.trim() !== '');

      for (const line of lines) {
        const data = JSON.parse(line);
        const content = data?.message?.content || '';
        fullReply += content;
        msg.innerHTML = formatText(fullReply);
        chatBox.scrollTop = chatBox.scrollHeight;
      }
    }

    if (fullReply.trim()) {
      conversationHistory.push({ role: "assistant", content: fullReply.trim() });
      localStorage.setItem('conversationHistory', JSON.stringify(conversationHistory));
    } else {
      msg.innerHTML = '⚠️ SERVER KHÔNG PHẢN HỒI.';
    }

  } catch (error) {
    msg.innerHTML = '⚠️ SERVER LỖI HOẶC KHÔNG KẾT NỐI.';
  }
}

// ==== Phát hiện DevTools ====
(function detectDevToolsImmediate() {
  let shown = false;

  const check = () => {
    const start = performance.now();
    debugger;
    const end = performance.now();

    if (end - start > 50 && !shown) {
      shown = true;
      showDonationBanner();
    }

    requestAnimationFrame(check);
  };

  requestAnimationFrame(check);
})();

// ==== Load lịch sử nếu có ====
window.addEventListener('DOMContentLoaded', () => {
  const saved = localStorage.getItem('conversationHistory');
  if (saved) {
    conversationHistory = JSON.parse(saved);
    conversationHistory.forEach(item =>
      appendMessage(item.role, item.content)
    );
  }
});


// ==== Thông báo khi bung DevTools ====
function showDonationBanner() {
  if (document.getElementById('donation-banner')) return;

  const banner = document.createElement('div');
  banner.id = 'donation-banner';
  banner.style.position = 'fixed';
  banner.style.top = '50%';
  banner.style.left = '50%';
  banner.style.transform = 'translate(-50%, -50%)';
  banner.style.zIndex = '9999';
  banner.style.backgroundColor = '#fff';
  banner.style.border = '2px solid #ccc';
  banner.style.padding = '20px';
  banner.style.boxShadow = '0 0 15px rgba(0,0,0,0.4)';
  banner.style.textAlign = 'center';
  banner.style.borderRadius = '10px';

  const img = document.createElement('img');
  img.src = 'data/Donate.jpg';
  img.alt = 'Donation';
  img.style.maxWidth = '250px';
  img.style.marginBottom = '15px';

  const text = document.createElement('div');
  text.textContent = 'Bung suộc rùi thì donate đi, MOMO nè!';
  text.style.fontWeight = 'bold';
  text.style.fontSize = '18px';
  text.style.color = 'red';

  banner.appendChild(img);
  banner.appendChild(text);
  document.body.appendChild(banner);
}
