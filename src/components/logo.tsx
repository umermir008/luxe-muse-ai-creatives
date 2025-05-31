import Link from 'next/link';

export function Logo() {
  return (
    <Link href="/" className="font-headline text-3xl font-bold text-primary hover:opacity-80 transition-opacity">
      Luxe Muse
    </Link>
  );
}
