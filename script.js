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
                loadProjectData();
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
        function loadProjectData() {
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
        }

        // Register all event listeners ONCE
        enhanceBtn.addEventListener('click', () => {
            const descInput = document.getElementById('concept-desc');
            const desc = descInput.value.trim();
            if (!desc) { alert('Please enter a description to enhance.'); return; }
            enhanceBtn.classList.add('loading');
            enhanceBtn.disabled = true;
            setTimeout(() => {
                proposedTextElem.value = performProfessionalOptimization(desc);
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
            const angles = [
                "Leverage a more disruptive narrative hook that challenges category norms.",
                "Inject a sensory-driven vocabulary to make the visualization more visceral.",
                "Shift the focus from product features to a deeper human truth/insight.",
                "Incorporate a digital-first interactive element to drive engagement."
            ];
            const advice = angles[Math.floor(Math.random() * angles.length)];
            if (text.length < 100) {
                return `PROPOSAL: ${text}\n\nREFINEMENT: ${advice}\n\nEXPANDED CONCEPT: ${text} by creating a cinematic parallel between the user's daily struggle and the brand's core solution, ensuring a high-impact emotional payoff.`;
            }
            return `${text}\n\nCreative Addendum: ${advice}`;
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
                currentAnalysis = result;
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
            const combined = (title + " " + desc).toLowerCase();
            const metrics = {
                insight: Math.min(9.5, 4 + (desc.length / 100) + (combined.includes('because') ? 2 : 0)),
                execution: Math.min(9.8, 5 + (desc.length / 200)),
                innovation: Math.min(9.2, 3 + (combined.match(/interactive|viral|ai|ar|metaverse/g)?.length || 0) * 1.5),
                impact: Math.min(9.6, 4 + (Math.random() * 4))
            };
            Object.keys(metrics).forEach(k => metrics[k] = parseFloat((metrics[k] + (Math.random() * 1)).toFixed(1)));
            const avg = (metrics.insight + metrics.execution + metrics.innovation + metrics.impact) / 4;
            const score = parseFloat(avg.toFixed(1));
            let feedback = "";
            if (score >= 8.5) feedback = "Cannes Lions potential. The disruption factor is high, and the insight feels authentic.";
            else if (score >= 7.0) feedback = "Solid agency-level work. Strong execution path, though the 'Big Idea' could be sharper.";
            else if (score >= 5.0) feedback = "Good foundation. Needs more focus on the 'Why' (Strategy) to break through current market noise.";
            else feedback = "Below global standards. The concept is too derivative. Recommend a total pivot or deeper research.";
            return { score, feedback, metrics };
        }

        // Save Concept
        conceptForm.addEventListener('submit', (e) => {
            e.preventDefault();
            if (!currentAnalysis) return;
            const newConcept = {
                id: Date.now(),
                title: document.getElementById('concept-title').value,
                desc: document.getElementById('concept-desc').value,
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
                        <h3 class="card-title">${concept.title}</h3>
                        <span class="card-rating">${concept.rating}/10</span>
                    </div>
                    <p class="card-body">${concept.desc}</p>
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
                const scores = computeScores(bodyText, currentScriptStyle);
                const overall = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
                scriptAIScore.textContent = overall;
                scriptAIScore.style.color = overall < 40 ? '#e74c3c' : overall < 65 ? '#f39c12' : 'var(--accent-color)';
                scriptMetricsGrid.innerHTML = '';
                category.metrics.forEach((metric, i) => {
                    const val = scores[i];
                    const barColor = val < 40 ? '#e74c3c' : val < 65 ? '#f39c12' : 'var(--accent-color)';
                    const item = document.createElement('div');
                    item.className = 'metric-item';
                    item.innerHTML = `
                        <div class="metric-label">${metric} <span style="float:right;color:${barColor}">${val}%</span></div>
                        <div class="metric-value-wrap">
                            <div class="metric-fill" style="width: ${val}%; background: ${barColor}; box-shadow: 0 0 8px ${barColor}55;"></div>
                        </div>
                    `;
                    scriptMetricsGrid.appendChild(item);
                });
                let feedback = '';
                if (overall < 35) feedback = `⚠️ Script is too sparse for ${category.label}. Click ✨ Enhance to generate a full structure.`;
                else if (overall < 60) feedback = `📝 Foundation exists but needs more ${category.label} elements. Focus on: ${category.advice}`;
                else feedback = `✅ Solid structure for ${category.label}. ${category.advice}`;
                scriptAIFeedback.textContent = feedback;
                saveScriptBtn.style.display = 'block';
            }, 1200);
        }

        function computeScores(text, style) {
            const words = text.split(/\s+/).filter(Boolean).length;
            const lines = text.split('\n').filter(l => l.trim()).length;
            const hasSceneHeading = /\b(INT\.|EXT\.|INT\/EXT\.)/i.test(text);
            const hasDialogue = text.includes(':') || /[""]/.test(text);
            const hasAction = words > 20;
            const hasConflict = /\b(but|however|suddenly|until|when|unless|although|despite)\b/i.test(text);
            const hasCTA = /\b(follow|subscribe|share|click|buy|visit|comment)\b/i.test(text);
            const hasHook = lines >= 1 && words >= 5;
            const wordRatio = Math.min(words / 150, 1);
            if (style === 'shortfillm') return [
                Math.round((hasSceneHeading ? 40 : 5) + wordRatio * 60),
                Math.round((lines > 3 ? 30 : 5) + wordRatio * 50),
                Math.round((hasConflict ? 40 : 5) + wordRatio * 40),
                Math.round((hasAction || hasDialogue ? 35 : 5) + wordRatio * 45)
            ];
            if (style === 'animation') return [
                Math.round((hasSceneHeading ? 40 : 5) + wordRatio * 55),
                Math.round((hasDialogue ? 10 : 40) + wordRatio * 30),
                Math.round((hasAction ? 30 : 5) + wordRatio * 50),
                Math.round(wordRatio * 70 + (lines > 2 ? 20 : 5))
            ];
            if (style === 'youtube') return [
                Math.round((wordRatio * 60) + (lines > 4 ? 25 : 0)),
                Math.round((hasHook ? 35 : 5) + wordRatio * 40),
                Math.round(wordRatio * 80),
                Math.round((hasConflict ? 30 : 5) + wordRatio * 40)
            ];
            return [ // social
                Math.round((hasHook ? 35 : 5) + (words < 60 ? 35 : 10) + wordRatio * 20),
                Math.round((words < 80 ? 40 : 15) + (hasAction ? 20 : 0) + wordRatio * 20),
                Math.round((lines > 1 ? 30 : 5) + wordRatio * 30),
                Math.round((hasCTA ? 50 : 5) + wordRatio * 30)
            ];
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
                return `SHORT FILM — GENERATED STRUCTURE\nBased on your idea: "${idea}"\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\nACT 1 — SETUP (Enter as late as possible)\nINT. [LOCATION] — DAY/NIGHT\n[We meet the protagonist in their ordinary world. Something is already slightly off.]\n\n${idea}\n\nThe character pauses. Something draws their attention — a detail most would ignore.\n\nCHARACTER (V.O.)\n"[Internal thought that reveals desire or fear]"\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\nACT 2 — CONFRONTATION\nEXT. [NEW LOCATION] — [TIME]\n[The world pushes back. The conflict is now unavoidable.]\n\nCHARACTER\n"[Line that reveals they are wrong about something]"\n\n[ACTION: A choice must be made. The audience feels the weight.]\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\nACT 3 — RESOLUTION (Exit as soon as the point lands)\nINT. [LOCATION] — [TIME] — MOMENTS LATER\n\n[The character is changed — even if just slightly. Show it, don't say it.]\n\nFADE TO BLACK.\n\nTITLE CARD: [Film Title]\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\nNOTE: Fill the bracketed directions with your specific scenes and dialogue.`;
            }
            if (style === 'animation') {
                return `ANIMATION SCRIPT — GENERATED STRUCTURE\nConcept: "${idea}"\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\nSCENE 01 — WORLD INTRODUCTION\nVISUAL: [Establish color palette — warm/cool tones, lighting mood]\nMUSIC: [Underscore begins — light, curious]\n\n[CHARACTER NAME] stands in [ENVIRONMENT]. The world is [describe visual style].\n[ACTION: Character notices something. Eyes shift. Small movement — no words needed.]\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\nSCENE 02 — CONFLICT / CHOICE\nVISUAL: [Color shift — warmer/darker to signal tension]\n[ACTION: A second character or obstacle enters the frame.]\n\n${idea}\n\nCHARACTER A\n(barely a whisper)\n"[One impactful line. Maximum emotion, minimum words.]"\n\nPAUSE — 2 SECONDS. Let the image breathe.\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\nSCENE 03 — RESOLUTION\nVISUAL: [Return to opening palette, but something is different]\n[ACTION: Character is in the same world, but transformed.]\nMUSIC: [Swells and resolves]\n\nFADE OUT.\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\nNOTES: Keep dialogue under 5 lines. Let visual metaphors carry the story weight.`;
            }
            if (style === 'youtube') {
                return `YOUTUBE SCRIPT — GENERATED STRUCTURE\nTopic: "${idea}"\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n[00:00–00:15] HOOK\n"[Bold statement or surprising fact about: ${idea}]"\n"Stay until the end — this changes everything."\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n[00:15–01:00] INTRO & CONTEXT\n→ Point 1: [Context]\n→ Point 2: [Why now]\n→ Point 3: [Who this is for]\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n[01:00–04:00] MAIN CONTENT\n**POINT 1:** [Main argument + example]\n**POINT 2:** [Deeper insight + personal angle]\n**POINT 3:** [Actionable step viewer can take today]\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n[04:00–04:30] RETENTION RESET\n"But here's what most people get wrong about this..."\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n[04:30–05:00] CLOSE + CTA\n"[Summarize key insight in one sentence.]"\n"Subscribe — I post [frequency] about [topic]."`;
            }
            // social
            return `SOCIAL MEDIA SCRIPT — GENERATED STRUCTURE\nConcept: "${idea}"\nFormat: 15–45 seconds | TikTok / Instagram Reels\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n[0–3s] STOP-THE-SCROLL HOOK\nVISUAL: [Start MID-action or with a result already visible]\nTEXT ON SCREEN: "[Bold 3–5 word claim]"\nVOICE: "[Sentence that creates curiosity about: ${idea}]"\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n[3–5s] PATTERN INTERRUPT\n[CUT or ZOOM]\n"Most people don't know this..."\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n[5–20s] VALUE / STORY\n→ "[Beat 1 — the problem or situation]"\n→ "[Beat 2 — the insight or action]"\n→ "[Beat 3 — the result or proof]"\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n[20–30s] CTA\n"Follow for more [topic] content."\nTEXT ON SCREEN: "[Your handle or brand]"\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\nMETRICS:\n☐ First 3s hook rate > 60%\n☐ Watch time > 50%\n☐ Save / Share rate`;
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
                title: scriptTitle.value,
                logline: scriptLogline.value,
                body: scriptBody.value,
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
                    <p class="card-body" style="font-family: monospace; background: #111; padding: 1rem; border-radius: 6px; font-size: 0.85rem; line-height: 1.6; color: #ccc;">${script.body}</p>
                    <div class="card-meta">
                        <span>Created: ${script.date}</span>
                        <span style="float: right; color: var(--accent-color); opacity: 0.8;">By ${script.author || 'Creator'}</span>
                    </div>
                `;
                scriptsList.appendChild(card);
            });
        }

        window.deleteScript = (id) => {
            if (confirm('Delete this script?')) {
                scripts = scripts.filter(s => s.id !== id);
                saveScripts();
                renderScripts();
            }
        };

        // Load project data for the first time
        loadProjectData();
    }
});

