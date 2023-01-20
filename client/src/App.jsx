import {
  BrowserRouter as Router,
  Route,
  Routes
} from "react-router-dom";
import { useAuth } from "./contexts/AuthContext/AuthContext";
import Help from "./pages/Help";

import Home from "./pages/Home/"
import Login from "./pages/Login";
import Register from "./pages/Register";

function App() {

  const auth = useAuth();

  return (
    <div className="App">
        <Router>
          <Routes>

            <Route path="/" element={<Home />} />

            <Route path="/help" element={<Help />} />

            {!auth.user && <Route path="/login" element={<Login />} />}

            {!auth.user && <Route path="/register" element={<Register />} />}
          </Routes>
        </Router>
    </div>
  )
}

export default App