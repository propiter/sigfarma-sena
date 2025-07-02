import { ReactNode } from 'react';

interface MainContentProps {
  children: ReactNode;
}

export function MainContent({ children }: MainContentProps) {
  return (
    <main className="flex-1 overflow-y-auto bg-gray-50 dark:bg-gray-950">
      <div className="w-full max-w-[1600px] mx-auto p-4 sm:p-6">
        {children}
      </div>
    </main>
  );
}