import { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ChatProvider } from './context/ChatContext';
import ServerRail from './components/Sidebar/ServerRail';
import Sidebar from './components/Sidebar/Sidebar';
import ChatArea from './components/Chat/ChatArea';
import MembersPanel from './components/Members/MembersPanel';
import LoginPage from './pages/LoginPage';
import './App.css';

function AppShell() {
  const { isAuthenticated } = useAuth();
  const [membersOpen, setMembersOpen] = useState(true);

  if (!isAuthenticated) return <LoginPage />;

  return (
    <ChatProvider>
      <div className="app">
        <ServerRail />
        <Sidebar />
        <ChatArea onToggleMembers={() => setMembersOpen(o => !o)} />
        {membersOpen && <MembersPanel />}
      </div>
    </ChatProvider>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppShell />
    </AuthProvider>
  );
}
