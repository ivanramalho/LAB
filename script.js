document.addEventListener('DOMContentLoaded', () => {
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

    const appHeader = document.querySelector('.app-header');
    const appMain = document.querySelector('.app-main');
    const currentProjectDisplay = document.getElementById('current-project-display');

    let currentUser = localStorage.getItem('creativeLab_lastUser') || '';
    let currentProject = localStorage.getItem('creativeLab_lastProject') || '';

    // Switch Project Handler
    switchProjectBtn.addEventListener('click', () => {
        // Show login overlay
        loginScreen.style.display = 'flex';
        setTimeout(() => {
            loginScreen.style.opacity = '1';
        }, 10);

        // Transition to Step 2 directly (keeping user)
        loginStep1.classList.add('hidden');
        loginStep2.classList.remove('hidden');
        renderRecentProjects();
        projectInput.focus();

        // Hide App
        appHeader.classList.add('hidden');
        appMain.classList.add('hidden');
    });

    // Auto-fill User if available
    if (currentUser) {
        userInput.value = currentUser;
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
        return JSON.parse(localStorage.getItem('creativeLab_recentProjects')) || [];
    }

    function addToRecents(projectName) {
        let recents = getRecentProjects();
        // Remove if exists (to move to top)
        recents = recents.filter(p => p.toLowerCase() !== projectName.toLowerCase());
        // Add to top
        recents.unshift(projectName);
        // Limit to 5
        if (recents.length > 5) recents.pop();

        localStorage.setItem('creativeLab_recentProjects', JSON.stringify(recents));
    }

    function renderRecentProjects() {
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
        // Normalize: lowercase and trim to ensure "Nike" == "nike"
        return `creativeLab_project_${projectName.trim().toLowerCase()}`;
    }

    function enterLab(projectName) {
        currentProject = projectName;
        addToRecents(currentProject); // Save to history
        localStorage.setItem('creativeLab_lastProject', currentProject);

        // Update UI
        currentProjectDisplay.textContent = `| ${currentProject} (User: ${currentUser})`;

        // Hide Login, Show App
        loginScreen.style.opacity = '0';
        setTimeout(() => {
            loginScreen.style.display = 'none';
            appHeader.classList.remove('hidden');
            appMain.classList.remove('hidden');
            initializeApp(); // Load data for this project
        }, 500);
    }

    function initializeApp() {
        // --- Navigation / Tabs ---
        const navBtns = document.querySelectorAll('.nav-btn');
        const tabContents = document.querySelectorAll('.tab-content');

        navBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const tabId = btn.getAttribute('data-tab');

                // Update Buttons
                navBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');

                // Update Content
                tabContents.forEach(content => {
                    content.classList.remove('active');
                    if (content.id === tabId) {
                        content.classList.add('active');
                    }
                });
            });
        });

        // --- Campaign Concepts (AI Analysis) ---
        const conceptForm = document.getElementById('concept-form');
        const analyzeBtn = document.getElementById('analyze-btn');
        const enhanceBtn = document.getElementById('enhance-btn');
        const saveBtn = document.getElementById('save-concept-btn');
        const analysisResult = document.getElementById('analysis-result');
        const aiScoreDisplay = document.getElementById('ai-score');
        const aiFeedbackDisplay = document.getElementById('ai-feedback');
        const conceptsList = document.getElementById('concepts-list');

        let currentAnalysis = null;

        // Load Concepts (Project Scoped & Normalized)
        // Use generic key for now if legacy data exists, otherwise use normalized key
        // NOTE: For this implementation we switch to Normalized Key exclusively for new/robust access
        const storageKey = getProjectKey(currentProject) + '_concepts';
        let concepts = JSON.parse(localStorage.getItem(storageKey)) || [];

        // Fallback: Check for legacy non-normalized key if empty (Optional migration logic could go here)
        // For simplicity, we stick to the new robust key.

        renderConcepts();

        // Enhance Idea (Simulated AI)
        enhanceBtn.addEventListener('click', () => {
            const descInput = document.getElementById('concept-desc');
            const desc = descInput.value.trim();

            if (!desc) {
                alert('Please enter a description to enhance.');
                return;
            }

            // UI Loading
            enhanceBtn.classList.add('loading');
            enhanceBtn.disabled = true;

            setTimeout(() => {
                const enhancedText = performOptimization(desc);
                descInput.value = enhancedText;

                // Visual Highlight effect
                descInput.style.borderColor = 'var(--accent-color)';
                descInput.style.boxShadow = '0 0 10px rgba(138, 43, 226, 0.3)';
                setTimeout(() => {
                    descInput.style.borderColor = '';
                    descInput.style.boxShadow = '';
                }, 1000);

                enhanceBtn.classList.remove('loading');
                enhanceBtn.disabled = false;
            }, 1200);
        });

        function performOptimization(text) {
            // Simple heuristic improvements
            const adjectives = ['immersive', 'captivating', 'dynamic', 'authentic', 'groundbreaking', 'emotional', 'visceral'];
            const randomAdj = adjectives[Math.floor(Math.random() * adjectives.length)];

            let optimized = text;

            // 1. Better openers
            if (!text.toLowerCase().startsWith('a ') && !text.toLowerCase().startsWith('the ')) {
                optimized = `A ${randomAdj} campaign featuring: ${text}`;
            } else {
                optimized = text.replace(/^(a|the)\s/i, `A ${randomAdj} `);
            }

            // 2. Expand short text
            if (text.length < 50) {
                optimized += " It aims to connect deeply with the target audience through visual storytelling and relatable narratives.";
            }

            // 3. Polishing
            if (!optimized.endsWith('.')) optimized += '.';

            return optimized;
        }

        // AI Analysis Simulation
        analyzeBtn.addEventListener('click', () => {
            const title = document.getElementById('concept-title').value.trim();
            const desc = document.getElementById('concept-desc').value.trim();

            if (!title || !desc) {
                alert('Please fill in both title and description to analyze.');
                return;
            }

            // UI Loading State
            analyzeBtn.classList.add('loading');
            analyzeBtn.disabled = true;
            analysisResult.classList.add('hidden');
            saveBtn.style.display = 'none';

            // Simulate API Delay
            setTimeout(() => {
                const result = performHeuristicAnalysis(title, desc);
                currentAnalysis = result;

                // Update UI
                aiScoreDisplay.textContent = result.score;
                aiFeedbackDisplay.textContent = result.feedback;

                analyzeBtn.classList.remove('loading');
                analyzeBtn.disabled = false;
                analysisResult.classList.remove('hidden');
                saveBtn.style.display = 'block'; // Show save button after analysis
            }, 1500);
        });

        function performHeuristicAnalysis(title, desc) {
            let score = 5.0;
            const combinedText = (title + " " + desc).toLowerCase();

            // 1. Length Bonus
            if (desc.length > 50) score += 1.0;
            if (desc.length > 150) score += 1.0;

            // 2. Keyword Bonus (Buzzwords)
            const keywords = ['interactive', 'viral', 'emotional', 'cinematic', 'authentic', 'sustainable', 'AI', 'immersive', 'storytelling'];
            keywords.forEach(word => {
                if (combinedText.includes(word.toLowerCase())) {
                    score += 0.5;
                }
            });

            // 3. Random Variance (Creativity Factor)
            score += (Math.random() * 2 - 1); // +/- 1.0

            // Clamp
            score = Math.max(1.0, Math.min(9.9, score));
            score = parseFloat(score.toFixed(1));

            // Generate Feedback
            let feedback = "";
            if (score >= 9.0) feedback = "This concept is absolutely visionary. High viral potential.";
            else if (score >= 8.0) feedback = "Strong, marketable idea with clear audience appeal.";
            else if (score >= 6.0) feedback = "Solid foundation, but could use a unique twist.";
            else if (score >= 4.0) feedback = "A bit generic. Try to deepen the emotional hook.";
            else feedback = "Needs significant rethinking. Focus on the core value proposition.";

            return { score, feedback };
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
                author: currentUser, // Attaching Author
                date: new Date().toLocaleDateString()
            };

            concepts.unshift(newConcept);
            saveConcepts();
            renderConcepts();

            // Reset UI
            conceptForm.reset();
            analysisResult.classList.add('hidden');
            saveBtn.style.display = 'none';
            currentAnalysis = null;
        });

        function saveConcepts() {
            localStorage.setItem(storageKey, JSON.stringify(concepts));
        }

        function renderConcepts() {
            conceptsList.innerHTML = '';
            concepts.forEach(concept => {
                const card = document.createElement('div');
                card.className = 'card';
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

        // Connect delete function to window scope
        window.deleteConcept = (id) => {
            if (confirm('Delete this concept?')) {
                concepts = concepts.filter(c => c.id !== id);
                saveConcepts();
                renderConcepts();
            }
        };


        // --- Commercial Scripts ---
        const scriptForm = document.getElementById('script-form');
        const scriptsList = document.getElementById('scripts-list');

        // Load Scripts (Project Scoped & Normalized)
        const scriptStorageKey = getProjectKey(currentProject) + '_scripts';
        let scripts = JSON.parse(localStorage.getItem(scriptStorageKey)) || [];
        renderScripts();

        // Add Script
        scriptForm.addEventListener('submit', (e) => {
            e.preventDefault();

            const newScript = {
                id: Date.now(),
                title: document.getElementById('script-title').value,
                logline: document.getElementById('script-logline').value,
                body: document.getElementById('script-body').value,
                author: currentUser, // Attaching Author
                date: new Date().toLocaleDateString()
            };

            scripts.unshift(newScript);
            saveScripts();
            renderScripts();
            scriptForm.reset();
        });

        function saveScripts() {
            localStorage.setItem(scriptStorageKey, JSON.stringify(scripts));
        }

        function renderScripts() {
            scriptsList.innerHTML = '';
            scripts.forEach(script => {
                const card = document.createElement('div');
                card.className = 'card';
                card.innerHTML = `
                    <button class="card-delete" onclick="deleteScript(${script.id})">&times;</button>
                    <div class="card-header">
                        <h3 class="card-title">${script.title}</h3>
                    </div>
                    <p style="margin-bottom: 0.5rem; font-weight: bold; color: var(--text-secondary);">Logline: ${script.logline}</p>
                    <p class="card-body" style="font-family: monospace; background: #111; padding: 1rem; border-radius: 6px;">${script.body}</p>
                    <div class="card-meta">
                        <span>Created: ${script.date}</span>
                        <span style="float: right; color: var(--text-primary);">By ${script.author || 'Unknown'}</span>
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
    }
});
