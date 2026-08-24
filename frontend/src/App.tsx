import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import { Button } from './components/ui/Button';
import { Input } from './components/ui/Input';
import { Badge } from './components/ui/Badge';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <div className="min-h-screen bg-background p-8 text-on-surface">
        <div className="max-w-2xl mx-auto space-y-6">
          <h1 className="text-2xl font-bold text-primary">NotesHub UI Foundation</h1>
          <p className="text-on-surface-variant">Core design system & atomic UI components</p>
          <div className="flex gap-3">
            <Button>Primary Button</Button>
            <Button variant="secondary">Secondary</Button>
            <Badge>Milano Red</Badge>
          </div>
          <Input label="Sample Input" placeholder="Type here..." />
        </div>
      </div>
      <Toaster position="top-right" />
    </QueryClientProvider>
  );
}

export default App;
