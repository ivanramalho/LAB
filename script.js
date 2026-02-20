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

        // Scan ALL localStorage keys to find projects OWNED by current user
        const allProjects = [];
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key.startsWith('creativeLab_project_') && key.endsWith('_owner')) {
                const owner = localStorage.getItem(key);
                if (owner === currentUser) {
                    const normalizedName = key.replace('creativeLab_project_', '').replace('_owner', '');
                    // We need the display name. Let's look for concepts or scripts to find capitalization, 
                    // or just use the normalized name for the chip.
                    if (!allProjects.includes(normalizedName)) allProjects.push(normalizedName);
                }
            }
        }

        // Include the user-specific 'recents' list
        const recents = getRecentProjects();
        recents.forEach(p => {
            if (!allProjects.includes(p.toLowerCase())) allProjects.push(p.toLowerCase());
        });

        if (allProjects.length === 0) {
            recentProjectsContainer.classList.add('hidden');
            return;
        }

        recentProjectsContainer.classList.remove('hidden');
        recentProjectsList.innerHTML = '';

        allProjects.forEach(proj => {
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
        const normalizedName = projectName.trim().toLowerCase();
        const ownerKey = `creativeLab_project_${normalizedName}_owner`;
        const existingOwner = localStorage.getItem(ownerKey);

        if (existingOwner && existingOwner !== currentUser) {
            alert(`Access Denied: This workspace belongs to ${existingOwner}.`);
            return;
        }

        // Set ownership if new
        if (!existingOwner) {
            localStorage.setItem(ownerKey, currentUser);
        }

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

        // Enhance Idea (New Two-Step Workflow)
        const enhanceProposal = document.getElementById('enhance-proposal');
        const proposedTextElem = document.getElementById('proposed-text');
        const applyEnhanceBtn = document.getElementById('apply-enhancement');
        const discardEnhanceBtn = document.getElementById('discard-enhancement');

        enhanceBtn.addEventListener('click', () => {
            const descInput = document.getElementById('concept-desc');
            const desc = descInput.value.trim();

            if (!desc) {
                alert('Please enter a description to enhance.');
                return;
            }

            enhanceBtn.classList.add('loading');
            enhanceBtn.disabled = true;

            setTimeout(() => {
                const enhancedText = performProfessionalOptimization(desc);
                proposedTextElem.value = enhancedText;

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

            // Visual feedback
            descInput.style.borderColor = 'var(--accent-color)';
            setTimeout(() => descInput.style.borderColor = '', 1000);
        });

        discardEnhanceBtn.addEventListener('click', () => {
            enhanceProposal.classList.add('hidden');
        });

        function performProfessionalOptimization(text) {
            // Enhanced agency-style optimization logic
            const angles = [
                "Leverage a more disruptive narrative hook that challenges category norms.",
                "Inject a sensory-driven vocabulary to make the visualization more visceral.",
                "Shift the focus from product features to a deeper human truth/insight.",
                "Incorporate a digital-first interactive element to drive engagement."
            ];
            const advice = angles[Math.floor(Math.random() * angles.length)];

            // Simulation of a more 'mature' creative suggestion
            let optimized = text;
            if (text.length < 100) {
                optimized = `PROPOSAL: ${text}\n\nREFINEMENT: ${advice}\n\nEXPANDED CONCEPT: ${text} by creating a cinematic parallel between the user's daily struggle and the brand's core solution, ensuring a high-impact emotional payoff.`;
            } else {
                optimized = `${text}\n\nCreative Addendum: ${advice}`;
            }

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

                // Update Bars
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
            setTimeout(() => {
                bar.style.width = (value * 10) + '%';
            }, 100);
        }

        function performHeuristicAnalysis(title, desc) {
            // Agency-Grade Qualitative Analysis Simulation
            const combined = (title + " " + desc).toLowerCase();

            // Mock scoring based on "agency" criteria
            const metrics = {
                insight: Math.min(9.5, 4 + (desc.length / 100) + (combined.includes('because') ? 2 : 0)),
                execution: Math.min(9.8, 5 + (desc.length / 200)),
                innovation: Math.min(9.2, 3 + (combined.match(/interactive|viral|ai|ar|metaverse/g)?.length || 0) * 1.5),
                impact: Math.min(9.6, 4 + (Math.random() * 4))
            };

            // Override with random variance for organic feel
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
                card.className = 'card interactive-light';
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
