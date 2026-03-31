'use client';

import { useMemo } from 'react';
import { diffLines, Change } from 'diff';

interface SpecDiffProps {
  original: string;
  modified: string;
  title?: string;
}

export function SpecDiff({ original, modified, title }: SpecDiffProps) {
  const changes = useMemo(() => {
    return diffLines(original, modified);
  }, [original, modified]);

  const stats = useMemo(() => {
    const added = changes.filter((c) => c.added).length;
    const removed = changes.filter((c) => c.removed).length;
    const unchanged = changes.filter((c) => !c.added && !c.removed).length;
    return { added, removed, unchanged, total: changes.length };
  }, [changes]);

  return (
    <div className="space-y-4">
      {title && (
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">{title}</h3>
          <div className="flex items-center space-x-4 text-sm">
            <span className="text-green-600">+{stats.added} added</span>
            <span className="text-red-600">-{stats.removed} removed</span>
            <span className="text-gray-600">{stats.unchanged} unchanged</span>
          </div>
        </div>
      )}

      <div className="rounded-lg border border-gray-200 bg-gray-50 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm font-mono">
            <tbody>
              {changes.map((change, index) => (
                <DiffLine key={index} change={change} lineNumber={index + 1} />
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

interface DiffLineProps {
  change: Change;
  lineNumber: number;
}

function DiffLine({ change, lineNumber }: DiffLineProps) {
  const getLineStyle = () => {
    if (change.added) {
      return 'bg-green-50 border-l-4 border-green-500';
    }
    if (change.removed) {
      return 'bg-red-50 border-l-4 border-red-500';
    }
    return 'bg-white';
  };

  const getTextColor = () => {
    if (change.added) return 'text-green-800';
    if (change.removed) return 'text-red-800';
    return 'text-gray-800';
  };

  const getPrefix = () => {
    if (change.added) return '+';
    if (change.removed) return '-';
    return ' ';
  };

  // Split value by lines to render each line separately
  const lines = change.value.split('\n').filter((line, idx, arr) => {
    // Keep all lines except the last one if it's empty
    // (diff library tends to add an extra newline at the end)
    return idx < arr.length - 1 || line.length > 0;
  });

  return (
    <>
      {lines.map((line, idx) => (
        <tr key={`${lineNumber}-${idx}`} className={getLineStyle()}>
          <td className="px-4 py-1 text-right text-gray-400 select-none w-12">
            {lineNumber}
          </td>
          <td className="px-2 py-1 text-center text-gray-500 select-none w-8">
            {getPrefix()}
          </td>
          <td className={`px-4 py-1 ${getTextColor()}`}>
            <pre className="whitespace-pre-wrap break-words">{line || '\u00A0'}</pre>
          </td>
        </tr>
      ))}
    </>
  );
}
