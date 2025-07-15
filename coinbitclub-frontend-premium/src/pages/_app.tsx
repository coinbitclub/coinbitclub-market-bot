import '../styles/globals.css'
import type { AppProps } from 'next/app'
import Navbar from '../components/Navbar'
import ThemeProvider from '../components/ThemeProvider'
import Footer from '../components/Footer'
import { useEffect } from 'react'
import { initSentry } from '../lib/sentry'

export default function App({ Component, pageProps }: AppProps) {
  useEffect(() => {
    initSentry()
  }, [])

  return (
    <ThemeProvider>
      <Navbar />
      <Component {...pageProps} />
      <Footer />
    </ThemeProvider>
  )
}
