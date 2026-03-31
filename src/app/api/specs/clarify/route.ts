import { NextRequest, NextResponse } from 'next/server';
import { clarifyService } from '@/services/clarify-service';
import { db } from '@/lib/db';
import { z } from 'zod';

const answerSchema = z.object({
  specRevId: z.string(),
  answers: z.array(
    z.object({
      questionNumber: z.number(),
      question: z.string(),
      answer: z.string(),
    })
  ),
});

// GET clarifying questions
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const specRevId = searchParams.get('specRevId');

    if (!specRevId) {
      return NextResponse.json(
        { success: false, error: 'specRevId is required' },
        { status: 400 }
      );
    }

    // Get spec content
    const specRev = await db.specRevision.findUnique({
      where: { id: specRevId },
      include: {
        feature: {
          include: {
            project: true,
          },
        },
      },
    });

    if (!specRev) {
      return NextResponse.json(
        { success: false, error: 'Spec revision not found' },
        { status: 404 }
      );
    }

    // Check if questions have already been generated and answered
    const existingAnswers = await clarifyService.getAnswers(specRevId);

    if (existingAnswers.length > 0) {
      // Return existing answers
      return NextResponse.json({
        success: true,
        data: {
          questions: existingAnswers.map((a) => ({
            questionNumber: a.questionNumber,
            question: a.question,
            type: 'text',
          })),
          answers: existingAnswers,
        },
      });
    }

    // Generate new questions
    // Note: In a real implementation, we'd fetch the spec content
    // For now, we'll use the feature description as a placeholder
    const questions = await clarifyService.identifyClarifyingQuestions(
      specRev.feature.description || '',
      specRev.feature.project.orgId
    );

    return NextResponse.json({
      success: true,
      data: { questions, answers: [] },
    });
  } catch (error) {
    console.error('Error generating clarifying questions:', error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : 'Failed to generate clarifying questions',
      },
      { status: 500 }
    );
  }
}

// POST answers and regenerate spec
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { specRevId, answers } = answerSchema.parse(body);

    // Save answers and regenerate spec
    const result = await clarifyService.saveAnswersAndRegenerate(
     specRevId,
      answers
    );

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('Error saving answers:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Invalid request data', details: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : 'Failed to save answers',
      },
      { status: 500 }
    );
  }
}
