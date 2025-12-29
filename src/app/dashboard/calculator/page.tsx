'use client';

import { Calculator as CalculatorComponent } from '@/components/calculator';
import { CalculatorIcon } from 'lucide-react';

export default function CalculatorPage() {
    return (
        <div className="flex flex-col gap-8 h-full">
            <div className="flex items-center gap-2">
                <CalculatorIcon className="w-6 h-6" />
                <h1 className="text-3xl font-bold">Calculator</h1>
            </div>
            <div className="flex-grow flex items-center justify-center">
                <div className="w-full max-w-sm">
                  <CalculatorComponent />
                </div>
            </div>
        </div>
    )
}
