import {
  BrowserRouter as Router,
  Route,
  Routes
} from "react-router-dom";
import { useAuth } from "./contexts/AuthContext/AuthContext";
import { useTheme } from "./contexts/ThemeContext/ThemeContext";
import Help from "./pages/Help";

import permissions from "./data/permissions.json";

import Home from "./pages/Home/"
import Login from "./pages/Login";
import Posts from "./pages/Posts";
import PostViewer from "./pages/Posts/PostViewer";
import Register from "./pages/Register";
import Settings from "./pages/Settings";



function App() {

  const auth = useAuth();
  const theme = useTheme();

  import(`./styles/${theme.theme}.theme.css`);

  return (
    <div className="App">
      <Router>
        <Routes>

          <Route path="/" element={<Home />} />

          {(auth.user && auth.hasPermission(permissions.indexOf("VIEW_POSTS"))) && <Route path="/posts" element={<Posts />} />}
          {(auth.user && auth.hasPermission(permissions.indexOf("VIEW_POSTS"))) && <Route path="/posts/view" element={<PostViewer />} />}

          <Route path="/help" element={<Help />} />

          {auth.user && <Route path="/settings" element={<Settings />} />}

          {!auth.user && <Route path="/login" element={<Login />} />}

          {!auth.user && <Route path="/register" element={<Register />} />}
        </Routes>
      </Router>
    </div>
  )
}

export default App