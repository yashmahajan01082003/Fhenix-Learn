import Home from './pages/Home';
import Learn from './pages/Learn';
import Lesson from './pages/Lesson';
import Profile from './pages/Profile';
import __Layout from './Layout.jsx';


export const PAGES = {
    "Home": Home,
    "Learn": Learn,
    "Lesson": Lesson,
    "Profile": Profile,
}

export const pagesConfig = {
    mainPage: "Home",
    Pages: PAGES,
    Layout: __Layout,
};