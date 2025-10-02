// Get CSRF token from meta tag
function getCsrfToken() {
    return document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
}

async function pm2AppAction(appName, action){
    const csrfToken = getCsrfToken();
    const headers = {
        'Content-Type': 'application/json'
    };

    if (csrfToken) {
        headers['csrf-token'] = csrfToken;
    }

    await fetch(`/api/apps/${appName}/${action}`, {
        method: 'POST',
        headers: headers
    })
    location.reload();
}