import { Routes, Route } from 'react-router-dom'
import HomePage from './components/home/index'
import './App.css'

function App() {
    return (
        <div className="min-h-screen font-sans antialiased">
            <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/home" element={<HomePage />} />
            </Routes>
        </div>
    )
}

export default App