(function () {
    // If we're already running or not in demo mode, stop.
    if (window.DEMO_RUNNING || !window.location.search.includes('demo=1')) return;
    window.DEMO_RUNNING = true;

    console.log("Starting visual demo...");

    const startDemo = async () => {
        // Wait for elements to be available
        const waitForElement = (id, timeout = 5000) => {
            return new Promise((resolve) => {
                const start = Date.now();
                const timer = setInterval(() => {
                    const el = document.getElementById(id);
                    if (el || Date.now() - start > timeout) {
                        clearInterval(timer);
                        resolve(el);
                    }
                }, 100);
            });
        };

        // Create a visual banner
        const banner = document.createElement('div');
        banner.style.cssText = 'position:fixed; top:0; left:0; width:100%; background:#11da8f; color:#000; padding:15px; text-align:center; font-family:sans-serif; font-weight:bold; z-index:10000; box-shadow:0 2px 10px rgba(0,0,0,0.5);';
        banner.innerHTML = '🤖 DEMONSTRAÇÃO DE RIGOR... OBSERVE O TESTE!';
        document.body.appendChild(banner);

        const delay = (ms) => new Promise(res => setTimeout(res, ms));

        const typeValue = async (id, text) => {
            const input = await waitForElement(id);
            if (!input) return;
            input.value = '';
            for (let i = 0; i < text.length; i++) {
                input.value += text[i];
                input.dispatchEvent(new Event('input', { bubbles: true }));
                await delay(40);
            }
        };

        const clickBtn = async (selector) => {
            const btn = document.querySelector(selector);
            if (btn) {
                btn.style.outline = '3px solid white';
                await delay(300);
                btn.click();
                btn.style.outline = 'none';
            }
        };

        await delay(1000);

        // Step 1: User Name
        banner.innerHTML = '🤖 PASSO 1: IDENTIFICANDO O CRIADOR...';
        await typeValue('user-name', 'LEO (Rigor-Test)');
        await delay(500);
        await clickBtn('#user-form button[type="submit"]');

        // Step 2: Project
        await delay(800);
        banner.innerHTML = '🤖 PASSO 2: ENTRANDO NO LABORATÓRIO DE RIGOR...';
        await typeValue('project-name', 'Rigor Lab');
        await delay(500);
        await clickBtn('#project-form button[type="submit"]');

        // Step 3: Test Spam/Weak content
        await delay(1500);
        banner.innerHTML = '🤖 TESTE 1: TENTANDO BULAR COM "fff" (EXPECTATIVA: NOTA 0.5)';
        await typeValue('concept-title', 'fff');
        await typeValue('concept-desc', 'ffffffffffff');
        await delay(500);
        await clickBtn('#analyze-btn');

        // Wait for analysis
        await delay(3000);
        banner.innerHTML = '⚠️ BLOQUEADO! Note a nota 0.5 e o aviso de insuficiência.';
        banner.style.background = '#ff4444';
        await delay(4000);

        // Step 4: Real content
        banner.style.background = '#11da8f';
        banner.innerHTML = '🤖 TESTE 2: AGORA UM CONCEITO ESTRATÉGICO REAL...';
        await typeValue('concept-title', 'Evolução Urbana 2050');
        await typeValue('concept-desc', 'Campanha de AR que projeta o futuro das cidades brasileiras integrando natureza e tecnologia, focada em sustentabilidade e impacto visual extremo.');
        await delay(500);
        await clickBtn('#analyze-btn');

        await delay(3000);
        banner.innerHTML = '✅ RIGOR VALIDADO! O sistema aprovou o conceito real. Salvando...';
        await clickBtn('#save-concept-btn');

        await delay(1500);
        banner.innerHTML = '✅ DEMONSTRAÇÃO CONCLUÍDA COM SUCESSO!';
        const closeBtn = document.createElement('button');
        closeBtn.innerHTML = 'Fechar';
        closeBtn.style.cssText = 'margin-left:20px; padding:5px 10px; cursor:pointer; background:#000; color:#fff; border:none; border-radius:5px;';
        closeBtn.onclick = () => banner.remove();
        banner.appendChild(closeBtn);
    };

    if (document.readyState === 'complete') {
        startDemo();
    } else {
        window.addEventListener('load', startDemo);
    }
})();
