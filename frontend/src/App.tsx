// App.tsx
import { Routes, Route } from 'react-router-dom'
import HomePage from './components/home/HomePage'
import './App.css'

// В Vite шрифты подключаются через CSS или Google Fonts CDN
function App() {
    return (
        <div className="min-h-screen font-sans antialiased">
            <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/home" element={<HomePage />} />
            </Routes>
            {/* Аналитика подключается по-другому */}
        </div>
    )
}

export default App