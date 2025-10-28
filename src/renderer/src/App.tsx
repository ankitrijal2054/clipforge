import React from 'react'
import { Layout } from './components/Layout'
import { Toaster } from '../../components/ui/toaster'

function App(): React.JSX.Element {
  return (
    <>
      <Layout />
      <Toaster />
    </>
  )
}

export default App
