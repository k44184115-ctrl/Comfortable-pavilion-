// --- Configuration & State ---
const STATE = {
  data: null,
  filteredArticles: [], // Currently visible articles based on search
  activeSection: null
};

// --- Heuristic AI Engine (Offline Violation Detector) ---
class ViolationDetector {
  constructor(keywordsMap) {
    this.keywordsMap = keywordsMap;
    // Normalize keys and values for faster lookup
    this.normalizer = new Intl.Collator('ru', { sensitivity: 'base' });
  }

  /**
   * Analyzes raw user input to find potential violations
   * @param {string} input - The messy user text
   * @returns {Array<{category: string, confidence: number, matchedWords: string[]}>}
   */
  analyze(input) {
    if (!input || input.trim().length === 0) return [];
    
    const lowerInput = input.toLowerCase();
    const results = [];

    for (const [category, keywords] of Object.entries(this.keywordsMap)) {
      let matches = [];
      let score = 0;

      for (const word of keywords) {
        // Simple substring match for slang flexibility
        if (lowerInput.includes(word)) {
          matches.push(word);
          score += 1;
        }
      }

      if (score > 0) {
        // Confidence heuristic: more unique keyword hits = higher confidence
        // Cap at 1.0
        const confidence = Math.min(score / 3, 1.0); 
        results.push({
          category,
          confidence,
          matchedWords: [...new Set(matches)]
        });
      }
    }

    // Sort by confidence descending
    return results.sort((a, b) => b.confidence - a.confidence);
  }

  /**
   * Maps violation categories to Article Numbers from the Codex
   */
  mapToArticles(violations, sections) {
    const articleMapping = {
      'insult': ['40'],
      'bullying': ['41'],
      'porn': ['42', '42.1'],
      'shock': ['43', '43.1'],
      'spam': ['45', '47'],
      'phishing': ['46'],
      'doxxing': ['48'],
      'drug': ['44'],
      'suicide': ['44'],
      'threat': ['51'],
      'corruption': ['55']
    };

    const recommendedArticles = new Set();
    violations.forEach(v => {
      const arts = articleMapping[v.category];
      if (arts) arts.forEach(a => recommendedArticles.add(a));
    });

    return Array.from(recommendedArticles);
  }
}

// --- Visual Effects: Neural Network Canvas ---
class NeuralBackground {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    this.ctx = this.canvas.getContext('2d');
    this.nodes = [];
    this.animationFrame = null;
    this.resizeHandler = this.resize.bind(this);
    
    window.addEventListener('resize', this.resizeHandler);
    this.initNodes();
    this.animate();
  }

  resize() {
    this.width = this.canvas.width = window.innerWidth;
    this.height = this.canvas.height = window.innerHeight;
    this.initNodes(); // Re-distribute nodes on resize
  }

  initNodes() {
    this.nodes = [];
    const nodeCount = Math.floor((this.width * this.height) / 15000); // Density control
    
    for (let i = 0; i < nodeCount; i++) {
      this.nodes.push({
        x: Math.random() * this.width,
        y: Math.random() * this.height,
        vx: (Math.random() - 0.5) * 0.5,
        vy: (Math.random() - 0.5) * 0.5,
        radius: Math.random() * 2 + 1
      });
    }
  }

  animate() {
    this.ctx.clearRect(0, 0, this.width, this.height);
    
    // Draw connections first
    this.ctx.strokeStyle = 'rgba(0, 240, 255, 0.15)';
    this.ctx.lineWidth = 0.5;
    
    for (let i = 0; i < this.nodes.length; i++) {
      for (let j = i + 1; j < this.nodes.length; j++) {
        const dx = this.nodes[i].x - this.nodes[j].x;
        const dy = this.nodes[i].y - this.nodes[j].y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        
        if (dist < 150) {
          this.ctx.beginPath();
          this.ctx.moveTo(this.nodes[i].x, this.nodes[i].y);
          this.ctx.lineTo(this.nodes[j].x, this.nodes[j].y);
          this.ctx.stroke();
        }
      }
      
      // Update position
      const node = this.nodes[i];
      node.x += node.vx;
      node.y += node.vy;
      
      // Bounce off edges
      if (node.x < 0 || node.x > this.width) node.vx *= -1;
      if (node.y < 0 || node.y > this.height) node.vy *= -1;
      
      // Draw Node
      this.ctx.fillStyle = '#00f0ff';
      this.ctx.shadowBlur = 10;
      this.ctx.shadowColor = '#00f0ff';
      this.ctx.beginPath();
      this.ctx.arc(node.x, node.y, node.radius, 0, Math.PI * 2);
      this.ctx.fill();
      this.ctx.shadowBlur = 0; // Reset shadow for lines
    }
    
    this.animationFrame = requestAnimationFrame(() => this.animate());
  }
  
  destroy() {
    cancelAnimationFrame(this.animationFrame);
    window.removeEventListener('resize', this.resizeHandler);
  }
}

// --- Core Application Logic ---

async function initApp() {
  try {
    // Fetch Data
    const response = await fetch('./data.json');
    if (!response.ok) throw new Error('Failed to load codex data');
    STATE.data = await response.json();
    
    // Initialize Components
    renderHero(STATE.data.meta);
    renderNavigation(STATE.data.sections);
    renderCodex(STATE.data.sections);
    
    // Setup Interactions
    setupSearch();
    setupScrollSpy();
    
    // Start Visuals
    new NeuralBackground('neural-net-canvas');
    
    console.log("Comfortable Pavilion System Online.");
  } catch (error) {
    console.error("Critical Failure:", error);
    document.body.innerHTML = `<div style="color:red;padding:20px;font-family:monospace;">ERROR: ${error.message}</div>`;
  }
}

function renderHero(meta) {
  const heroTitle = document.querySelector('.hero-title');
  const subtitle = document.querySelector('.hero-subtitle');
  const badge = document.querySelector('.version-badge');
  
  if(heroTitle) heroTitle.textContent = meta.title;
  if(subtitle) subtitle.textContent = meta.subtitle;
  if(badge) badge.textContent = `v${meta.version}`;
}

function renderNavigation(sections) {
  const navContainer = document.querySelector('.nav-chips');
  if(!navContainer) return;
  
  navContainer.innerHTML = '';
  sections.forEach(sec => {
    const link = document.createElement('a');
    link.href = `#section-${sec.id}`;
    link.className = 'chip';
    link.textContent = sec.id;
    link.dataset.target = `section-${sec.id}`;
    navContainer.appendChild(link);
  });
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function highlightKeywords(text, query) {
  if (!query) return escapeHtml(text);
  
  const escapedQuery = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const regex = new RegExp(`(${escapedQuery})`, 'gi');
  
  // Split by regex to preserve structure but inject marks
  // Note: This is a simple implementation. For production, use DOMParser.
  return escapeHtml(text).replace(regex, '<mark class="highlight">$1</mark>');
}

function getViolationClass(category) {
  switch(category) {
    case 'insult': case 'bullying': return 'mark-insult';
    case 'porn': case 'shock': case 'phishing': case 'doxxing': case 'threat': return 'mark-ban';
    case 'spam': case 'drug': case 'suicide': return 'mark-warn';
    case 'mute': return 'mark-mute';
    default: return '';
  }
}

function renderArticle(article, detector, currentQuery) {
  const card = document.createElement('article');
  card.className = 'article-card';
  card.id = `art-${article.num}`;
  
  // Check for violations in this specific article text using our heuristic engine
  // We only run heavy analysis if there's no global search query filtering us out already
  // Or we can pre-analyze. Let's do dynamic highlighting for the "AI" feel.
  
  let processedText = article.text;
  
  // If user typed something, highlight it
  if (currentQuery) {
     processedText = highlightKeywords(processedText, currentQuery);
  } else {
     processedText = escapeHtml(processedText);
  }

  // Detect penalties mentioned in text and style them
  // Regex to find words like "бан", "варн", "мут"
  const penaltyRegex = /\b(бан|варн|мут)\b/gi;
  processedText = processedText.replace(penaltyRegex, (match, p1) => {
    const type = p1.toLowerCase();
    let cls = 'mark-warn';
    if(type === 'бан') cls = 'mark-ban';
    if(type === 'мут') cls = 'mark-mute';
    return `<span class="${cls}">${p1.toUpperCase()}</span>`;
  });

  card.innerHTML = `
    <div class="article-number">Ст. ${escapeHtml(article.num)}</div>
    <div class="article-text">${processedText}</div>
  `;
  
  return card;
}

function renderCodex(sections) {
  const mainContent = document.querySelector('main');
  if(!mainContent) return;
  
  mainContent.innerHTML = '';
  
  sections.forEach(section => {
    const sectionEl = document.createElement('section');
    sectionEl.id = `section-${section.id}`;
    
    const header = document.createElement('div');
    header.className = 'section-header';
    header.innerHTML = `
      <span class="section-id">${section.id}</span>
      <h2 class="section-title">${escapeHtml(section.title)}</h2>
    `;
    sectionEl.appendChild(header);
    
    section.articles.forEach(article => {
      // Pass dummy detector here as we don't need full AI analysis per render unless searching
      const card = renderArticle(article, null, '');
      sectionEl.appendChild(card);
    });
    
    mainContent.appendChild(sectionEl);
  });
}

function setupSearch() {
  const input = document.getElementById('search-query');
  const hint = document.querySelector('.ai-hint');
  const cards = document.querySelectorAll('.article-card');
  const sections = document.querySelectorAll('section');
  
  if(!input) return;

  // Debounce helper
  let timeout;
  
  input.addEventListener('input', (e) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => {
      handleSearch(e.target.value.trim(), cards, sections, hint);
    }, 300);
  });
  
  // Keyboard shortcut '/' to focus
  document.addEventListener('keydown', (e) => {
    if (e.key === '/' && document.activeElement !== input) {
      e.preventDefault();
      input.focus();
    }
  });
}

function handleSearch(query, cards, sections, hint) {
  const normalizedQuery = query.toLowerCase();
  
  if (!normalizedQuery) {
    // Reset view
    cards.forEach(c => c.style.display = 'block');
    sections.forEach(s => s.style.display = 'block');
    hint.classList.remove('visible');
    hint.textContent = "";
    return;
  }

  // 1. Filter Articles by Text Match
  let visibleCount = 0;
  cards.forEach(card => {
    const text = card.innerText.toLowerCase();
    if (text.includes(normalizedQuery)) {
      card.style.display = 'block';
      card.classList.add('highlighted');
      visibleCount++;
    } else {
      card.style.display = 'none';
      card.classList.remove('highlighted');
    }
  });

  // 2. Hide Empty Sections
  sections.forEach(section => {
    const hasVisibleCards = section.querySelector('.article-card:not([style*="display: none"])');
    if (hasVisibleCards) {
      section.style.display = 'block';
    } else {
      section.style.display = 'none';
    }
  });

  // 3. AI Analysis Mode (If query looks like natural language description of a crime)
  // Heuristic: If query length > 10 chars and contains verbs/nouns typical of complaints
  detectAndSuggestViolations(query, hint);
}

function detectAndSuggestViolations(userInput, hintElement) {
  if (!STATE.data || !STATE.data.keywords_map) return;
  
  const detector = new ViolationDetector(STATE.data.keywords_map);
  const violations = detector.analyze(userInput);
  
  if (violations.length > 0) {
    const topViolation = violations[0];
    const relatedArticles = detector.mapToArticles(violations, STATE.data.sections);
    
    hintElement.innerHTML = `🤖 AI Анализ: Вероятное нарушение категории "<strong>${topViolation.category}</strong>". Соответствующие статьи: <code>${relatedArticles.join(', ')}</code>. Уверенность: ${(topViolation.confidence * 100).toFixed(0)}%`;
    hintElement.classList.add('visible');
  } else {
    hintElement.classList.remove('visible');
  }
}

function setupScrollSpy() {
  const chips = document.querySelectorAll('.chip');
  const sections = document.querySelectorAll('section');
  
  const observerOptions = {
    rootMargin: '-20% 0px -60% 0px', // Trigger when section is near top/middle
    threshold: 0
  };

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const id = entry.target.id;
        chips.forEach(chip => {
          chip.classList.toggle('active', chip.dataset.target === id);
        });
      }
    });
  }, observerOptions);

  sections.forEach(sec => observer.observe(sec));
}

// Boot
document.addEventListener('DOMContentLoaded', initApp);
