// Web navigation setup using React Router
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { MainNav } from '../components/MainNav';
import { DiscoverPage } from '../pages/DiscoverPage';
import { ProfilePage } from '../pages/ProfilePage';
import { CollectionsPage } from '../pages/CollectionsPage';
import { MyThreesPage } from '../pages/MyThreesPage';
import { PickDetailPage } from '../pages/PickDetailPage';
import { CollectionDetailPage } from '../pages/CollectionDetailPage';

// Placeholder for pages that might not exist yet
const EditProfilePage = () => <div>Edit Profile Page</div>;
const EditPickPage = () => <div>Edit Pick Page</div>;

// Web navigation uses React Router
export const AppNavigator = () => {
  return (
    <Router>
      <MainNav 
        onLogin={() => console.log('Login clicked')} 
        onSignup={() => console.log('Signup clicked')} 
        onLogout={() => console.log('Logout clicked')} 
      />
      <Routes>
        {/* Main routes */}
        <Route path="/" element={<DiscoverPage />} />
        <Route path="/collections" element={<CollectionsPage />} />
        <Route path="/my-threes" element={<MyThreesPage />} />
        <Route path="/profile/:id" element={<ProfilePage />} />
        
        {/* Detail routes */}
        <Route path="/pick/:id" element={<PickDetailPage />} />
        <Route path="/collection/:id" element={<CollectionDetailPage />} />
        <Route path="/edit-profile" element={<EditProfilePage />} />
        <Route path="/edit-pick/:id" element={<EditPickPage />} />
        
        {/* Fallback route */}
        <Route path="*" element={<DiscoverPage />} />
      </Routes>
    </Router>
  );
};
