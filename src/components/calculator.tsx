
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { CalculatorIcon, Delete } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export function Calculator() {
  const [input, setInput] = useState('');
  const { toast } = useToast();

  const handleButtonClick = (value: string) => {
    setInput((prev) => prev + value);
  };

  const handleClear = () => {
    setInput('');
  };

  const handleBackspace = () => {
    setInput((prev) => prev.slice(0, -1));
  };

  const handleCalculate = () => {
    try {
      const expression = input.replace(/x/g, '*');
      if (!/^[0-9+\-*/.() ]+$/.test(expression)) {
        throw new Error('Invalid characters in expression');
      }
      const result = eval(expression);
      if (typeof result !== 'number' || !isFinite(result)) {
        throw new Error('Invalid calculation');
      }
      setInput(String(result));
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Invalid Calculation',
        description: 'Please check your expression and try again.',
      });
      setInput('');
    }
  };

  const buttons = [
    '7', '8', '9', '/',
    '4', '5', '6', 'x',
    '1', '2', '3', '-',
    '0', '.', '=', '+',
  ];

  return (
    <Card className="shadow-lg">
      <CardHeader>
          <div className='flex items-center gap-2'>
            <CalculatorIcon className="h-5 w-5 text-muted-foreground" />
            <CardTitle className="text-lg">Calculator</CardTitle>
          </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <Input
          type="text"
          value={input}
          readOnly
          placeholder="0"
          className="text-right text-2xl font-mono h-12"
        />
        <div className="grid grid-cols-2 gap-2">
             <Button variant="outline" onClick={handleClear} className="col-span-1">
                Clear
            </Button>
            <Button variant="outline" onClick={handleBackspace}>
                <Delete className="h-5 w-5" />
            </Button>
        </div>
        <div className="grid grid-cols-4 gap-2">
          {buttons.map((btn) => (
            <Button
              key={btn}
              variant={btn === '=' ? 'default' : 'outline'}
              size="lg"
              className="text-xl"
              onClick={() => {
                if (btn === '=') {
                  handleCalculate();
                } else {
                  handleButtonClick(btn);
                }
              }}
            >
              {btn}
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
