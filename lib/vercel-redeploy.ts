interface VercelRedeployResult {
  triggered: boolean;
  error?: string;
}

export async function triggerVercelRedeploy(reason: string): Promise<VercelRedeployResult> {
  const deployHookUrl = process.env.VERCEL_DEPLOY_HOOK_URL?.trim();

  if (!deployHookUrl) {
    return {
      triggered: false,
      error: 'VERCEL_DEPLOY_HOOK_URL is not configured',
    };
  }

  try {
    const response = await fetch(deployHookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        reason,
        source: 'properties-api',
      }),
    });

    if (!response.ok) {
      const responseText = (await response.text()).slice(0, 500);
      return {
        triggered: false,
        error: `Deploy hook failed with status ${response.status}${responseText ? `: ${responseText}` : ''}`,
      };
    }

    return { triggered: true };
  } catch (error) {
    return {
      triggered: false,
      error: error instanceof Error ? error.message : 'Failed to call Vercel deploy hook',
    };
  }
}
