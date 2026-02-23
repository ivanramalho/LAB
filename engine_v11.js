document.addEventListener('DOMContentLoaded', () => {
    // --- Interactive Background Lights ---
    const orbs = document.querySelectorAll('.orb');
    const portal = document.querySelector('.glow-portal');

    document.addEventListener('mousemove', (e) => {
        const { clientX, clientY } = e;

        // Spotlight Variables
        const mouseX = (clientX / window.innerWidth) * 100;
        const mouseY = (clientY / window.innerHeight) * 100;
        document.documentElement.style.setProperty('--mouse-x', `${mouseX}%`);
        document.documentElement.style.setProperty('--mouse-y', `${mouseY}%`);

        // Micro-lighting for elements
        const targets = document.querySelectorAll('.interactive-light');
        targets.forEach(target => {
            const rect = target.getBoundingClientRect();
            const x = clientX - rect.left;
            const y = clientY - rect.top;
            target.style.setProperty('--rel-x', `${x}px`);
            target.style.setProperty('--rel-y', `${y}px`);
        });

        // Parallax Effects
        const x = (clientX / window.innerWidth - 0.5) * 40;
        const y = (clientY / window.innerHeight - 0.5) * 40;

        orbs.forEach((orb, index) => {
            const factor = (index + 1) * 0.5;
            orb.style.transform = `translate(${x * factor}px, ${y * factor}px)`;
        });

        if (portal) {
            portal.style.transform = `translateX(calc(-50% + ${-x * 0.4}px)) translateY(${-y * 0.2}px)`;
        }
    });

    document.addEventListener('scroll', () => {
        const scrolled = window.scrollY;
        orbs.forEach((orb, index) => {
            const speed = (index + 1) * 0.2;
            orb.style.top = (index * 20 - scrolled * speed) + 'px';
        });
    });

    // --- Login System ---
    const loginScreen = document.getElementById('login-screen');
    const loginStep1 = document.getElementById('login-step-1');
    const loginStep2 = document.getElementById('login-step-2');

    const userForm = document.getElementById('user-form');
    const userInput = document.getElementById('user-name');

    const projectForm = document.getElementById('project-form');
    const projectInput = document.getElementById('project-name');
    const backToUserBtn = document.getElementById('back-to-user');
    const switchProjectBtn = document.getElementById('switch-project-btn');

    const recentProjectsContainer = document.getElementById('recent-projects-container');
    const recentProjectsList = document.getElementById('recent-projects-list');

    const logoutBtn = document.getElementById('logout-btn');

    const appHeader = document.querySelector('.app-header');
    const appMain = document.querySelector('.app-main');
    const currentProjectDisplay = document.getElementById('current-project-display');

    let currentUser = localStorage.getItem('creativeLab_lastUser') || '';
    let currentProject = localStorage.getItem('creativeLab_lastProject') || '';
    let appInitialized = false; // Guard to prevent double event listeners

    // Switch Project Handler
    switchProjectBtn.addEventListener('click', () => {
        openEntryScreen(true);
    });

    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            // Clear current project, but keep last user name for convenience
            localStorage.removeItem('creativeLab_lastProject');
            openEntryScreen(false);
        });
    }

    function openEntryScreen(keepUser = true) {
        loginScreen.style.display = 'flex';
        setTimeout(() => {
            loginScreen.style.opacity = '1';
        }, 10);

        if (keepUser) {
            loginStep1.classList.add('hidden');
            loginStep2.classList.remove('hidden');
            renderRecentProjects();
            projectInput.focus();
        } else {
            loginStep2.classList.add('hidden');
            loginStep1.classList.remove('hidden');
            userInput.focus();
        }

        appHeader.classList.add('hidden');
        appMain.classList.add('hidden');
    }

    // Auto-fill User if available
    if (currentUser) {
        userInput.value = currentUser;
    }

    // Auto-restore full session: if we have both user and project, re-enter directly
    if (currentUser && currentProject) {
        // Skip login screens and go directly to their workspace
        enterLab(currentProject);
    }

    // Step 1: User Name
    userForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const name = userInput.value.trim();
        if (name) {
            currentUser = name;
            localStorage.setItem('creativeLab_lastUser', currentUser);

            // Transition to Step 2
            loginStep1.classList.add('hidden');
            loginStep2.classList.remove('hidden');
            renderRecentProjects(); // Show history
            projectInput.focus();
        }
    });

    // Back Button
    backToUserBtn.addEventListener('click', () => {
        loginStep2.classList.add('hidden');
        loginStep1.classList.remove('hidden');
        userInput.focus();
    });

    // Step 2: Project Name
    projectForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const projectName = projectInput.value.trim();
        if (projectName) {
            enterLab(projectName);
        }
    });

    // Recent Projects Logic
    function getRecentProjects() {
        if (!currentUser) return [];
        return JSON.parse(localStorage.getItem(`creativeLab_${currentUser}_recentProjects`)) || [];
    }

    function addToRecents(projectName) {
        if (!currentUser) return;
        let recents = getRecentProjects();
        // Remove if exists (to move to top)
        recents = recents.filter(p => p.toLowerCase() !== projectName.toLowerCase());
        // Add to top
        recents.unshift(projectName);
        // Limit to 10
        if (recents.length > 10) recents.pop();

        localStorage.setItem(`creativeLab_${currentUser}_recentProjects`, JSON.stringify(recents));
    }

    function renderRecentProjects() {
        if (!currentUser) return;

        // Strictly use user-scoped recents
        const recents = getRecentProjects();

        if (recents.length === 0) {
            recentProjectsContainer.classList.add('hidden');
            return;
        }

        recentProjectsContainer.classList.remove('hidden');
        recentProjectsList.innerHTML = '';

        recents.forEach(proj => {
            const chip = document.createElement('div');
            chip.className = 'recent-chip';
            chip.textContent = proj;
            chip.addEventListener('click', () => {
                projectInput.value = proj;
                enterLab(proj);
            });
            recentProjectsList.appendChild(chip);
        });
    }

    function getProjectKey(projectName) {
        if (!currentUser || !projectName) {
            console.warn('[CreativeLab] getProjectKey called with empty user or project.');
            return `creativeLab__fallback_project_`;
        }
        const userSlug = currentUser.trim().toLowerCase().replace(/\s+/g, '_');
        const projectSlug = projectName.trim().toLowerCase().replace(/\s+/g, '_');
        return `creativeLab_${userSlug}_project_${projectSlug}`;
    }

    function enterLab(projectName) {
        currentProject = projectName;
        addToRecents(currentProject); // Save to user-scoped history
        localStorage.setItem('creativeLab_lastProject', currentProject);

        // Update UI
        currentProjectDisplay.textContent = `| ${currentProject}`;

        // Hide Login, Show App
        loginScreen.style.opacity = '0';
        setTimeout(() => {
            loginScreen.style.display = 'none';
            appHeader.classList.remove('hidden');
            appMain.classList.remove('hidden');

            if (!appInitialized) {
                initializeApp(); // First time: registers all event listeners + loads data
            } else {
                // On project switch: ONLY reload data, do not re-register listeners
                window.loadProjectData();
            }
        }, 500);
    }

    function initializeApp() {
        // --- Navigation / Tabs ---
        // Only register nav listeners ONCE to avoid stacking handlers on project switch
        if (!appInitialized) {
            const navBtns = document.querySelectorAll('.nav-btn');
            const tabContents = document.querySelectorAll('.tab-content');

            navBtns.forEach(btn => {
                btn.addEventListener('click', () => {
                    const tabId = btn.getAttribute('data-tab');
                    navBtns.forEach(b => b.classList.remove('active'));
                    btn.classList.add('active');
                    tabContents.forEach(content => {
                        content.classList.remove('active');
                        if (content.id === tabId) content.classList.add('active');
                    });
                });
            });

            appInitialized = true;
        }

        // --- Campaign Concepts (AI Analysis) ---
        const conceptForm = document.getElementById('concept-form');
        const analyzeBtn = document.getElementById('analyze-btn');
        const enhanceBtn = document.getElementById('enhance-btn');
        const saveBtn = document.getElementById('save-concept-btn');
        const analysisResult = document.getElementById('analysis-result');
        const aiScoreDisplay = document.getElementById('ai-score');
        const aiFeedbackDisplay = document.getElementById('ai-feedback');
        const conceptsList = document.getElementById('concepts-list');
        const enhanceProposal = document.getElementById('enhance-proposal');
        const proposedTextElem = document.getElementById('proposed-text');
        const applyEnhanceBtn = document.getElementById('apply-enhancement');
        const discardEnhanceBtn = document.getElementById('discard-enhancement');

        // --- Commercial Scripts ---
        const scriptForm = document.getElementById('script-form');
        const scriptsList = document.getElementById('scripts-list');
        const scriptBody = document.getElementById('script-body');
        const scriptTitle = document.getElementById('script-title');
        const scriptLogline = document.getElementById('script-logline');
        const analyzeScriptBtn = document.getElementById('analyze-script-btn');
        const enhanceScriptBtn = document.getElementById('enhance-script-btn');
        const saveScriptBtn = document.getElementById('save-script-btn');
        const scriptAnalysisResult = document.getElementById('script-analysis-result');
        const scriptAIScore = document.getElementById('script-ai-score');
        const scriptMetricsGrid = document.getElementById('script-metrics-grid');
        const scriptAIFeedback = document.getElementById('script-ai-feedback');
        const scriptEnhanceProposal = document.getElementById('script-enhance-proposal');
        const scriptProposedText = document.getElementById('script-proposed-text');
        const scriptProposalDesc = document.getElementById('script-proposal-desc');

        // Module-level data — these are re-loaded on every project enter
        let concepts = [];
        let scripts = [];
        let currentAnalysis = null;
        let currentScriptStyle = 'social';

        // --- KEY FUNCTIONS: always derive key from LIVE currentProject ---
        function getConceptsKey() { return getProjectKey(currentProject) + '_concepts'; }
        function getScriptsKey() { return getProjectKey(currentProject) + '_scripts'; }

        function saveConcepts() {
            localStorage.setItem(getConceptsKey(), JSON.stringify(concepts));
        }

        function saveScripts() {
            localStorage.setItem(getScriptsKey(), JSON.stringify(scripts));
        }

        // Load data for the CURRENT project (called every time user enters a project)
        window.loadProjectData = function () {
            concepts = JSON.parse(localStorage.getItem(getConceptsKey())) || [];
            scripts = JSON.parse(localStorage.getItem(getScriptsKey())) || [];
            renderConcepts();
            renderScripts();
            // Reset UI state
            analysisResult.classList.add('hidden');
            enhanceProposal.classList.add('hidden');
            saveBtn.style.display = 'none';
            scriptAnalysisResult.classList.add('hidden');
            scriptEnhanceProposal.classList.add('hidden');
            saveScriptBtn.style.display = 'none';
        };

        // Register all event listeners ONCE
        enhanceBtn.addEventListener('click', () => {
            const descInput = document.getElementById('concept-desc');
            const desc = descInput.value.trim();
            if (!desc) { alert('Please enter a description to enhance.'); return; }
            enhanceBtn.classList.add('loading');
            enhanceBtn.disabled = true;
            setTimeout(() => {
                const result = performProfessionalOptimization(desc);
                if (result.startsWith('REJECTION:')) {
                    alert(result.replace('REJECTION:', '').trim());
                    enhanceBtn.classList.remove('loading');
                    enhanceBtn.disabled = false;
                    return;
                }
                proposedTextElem.value = result;
                enhanceProposal.classList.remove('hidden');
                enhanceBtn.classList.remove('loading');
                enhanceBtn.disabled = false;
                enhanceProposal.scrollIntoView({ behavior: 'smooth' });
            }, 1200);
        });

        applyEnhanceBtn.addEventListener('click', () => {
            const descInput = document.getElementById('concept-desc');
            descInput.value = proposedTextElem.value;
            enhanceProposal.classList.add('hidden');
            descInput.style.borderColor = 'var(--accent-color)';
            setTimeout(() => descInput.style.borderColor = '', 1000);
        });

        discardEnhanceBtn.addEventListener('click', () => enhanceProposal.classList.add('hidden'));

        function performProfessionalOptimization(text) {
            const lowerText = text.toLowerCase();

            // 1. Strict Validation: Reject low-effort 'garbage' inputs
            if (text.length < 15 || text.split(/\s+/).length < 3) {
                return "REJECTION: Input too shallow for professional enhancement. Agency AI requires at least a basic concept (minimum 15 characters/3 words) to generate strategic value.";
            }

            const strategies = [
                {
                    key: "narrative",
                    advice: "Disrupt the category through a non-linear narrative arc.",
                    angles: [
                        "Introduce a third-act revelation that flips the brand's perceived role.",
                        "Ground the story in a character flaw that only the brand can resolve.",
                        "Use a 'Revisionist History' lens to challenge established industry norms."
                    ],
                    render: (t, v) => `STRATEGIC REVISION: ${t}\n\nDIRECTION: ${v}\n\nACTION: Implement a 'Fourth Wall' break where the audience is invited to deconstruct the message.`
                },
                {
                    key: "digital",
                    advice: "Scale through a digital-first interactive ecosystem.",
                    angles: [
                        "Create a gamified community challenge that rewards brand-centric creativity.",
                        "Deploy a custom AR filter that transforms ordinary moments into brand experiences.",
                        "Integrate a 'Dark Social' strategy using exclusive messaging channels for top advocates."
                    ],
                    render: (t, v) => `DIGITAL ECOSYSTEM: ${t}\n\nOPPORTUNITY: ${v}\n\nTECH-STACK: High-fidelity AR assets and a decentralized community ledger.`
                },
                {
                    key: "sensory",
                    advice: "Elevate the visualization through visceral sensory triggers.",
                    angles: [
                        "Utilize macro cinematography and ASMR-grade sound design for physical impact.",
                        "Implement a minimalist palette that emphasizes product texture and premium weight.",
                        "Focus on the 'Iconic Void'—letting the product breathe in a high-contrast environment."
                    ],
                    render: (t, v) => `SENSORY UPGRADE: ${v}\n\nVISUAL CORE: ${t.substring(0, 30)}... re-imagined through high-speed phantom photography.`
                },
                {
                    key: "human",
                    advice: "Anchor the concept in a deeper, unarticulated human truth.",
                    angles: [
                        "Shift focus from features to the universal fear of missing out on connection.",
                        "Mirror a common daily frustration and show the brand as the unexpected silence.",
                        "Ground the concept in a cultural tension that the brand dares to address directly."
                    ],
                    render: (t, v) => `HUMAN TRUTH: ${v}\n\nCONCEPT REFINED: ${t}\n\nNOTE: Move from 'selling' a product to 'solving' a behavioral dilemma.`
                },
                {
                    key: "meta",
                    advice: "Deconstruct the advertising medium itself for higher authenticity.",
                    angles: [
                        "Acknowledge the consumer's cynicism by being brutally honest about the brand's goal.",
                        "Use a 'behind-the-scenes' aesthetic that feels unpolished and authentic.",
                        "Avert standard tropes by creating a parody of the brand's own category."
                    ],
                    render: (t, v) => `META DIRECTION: ${v}\n\nREFINED WORK: ${t}\n\nSTRATEGY: Build trust through radical transparency.`
                }
            ];

            // Match keyword or pick random
            let strategy = strategies.find(s => lowerText.includes(s.key)) || strategies[Math.floor(Math.random() * strategies.length)];
            let specificAngle = strategy.angles[Math.floor(Math.random() * strategy.angles.length)];

            return strategy.render(text, specificAngle);
        }

        analyzeBtn.addEventListener('click', () => {
            const title = document.getElementById('concept-title').value.trim();
            const desc = document.getElementById('concept-desc').value.trim();
            if (!title || !desc) { alert('Please fill in both title and description to analyze.'); return; }
            analyzeBtn.classList.add('loading');
            analyzeBtn.disabled = true;
            analysisResult.classList.add('hidden');
            saveBtn.style.display = 'none';
            setTimeout(() => {
                const result = performHeuristicAnalysis(title, desc);
                currentAnalysis = { ...result, title: title, desc: desc };
                animateMetric('m-insight', result.metrics.insight);
                animateMetric('m-execution', result.metrics.execution);
                animateMetric('m-innovation', result.metrics.innovation);
                animateMetric('m-impact', result.metrics.impact);
                aiScoreDisplay.textContent = result.score;
                aiFeedbackDisplay.textContent = result.feedback;
                analyzeBtn.classList.remove('loading');
                analyzeBtn.disabled = false;
                analysisResult.classList.remove('hidden');
                saveBtn.style.display = 'block';
                analysisResult.scrollIntoView({ behavior: 'smooth' });
            }, 1500);
        });

        function animateMetric(id, value) {
            const bar = document.getElementById(id);
            bar.style.width = '0%';
            setTimeout(() => { bar.style.width = (value * 10) + '%'; }, 100);
        }

        function performHeuristicAnalysis(title, desc) {
            const combined = (title + " " + desc).toLowerCase().trim();
            const words = combined.split(/\s+/).filter(w => w.length > 2);
            const wordCount = words.length;

            // 1. Nuclear Rejections (URL, Spam, Script)
            const urlPattern = /https?:\/\/[^\s]+|\w+\.(com|net|io|org|gov|edu|me|github|br)\b/i;
            const scriptMarkers = [/\bfade in\b/i, /\bext\.\b/i, /\bint\.\b/i, /\bcene\b/i, /\bcut to\b/i, /\btitle card\b/i];

            const isURL = urlPattern.test(combined);
            const isActuallyAScript = scriptMarkers.some(m => m.test(combined));
            const isSpam = /^(.)\1+$/.test(combined.replace(/\s+/g, ''));
            const uniqueWords = new Set(words).size;
            const repetitionRatio = wordCount > 0 ? uniqueWords / wordCount : 0;

            if (isURL || isActuallyAScript || combined.length < 120 || wordCount < 20 || isSpam || repetitionRatio < 0.7) {
                let reason = "This input lacks the strategic complexity required for agency-grade analysis.";
                if (isURL) reason = "URLs/Links are not campaign concepts. Describe your strategy.";
                if (isActuallyAScript) reason = "This is a script. Use the Script Analyzer for this content.";
                if (wordCount < 20) reason = "Input too brief. Proessional concepts require detailed reasoning (min 20 words).";

                return {
                    score: 0.1,
                    feedback: `REJECTED: ${reason} (High-Density Rigor: Fail)`,
                    metrics: { insight: 0.1, execution: 0.1, innovation: 0.1, impact: 0.1 }
                };
            }

            // 2. Mandatory Strategic Pillars (McCann/Ogilvy Rigor)
            const targetMarkers = ['target', 'audiência', 'audiencia', 'público', 'publico', 'persona', 'segmento', 'consumidor', 'audience'];
            const purposeMarkers = ['objetivo', 'desafio', 'meta', 'kpi', 'entrega', 'objective', 'purpose', 'goal'];
            const insightMarkers = ['insight', 'verdade', 'tensão', 'tensao', 'tension', 'truth', 'comportamento', 'dilema', 'porque', 'because', 'why', 'hábito', 'habito'];
            const innovationMarkers = ['stunt', 'ativacao', 'interactive', 'experiência', 'experiencia', 'disruptivo', 'stunt', 'digital-first', 'innovation', 'ar/vr', 'ooh'];

            let hasTarget = words.some(w => targetMarkers.some(m => w.includes(m)));
            let hasPurpose = words.some(w => purposeMarkers.some(m => w.includes(m)));
            let hasInsight = words.some(w => insightMarkers.some(m => w.includes(m)));
            let hasInnovation = words.some(w => innovationMarkers.some(m => w.includes(m)));

            // 3. Scoring Engine (Base Score starts very low)
            let meritWords = ['disruptive', 'authentic', 'narrative', 'sustainable', 'paradigm', 'ecosystem', 'identidade', 'estratégico', 'reativa', 'proativa', 'impacto'];
            let buzzwords = ['diferente', 'legal', 'top', 'incrível', 'amazing', 'nice', 'good', 'cool', 'muito', 'bem'];

            let meritCount = words.filter(w => meritWords.includes(w)).length;
            let buzzCount = words.filter(w => buzzwords.includes(w)).length;
            let buzzPenalty = buzzCount > meritCount ? (buzzCount - meritCount) * 1.5 : 0;

            const metrics = {
                insight: Math.min(9.8, (hasInsight ? 2.5 : 0.1) + (hasTarget ? 0.8 : 0) - (buzzPenalty * 1.5)),
                execution: Math.min(9.8, (hasPurpose ? 2.0 : 0.1) + (desc.length / 2500)),
                innovation: Math.min(9.5, (hasInnovation ? 3.0 : 0.0) + (hasInsight ? 0.5 : 0)),
                impact: Math.min(9.6, (hasTarget && hasPurpose ? 3.0 : 0.2) + (wordCount / 100))
            };

            Object.keys(metrics).forEach(k => {
                metrics[k] = Math.max(0.1, parseFloat(metrics[k].toFixed(1)));
            });

            const avg = (metrics.insight + metrics.execution + metrics.innovation + metrics.impact) / 4;
            let score = parseFloat(avg.toFixed(1));

            // THE BRUTAL CEILINGS (Extreme Professional Rigor)
            if (!hasTarget || !hasPurpose || !hasInsight) {
                // If missing ANY core pillar, the campaign cannot pass the "Professional Floor"
                score = Math.min(score, 2.8);
            } else if (!hasInnovation) {
                // If it has foundation but no "Spark", it can't be a Gold/Silver campaign
                score = Math.min(score, 4.5);
            } else if (buzzCount > meritCount) {
                // Buzzword-heavy generic fluff
                score = Math.min(score, 3.2);
            }

            // Word Diversity Bonus / Penalty
            if (repetitionRatio < 0.75) score *= 0.8;

            let feedback = "";
            if (score >= 8.5) feedback = "OGILVY GOLD: Masterpiece level. Perfect alignment of insight, target, and disruption.";
            else if (score >= 6.0) feedback = "Agency Merit (Cannes Shortlist): Strong strategic foundation with clear execution innovation.";
            else if (score >= 4.0) feedback = "Professional Passable: Solid logic, but missing the 'Disruption' needed for major agencies.";
            else if (score >= 2.0) feedback = "Strategic Failure: Missing core pillars (Target, Objective, or Insight). Too generic.";
            else feedback = "Creative Rejection: This is a series of words, not a campaign strategy.";

            return { score, feedback, metrics };
        }



        // Save Concept
        conceptForm.addEventListener('submit', (e) => {
            e.preventDefault();
            if (!currentAnalysis) return;
            const newConcept = {
                id: Date.now(),
                title: document.getElementById('concept-title').value || currentAnalysis.title,
                desc: document.getElementById('concept-desc').value || currentAnalysis.desc,
                rating: currentAnalysis.score,
                feedback: currentAnalysis.feedback,
                author: currentUser,
                date: new Date().toLocaleDateString()
            };
            concepts.unshift(newConcept);
            saveConcepts();
            renderConcepts();
            conceptForm.reset();
            analysisResult.classList.add('hidden');
            saveBtn.style.display = 'none';
            currentAnalysis = null;
        });

        function renderConcepts() {
            conceptsList.innerHTML = '';
            concepts.forEach(concept => {
                const card = document.createElement('div');
                card.className = 'card interactive-light';
                card.innerHTML = `
                    <button class="card-delete" onclick="deleteConcept(${concept.id})">&times;</button>
                    <div class="card-header">
                        <h3 class="card-title">${concept.title || 'Untitled Concept'}</h3>
                        <span class="card-rating">${concept.rating}/10</span>
                    </div>
                    <div class="card-content-collapsed" id="concept-desc-${concept.id}">
                        <p class="card-body" style="margin: 0;">${concept.desc || 'No description provided.'}</p>
                    </div>
                    <button class="card-expand-btn" onclick="toggleExpand('concept-desc-${concept.id}', this)">👁️ View Full Text</button>
                    <div class="card-meta" style="color: var(--accent-color); margin-top: 0.5rem; font-size: 0.9rem;">
                        AI Note: "${concept.feedback || 'Legacy concept'}"
                    </div>
                    <div class="card-meta">
                        <span>Created: ${concept.date}</span>
                        <span style="float: right; color: var(--text-primary);">By ${concept.author || 'Unknown'}</span>
                    </div>
                `;
                conceptsList.appendChild(card);
            });
        }

        window.deleteConcept = (id) => {
            if (confirm('Delete this concept?')) {
                concepts = concepts.filter(c => c.id !== id);
                saveConcepts();
                renderConcepts();
            }
        };

        // Style Chip Selection
        const styleChips = document.querySelectorAll('.style-chip');
        styleChips.forEach(chip => {
            chip.addEventListener('click', () => {
                styleChips.forEach(c => c.classList.remove('active'));
                chip.classList.add('active');
                currentScriptStyle = chip.dataset.style;
                scriptAnalysisResult.classList.add('hidden');
                scriptEnhanceProposal.classList.add('hidden');
                saveScriptBtn.style.display = 'none';
            });
        });

        // Heuristic Logic for Scripts
        const scriptCategories = {
            social: {
                label: 'Social Media (TikTok/IG)',
                metrics: ['Hook Strength', 'Value Density', 'Pattern Interrupts', 'CTA Clarity'],
                advice: 'Focus on the first 3 seconds. Use punchy, conversational lines.'
            },
            youtube: {
                label: 'YouTube Content',
                metrics: ['Retention Flow', 'Intro Hook', 'Value Depth', 'Logic Chain'],
                advice: 'Ensure a strong hook in the first 15 seconds. Structure points clearly.'
            },
            animation: {
                label: 'Animation',
                metrics: ['Visual Detail', 'Dialogue Economy', 'Action Clarity', 'Timing'],
                advice: 'Show, don\'t tell. Keep dialogue minimal and visuals highly descriptive.'
            },
            shortfillm: {
                label: 'Short Film',
                metrics: ['Narrative Arc', 'Scene Economy', 'Subtext', 'Emotional Core'],
                advice: 'Enter scenes late and exit early. Focus on a single powerful conflict.'
            }
        };

        function analyzeScriptByStyle() {
            const bodyText = scriptBody.value.trim();
            if (!bodyText) return alert('Please write a script first.');
            scriptAnalysisResult.classList.remove('hidden');
            scriptAIFeedback.textContent = 'Analyzing script structure...';
            setTimeout(() => {
                const category = scriptCategories[currentScriptStyle];
                const result = computeScores(bodyText, currentScriptStyle);
                const scores = result.scores;
                const fluffFound = result.fluff;
                const isTooLong = result.tooLong;
                // Save the analyzed text for later
                scriptBody.dataset.lastAnalyzed = bodyText;
                scriptTitle.dataset.lastAnalyzed = scriptTitle.value;
                scriptLogline.dataset.lastAnalyzed = scriptLogline.value;

                scriptMetricsGrid.innerHTML = '';
                scores.forEach((val, i) => {
                    const label = category.metrics[i];
                    const barColor = val < 30 ? '#ff4757' : val < 60 ? '#ffa502' : (i === 0 || i === 2 ? 'var(--accent-color)' : 'var(--accent-blue)');
                    const item = document.createElement('div');
                    item.className = 'metric-item';
                    item.innerHTML = `
                        <div style="display: flex; justify-content: space-between; align-items: center;">
                            <span class="metric-label">${label}</span>
                            <span style="font-size: 0.8rem; font-weight: bold; color: ${barColor}">${val}%</span>
                        </div>
                        <div class="metric-value-wrap">
                            <div class="metric-fill" style="width: ${val}%; background: ${barColor}; box-shadow: 0 0 8px ${barColor}55;"></div>
                        </div>
                    `;
                    scriptMetricsGrid.appendChild(item);
                });

                const overall = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
                scriptAIScore.innerHTML = `${overall}<span class="score-label"> / 100</span>`;
                scriptAIScore.style.color = overall < 35 ? '#ff4757' : overall < 60 ? '#ffa502' : 'var(--accent-color)';

                let feedback = '';
                if (overall < 25) feedback = `❌ CRITICAL FAILURE: This is not a creative script. It reads like a list of instructions or generic notes. ${category.advice}`;
                else if (overall < 50) feedback = `📉 LOW MERIT: Too much technical focus, too little story weight. ${category.advice}`;
                else if (overall < 70) feedback = `📝 PASSABLE: Some foundation exists, but it lacks the 'punch' of professional work. ${category.advice}`;
                else feedback = `💎 PREMIUM LEVEL: Excellent balance of structure and narrative. ${category.advice}`;

                // Actionable Social Media Rigor
                if (isTooLong) {
                    feedback = `🛑 REJEIÇÃO TÉCNICA: Roteiro excessivamente longo para ${category.label}. Vídeos para redes sociais morrem após 45 segundos. Remova pelo menos ${Math.round(result.wordDelta)} palavras para ter chance de retenção.`;
                }

                // Add Heavy OBS for technical noise
                if (fluffFound.length > 0) {
                    const list = fluffFound.map(f => `• ${f}`).join('\n');
                    feedback += `\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n🔴 PARA CORRIGIR (REMOVER RUÍDO):\n${list}\n\n💡 OBS: Roteiros profissionais são escritos para ATORES e EDITORES, não para máquinas. Decisões de câmera e equipamento poluem a leitura e demonstram amadorismo. Remova essas referências e foque na emoção/ação.`;
                }

                scriptAIFeedback.textContent = feedback;
                saveScriptBtn.style.display = 'block';
            }, 1200);
        }

        function computeScores(text, style) {
            // Noise Filter: Strip out common template structures
            const noisePatterns = [
                /SHORT FILM — GENERATED STRUCTURE/gi,
                /Based on your idea: ".*"/gi,
                /━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━/g,
                /ACT \d — [A-Z ]+/g,
                /INT\. \[LOCATION\] — [A-Z\/ ]+/g,
                /EXT\. \[LOCATION\] — [A-Z\/ ]+/g,
                /\[We meet the protagonist in their ordinary world\..*?\]/g,
                /The character pauses\..*?ignore\./g,
                /CHARACTER \(V\.O\.\)/g,
                /"\[Internal thought that reveals desire or fear\]"/g,
                /ACT \d — CONFRONTATION/g,
                /\[The world pushes back\..*?unavoidable\.\]/g,
                /CHARACTER/g,
                /"\[Line that reveals they are wrong about something\]"/g,
                /\[ACTION: A choice must be made\. The audience feels the weight\.\]/g,
                /ACT \d — RESOLUTION.*?lands\)/g,
                /\[The character is changed — even if just slightly\. Show it, don't say it\.\]/g,
                /FADE TO BLACK\./g,
                /TITLE CARD: \[Film Title\]/g,
                /NOTE: Fill the bracketed directions with your specific scenes and dialogue\./g,
                /ANIMATION SCRIPT — GENERATED STRUCTURE/gi,
                /SCENE \d+ — [A-Z ]+/g,
                /VISUAL: \[.*?\]/g,
                /MUSIC: \[.*?\]/g,
                /\[CHARACTER NAME\] stands in \[ENVIRONMENT\].*?\./g,
                /\[ACTION:.*?\]/g,
                /CHARACTER A/g,
                /\(barely a whisper\)/g,
                /"\[One impactful line\..*?\]"/g,
                /PAUSE — 2 SECONDS\..*?breathe\./g,
                /YOUTUBE SCRIPT — GENERATED STRUCTURE/gi,
                /\[\d{2}:\d{2}–\d{2}:\d{2}\] HOOK/g,
                /"\[Bold statement or surprising fact.*?\]"/g,
                /Stay until the end — this changes everything\./g,
                /\[\d{2}:\d{2}–\d{2}:\d{2}\] INTRO & CONTEXT/g,
                /→ Point \d: \[.*?\]/g,
                /\[\d{2}:\d{2}–\d{2}:\d{2}\] MAIN CONTENT/g,
                /\*\*POINT \d:\*\* \[.*?\]/g,
                /\[\d{2}:\d{2}–\d{2}:\d{2}\] RETENTION RESET/g,
                /But here's what most people get wrong about this\.\.\./g,
                /\[\d{2}:\d{2}–\d{2}:\d{2}\] CLOSE \+ CTA/g,
                /SOCIAL MEDIA SCRIPT — GENERATED STRUCTURE/gi,
                /\[0–3s\] STOP-THE-SCROLL HOOK/g,
                /\[3–5s\] PATTERN INTERRUPT/g,
                /\[5–20s\] VALUE \/ STORY/g,
                /\[20–30s\] CTA/g,
                /☐ First 3s hook rate > 60%/g,
                /☐ Watch time > 50%/g,
                /☐ Save \/ Share rate/g,
                /Format: 15–45 seconds \| TikTok \/ Instagram Reels/g,
                /TEXT ON SCREEN: ".*?"/g,
                /VOICE: ".*?"/g
            ];

            let cleanText = text;
            noisePatterns.forEach(pattern => {
                cleanText = cleanText.replace(pattern, '');
            });

            // PRODUCTION NOISE DETECTION (Detecting "Director's Fluff" & Equipment)
            const prodJargon = [
                { term: 'drone shot', regex: /\bdrone\b|\bdrone shot\b/i },
                { term: 'camera shot', regex: /\bcamera shot\b|\bshot style\b|\bstyle camera\b/i },
                { term: 'closeup/angle', regex: /\bcloseup\b|\bclose-up\b|\bangle\b|\bangulo\b|\bwide shot\b|\bplano aberto\b/i },
                { term: 'cinematic', regex: /\bcinematic\b/i },
                { term: 'overhead', regex: /\boverhead\b/i },
                { term: 'establishing shot', regex: /\bestablishing shot\b/i },
                { term: 'sony/equipment', regex: /\bsony\b|\bdji\b|\bgopro\b|\bred camera\b|\barri\b|\bblackmagic\b|\bgear\b|\bequipamento\b/i },
                { term: 'shutter/fps', regex: /\bshutter\b|\bfps\b|\bframe rate\b|\baperture\b|\biso\b/i },
                { term: 'zoom', regex: /\bzoom\b/i },
                { term: 'gimbal/stabilizer', regex: /\bgimbal\b|\bronin\b|\bstabilizer\b|\bestabilizador\b/i },
                { term: 'pan/tilt', regex: /\bpan\b|\btilt\b/i }
            ];

            let detectedFluff = prodJargon.filter(p => p.regex.test(cleanText)).map(p => p.term);
            let prodNoiseCount = detectedFluff.length;

            // PLOT / SUBTEXT DETECTION
            const plotMarkers = [
                /\b(but|however|reveals|discovers|suddenly|until|unless|secret|hidden|truth|twist|turns out)\b/i,
                /\b(dilema|tension|tensão|confronto|confrontation|mergulha|depth|coragem)\b/i
            ];
            let hasTruePlot = plotMarkers.some(m => m.test(cleanText));
            let subtextMarkers = (cleanText.match(/\(.*?\)/g) || []).length; // Parentheticals for subtext/mood

            const originalWords = text.split(/\s+/).filter(Boolean).length;
            const cleanWords = cleanText.split(/\s+/).filter(Boolean).filter(w => w.length > 2).length;
            const lines = cleanText.split('\n').filter(l => l.trim()).length;

            // SOCIAL MEDIA RIGOR: Hard check for length (even more rigorous)
            let tooLongForSocial = style === 'social' && cleanWords > 90;
            let wordDelta = cleanWords - 50;

            // Creative Density Calculation
            const density = originalWords > 0 ? cleanWords / originalWords : 0;

            const hasSceneHeading = /\b(INT\.|EXT\.|INT\/EXT\.|FADE IN:)/i.test(cleanText);
            const hasDialogue = cleanText.includes(':') || /["“'‘]/.test(cleanText);
            const hasAction = cleanWords > 40;
            const wordRatio = Math.min(cleanWords / 600, 1);

            // EXTREME CONTENT RIGOR
            if (cleanWords < 15) return { scores: [5, 5, 2, 8], fluff: detectedFluff, tooLong: tooLongForSocial, wordDelta };

            // Apply a heavy penalty if density is low OR production fluff is too high
            let fluffPenalty = Math.max(0, (prodNoiseCount * 35) - (hasTruePlot ? 15 : 0));
            const baseDensityMultiplier = density < 0.5 ? 0.1 : density < 0.7 ? 0.4 : 1.0;

            let baseScores = [];
            if (style === 'shortfillm') {
                baseScores = [
                    Math.round(((hasSceneHeading ? 30 : 0) + wordRatio * 50)),
                    Math.round(((lines > 8 ? 20 : 0) + wordRatio * 50)),
                    Math.round(((hasTruePlot ? 40 : 5) + (subtextMarkers * 3))),
                    Math.round(((hasAction && hasDialogue ? 40 : 0) + wordRatio * 40))
                ];
            } else if (style === 'animation') {
                baseScores = [
                    Math.round(((hasSceneHeading ? 30 : 0) + wordRatio * 70)),
                    Math.round(((hasDialogue ? 10 : 40) + wordRatio * 45) * 1.0),
                    Math.round(((hasAction ? 30 : 0) + wordRatio * 70)),
                    Math.round((wordRatio * 100))
                ];
            } else if (style === 'youtube') {
                baseScores = [
                    Math.round(((wordRatio * 50) + (lines > 12 ? 20 : 0))),
                    Math.round(((cleanWords > 80 ? 30 : 0) + wordRatio * 50)),
                    Math.round((wordRatio * 70)),
                    Math.round(((hasTruePlot ? 30 : 5) + wordRatio * 50))
                ];
            } else { // social
                baseScores = [
                    Math.round(((cleanWords > 40 ? 20 : 0) + wordRatio * 50)),
                    Math.round(((cleanWords > 50 ? 20 : 0) + (hasAction ? 20 : 0) + wordRatio * 40)),
                    Math.round(((lines > 6 ? 20 : 0) + wordRatio * 50)),
                    Math.round(((cleanText.match(/\bclique|acesse|follow|share|link na bio\b/gi) ? 40 : 0) + wordRatio * 40))
                ];
            }

            // Apply Hard Penalties and Caps
            const finalScores = baseScores.map(val => {
                let finalVal = Math.round(val * baseDensityMultiplier - fluffPenalty);

                // NO PLOT PENALTY: 50% reduction if no narrative tension is detected
                if (!hasTruePlot) finalVal *= 0.4;

                // THE MEIA-BOCA CAP: If no plot twist and heavy production fluff -> Max 35 (Cruel rigor)
                if (!hasTruePlot && prodNoiseCount > 1) {
                    finalVal = Math.min(finalVal, 35);
                }
                // SOCIAL CAP: If it's too long, it can't be perfect
                if (tooLongForSocial) {
                    finalVal = Math.min(finalVal, 25);
                }
                return Math.max(1, finalVal);
            });

            return { scores: finalScores, fluff: detectedFluff, tooLong: tooLongForSocial, wordDelta };
        }

        analyzeScriptBtn.addEventListener('click', analyzeScriptByStyle);

        enhanceScriptBtn.addEventListener('click', () => {
            const bodyText = scriptBody.value.trim();
            if (!bodyText) return alert('Please write an idea or script first.');
            enhanceScriptBtn.disabled = true;
            enhanceScriptBtn.querySelector('.btn-text').textContent = 'Building Script...';
            setTimeout(() => {
                scriptProposedText.value = performScriptOptimization(bodyText, currentScriptStyle);
                scriptEnhanceProposal.classList.remove('hidden');
                scriptProposalDesc.textContent = `Full structure generated for ${scriptCategories[currentScriptStyle].label}.`;
                enhanceScriptBtn.disabled = false;
                enhanceScriptBtn.querySelector('.btn-text').textContent = '✨ Enhance Script';
                scriptEnhanceProposal.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }, 1800);
        });

        function performScriptOptimization(text, style) {
            const idea = text.trim();
            if (style === 'shortfillm') {
                return `PREMIUM SHORT FILM SCRIPT\nConcept: "${idea}"\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\nSCENE 1 - EXT. [EVOCATIVE LOCATION] - [TIME]\n\n[Describe the mood through atmosphere, not camera directions. Focus on light and sound.]\n\nA figure, [CHARACTER], moves with intentional silence. They are searching for something the audience can\'t see yet.\n\n[ACTION: The character encounters a physical obstacle that mirrors their internal struggle.]\n\n${idea}\n\nCHARACTER\n(to themselves)\n"It isn\'t supposed to be this quiet."\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\nSCENE 2 - INT. [CONTRASTING SPACE] - LATER\n\n[Tension peaks. The ordinary world is left behind.]\n\n[ACTION: A revelation occurs. Something hidden is revealed through a specific object or gesture.]\n\nCHARACTER\n"I thought I knew the way out."\n\n[ACTION: They make a choice that cannot be undone.]\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\nSCENE 3 - EXT/INT. [FINAL LOCATION]\n\n[The aftermath. The character is physically or emotionally altered.]\n\n[ACTION: Show the result of the choice. No dialogue needed here.]\n\nFADE TO BLACK.\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\nAGENCY NOTE: Remove all camera jargon. Focus on the emotional arc.`;
            }
            if (style === 'animation') {
                return `CONCEPT: "${idea}"\nSTYLE: [Modern Stylized Animation]\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n[BEAT 01: THE HOOK]\nVisuals: [Define a unique color palette - e.g., neon over monochrome].\nAction: A sequence of fluid, physics-defying movements.\n\n[BEAT 02: THE CORE]\n${idea}\nDialogue: "[One power-line that encapsulates the theme]"\n\n[BEAT 03: THE TWIST]\nVisuals: The world deconstructs or transforms to reveal a hidden layer.\nAction: The character adapts to the new reality with a singular, iconic pose.\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\nNOTE: Animation is literal. If you write 'fast', show it through smears and frame-trailing. Avoid 'camera' talk.`;
            }
            if (style === 'youtube') {
                return `YOUTUBE RETENTION-MAX SCRIPT\nTopic: "${idea}"\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n[00:00–00:10] THE "IMPOSSIBLE" HOOK\n"What if I told you that ${idea} is actually the opposite of what you think?"\nVisual: [Extreme foreground detail + high energy movement]\n\n[00:10–01:30] THE VALUE BRIDGE\n→ Fact: [Something unexpected]\n→ Pain point: "We all struggle with [X], but look at this..."\n\n[01:30–04:30] THE "SECRET" REVEAL\nIdentify the core mechanics of "${idea}".\nShow, don\'t just tell—use visual metaphors.\n\n[04:30–05:00] THE EXIT\n"The real truth isn\'t what we found, it\'s how we used it."\nCTA: "If you understood this, you\'re in the top 1%. Sub to stay there."`;
            }
            // social
            return `SOCIAL MEDIA - "VIRAL" STRUCTURE\nConcept: "${idea}"\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n[0-2s] THE PATTERN INTERRUPT\nVisual: [Start from the middle of a high-motion action]\nText: "Stop ignoring this."\n\n[2-10s] THE REVELATION\n${idea}\nVoice: "I tested this for 30 days. Here is the result."\n\n[10-25s] THE PROOF\n[Fast cuts - 0.5s each]\nVisual 1: [Problem]\nVisual 2: [Solution]\nVisual 3: [Result]\n\n[25-30s] THE CTA\n"Read the caption for the full breakdown. Save this."`;
        }

        document.getElementById('apply-script-enhance').addEventListener('click', () => {
            scriptBody.value = scriptProposedText.value;
            scriptEnhanceProposal.classList.add('hidden');
            saveScriptBtn.style.display = 'block';
        });

        document.getElementById('discard-script-enhance').addEventListener('click', () => {
            scriptEnhanceProposal.classList.add('hidden');
        });

        scriptForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const newScript = {
                id: Date.now(),
                title: scriptTitle.value || scriptTitle.dataset.lastAnalyzed || 'Untitled Script',
                logline: scriptLogline.value || scriptLogline.dataset.lastAnalyzed || 'No logline',
                body: scriptBody.value || scriptBody.dataset.lastAnalyzed || 'Empty body',
                style: currentScriptStyle,
                author: currentUser,
                date: new Date().toLocaleDateString()
            };
            scripts.unshift(newScript);
            saveScripts();
            renderScripts();
            scriptForm.reset();
            scriptAnalysisResult.classList.add('hidden');
            saveScriptBtn.style.display = 'none';
        });

        function renderScripts() {
            scriptsList.innerHTML = '';
            scripts.forEach(script => {
                const styleName = scriptCategories[script.style]?.label || 'Standard';
                const card = document.createElement('div');
                card.className = 'card interactive-light';
                card.innerHTML = `
                    <button class="card-delete" onclick="deleteScript(${script.id})">&times;</button>
                    <div class="card-header">
                        <div style="display: flex; gap: 0.5rem; flex-wrap: wrap;">
                            <h3 class="card-title">${script.title}</h3>
                            <span class="badge" style="background: rgba(17, 218, 143, 0.1); color: var(--accent-color); padding: 2px 8px; border-radius: 4px; font-size: 0.7rem;">${styleName}</span>
                        </div>
                    </div>
                    <p style="margin-bottom: 0.5rem; font-weight: bold; color: var(--text-secondary); font-size: 0.9rem;">Logline: ${script.logline}</p>
                    <div class="card-content-collapsed" id="script-body-${script.id}">
                        <p class="card-body" style="font-family: monospace; background: #111; padding: 1rem; border-radius: 6px; font-size: 0.85rem; line-height: 1.6; color: #ccc; margin: 0;">${script.body}</p>
                    </div>
                    <button class="card-expand-btn" onclick="toggleExpand('script-body-${script.id}', this)">👁️ View Full Script</button>
                    <div class="card-meta">
                        <span>Created: ${script.date}</span>
                        <span style="float: right; color: var(--accent-color); opacity: 0.8;">By ${script.author || 'Creator'}</span>
                    </div>
                `;
                scriptsList.appendChild(card);
            });
        }

        window.toggleExpand = (containerId, btn) => {
            const container = document.getElementById(containerId);
            if (container.classList.contains('card-content-collapsed')) {
                container.classList.remove('card-content-collapsed');
                btn.textContent = '🙈 Collapse Text';
            } else {
                container.classList.add('card-content-collapsed');
                btn.textContent = containerId.includes('script') ? '👁️ View Full Script' : '👁️ View Full Text';
            }
        };

        window.deleteScript = (id) => {
            if (confirm('Delete this script?')) {
                scripts = scripts.filter(s => s.id !== id);
                saveScripts();
                renderScripts();
            }
        };

        // Load project data for the first time
        window.loadProjectData();
    }
});

