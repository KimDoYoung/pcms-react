import { Link } from 'react-router-dom'

function Toolbar() {
  return (
    <div className="flex items-center justify-between px-6 py-3 bg-gray-900 text-white">
      <span className="font-bold text-lg">PCMS</span>
      <Link to="/login" className="text-sm hover:underline">Login</Link>
    </div>
  )
}

export default Toolbar
