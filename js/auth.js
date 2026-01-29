document.addEventListener('DOMContentLoaded', () => {
    
    // 1. DETECT SIGNUP MODE
    // Checks if the URL is "login.html?mode=signup"
    const params = new URLSearchParams(window.location.search);
    const isSignupMode = params.get('mode') === 'signup';
    
    if (isSignupMode) {
        toggleToSignup();
    }

    // 2. HANDLE FORM SUBMIT (Login/Signup Click)
    const form = document.getElementById('authForm');
    if (form) {
        form.addEventListener('submit', (e) => {
            e.preventDefault(); // Stop reload
            
            const btn = document.getElementById('submitBtn');
            const email = document.getElementById('emailInput').value;
            
            // Visual Feedback
            btn.innerHTML = 'Authenticating...';
            btn.style.opacity = '0.7';
            btn.disabled = true;

            // Simulate Server Delay -> Go to Dashboard
            setTimeout(() => {
                // Store user info (Mock)
                localStorage.setItem('user', email);
                window.location.href = 'dashboard.html';
            }, 800);
        });
    }

    // 3. HANDLE TOGGLE LINK CLICK
    const toggleLink = document.getElementById('toggleAuth');
    if (toggleLink) {
        toggleLink.addEventListener('click', (e) => {
            e.preventDefault();
            const currentTitle = document.getElementById('pageTitle').innerText;
            
            if (currentTitle.includes('Welcome')) {
                toggleToSignup();
            } else {
                toggleToLogin();
            }
        });
    }
});

function toggleToSignup() {
    document.getElementById('pageTitle').innerText = 'Create Account';
    document.getElementById('pageSubtitle').innerText = 'Start your free 14-day trial';
    document.getElementById('submitBtn').innerText = 'Create Account';
    document.getElementById('switchLabel').innerText = 'Already have an account?';
    document.getElementById('toggleAuth').innerText = 'Sign In';
    
    // Update URL without reloading (so refresh keeps you on signup)
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