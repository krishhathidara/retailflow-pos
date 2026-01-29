document.addEventListener('DOMContentLoaded', () => {
    
    // 1. Check if we are in "Sign Up" mode (from index.html link)
    const params = new URLSearchParams(window.location.search);
    if (params.get('mode') === 'signup') {
        toggleAuthMode();
    }

    // 2. Handle Form Submission (The Login Logic)
    const form = document.getElementById('authForm');
    if (form) {
        form.addEventListener('submit', (e) => {
            e.preventDefault(); // STOP the page from reloading
            
            const btn = form.querySelector('button');
            const originalText = btn.innerText;
            
            // Show loading state
            btn.innerText = 'Authenticating...';
            btn.style.opacity = '0.7';
            btn.disabled = true;

            // Simulate server delay then Redirect
            setTimeout(() => {
                window.location.href = 'dashboard.html';
            }, 800);
        });
    }

    // 3. Handle Toggle between Login and Signup
    const toggleBtn = document.getElementById('toggleAuth');
    if (toggleBtn) {
        toggleBtn.addEventListener('click', (e) => {
            e.preventDefault();
            toggleAuthMode();
        });
    }
});

function toggleAuthMode() {
    const title = document.getElementById('pageTitle');
    const subtitle = document.getElementById('pageSubtitle');
    const btn = document.querySelector('.btn-primary');
    const toggleLink = document.getElementById('toggleAuth');
    const switchText = document.querySelector('.switch-text');

    if (title.innerText === 'Welcome back') {
        // Switch to Sign Up
        title.innerText = 'Create Account';
        subtitle.innerText = 'Get started with your free trial';
        btn.innerText = 'Create Account';
        switchText.innerHTML = 'Already have an account? <a href="#" id="toggleAuth">Sign in</a>';
    } else {
        // Switch to Sign In
        title.innerText = 'Welcome back';
        subtitle.innerText = 'Sign in to access your dashboard';
        btn.innerText = 'Sign In';
        switchText.innerHTML = 'Don\'t have an account? <a href="#" id="toggleAuth">Sign up</a>';
    }

    // Re-attach event listener to new link
    document.getElementById('toggleAuth').addEventListener('click', (e) => {
        e.preventDefault();
        toggleAuthMode();
    });
}