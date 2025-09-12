import './App.css';
import { Button } from '@/components/ui/button';

export default function App() {
  function handleClick() {
    const eventSource = new EventSource('/api/sse');

    eventSource.onopen = () => {
      console.log('Connected to server');
    };

    eventSource.onmessage = (event) => {
      console.log(event.data);
    };

    eventSource.onerror = () => {
      eventSource.close();
    };
  }

  return (
    <div>
      <h1 className="text-3xl font-bold">TODO</h1>
      <Button onClick={handleClick}>Click me</Button>
    </div>
  );
}
