import Layout from "./Layout.jsx";

import Podcasts from "./Podcasts";

import Schedule from "./Schedule";

import ExternalStreams from "./ExternalStreams";

import Settings from "./Settings";

import Home from "./Home";

import Studio from "./Studio";

import Library from "./Library";

import Episode from "./Episode";

import RSS from "./RSS";

import Audio from "./Audio";

import HaramainLive from "./HaramainLive";

import VideoPodcast from "./VideoPodcast";

import Moderation from "./Moderation";

import UserProfile from "./UserProfile";

import MediaRequest from "./MediaRequest";

import Favorites from "./Favorites";

import CreatorStudio from "./CreatorStudio";

import Search from "./Search";

import Community from "./Community";
import SignIn from "./SignIn";
import SignUp from "./SignUp";

import { BrowserRouter as Router, Route, Routes, useLocation } from 'react-router-dom';

const PAGES = {
    
    Podcasts: Podcasts,
    
    Schedule: Schedule,
    
    ExternalStreams: ExternalStreams,
    
    Settings: Settings,
    
    Home: Home,
    
    Studio: Studio,
    
    Library: Library,
    
    Episode: Episode,
    
    RSS: RSS,
    
    Audio: Audio,
    
    HaramainLive: HaramainLive,
    
    VideoPodcast: VideoPodcast,
    
    Moderation: Moderation,
    
    UserProfile: UserProfile,
    
    MediaRequest: MediaRequest,
    
    Favorites: Favorites,
    
    CreatorStudio: CreatorStudio,
    
    Search: Search,
    
    Community: Community,
    SignIn: SignIn,
    SignUp: SignUp,
    
}

function _getCurrentPage(url) {
    if (url.endsWith('/')) {
        url = url.slice(0, -1);
    }
    let urlLastPart = url.split('/').pop();
    if (urlLastPart.includes('?')) {
        urlLastPart = urlLastPart.split('?')[0];
    }

    const pageName = Object.keys(PAGES).find(page => page.toLowerCase() === urlLastPart.toLowerCase());
    return pageName || Object.keys(PAGES)[0];
}

// Create a wrapper component that uses useLocation inside the Router context
function PagesContent() {
    const location = useLocation();
    const currentPage = _getCurrentPage(location.pathname);
    
    return (
        <Layout currentPageName={currentPage}>
            <Routes>            
                
                    <Route path="/" element={<Podcasts />} />
                
                
                <Route path="/Podcasts" element={<Podcasts />} />
                
                <Route path="/Schedule" element={<Schedule />} />
                
                <Route path="/ExternalStreams" element={<ExternalStreams />} />
                
                <Route path="/Settings" element={<Settings />} />
                
                <Route path="/Home" element={<Home />} />
                
                <Route path="/Studio" element={<Studio />} />
                
                <Route path="/Library" element={<Library />} />
                
                <Route path="/Episode" element={<Episode />} />
                
                <Route path="/RSS" element={<RSS />} />
                
                <Route path="/Audio" element={<Audio />} />
                
                <Route path="/HaramainLive" element={<HaramainLive />} />
                
                <Route path="/VideoPodcast" element={<VideoPodcast />} />
                
                <Route path="/Moderation" element={<Moderation />} />
                
                <Route path="/UserProfile" element={<UserProfile />} />
                
                <Route path="/MediaRequest" element={<MediaRequest />} />
                
                <Route path="/Favorites" element={<Favorites />} />
                
                <Route path="/CreatorStudio" element={<CreatorStudio />} />
                
                <Route path="/Search" element={<Search />} />
                
                <Route path="/Community" element={<Community />} />
                <Route path="/SignIn" element={<SignIn />} />
                <Route path="/SignUp" element={<SignUp />} />
                
            </Routes>
        </Layout>
    );
}

export default function Pages() {
    return (
        <Router>
            <PagesContent />
        </Router>
    );
}
