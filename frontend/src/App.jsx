import { useEffect, useState } from 'react'

function App() {
  const [message, setMessage] = useState('Loading...')

  useEffect(() => {
    fetch('/api/health')
        .then((res) => res.text())
        .then((data) => setMessage(data))
        .catch(() => setMessage('Error connecting to backend'))
  }, [])

  return (
      <div>
        <h1>Swappable</h1>
        <p>{message}</p>
      </div>
  )
}

export default App