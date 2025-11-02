import { Routes, Route, HashRouter } from "react-router-dom"
import Home from "./pages/Home"

const App = () => {
  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/directory/*" element={<Home />} />
      </Routes>
    </HashRouter>
  )
}

export default App