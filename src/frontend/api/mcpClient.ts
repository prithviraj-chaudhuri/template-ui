import type { McpServersResponse } from '@/types/mcp';

export class McpClient {
  /**
   * Fetch all MCP servers with their status
   */
  static async getServers(): Promise<McpServersResponse> {
    const response = await fetch('/api/mcp/servers', {
      method: 'GET',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch MCP servers: ${response.status}`);
    }

    return response.json();
  }

  /**
   * Store CSRF token before OAuth redirect
   */
  static async prepareOAuth(csrf: string, serverName: string): Promise<void> {
    const response = await fetch('/api/oauth/prepare', {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ csrf, serverName }),
    });

    if (!response.ok) {
      throw new Error(`Failed to prepare OAuth: ${response.status}`);
    }
  }

  /**
   * Open OAuth popup and handle authentication flow
   */
  static async authenticateWithPopup(authUrl: string, serverName: string): Promise<void> {
    return new Promise((resolve, reject) => {
      // Generate CSRF token
      const csrf = crypto.randomUUID();

      // Add CSRF to auth URL
      const url = new URL(authUrl);
      url.searchParams.set('state', csrf);

      // Store CSRF token
      this.prepareOAuth(csrf, serverName).catch(reject);

      // Open popup
      const width = 600;
      const height = 700;
      const left = window.screenX + (window.outerWidth - width) / 2;
      const top = window.screenY + (window.outerHeight - height) / 2;

      const popup = window.open(
        url.toString(),
        'oauth-popup',
        `width=${width},height=${height},left=${left},top=${top},popup=yes`
      );

      if (!popup) {
        reject(new Error('Failed to open popup window. Please allow popups for this site.'));
        return;
      }

      // Listen for OAuth callback
      const handleMessage = (event: MessageEvent) => {
        if (event.origin !== window.location.origin) {
          return;
        }

        if (event.data.type === 'oauth-success' && event.data.serverName === serverName) {
          window.removeEventListener('message', handleMessage);
          popup.close();
          resolve();
        }
      };

      window.addEventListener('message', handleMessage);

      // Handle popup close without success
      const checkClosed = setInterval(() => {
        if (popup.closed) {
          clearInterval(checkClosed);
          window.removeEventListener('message', handleMessage);
          // Don't reject - user might have cancelled intentionally
          resolve();
        }
      }, 500);
    });
  }
}
