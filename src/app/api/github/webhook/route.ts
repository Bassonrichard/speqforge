import { NextRequest, NextResponse } from 'next/server';
import { webhookService } from '@/services/webhook-service';
import { verifyGitHubWebhookSignature } from '@/lib/utils';

export async function POST(request: NextRequest) {
  try {
    // Get webhook signature
    const signature = request.headers.get('x-hub-signature-256');
    const event = request.headers.get('x-github-event');

    if (!signature || !event) {
      return NextResponse.json(
        { success: false, error: 'Missing webhook headers' },
        { status: 400 }
      );
    }

    // Get raw body for signature verification
    const body = await request.text();

    // Verify webhook signature
    const webhookSecret = process.env.GITHUB_WEBHOOK_SECRET;
    if (webhookSecret && !verifyGitHubWebhookSignature(body, signature, webhookSecret)) {
      return NextResponse.json(
        { success: false, error: 'Invalid webhook signature' },
        { status: 401 }
      );
    }

    // Parse payload
    const payload = JSON.parse(body);

    // Process webhook
    const result = await webhookService.processWebhook(event, payload);

    return NextResponse.json({
      success: result.success,
      message: result.message,
      featureId: result.featureId,
      action: result.action,
    });
  } catch (error) {
    console.error('Webhook processing error:', error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : 'Failed to process webhook',
      },
      { status: 500 }
    );
  }
}
