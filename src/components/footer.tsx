
'use client';
import { useEffect, useState } from 'react';

export function Footer() {
  const [year, setYear] = useState(new Date().getFullYear());

  useEffect(() => {
    setYear(new Date().getFullYear());
  }, []);

  return (
    <footer className="flex items-center justify-center h-16 border-t bg-background">
      <p className="text-sm text-muted-foreground">&copy; {year} KitaMo!. All rights reserved.</p>
    </footer>
  );
}
