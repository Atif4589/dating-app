import { Show, SignInButton, SignUpButton, UserButton } from '@clerk/nextjs'

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4">
      <h1 className="text-3xl font-bold">Welcome to the Dating App</h1>

      <Show when="signed-out">
        <div className="flex gap-4">
          <SignInButton mode="modal">
            <button className="px-4 py-2 bg-pink-500 text-white rounded-lg">Sign In</button>
          </SignInButton>
          <SignUpButton mode="modal">
            <button className="px-4 py-2 bg-gray-800 text-white rounded-lg">Sign Up</button>
          </SignUpButton>
        </div>
      </Show>

      <Show when="signed-in">
        <p>You&apos;re logged in!</p>
        <UserButton />
      </Show>
    </main>
  )
}