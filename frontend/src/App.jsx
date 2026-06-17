import { BrowserRouter } from 'react-router-dom';
import AppRoutes         from './routes/AppRoute';
import ScrollToTop from './components/layout/ScrollToTop';
export default function App() {
  return (
    
      <BrowserRouter>
      <ScrollToTop/>
        <AppRoutes />
      </BrowserRouter>
    
  );
}