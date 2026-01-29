const API_URL = 'http://localhost:5000/api';

document.addEventListener('DOMContentLoaded', () => {
    
    // 1. Detect Signup Mode from URL
    const params = new URLSearchParams(window.location.search);
    if (params.get('mode') === 'signup') {
        toggleToSignup();
    }

    // 2. Handle Form Submit
    const authForm = document.getElementById('authForm');
    if (authForm) {
        authForm.addEventListener('submit', handleAuth);
    }

    // 3. Handle Toggle Link
    const toggleLink = document.getElementById('toggleAuth');
    if (toggleLink) {
        toggleLink.addEventListener('click', (e) => {
            e.preventDefault();
            const title = document.getElementById('pageTitle').innerText;
            if (title.includes('Welcome')) toggleToSignup();
            else toggleToLogin();
        });
    }
});

async function handleAuth(e) {
    e.preventDefault();
    const email = document.getElementById('emailInput').value;
    const btn = document.getElementById('submitBtn');
    
    // UI Loading
    const originalText = btn.innerText;
    btn.innerText = 'Processing...';
    btn.disabled = true;
    btn.style.opacity = '0.7';

    try {
        // Try to reach backend (Will work locally, might fail on Vercel)
        const res = await fetch(`${API_URL}/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: email, password: "any" })
        });
        
        // If backend responds (Success or Fail)
        if (res.ok) {
            window.location.href = 'dashboard.html';
        } else {
            // Backend rejected it, but for demo we let them in
            console.warn("Backend rejected, entering Demo Mode");
            enterDemoMode();
        }
    } catch (err) {
        // Network Error (Vercel can't reach Laptop) -> Enter Demo Mode
        console.log("Offline or Vercel Mode detected. Entering Dashboard.");
        enterDemoMode();
    }
}

function enterDemoMode() {
    setTimeout(() => {
        window.location.href = 'dashboard.html';
    }, 1000);
}

function toggleToSignup() {
    document.getElementById('pageTitle').innerText = 'Create Account';
    document.getElementById('pageSubtitle').innerText = 'Start your free trial';
    document.getElementById('submitBtn').innerText = 'Create Account';
    document.getElementById('switchLabel').innerText = 'Already have an account?';
    document.getElementById('toggleAuth').innerText = 'Sign In';
    
    const url = new URL(window.location);
    url.searchParams.set('mode', 'signup');
    window.history.pushState({}, '', url);
}

function toggleToLogin() {
    document.getElementById('pageTitle').innerText = 'Welcome back';
    document.getElementById('pageSubtitle').innerText = 'Sign in to access your dashboard';
    document.getElementById('submitBtn').innerText = 'Sign In';
    document.getElementById('switchLabel').innerText = 'Don\'t have an account?';
    document.getElementById('toggleAuth').innerText = 'Sign Up';
    
    const url = new URL(window.location);
    url.searchParams.delete('mode');
    window.history.pushState({}, '', url);
}