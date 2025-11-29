import Home from './pages/Home';
import Learn from './pages/Learn';
import Lesson from './pages/Lesson';
import __Layout from './Layout.jsx';


export const PAGES = {
    "Home": Home,
    "Learn": Learn,
    "Lesson": Lesson,
}

export const pagesConfig = {
    mainPage: "Home",
    Pages: PAGES,
    Layout: __Layout,
};