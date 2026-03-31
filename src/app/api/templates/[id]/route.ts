import { NextRequest, NextResponse } from 'next/server';
import { templateService } from '@/services/template-service';

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // TODO: Get authenticated user and check if admin

    await templateService.deleteTemplate(id);

    return NextResponse.json({
      success: true,
      message: 'Template deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting template:', error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : 'Failed to delete template',
      },
      { status: 500 }
    );
  }
}
