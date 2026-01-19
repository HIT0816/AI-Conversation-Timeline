// ChatGPT 平台的完整内容脚本
class ChatGPTTimeline {
  constructor() {
    this.timelineData = [];
    this.timelineContainer = null;
    this.previewPopup = null;
    this.platform = 'chatgpt';
    this.contentHandler = new ChatGPTContentHandler();
    this.currentConversationId = null; // track current conversation/session
    this.init();
  }

  init() {
    console.log('ChatGPT Timeline: Initializing on ChatGPT...');
    this.createTimelineContainer();
    this.createPreviewPopup();
    this.initContentHandler();
    this.setupLocationChangeListener();
    this.setupObserver();
  }

  // 返回当前会话标识，优先使用页面上可用的会话相关属性，回退到 URL
  getConversationId() {
    try {
      const firstTurn = document.querySelector('article[data-turn-id]');
      if (firstTurn) {
        const conv = firstTurn.closest('[data-conversation-id]');
        if (conv && conv.dataset && conv.dataset.conversationId) return String(conv.dataset.conversationId);
        // 尝试使用第一个 message 的 turn id 做区分
        if (firstTurn.dataset && firstTurn.dataset.turnId) return `turn-${firstTurn.dataset.turnId}`;
      }
    } catch {}
    return location.pathname + location.search;
  }

  // 监听 SPA 导航（history API）变化，触发会话切换处理
  setupLocationChangeListener() {
    // 全局只需要 hook 一次 history 方法
    if (!window.__geminiTimelineHistoryHook) {
      const _push = history.pushState;
      const _replace = history.replaceState;
      history.pushState = function () {
        const res = _push.apply(this, arguments);
        window.dispatchEvent(new Event('locationchange'));
        return res;
      };
      history.replaceState = function () {
        const res = _replace.apply(this, arguments);
        window.dispatchEvent(new Event('locationchange'));
        return res;
      };
      window.addEventListener('popstate', () => window.dispatchEvent(new Event('locationchange')));
      window.__geminiTimelineHistoryHook = true;
    }

    // 监听 locationchange，比较会话 id
    window.addEventListener('locationchange', () => {
      try { this.handleConversationChange(); } catch (e) { console.error(e); }
    });
  }

  // 当检测到会话切换时，重置并重新加载数据
  async handleConversationChange() {
    const newId = this.getConversationId();
    if (this.currentConversationId === newId) return;
    console.log('ChatGPT Timeline: Conversation changed', { from: this.currentConversationId, to: newId });
    this.currentConversationId = newId;

    // 清空旧数据并重置处理器容器引用，触发重新初始化/解析
    this.timelineData = [];
    this.renderTimeline();

    try {
      // 清理并重新初始化 content handler 以绑定到新会话 DOM
      this.contentHandler.conversationContainer = null;
      this.contentHandler.scrollContainer = null;
      const ok = await this.contentHandler.init();
      if (ok) {
        // 重新绑定观察器 到新容器
        if (this.observer) {
          try { this.observer.disconnect(); } catch {}
          const target = this.contentHandler.conversationContainer || document.body;
          this.observer.observe(target, { childList: true, subtree: true, attributes: false, characterData: false });
        }
        this.tryParseMessages();
      }
    } catch (error) {
      console.error('ChatGPT Timeline: Error handling conversation change', error);
    }
  }

  // 初始化平台专用内容处理器
  async initContentHandler() {
    const success = await this.contentHandler.init();
    if (success) {
      console.log('ChatGPT Timeline: ChatGPT content handler initialized successfully');
      this.tryParseMessages();
    }
  }

  // 创建时间轴容器
  createTimelineContainer() {
    this.isCollapsed = true; // 默认折叠状态
    
    this.timelineContainer = document.createElement('div');
    this.timelineContainer.id = 'gemini-timeline';
    
    // 平台标题
    const platformTitle = 'ChatGPT 对话时间轴';
    
    this.timelineContainer.innerHTML = `
      <div class="timeline-header">
        <div class="timeline-title-section">
          <span class="timeline-title">${platformTitle}</span>
          <div class="timeline-copyright">— developed by Gem-ikun</div>
        </div>
        <button class="timeline-toggle" id="timeline-toggle">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="9 18 15 12 9 6"></polyline>
          </svg>
        </button>
      </div>
      <div class="timeline-content"></div>
    `;
    
    // 确保时间轴容器样式
    this.timelineContainer.style.position = 'fixed';
    this.timelineContainer.style.top = '0';
    this.timelineContainer.style.right = '0';
    this.timelineContainer.style.width = '250px';
    this.timelineContainer.style.height = '100vh';
    this.timelineContainer.style.backgroundColor = 'rgba(255, 255, 255, 0.95)';
    this.timelineContainer.style.borderLeft = '1px solid rgba(0, 0, 0, 0.1)';
    this.timelineContainer.style.boxShadow = '0 4px 20px rgba(0, 0, 0, 0.1)';
    this.timelineContainer.style.zIndex = '10000';
    this.timelineContainer.style.display = 'flex';
    this.timelineContainer.style.flexDirection = 'column';
    this.timelineContainer.style.backdropFilter = 'blur(10px)';
    this.timelineContainer.style.overflow = 'hidden';
    this.timelineContainer.style.transition = 'transform 0.3s ease';
    
    // 初始折叠状态
    this.timelineContainer.style.transform = 'translateX(100%)';
    
    document.body.appendChild(this.timelineContainer);
    
    // 添加切换按钮事件监听
    this.setupToggleButton();
    
    // 创建折叠状态下的悬浮按钮
    this.createFloatingButton();
    
    console.log('ChatGPT Timeline: Container created');
  }
  
  // 设置切换按钮
  setupToggleButton() {
    const toggleButton = this.timelineContainer.querySelector('#timeline-toggle');
    if (toggleButton) {
      toggleButton.addEventListener('click', () => {
        this.toggleTimeline();
      });
    }
  }
  
  // 创建折叠状态下的悬浮按钮 - 圆形设计，与扩展图标风格一致
  createFloatingButton() {
    this.floatingButton = document.createElement('button');
    this.floatingButton.id = 'gemini-timeline-floating';
    
    // 使用与扩展图标相同的时间轴设计 SVG
    this.floatingButton.innerHTML = `
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="floating-bg-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style="stop-color:#667eea;stop-opacity:0.8" />
            <stop offset="50%" style="stop-color:#764ba2;stop-opacity:0.8" />
            <stop offset="100%" style="stop-color:#f093fb;stop-opacity:0.8" />
          </linearGradient>
          <linearGradient id="floating-line-gradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" style="stop-color:#ffffff;stop-opacity:0.9" />
            <stop offset="100%" style="stop-color:#ffffff;stop-opacity:0.5" />
          </linearGradient>
        </defs>
        <!-- 时间轴竖线 -->
        <line x1="12" y1="2" x2="12" y2="22" stroke="url(#floating-line-gradient)" stroke-width="2" stroke-linecap="round"/>
        <!-- 时间轴节点 - 增大半径50%，增加间距60% -->
        <circle cx="12" cy="5" r="3" fill="#ffffff" opacity="0.95"/>
        <circle cx="12" cy="13" r="3" fill="#ffffff" opacity="0.95"/>
        <circle cx="12" cy="21" r="3" fill="#ffffff" opacity="0.95"/>
        <!-- 高亮当前节点 -->
        <circle cx="12" cy="13" r="5" fill="#ffffff" opacity="0.25"/>
        <circle cx="12" cy="13" r="3" fill="#ffffff" opacity="1"/>
      </svg>
    `;
    
    // 悬浮按钮样式 - 圆形设计，渐变背景，渐变阴影
    this.floatingButton.style.position = 'fixed';
    this.floatingButton.style.top = '50%';
    this.floatingButton.style.right = '40px';
    this.floatingButton.style.transform = 'translateY(-50%)';
    this.floatingButton.style.width = '48px';
    this.floatingButton.style.height = '48px';
    this.floatingButton.style.borderRadius = '50%';
    // 使用与扩展图标相同的渐变背景，降低透明度
    this.floatingButton.style.background = 'linear-gradient(135deg, rgba(102, 126, 234, 0.8) 0%, rgba(118, 75, 162, 0.8) 50%, rgba(240, 147, 251, 0.8) 100%)';
    this.floatingButton.style.border = 'none';
    // 渐变阴影效果 - 降低透明度
    this.floatingButton.style.boxShadow = `
      0 4px 12px rgba(102, 126, 234, 0.3),
      0 2px 6px rgba(118, 75, 162, 0.25),
      0 0 0 1px rgba(255, 255, 255, 0.1) inset,
      0 1px 2px rgba(0, 0, 0, 0.05)
    `;
    this.floatingButton.style.cursor = 'pointer';
    this.floatingButton.style.zIndex = '9999';
    this.floatingButton.style.transition = 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)';
    this.floatingButton.style.display = 'flex';
    this.floatingButton.style.alignItems = 'center';
    this.floatingButton.style.justifyContent = 'center';
    this.floatingButton.style.outline = 'none';
    
    // 悬停效果 - 增强阴影和轻微放大
    this.floatingButton.addEventListener('mouseenter', () => {
      this.floatingButton.style.transform = 'translateY(-50%) scale(1.1)';
      this.floatingButton.style.boxShadow = `
        0 6px 20px rgba(102, 126, 234, 0.5),
        0 4px 10px rgba(118, 75, 162, 0.4),
        0 0 0 1px rgba(255, 255, 255, 0.15) inset,
        0 2px 4px rgba(0, 0, 0, 0.15)
      `;
    });
    
    this.floatingButton.addEventListener('mouseleave', () => {
      this.floatingButton.style.transform = 'translateY(-50%) scale(1)';
      this.floatingButton.style.boxShadow = `
        0 4px 12px rgba(102, 126, 234, 0.4),
        0 2px 6px rgba(118, 75, 162, 0.3),
        0 0 0 1px rgba(255, 255, 255, 0.1) inset,
        0 1px 2px rgba(0, 0, 0, 0.1)
      `;
    });
    
    // 点击效果
    this.floatingButton.addEventListener('mousedown', () => {
      this.floatingButton.style.transform = 'translateY(-50%) scale(0.95)';
    });
    
    this.floatingButton.addEventListener('mouseup', () => {
      this.floatingButton.style.transform = 'translateY(-50%) scale(1.1)';
    });
    
    // 添加点击事件
    this.floatingButton.addEventListener('click', () => {
      this.toggleTimeline();
    });
    
    document.body.appendChild(this.floatingButton);
  }
  
  // 切换时间轴显示/隐藏
  toggleTimeline() {
    this.isCollapsed = !this.isCollapsed;
    
    if (this.isCollapsed) {
      // 折叠
      this.timelineContainer.style.transform = 'translateX(100%)';
      this.floatingButton.style.display = 'flex';
      this.updateToggleIcon(false);
      console.log('ChatGPT Timeline: Collapsed');
    } else {
      // 展开
      this.timelineContainer.style.transform = 'translateX(0)';
      this.floatingButton.style.display = 'none';
      this.updateToggleIcon(true);
      console.log('ChatGPT Timeline: Expanded');
    }
  }
  
  // 更新切换按钮图标
  updateToggleIcon(isExpanded) {
    const toggleButton = this.timelineContainer.querySelector('#timeline-toggle svg');
    if (toggleButton) {
      if (isExpanded) {
        // 展开状态：箭头指向右（折叠方向）
        toggleButton.style.transform = 'rotate(0deg)';
      } else {
        // 折叠状态：箭头指向左（展开方向）
        toggleButton.style.transform = 'rotate(180deg)';
      }
    }
  }

  // 创建预览弹窗
  createPreviewPopup() {
    this.previewPopup = document.createElement('div');
    this.previewPopup.id = 'gemini-timeline-preview';
    document.body.appendChild(this.previewPopup);
    console.log('ChatGPT Timeline: Preview popup created');
  }

  // 尝试解析消息，带重试机制
  tryParseMessages(retries = 0) {
    const maxRetries = 5;
    
    if (!this.contentHandler) {
      if (retries < maxRetries) {
        console.log(`ChatGPT Timeline: No content handler, retrying in ${1000 * (retries + 1)}ms...`);
        setTimeout(() => {
          this.tryParseMessages(retries + 1);
        }, 1000 * (retries + 1));
      } else {
        console.log('ChatGPT Timeline: Max retries reached, no content handler');
      }
      return;
    }
    
    const messages = this.getAllMessages();
    
    if (messages.length > 0) {
      console.log(`ChatGPT Timeline: Found ${messages.length} messages`);
      this.parseExistingMessages();
    } else if (retries < maxRetries) {
      console.log(`ChatGPT Timeline: No messages found, retrying in ${1000 * (retries + 1)}ms...`);
      setTimeout(() => {
        this.tryParseMessages(retries + 1);
      }, 1000 * (retries + 1));
    } else {
      console.log('ChatGPT Timeline: Max retries reached, no messages found');
      // 添加一条默认消息到时间轴，表明时间轴已加载
      this.timelineData = [{ id: Date.now(), userQuery: '时间轴已加载', geminiResponse: '等待新消息...' }];
      this.renderTimeline();
    }
  }

  // 解析现有的聊天消息
  parseExistingMessages() {
    const messages = this.getAllMessages();
    this.timelineData = messages;
    
    console.log(`AI Conversation Timeline: Created ${this.timelineData.length} timeline items`);
    this.renderTimeline();
  }

  // 获取所有聊天消息 - 使用平台专用处理器
  getAllMessages() {
    if (!this.contentHandler) return [];
    
    return this.contentHandler.getAllMessages() || [];
  }

  // 渲染时间轴
  renderTimeline() {
    const content = this.timelineContainer.querySelector('.timeline-content');
    if (!content) {
      console.error('ChatGPT Timeline: Content element not found');
      return;
    }
    
    content.innerHTML = '';
    
    this.timelineData.forEach((item, index) => {
      const timelineItem = document.createElement('div');
      timelineItem.className = 'timeline-item';
      timelineItem.dataset.index = index;
      timelineItem.innerHTML = `
        <div class="timeline-dot"></div>
        <div class="timeline-line"></div>
        <div class="timeline-text">${item.userQuery || '用户提问'}</div>
      `;
      
      // 确保时间轴项可见
      timelineItem.style.position = 'relative';
      timelineItem.style.padding = '8px 20px 8px 40px';
      timelineItem.style.cursor = 'pointer';
      timelineItem.style.transition = 'background-color 0.2s ease';
      timelineItem.style.display = 'flex';
      timelineItem.style.alignItems = 'flex-start';
      timelineItem.style.userSelect = 'none';
      
      // 添加悬停事件
      timelineItem.addEventListener('mouseenter', (e) => {
        this.showPreview(e, item);
      });
      
      timelineItem.addEventListener('mouseleave', () => {
        this.hidePreview();
      });
      
      // 添加点击事件
      timelineItem.addEventListener('click', () => {
        this.scrollToMessage(item);
      });
      
      content.appendChild(timelineItem);
    });
    
    console.log('ChatGPT Timeline: Timeline rendered');
  }

  // 显示预览
  showPreview(event, item) {
    const aiName = 'ChatGPT';
    const previewContent = `
      <div class="preview-title">对话 #${this.timelineData.indexOf(item) + 1}</div>
      <div class="preview-section">
        <strong>用户:</strong> ${item.userQuery}
      </div>
      <div class="preview-section">
        <strong>${aiName}:</strong> ${item.geminiResponse}
      </div>
    `;
    
    this.previewPopup.innerHTML = previewContent;
    this.previewPopup.style.display = 'block';
    
    // 定位预览弹窗
    const rect = event.target.getBoundingClientRect();
    this.previewPopup.style.left = `${rect.left - this.previewPopup.offsetWidth - 10}px`;
    this.previewPopup.style.top = `${rect.top + window.scrollY}px`;
  }

  // 隐藏预览
  hidePreview() {
    this.previewPopup.style.display = 'none';
  }

  // 滚动到指定消息 - 使用平台专用处理器
  scrollToMessage(item) {
    if (!this.contentHandler || !item.userElement) return;
    
    // 高亮用户消息
    this.highlightElement(item.userElement);
    
    // 使用平台专用的平滑滚动方法
    this.contentHandler.smoothScrollTo(item.userElement);
  }

  // 高亮元素
  highlightElement(element) {
    element.style.backgroundColor = 'rgba(66, 133, 244, 0.1)';
    element.style.borderRadius = '8px';
    element.style.transition = 'background-color 0.3s ease';
    
    setTimeout(() => {
      element.style.backgroundColor = '';
      element.style.borderRadius = '';
    }, 1500);
  }

  // 设置 MutationObserver 监听 DOM 变化 - 使用防抖策略（参考 refer-extension）
  setupObserver() {
    // 创建防抖函数，延迟 350ms（参考 refer-extension）
    let debounceTimer = null;
    const debouncedParse = () => {
      if (debounceTimer) {
        clearTimeout(debounceTimer);
      }
      debounceTimer = setTimeout(() => {
        debounceTimer = null;
        try {
          // 确保容器是最新的
          this.ensureContainersUpToDate();
          // 解析并更新时间轴
          this.parseExistingMessages();
        } catch (error) {
          console.error('ChatGPT Timeline: Error in debounced parse:', error);
        }
      }, 350);
    };
    
    this.observer = new MutationObserver((mutations) => {
      let shouldUpdate = false;
      
      mutations.forEach(mutation => {
        if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
          // 检查是否添加了新的消息节点
          mutation.addedNodes.forEach(node => {
            if (node.nodeType === 1) {
              // 检查是否是消息相关的节点
              if (node.tagName === 'ARTICLE' || 
                  node.querySelector?.('article[data-turn-id]') ||
                  node.querySelector?.('article[data-turn="user"]')) {
                shouldUpdate = true;
              }
            }
          });
        }
      });
      
      if (shouldUpdate) {
        console.log('ChatGPT Timeline: DOM changed, scheduling update');
        debouncedParse();
      }
    });
    
    // 优先监听对话容器，如果不存在则监听 document.body
    const targetContainer = this.contentHandler?.conversationContainer || document.body;
    this.observer.observe(targetContainer, {
      childList: true,
      subtree: true,
      attributes: false,
      characterData: false
    });
    
    console.log('ChatGPT Timeline: Observer setup on', targetContainer === document.body ? 'document.body' : 'conversationContainer');
  }
  
  // 确保容器是最新的（参考 refer-extension）
  ensureContainersUpToDate() {
    if (!this.contentHandler) return;
    
    try {
      const firstTurn = document.querySelector('article[data-turn-id]');
      if (!firstTurn) return;
      
      const newConv = firstTurn.parentElement;
      if (newConv && newConv !== this.contentHandler.conversationContainer) {
        // 重新绑定容器
        this.contentHandler.conversationContainer = newConv;
        this.contentHandler.scrollContainer = this.contentHandler.findScrollContainer();
        
        // 重新设置观察器
        if (this.observer) {
          this.observer.disconnect();
          this.observer.observe(newConv, {
            childList: true,
            subtree: true,
            attributes: false,
            characterData: false
          });
        }
      }
    } catch (error) {
      console.error('ChatGPT Timeline: Error ensuring containers up to date:', error);
    }
  }
}

// ChatGPT 平台的内容处理器
class ChatGPTContentHandler {
  constructor() {
    this.conversationContainer = null;
    this.scrollContainer = null;
  }

  // 初始化
  async init() {
    // 尝试多种方式获取对话容器，增加鲁棒性
    let firstTurn = null;
    let attempts = 0;
    const maxAttempts = 3;
    const retryDelay = 1000;
    
    while (!firstTurn && attempts < maxAttempts) {
      try {
        firstTurn = await this.waitForElement('article[data-turn-id]', 3000);
        if (firstTurn) break;
      } catch {}
      
      attempts++;
      if (attempts < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, retryDelay));
      }
    }
    
    // 如果没有找到带 data-turn-id 的元素，尝试其他选择器
    if (!firstTurn) {
      const alternativeSelectors = [
        'article[data-turn="user"]',
        '[data-testid="user-message"]',
        '.user-message-container'
      ];
      
      for (const selector of alternativeSelectors) {
        try {
          const elements = document.querySelectorAll(selector);
          if (elements.length > 0) {
            firstTurn = elements[0];
            break;
          }
        } catch {}
      }
    }
    
    // 如果仍然没有找到，尝试直接查找对话容器
    if (!firstTurn) {
      const conversationContainers = [
        '.conversation-container',
        '.chat-container',
        '[data-testid="chat-history"]',
        '#conversation'
      ];
      
      for (const selector of conversationContainers) {
        const container = document.querySelector(selector);
        if (container) {
          this.conversationContainer = container;
          this.scrollContainer = this.getScrollableAncestor(container);
          return true;
        }
      }
      
      return false;
    }
    
    // 绑定对话容器和滚动容器
    this.conversationContainer = firstTurn.parentElement;
    if (!this.conversationContainer) {
      // 尝试向上查找更可靠的对话容器
      const possibleContainers = firstTurn.closest('.conversation-container, .chat-container, [data-testid="chat-history"]');
      if (possibleContainers) {
        this.conversationContainer = possibleContainers;
      } else {
        return false;
      }
    }
    
    this.scrollContainer = this.findScrollContainer();
    return this.scrollContainer !== null;
  }

  // 等待元素出现
  waitForElement(selector, timeoutMs = 5000) {
    return new Promise((resolve) => {
      const el = document.querySelector(selector);
      if (el) return resolve(el);
      
      const obs = new MutationObserver(() => {
        const n = document.querySelector(selector);
        if (n) {
          try { obs.disconnect(); } catch {}
          resolve(n);
        }
      });
      
      try { obs.observe(document.body, { childList: true, subtree: true }); } catch {}
      setTimeout(() => { try { obs.disconnect(); } catch { } resolve(null); }, timeoutMs);
    });
  }

  // 查找滚动容器
  findScrollContainer() {
    let parent = this.conversationContainer;
    while (parent && parent !== document.body) {
      const style = window.getComputedStyle(parent);
      if (style.overflowY === 'auto' || style.overflowY === 'scroll') {
        return parent;
      }
      parent = parent.parentElement;
    }
    
    return document.scrollingElement || document.documentElement || document.body;
  }

  // 收集所有用户消息 - 使用稳定的选择器策略（参考 refer-extension）
  collectUserMessages() {
    // 如果对话容器为空，尝试重新获取
    if (!this.conversationContainer) {
      const firstTurn = document.querySelector('article[data-turn-id]');
      if (firstTurn) {
        this.conversationContainer = firstTurn.parentElement;
        // 重新查找滚动容器
        this.scrollContainer = this.findScrollContainer();
      } else {
        return [];
      }
    }
    
    // 使用稳定的选择器：优先使用 data-turn="user" 属性
    const userTurnElements = this.conversationContainer.querySelectorAll('article[data-turn="user"]');
    
    // 如果找到用户消息，直接返回
    if (userTurnElements.length > 0) {
      return Array.from(userTurnElements);
    }
    
    // 备选方案：查找所有带 data-turn-id 的元素，然后过滤用户消息
    // 这可以处理某些情况下 data-turn 属性缺失的情况
    try {
      const allTurns = this.conversationContainer.querySelectorAll('article[data-turn-id]');
      return Array.from(allTurns).filter(el => {
        try {
          // 检查 data-turn 属性或通过其他特征判断
          return el.dataset.turn === 'user' || 
                 el.querySelector('[data-testid="user-avatar"]') !== null ||
                 el.classList.contains('user-turn');
        } catch {
          return false;
        }
      });
    } catch {
      return [];
    }
  }

  // 标准化文本：移除多余空格和前缀
  normalizeText(text) {
    try {
      let s = String(text || '').replace(/\s+/g, ' ').trim();
      // 移除常见的前缀
      s = s.replace(/^\s*(you\s*said\s*[:：]?\s*)/i, '');
      s = s.replace(/^\s*((你说|您说|你說|您說)\s*[:：]?\s*)/, '');
      s = s.replace(/^\s*(user:\s*)/i, '');
      s = s.replace(/^\s*(用户:\s*)/, '');
      return s;
    } catch {
      return '';
    }
  }

  // 提取用户消息摘要
  extractUserSummary(el) {
    try {
      // 优先从特定的文本容器中提取
      const textContainers = [
        '.text-message',
        '.message-content',
        '[data-testid="message-content"]',
        '.prose'
      ];
      
      for (const selector of textContainers) {
        const textElement = el.querySelector(selector);
        if (textElement && textElement.textContent) {
          return this.normalizeText(textElement.textContent);
        }
      }
      
      // 否则使用整个元素的文本
      return this.normalizeText(el.textContent || '');
    } catch {
      return '';
    }
  }

  // 提取 AI 回答摘要
  extractAIResponse(userEl) {
    try {
      // 查找用户消息的下一个 AI 消息
      let nextSibling = userEl.nextElementSibling;
      
      while (nextSibling) {
        if (nextSibling.tagName === 'ARTICLE') {
          // 检查是否为 AI 消息
          const isModelMessage = nextSibling.dataset.turn === 'model' || 
                               nextSibling.querySelector('[data-testid="model-avatar"]') !== null ||
                               nextSibling.classList.contains('model-turn');
          
          if (isModelMessage) {
            // 提取 AI 回答文本
            const textContainers = [
              '.text-message',
              '.message-content',
              '[data-testid="message-content"]',
              '.prose'
            ];
            
            let aiText = '';
            
            for (const selector of textContainers) {
              const textElement = nextSibling.querySelector(selector);
              if (textElement && textElement.textContent) {
                aiText = this.normalizeText(textElement.textContent);
                break;
              }
            }
            
            if (!aiText) {
              aiText = this.normalizeText(nextSibling.textContent || '');
            }
            
            return aiText.length > 100 ? aiText.substring(0, 100) + '...' : aiText;
          }
        }
        nextSibling = nextSibling.nextElementSibling;
      }
      
      return '等待回复...';
    } catch (error) {
      console.error('ChatGPT Timeline: Error extracting AI response:', error);
      return '等待回复...';
    }
  }

  // 获取所有消息
  getAllMessages() {
    const userMessages = this.collectUserMessages();
    const messages = [];
    
    userMessages.forEach((userMsg, index) => {
      const userQuery = this.extractUserSummary(userMsg);
      const aiResponse = this.extractAIResponse(userMsg);
      
      messages.push({
        id: `chatgpt-${index}-${Date.now()}`,
        userQuery: userQuery,
        geminiResponse: aiResponse, // 使用统一的字段名
        userElement: userMsg
      });
    });
    
    return messages;
  }

  // 平滑滚动到指定消息
  smoothScrollTo(targetElement, duration = 600) {
    if (!this.scrollContainer || !targetElement) return;
    
    const containerRect = this.scrollContainer.getBoundingClientRect();
    const targetRect = targetElement.getBoundingClientRect();
    const targetPosition = targetRect.top - containerRect.top + this.scrollContainer.scrollTop;
    const startPosition = this.scrollContainer.scrollTop;
    const distance = targetPosition - startPosition;
    let startTime = null;

    const animation = (currentTime) => {
      if (startTime === null) startTime = currentTime;
      const timeElapsed = currentTime - startTime;
      const run = this.easeInOutQuad(timeElapsed, startPosition, distance, duration);
      this.scrollContainer.scrollTop = run;
      
      if (timeElapsed < duration) {
        requestAnimationFrame(animation);
      } else {
        this.scrollContainer.scrollTop = targetPosition;
      }
    };
    
    requestAnimationFrame(animation);
  }

  // 缓动函数
  easeInOutQuad(t, b, c, d) {
    t /= d / 2;
    if (t < 1) return c / 2 * t * t + b;
    t--;
    return -c / 2 * (t * (t - 2) - 1) + b;
  }
}

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', () => {
  // 延迟初始化，确保页面完全加载
  setTimeout(() => {
    console.log('ChatGPT Timeline: DOMContentLoaded, starting initialization');
    new ChatGPTTimeline();
  }, 1000);
});

// 同时监听页面加载完成事件，确保在各种情况下都能初始化
window.addEventListener('load', () => {
  setTimeout(() => {
    // 检查是否已初始化
    if (!document.getElementById('gemini-timeline')) {
      console.log('ChatGPT Timeline: Window loaded, starting initialization');
      new ChatGPTTimeline();
    }
  }, 2000);
});