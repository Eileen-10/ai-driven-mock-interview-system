import Header from '@/app/_components/Header';
import { SignIn } from '@clerk/nextjs'

export default function Page() {
  return (
    <div className="flex items-center justify-center h-auto m-10">
      <SignIn />
    </div>
  );
}