// Gemini 平台的完整内容脚本
class GeminiTimeline {
  constructor() {
    this.timelineData = [];
    this.timelineContainer = null;
    this.previewPopup = null;
    this.platform = 'gemini';
    this.contentHandler = new GeminiContentHandler();
    this.init();
  }

  init() {
    console.log('Gemini Timeline: Initializing on Gemini...');
    this.createTimelineContainer();
    this.createPreviewPopup();
    this.initContentHandler();
    this.setupObserver();
  }

  // 初始化平台专用内容处理器
  async initContentHandler() {
    const success = await this.contentHandler.init();
    if (success) {
      console.log('Gemini Timeline: Gemini content handler initialized successfully');
      this.tryParseMessages();
    }
  }

  // 创建时间轴容器
  createTimelineContainer() {
    this.isCollapsed = true; // 默认折叠状态
    
    this.timelineContainer = document.createElement('div');
    this.timelineContainer.id = 'gemini-timeline';
    
    // 平台标题
    const platformTitle = 'Gemini 对话时间轴';
    
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
    
    console.log('Gemini Timeline: Container created');
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
      console.log('Gemini Timeline: Collapsed');
    } else {
      // 展开
      this.timelineContainer.style.transform = 'translateX(0)';
      this.floatingButton.style.display = 'none';
      this.updateToggleIcon(true);
      console.log('Gemini Timeline: Expanded');
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
    console.log('Gemini Timeline: Preview popup created');
  }

  // 尝试解析消息，带重试机制
  tryParseMessages(retries = 0) {
    const maxRetries = 5;
    
    if (!this.contentHandler) {
      if (retries < maxRetries) {
        console.log(`Gemini Timeline: No content handler, retrying in ${1000 * (retries + 1)}ms...`);
        setTimeout(() => {
          this.tryParseMessages(retries + 1);
        }, 1000 * (retries + 1));
      } else {
        console.log('Gemini Timeline: Max retries reached, no content handler');
      }
      return;
    }
    
    const messages = this.getAllMessages();
    
    if (messages.length > 0) {
      console.log(`Gemini Timeline: Found ${messages.length} messages`);
      this.parseExistingMessages();
    } else if (retries < maxRetries) {
      console.log(`Gemini Timeline: No messages found, retrying in ${1000 * (retries + 1)}ms...`);
      setTimeout(() => {
        this.tryParseMessages(retries + 1);
      }, 1000 * (retries + 1));
    } else {
      console.log('Gemini Timeline: Max retries reached, no messages found');
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
      console.error('Gemini Timeline: Content element not found');
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
    
    console.log('Gemini Timeline: Timeline rendered');
  }

  // 显示预览
  showPreview(event, item) {
    const aiName = 'Gemini';
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
          console.error('Gemini Timeline: Error in debounced parse:', error);
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
              // 检查是否是用户消息相关的节点
              if (node.matches?.('.user-query-bubble-with-background, .user-query-container, user-query') ||
                  node.querySelector?.('.user-query-bubble-with-background, .user-query-container, user-query')) {
              shouldUpdate = true;
              }
            }
          });
        }
      });
      
      if (shouldUpdate) {
        console.log('Gemini Timeline: DOM changed, scheduling update');
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
    
    console.log('Gemini Timeline: Observer setup on', targetContainer === document.body ? 'document.body' : 'conversationContainer');
  }
  
  // 确保容器是最新的（参考 refer-extension）
  ensureContainersUpToDate() {
    if (!this.contentHandler) return;
    
    try {
      const first = document.querySelector(this.contentHandler.SEL_USER_BUBBLE);
      if (!first) return;
      
      const newRoot = this.contentHandler.findConversationRootFromFirst(first);
      if (newRoot && newRoot !== this.contentHandler.conversationContainer) {
        // 重新绑定容器
        this.contentHandler.conversationContainer = newRoot;
        this.contentHandler.scrollContainer = this.contentHandler.getScrollableAncestor(newRoot);
        
        // 重新设置观察器
        if (this.observer) {
          this.observer.disconnect();
          this.observer.observe(newRoot, {
            childList: true,
            subtree: true,
            attributes: false,
            characterData: false
          });
        }
      }
    } catch (error) {
      console.error('Gemini Timeline: Error ensuring containers up to date:', error);
    }
  }
}

// Gemini 平台的内容处理器
class GeminiContentHandler {
  constructor() {
    // 稳定的 Gemini 选择器
    this.SEL_USER_BUBBLE = [
      '.user-query-bubble-with-background',
      '.user-query-container.right-align-content',
      'user-query'
    ].join(',');
    
    // 已知的 Gemini 滚动区域
    this.SEL_SCROLL_PRIMARY = '#chat-history.chat-history-scroll-container';
    this.SEL_SCROLL_ALT = '[data-test-id="chat-history-container"].chat-history';
    
    this.conversationContainer = null;
    this.scrollContainer = null;
  }

  // 初始化
  async init() {
    // 尝试多种方式获取对话容器，增加鲁棒性
    let first = null;
    let attempts = 0;
    const maxAttempts = 3;
    const retryDelay = 1000;
    
    while (!first && attempts < maxAttempts) {
      try {
        first = await this.waitForElement(this.SEL_USER_BUBBLE, 3000);
        if (first) break;
      } catch {}
      
      attempts++;
      if (attempts < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, retryDelay));
      }
    }
    
    // 如果没有找到用户元素，尝试直接查找对话容器
    if (!first) {
      const conversationSelectors = [
        '#chat-history',
        '.chat-history-container',
        '[data-testid="chat-history-container"]',
        '.conversation-container'
      ];
      
      for (const selector of conversationSelectors) {
        const container = document.querySelector(selector);
        if (container) {
          this.conversationContainer = container;
          this.scrollContainer = this.getScrollableAncestor(container);
          return true;
        }
      }
      
      return false;
    }
    
    // 绑定对话根容器和滚动容器
    this.conversationContainer = this.findConversationRootFromFirst(first);
    this.scrollContainer = this.getScrollableAncestor(this.conversationContainer);
    
    return true;
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

  // 检查元素是否可滚动
  isElementScrollable(el) {
    if (!el) return false;
    
    try {
      const cs = getComputedStyle(el);
      const oy = (cs.overflowY || '').toLowerCase();
      const ok = oy === 'auto' || oy === 'scroll' || oy === 'overlay';
      if (!ok && el !== document.scrollingElement && el !== document.documentElement && el !== document.body) {
        return false;
      }
      
      if ((el.scrollHeight - el.clientHeight) > 4) return true;
      
      const prev = el.scrollTop;
      el.scrollTop = prev + 1;
      const changed = el.scrollTop !== prev;
      el.scrollTop = prev;
      return changed;
    } catch { return false; }
  }

  // 获取可滚动祖先元素
  getScrollableAncestor(startEl) {
    // 优先使用站点提供的容器
    try {
      const primary = document.querySelector(this.SEL_SCROLL_PRIMARY);
      if (primary && (primary.contains(startEl) || startEl.contains(primary)) && this.isElementScrollable(primary)) {
        return primary;
      }
    } catch {}
    
    try {
      const alt = document.querySelector(this.SEL_SCROLL_ALT);
      if (alt && (alt.contains(startEl) || startEl.contains(alt)) && this.isElementScrollable(alt)) {
        return alt;
      }
    } catch {}
    
    // 否则向上遍历祖先
    let el = startEl;
    while (el && el !== document.body) {
      if (this.isElementScrollable(el)) return el;
      el = el.parentElement;
    }
    
    const docScroll = document.scrollingElement || document.documentElement || document.body;
    return this.isElementScrollable(docScroll) ? docScroll : (document.documentElement || document.body);
  }

  // 从第一个用户消息找到对话根容器
  findConversationRootFromFirst(firstMsg) {
    if (!firstMsg) return null;
    
    try {
      const all = Array.from(document.querySelectorAll(this.SEL_USER_BUBBLE));
      let node = firstMsg.parentElement;
      while (node && node !== document.body) {
        let allInside = true;
        for (let i = 0; i < all.length; i++) {
          if (!node.contains(all[i])) {
            allInside = false;
            break;
          }
        }
        if (allInside) return node;
        node = node.parentElement;
      }
    } catch {}
    
    return firstMsg.parentElement || null;
  }

  // 收集用户节点 - 使用优先级策略（参考 refer-extension）
  collectUserNodes() {
    const root = this.conversationContainer || document;
    
    // 尝试重新获取对话容器如果为空
    if (!this.conversationContainer) {
      const userElements = document.querySelectorAll(this.SEL_USER_BUBBLE);
      if (userElements.length > 0) {
        this.conversationContainer = this.findConversationRootFromFirst(userElements[0]);
      }
    }
    
    // Priority 1: bubble itself (最优先)
    try {
      const bubbles = Array.from(root.querySelectorAll('.user-query-bubble-with-background')).filter(n => this.hasUserText(n));
      if (bubbles.length) return bubbles;
    } catch {}
    
    // Priority 2: right-aligned user container
      try {
      const rights = Array.from(root.querySelectorAll('.user-query-container.right-align-content')).filter(n => this.hasUserText(n));
      if (rights.length) return rights;
      } catch {}
    
    // Priority 3: custom element
    try {
      const tags = Array.from(root.querySelectorAll('user-query')).filter(n => this.hasUserText(n));
      if (tags.length) return tags;
    } catch {}
    
    return [];
  }

  // 检查元素是否包含用户文本
  hasUserText(el) {
    try {
      const line = el.querySelector('.query-text .query-text-line');
      if (line && line.textContent) {
        return String(line.textContent).trim().length > 0;
      }
    } catch {}
    
    try {
      const t = (el.textContent || '').replace(/\s+/g, ' ').trim();
      return t.length > 0;
    } catch { return false; }
  }

  // 提取用户摘要
  extractUserSummary(el) {
    try {
      const line = el.querySelector('.query-text .query-text-line');
      if (line && line.textContent) {
        return String(line.textContent).replace(/\s+/g, ' ').trim();
      }
    } catch {}
    
    try {
      return String(el.textContent || '').replace(/\s+/g, ' ').trim();
    } catch { return ''; }
  }

  // 提取 AI 回答摘要
  extractAIResponse(el) {
    try {
      // 寻找 AI 回答的容器（Gemini 将用户和 AI 消息放在同一个对话块中，AI 回答通常是用户消息的后续内容）
      // 查找包含 AI 回答的容器
      const aiResponseContainers = [
        '.model-response-container',
        '.response-container',
        '.model-response-wrapper',
        '[data-testid="model-response"]'
      ];
      
      let aiResponse = null;
      
      // 先尝试在当前消息的父容器中查找 AI 回答
      const parent = el.parentElement;
      if (parent) {
        for (const selector of aiResponseContainers) {
          const response = parent.querySelector(selector);
          if (response) {
            aiResponse = response;
            break;
          }
        }
      }
      
      // 如果没找到，尝试查找所有 AI 回答元素，然后找到与当前用户消息匹配的那一个
      if (!aiResponse) {
        const allResponses = document.querySelectorAll(aiResponseContainers.join(','));
        const allUserMessages = this.collectUserNodes();
        const currentIndex = allUserMessages.indexOf(el);
        
        if (currentIndex !== -1 && allResponses[currentIndex]) {
          aiResponse = allResponses[currentIndex];
        }
      }
      
      if (aiResponse) {
        // 优先从特定类中提取文本
        const responseTextSelectors = [
          '.model-response-content',
          '.response-text',
          '[role="paragraph"]',
          '.text-content',
          '.model-response'
        ];
        
        for (const selector of responseTextSelectors) {
          const responseText = aiResponse.querySelector(selector);
          if (responseText && responseText.textContent) {
            const text = String(responseText.textContent || '').replace(/\s+/g, ' ').trim();
            return text.length > 100 ? text.substring(0, 100) + '...' : text;
          }
        }
        
        // 否则提取所有文本
        const text = String(aiResponse.textContent || '').replace(/\s+/g, ' ').trim();
        return text.length > 100 ? text.substring(0, 100) + '...' : text;
      }
    } catch (error) {
      console.error('Gemini Timeline: Error extracting AI response:', error);
    }
    
    return '等待回复...';
  }

  // 获取所有消息
  getAllMessages() {
    const userNodes = this.collectUserNodes();
    const messages = [];
    
    userNodes.forEach((userNode, index) => {
      const userQuery = this.extractUserSummary(userNode);
      const aiResponse = this.extractAIResponse(userNode);
      
      messages.push({
        id: `gemini-${index}-${Date.now()}`,
        userQuery: userQuery,
        geminiResponse: aiResponse,
        userElement: userNode
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
    console.log('Gemini Timeline: DOMContentLoaded, starting initialization');
    new GeminiTimeline();
  }, 1000);
});

// 同时监听页面加载完成事件，确保在各种情况下都能初始化
window.addEventListener('load', () => {
  setTimeout(() => {
    // 检查是否已初始化
    if (!document.getElementById('gemini-timeline')) {
      console.log('Gemini Timeline: Window loaded, starting initialization');
      new GeminiTimeline();
    }
  }, 2000);
});