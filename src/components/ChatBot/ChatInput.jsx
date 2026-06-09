// src/components/ChatBot/ChatInput.jsx
import React, { useState } from 'react';
import { Send } from 'lucide-react';
import styles from './ChatBot.module.css';

const ChatInput = ({ onSendMessage, disabled }) => {
  const [text, setText] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (text.trim() && !disabled) {
      onSendMessage(text.trim());
      setText('');
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      handleSubmit(e);
    }
  };

  return (
    <form className={styles.inputArea} onSubmit={handleSubmit}>
      <input
        type="text"
        className={styles.inputField}
        placeholder="Введите сообщение..."
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={handleKeyDown}
        disabled={disabled}
        maxLength={500}
      />
      <button
        type="submit"
        className={styles.sendButton}
        disabled={disabled || !text.trim()}
        aria-label="Отправить"
      >
        <Send size={18} />
      </button>
    </form>
  );
};

export default ChatInput;
