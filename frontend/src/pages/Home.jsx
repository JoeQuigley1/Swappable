import { useNavigate } from 'react-router-dom'
import { BRAND_COLOR } from '../constants'

// home page shown when user visits the root URL
function Home() {

  const navigate = useNavigate()

  return (
    <div className="text-center py-5">
      <h1 className="display-4 fw-bold mb-3">Welcome to Swappable</h1>
      <p className="text-muted fs-5 mb-4">
        Swap more, buy less. Find items to swap in your local community.
      </p>
      <div className="d-flex gap-3 justify-content-center">
        <button
          className="btn btn-lg"
          style={{ backgroundColor: BRAND_COLOR, color: 'white' }}
          onClick={() => navigate('/browse')}
        >
          Browse items
        </button>
        <button
          className="btn btn-lg btn-outline-secondary"
          onClick={() => navigate('/register')}
        >
          Create account
        </button>
      </div>
    </div>
  )
}

export default Home