import Home from './pages/Home';
import Learn from './pages/Learn';
import Lesson from './pages/Lesson';
import Profile from './pages/Profile';
import Leaderboard from './pages/Leaderboard';
import EncryptionPlayground from './pages/EncryptionPlayground';
import BranchingSimulator from './pages/BranchingSimulator';
import LeakDetector from './pages/LeakDetector';
import __Layout from './Layout.jsx';


export const PAGES = {
    "home": Home,
    "lesson": Lesson,
    "profile": Profile,
    "leaderboard": Leaderboard,
    "encryption-playground": EncryptionPlayground,
    "branching-simulator": BranchingSimulator,
    "leak-detector": LeakDetector,
}

export const pagesConfig = {
    mainPage: "home",
    Pages: PAGES,
    Layout: __Layout,
};