/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import NavBar from './components/NavBar';
import Footer from './components/Footer';
import ChatBot from './components/ChatBot';
import Home from './pages/Home';
import AIChef from './pages/AIChef';
import RecipeView from './pages/RecipeView';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Ingredients from './pages/Ingredients';
import { AuthProvider, useAuth } from './AuthContext';
import { ThemeProvider } from './ThemeContext';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  
  if (loading) return null;
  if (!user) return <Navigate to="/login" />;
  
  return <>{children}</>;
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Router>
          <div className="min-h-screen flex flex-col bg-background text-on-background transition-colors duration-300">
            <NavBar />
            <div className="flex-grow">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/ai-chef" element={<AIChef />} />
              <Route path="/recipe" element={<RecipeView />} />
              <Route path="/login" element={<Login />} />
              <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
              <Route path="/ingredients" element={<ProtectedRoute><Ingredients /></ProtectedRoute>} />
            </Routes>
          </div>
          <Footer />
          <ChatBot />
        </div>
      </Router>
    </AuthProvider>
  </ThemeProvider>
);
}
