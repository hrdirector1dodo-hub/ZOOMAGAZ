// src/components/ChatBot/ChatBot.jsx
import React, { useState, useEffect, useRef } from 'react';
import { MessageSquare, X, Trash2 } from 'lucide-react';
import { api } from '../../services/api';
import ChatMessage from './ChatMessage';
import ChatInput from './ChatInput';
import { processUserMessage, INITIAL_STATE } from './chatBotLogic';
import styles from './ChatBot.module.css';

const LOCAL_STORAGE_KEY = 'zoomagaz_chat_messages';
const LOCAL_STORAGE_STATE_KEY = 'zoomagaz_chat_logic_state';
const LOCAL_STORAGE_OPEN_KEY = 'zoomagaz_chat_open';

const ChatBot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [chatState, setChatState] = useState(INITIAL_STATE);
  const [isTyping, setIsTyping] = useState(false);
  const [hasNewMessage, setHasNewMessage] = useState(false);

  // Cached data from api
  const [products, setProducts] = useState([]);
  const [branches, setBranches] = useState([]);
  const [promotions, setPromotions] = useState([]);

  const messagesEndRef = useRef(null);

  const defaultWelcomeMessage = {
    id: 'welcome',
    sender: 'bot',
    text: "Привет! Я умный помощник ZOOMAGAZ. Могу помочь вам подобрать товары для питомцев, рассказать о скидках, условиях доставки или найти контакты. \n\nНапишите ваш вопрос (например, 'нужен корм для кошки' или 'где находится магазин') или выберите одну из кнопок ниже 👇",
    timestamp: new Date().toISOString(),
    type: 'text',
    quickReplies: ['Подобрать корм', 'Товары для кошки', 'Товары для собаки', 'Акции', 'Контакты']
  };

  // Load products, branches, promotions from API on mount
  useEffect(() => {
    const loadApiData = async () => {
      try {
        const [p, b, pr] = await Promise.all([
          api.getProducts(),
          api.getBranches(),
          api.getPromotions()
        ]);
        setProducts(p);
        setBranches(b);
        setPromotions(pr);
      } catch (err) {
        console.error('Ошибка загрузки данных для чат-бота:', err);
      }
    };
    loadApiData();
  }, []);

  // Load chat status and history on mount
  useEffect(() => {
    const savedMessages = localStorage.getItem(LOCAL_STORAGE_KEY);
    const savedState = localStorage.getItem(LOCAL_STORAGE_STATE_KEY);
    const savedOpen = localStorage.getItem(LOCAL_STORAGE_OPEN_KEY);

    if (savedMessages) {
      try {
        setMessages(JSON.parse(savedMessages));
      } catch (e) {
        setMessages([defaultWelcomeMessage]);
      }
    } else {
      setMessages([defaultWelcomeMessage]);
    }

    if (savedState) {
      try {
        setChatState(JSON.parse(savedState));
      } catch (e) {
        setChatState(INITIAL_STATE);
      }
    }

    if (savedOpen === 'true') {
      setIsOpen(true);
    }
  }, []);

  // Save state and messages to localStorage
  useEffect(() => {
    if (messages.length > 0) {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(messages));
    }
  }, [messages]);

  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_STATE_KEY, JSON.stringify(chatState));
  }, [chatState]);

  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_OPEN_KEY, String(isOpen));
    if (isOpen) {
      setHasNewMessage(false);
      setTimeout(scrollToBottom, 50);
    }
  }, [isOpen]);

  // Automatic scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const handleSendMessage = (text) => {
    // 1. Add user message
    const userMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text,
      timestamp: new Date().toISOString(),
      type: 'text'
    };

    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setIsTyping(true);

    // 2. Process bot response after delay (simulate typing)
    setTimeout(() => {
      const response = processUserMessage(text, chatState, products, branches, promotions);
      
      const botMessage = {
        id: `bot-${Date.now()}`,
        sender: 'bot',
        text: response.text,
        timestamp: new Date().toISOString(),
        type: response.type || 'text',
        products: response.products,
        branches: response.branches,
        promotions: response.promotions,
        quickReplies: response.quickReplies
      };

      setMessages(prev => [...prev, botMessage]);
      setChatState(response.nextState);
      setIsTyping(false);

      if (!isOpen) {
        setHasNewMessage(true);
      }
    }, 700);
  };

  const handleClearChat = () => {
    if (window.confirm('Очистить историю сообщений?')) {
      const cleared = [defaultWelcomeMessage];
      setMessages(cleared);
      setChatState(INITIAL_STATE);
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(cleared));
      localStorage.setItem(LOCAL_STORAGE_STATE_KEY, JSON.stringify(INITIAL_STATE));
    }
  };

  // Get quick replies of the last bot message
  const getActiveQuickReplies = () => {
    if (isTyping) return [];
    
    // Find last bot message with quick replies
    for (let i = messages.length - 1; i >= 0; i--) {
      if (messages[i].sender === 'bot' && messages[i].quickReplies && messages[i].quickReplies.length > 0) {
        return messages[i].quickReplies;
      }
    }
    return defaultWelcomeMessage.quickReplies;
  };

  const activeQuickReplies = getActiveQuickReplies();

  return (
    <div className={styles.chatBotContainer}>
      {/* Chat Window */}
      {isOpen && (
        <div className={styles.chatWindow}>
          {/* Header */}
          <div className={styles.chatHeader}>
            <div className={styles.headerInfo}>
              <span className={styles.headerIcon}>🐾</span>
              <div className={styles.headerTitleText}>
                <span className={styles.chatTitle}>Помощник ZOOMAGAZ</span>
                <span className={styles.chatStatus}>
                  <span className={styles.statusDot}></span> Онлайн
                </span>
              </div>
            </div>
            <div className={styles.headerActions}>
              <button 
                onClick={handleClearChat} 
                className={styles.clearBtn} 
                title="Очистить чат"
                type="button"
              >
                Очистить
              </button>
              <button 
                onClick={() => setIsOpen(false)} 
                className={styles.closeBtn} 
                title="Закрыть"
                aria-label="Закрыть чат"
                type="button"
              >
                <X size={18} />
              </button>
            </div>
          </div>

          {/* Messages List */}
          <div className={styles.messagesList}>
            {messages.map((msg) => (
              <ChatMessage key={msg.id} message={msg} />
            ))}
            
            {isTyping && (
              <div className={`${styles.messageWrapper} ${styles.botWrapper}`}>
                <div className={styles.botAvatar}>🐾</div>
                <div className={`${styles.messageBubble} ${styles.botBubble}`}>
                  <div className={styles.typingIndicator}>
                    <span className={styles.typingDot}></span>
                    <span className={styles.typingDot}></span>
                    <span className={styles.typingDot}></span>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Replies Buttons */}
          {activeQuickReplies.length > 0 && (
            <div className={styles.quickRepliesContainer}>
              {activeQuickReplies.map((replyText, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSendMessage(replyText)}
                  className={styles.quickReplyButton}
                  type="button"
                >
                  {replyText}
                </button>
              ))}
            </div>
          )}

          {/* Input Area */}
          <ChatInput onSendMessage={handleSendMessage} disabled={isTyping} />
        </div>
      )}

      {/* Floating Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={styles.floatingButton}
        title="Помощник ZOOMAGAZ"
        aria-label="Открыть чат-бот"
        type="button"
      >
        {isOpen ? <X size={28} /> : <MessageSquare size={28} />}
        {hasNewMessage && !isOpen && <span className={styles.floatingBadge}></span>}
      </button>
    </div>
  );
};

export default ChatBot;
