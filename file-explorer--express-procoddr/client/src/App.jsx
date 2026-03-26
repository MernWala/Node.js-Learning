import { Routes, Route, HashRouter } from "react-router-dom"
import Home from "./pages/Home"

const App = () => {
  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/dir/:id" element={<Home />} />
        <Route path="/file/:id" element={<Home />} />
      </Routes>
    </HashRouter>
  )
}

export default App