import { io } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';
const token = sessionStorage.getItem('token');
const statusEl = document.getElementById('socketStatus');
const sendButton = document.getElementById('chatSendButton');
const recipientInput = document.getElementById('chatRecipient');
const messageInput = document.getElementById('chatMessageInput');
const messagesEl = document.getElementById('chatMessages');
const errorEl = document.getElementById('chatError');
const notificationList = document.getElementById('notificationList');
const notificationCount = document.getElementById('notificationCount');

if (token && statusEl) {
  const socket = io(SOCKET_URL, { autoConnect: false, auth: { token }, reconnection: true });
  let messages = [];
  let notifications = [];

  const escapeHtml = (value) => String(value ?? '').replace(/[&<>"']/g, (ch) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  })[ch]);

  function setStatus(connected, label) {
    statusEl.textContent = label || (connected ? 'Connected' : 'Disconnected');
    statusEl.className = `badge ${connected ? 'text-bg-success' : 'text-bg-secondary'}`;
    sendButton.disabled = !connected;
  }

  function currentUserId() {
    try {
      const payload = JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));
      return String(payload.sub || '');
    } catch (_) { return ''; }
  }

  const ownIdElement = document.getElementById('myStudentId');
  if (ownIdElement) ownIdElement.textContent = currentUserId() || 'Unavailable';

  function renderMessages() {
    const recipientId = recipientInput.value.trim();
    const visible = messages.filter((item) =>
      (String(item.sender) === currentUserId() && String(item.recipient) === recipientId) ||
      (String(item.sender) === recipientId && String(item.recipient) === currentUserId())
    );
    if (!visible.length) {
      messagesEl.innerHTML = '<p class="text-muted mb-0">No messages in this conversation yet.</p>';
      return;
    }
    messagesEl.innerHTML = visible.map((item) => {
      const mine = String(item.sender) === currentUserId();
      const date = item.createdAt ? new Date(item.createdAt).toLocaleString() : '';
      return `<div class="task13-message ${mine ? 'mine' : 'theirs'}"><div>${escapeHtml(item.text)}</div><small>${mine ? 'You' : escapeHtml(item.senderName || 'Student')} · ${escapeHtml(date)}</small></div>`;
    }).join('');
    messagesEl.scrollTop = messagesEl.scrollHeight;
  }

  function renderNotifications() {
    const unread = notifications.filter((item) => !item.isRead).length;
    notificationCount.textContent = `${unread} unread`;
    if (!notifications.length) {
      notificationList.innerHTML = '<p class="text-muted mb-0">No notifications yet.</p>';
      return;
    }
    notificationList.innerHTML = notifications.map((item) => `
      <div class="task13-notification ${item.isRead ? '' : 'unread'} d-flex justify-content-between align-items-center gap-2">
        <div><div>${escapeHtml(item.message)}</div><small class="text-muted">${escapeHtml(item.createdAt ? new Date(item.createdAt).toLocaleString() : '')}</small></div>
        ${item.isRead ? '<span class="badge text-bg-light">Read</span>' : `<button class="btn btn-sm btn-outline-primary" data-mark-read="${escapeHtml(item._id)}">Mark as read</button>`}
      </div>`).join('');
  }

  async function loadNotifications() {
    try {
      const data = await window.task13ApiRequest('/notifications');
      notifications = data.notifications || [];
      renderNotifications();
    } catch (error) {
      notificationList.innerHTML = `<p class="text-danger mb-0">${escapeHtml(error.message)}</p>`;
    }
  }

  socket.on('connect', () => { setStatus(true); errorEl.textContent = ''; });
  socket.on('disconnect', () => setStatus(false));
  socket.on('connect_error', (error) => { setStatus(false, 'Authentication / connection error'); errorEl.textContent = error.message; });
  socket.on('receive_message', (message) => {
    if (!messages.some((item) => String(item._id) === String(message._id))) messages.push(message);
    renderMessages();
  });
  socket.on('new_notification', (notification) => {
    notifications.unshift(notification);
    renderNotifications();
  });

  document.getElementById('chatForm').addEventListener('submit', (event) => {
    event.preventDefault();
    errorEl.textContent = '';
    const recipientId = recipientInput.value.trim();
    const text = messageInput.value.trim();
    if (!recipientId || !text) return;
    socket.emit('send_message', { recipientId, text }, (result) => {
      if (!result || !result.success) {
        errorEl.textContent = result?.message || 'Message could not be sent.';
        return;
      }
      messageInput.value = '';
    });
  });

  document.getElementById('loadChatHistory').addEventListener('click', async () => {
    const recipientId = recipientInput.value.trim();
    errorEl.textContent = '';
    if (!recipientId) { errorEl.textContent = 'Enter the recipient student ID first.'; return; }
    try {
      const data = await window.task13ApiRequest(`/messages/${encodeURIComponent(recipientId)}`);
      messages = data.messages || [];
      renderMessages();
    } catch (error) { errorEl.textContent = error.message; }
  });
  recipientInput.addEventListener('change', renderMessages);

  notificationList.addEventListener('click', async (event) => {
    const button = event.target.closest('[data-mark-read]');
    if (!button) return;
    button.disabled = true;
    try {
      const data = await window.task13ApiRequest(`/notifications/${encodeURIComponent(button.dataset.markRead)}/read`, { method: 'PATCH' });
      notifications = notifications.map((item) => String(item._id) === String(data.notification._id) ? data.notification : item);
      renderNotifications();
    } catch (error) { button.disabled = false; button.textContent = error.message; }
  });

  setStatus(false, 'Connecting…');
  socket.connect();
  loadNotifications();
  window.addEventListener('beforeunload', () => socket.disconnect());
} else if (statusEl) {
  setStatus(false, 'Login required');
  document.getElementById('chatError').textContent = 'Please log in again to use chat and notifications.';
}
