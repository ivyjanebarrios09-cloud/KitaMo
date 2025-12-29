import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Header } from '@/components/header';
import Image from 'next/image';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { Footer } from '@/components/footer';

export default function Home() {
  const heroImage = PlaceHolderImages.find(p => p.id === 'hero-image');

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Header />
      <main className="flex-1">
        <section className="w-full py-12 md:py-24 lg:py-32">
          <div className="container px-4 md:px-6">
            <div className="grid gap-6 lg:gap-12 items-center justify-center text-center">
              <div className="flex flex-col justify-center space-y-4">
                <div className="space-y-4">
                  <div className="inline-block rounded-lg bg-secondary px-3 py-1 text-sm text-secondary-foreground">
                    Your Personal Task Manager
                  </div>
                  <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl xl:text-6xl/none font-headline text-primary">
                    Organize Your Life with KitaMo!
                  </h1>
                  <p className="max-w-[600px] text-muted-foreground md:text-xl mx-auto">
                    A simple, modern, and fast way to manage your tasks. Stay organized, focused, and achieve more every day.
                  </p>
                </div>
                <div className="flex flex-col gap-2 min-[400px]:flex-row justify-center">
                  <Button asChild size="lg">
                    <Link href="/register">
                      Get Started for Free
                    </Link>
                  </Button>
                  <Button asChild variant="outline" size="lg">
                    <Link href="/login">
                      Login
                    </Link>
                  </Button>
                </div>
              </div>
              {heroImage && (
                <Image
                  src={heroImage.imageUrl}
                  alt={heroImage.description}
                  data-ai-hint={heroImage.imageHint}
                  width={600}
                  height={400}
                  className="mx-auto aspect-video overflow-hidden rounded-xl object-cover shadow-lg sm:w-full"
                />
              )}
            </div>
          </div>
        </section>

        <section className="w-full py-12 md:py-24 lg:py-32 bg-secondary/30">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <div className="space-y-2">
                <div className="inline-block rounded-lg bg-secondary px-3 py-1 text-sm">Features</div>
                <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl">Everything You Need to Be Productive</h2>
                <p className="max-w-[900px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                  KitaMo! provides a comprehensive set of tools to help you manage your tasks efficiently and effectively.
                </p>
              </div>
            </div>
            <div className="mx-auto grid max-w-5xl items-start gap-8 sm:grid-cols-2 md:gap-12 lg:grid-cols-3 mt-12">
              <div className="grid gap-1 text-center p-6 rounded-lg hover:bg-card transition-all">
                <h3 className="text-lg font-bold">Easy Task Management</h3>
                <p className="text-sm text-muted-foreground">Quickly add, edit, and delete tasks. Mark them as complete to track your progress.</p>
              </div>
              <div className="grid gap-1 text-center p-6 rounded-lg hover:bg-card transition-all">
                <h3 className="text-lg font-bold">Secure Authentication</h3>
                <p className="text-sm text-muted-foreground">Your data is safe with our secure email and password authentication powered by Firebase.</p>
              </div>
              <div className="grid gap-1 text-center p-6 rounded-lg hover:bg-card transition-all">
                <h3 className="text-lg font-bold">Cross-Device Sync</h3>
                <p className="text-sm text-muted-foreground">Your tasks are synced in real-time across all your devices, thanks to Firestore.</p>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
