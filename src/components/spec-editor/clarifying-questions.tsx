'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

interface ClarifyingQuestion {
  questionNumber: number;
  question: string;
  options?: string[];
  type: 'radio' | 'checkbox' | 'text';
}

interface ClarifyingAnswer {
  questionNumber: number;
  question: string;
  answer: string;
}

interface ClarifyingQuestionsProps {
  specRevId: string;
  onComplete: () => void;
  onSkip: () => void;
}

export function ClarifyingQuestions({
  specRevId,
  onComplete,
  onSkip,
}: ClarifyingQuestionsProps) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const queryClient = useQueryClient();

  // Fetch questions
  const { data, isLoading } = useQuery({
    queryKey: ['clarify-questions', specRevId],
    queryFn: async () => {
      const res = await fetch(`/api/specs/clarify?specRevId=${specRevId}`);
      if (!res.ok) throw new Error('Failed to fetch questions');
      const json = await res.json();
      return json.data as {
        questions: ClarifyingQuestion[];
        answers: ClarifyingAnswer[];
      };
    },
  });

  // Submit answers mutation
  const submitMutation = useMutation({
    mutationFn: async () => {
      const answerArray = data?.questions.map((q) => ({
        questionNumber: q.questionNumber,
        question: q.question,
        answer: answers[q.questionNumber] || '',
      }));

      const res = await fetch('/api/specs/clarify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          specRevId,
          answers: answerArray,
        }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to submit answers');
      }

      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['spec'] });
      onComplete();
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-muted-foreground">Loading questions...</div>
      </div>
    );
  }

  if (!data || !data.questions || data.questions.length === 0) {
    return (
      <div className="p-8 text-center">
        <p className="text-muted-foreground mb-4">
          No clarifying questions needed at this time.
        </p>
        <Button onClick={onSkip}>Continue</Button>
      </div>
    );
  }

  const currentQuestion = data.questions[currentQuestionIndex];
  const isLastQuestion = currentQuestionIndex === data.questions.length - 1;
  const allAnswered = data.questions.every(
    (q) => answers[q.questionNumber]?.trim()
  );

  const handleAnswer = (questionNumber: number, value: string) => {
    setAnswers((prev) => ({
      ...prev,
      [questionNumber]: value,
    }));
  };

  const handleNext = () => {
    if (isLastQuestion) {
      // Submit all answers
      submitMutation.mutate();
    } else {
      setCurrentQuestionIndex((prev) => prev + 1);
    }
  };

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex((prev) => prev - 1);
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-8 space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Clarifying Questions</h2>
        <p className="text-muted-foreground">
          Answer these questions to refine your specification and resolve ambiguities.
        </p>
      </div>

      <div className="text-sm text-muted-foreground">
        Question {currentQuestionIndex + 1} of {data.questions.length}
      </div>

      <div className="border rounded-lg p-6 space-y-4">
        <div>
          <h3 className="text-lg font-semibold mb-4">
            {currentQuestion.question}
          </h3>

          {currentQuestion.type === 'text' && (
            <textarea
              value={answers[currentQuestion.questionNumber] || ''}
              onChange={(e) =>
                handleAnswer(currentQuestion.questionNumber, e.target.value)
              }
              placeholder="Enter your answer..."
              className="w-full min-h-32 p-3 border rounded-lg resize-y focus:ring-2 focus:ring-primary"
            />
          )}

          {currentQuestion.type === 'radio' && currentQuestion.options && (
            <div className="space-y-2">
              {currentQuestion.options.map((option) => (
                <label
                  key={option}
                  className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-accent"
                >
                  <input
                    type="radio"
                    name={`question-${currentQuestion.questionNumber}`}
                    value={option}
                    checked={answers[currentQuestion.questionNumber] === option}
                    onChange={(e) =>
                      handleAnswer(currentQuestion.questionNumber, e.target.value)
                    }
                    className="h-4 w-4"
                  />
                  <span>{option}</span>
                </label>
              ))}
            </div>
          )}

          {currentQuestion.type === 'checkbox' && currentQuestion.options && (
            <div className="space-y-2">
              {currentQuestion.options.map((option) => {
                const currentAnswer = answers[currentQuestion.questionNumber] || '';
                const selected = currentAnswer.split(',').map((s) => s.trim());

                return (
                  <label
                    key={option}
                    className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-accent"
                  >
                    <input
                      type="checkbox"
                      checked={selected.includes(option)}
                      onChange={(e) => {
                        const newSelected = e.target.checked
                          ? [...selected, option]
                          : selected.filter((s) => s !== option);
                        handleAnswer(
                          currentQuestion.questionNumber,
                          newSelected.filter((s) => s).join(', ')
                        );
                      }}
                      className="h-4 w-4"
                    />
                    <span>{option}</span>
                  </label>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={handlePrevious}
            disabled={currentQuestionIndex === 0}
          >
            Previous
          </Button>
          <Button variant="ghost" onClick={onSkip}>
            Skip Questions
          </Button>
        </div>

        <Button
          onClick={handleNext}
          disabled={
            !answers[currentQuestion.questionNumber]?.trim() ||
            submitMutation.isPending
          }
        >
          {submitMutation.isPending
            ? 'Updating Spec...'
            : isLastQuestion
            ? 'Submit & Update Spec'
            : 'Next'}
        </Button>
      </div>

      {submitMutation.isError && (
        <div className="p-4 bg-destructive/10 border border-destructive rounded-lg">
          <p className="text-sm text-destructive">{submitMutation.error.message}</p>
        </div>
      )}
    </div>
  );
}
