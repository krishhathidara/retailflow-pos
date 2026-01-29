const API_URL = 'http://localhost:5000/api';

document.addEventListener('DOMContentLoaded', () => {
    
    // 1. Detect if we are in "Signup Mode" based on URL
    const params = new URLSearchParams(window.location.search);
    if (params.get('mode') === 'signup') {
        toggleToSignup();
    }

    // 2. Handle Form Submit
    const authForm = document.getElementById('authForm');
    if (authForm) {
        authForm.addEventListener('submit', handleAuth);
    }

    // 3. Handle Toggle Link Click
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
    const password = document.getElementById('passwordInput').value;
    const btn = document.getElementById('submitBtn');
    const isSignup = document.getElementById('pageTitle').innerText === 'Create Account';
    
    const endpoint = isSignup ? '/register' : '/login';
    
    // UI Loading State
    const originalText = btn.innerText;
    btn.innerText = 'Processing...';
    btn.disabled = true;
    btn.style.opacity = '0.7';

    try {
        const res = await fetch(`${API_URL}${endpoint}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });

        const data = await res.json();

        if (res.ok) {
            if (isSignup) {
                // If signup success, auto-login or ask to login
                alert("Account created! Please sign in.");
                toggleToLogin();
            } else {
                // Login Success
                localStorage.setItem('user', email);
                window.location.href = 'dashboard.html';
            }
        } else {
            alert(data.error || "Authentication failed");
        }
    } catch (err) {
        console.error(err);
        alert("Cannot connect to server. Is 'node index.js' running?");
    } finally {
        btn.innerText = originalText;
        btn.disabled = false;
        btn.style.opacity = '1';
    }
}

function toggleToSignup() {
    document.getElementById('pageTitle').innerText = 'Create Account';
    document.getElementById('pageSubtitle').innerText = 'Start your free trial';
    document.getElementById('submitBtn').innerText = 'Create Account';
    document.getElementById('switchLabel').innerText = 'Already have an account?';
    document.getElementById('toggleAuth').innerText = 'Sign In';
    
    // Update URL
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
    
    // Update URL
    const url = new URL(window.location);
    url.searchParams.delete('mode');
    window.history.pushState({}, '', url);
}