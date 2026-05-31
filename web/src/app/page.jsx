import { TranslatorApplication } from '@/components/TranslatorApplication';
import { Link } from '@nextui-org/react';

const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? '';

export default function Home() {
  return (
    <>
      <main className='min-h-screen flex flex-col justify-between'>
        <TranslatorApplication />
        <footer className="flex w-full my-4">
          <div className='mx-auto'>
            <h1 className='text-center'><b className='w-full'>ChatGPT Subtitle Translator Web Graphical User Interface</b></h1>
            <div className='flex flex-wrap items-center justify-center'>
              <div className='sm:w-auto text-center'>
                <Link isExternal className='mr-2 text-blue-500' href="https://github.com/Cerlancism">
                  @Cerlancism
                </Link>
              </div>
              <a href="https://github.com/Cerlancism/chatgpt-subtitle-translator" target="_blank" rel="noopener noreferrer" className="flex items-center justify-center">
                <img className='w-8 h-8 mx-auto' src={`${basePath}/github-mark.svg`} alt="GitHub" />
              </a>
            </div>
          </div>
        </footer>
      </main>

    </>
  )
}
