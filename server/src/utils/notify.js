const Notification = require('../models/Notification');

async function notify({ user, type, title, message, link = '' }) {
  if (!user) return null;
  try {
    return await Notification.create({ user, type, title, message, link });
  } catch (error) {
    console.error('Failed to create notification:', error.message);
    return null;
  }
}

module.exports = { notify };
