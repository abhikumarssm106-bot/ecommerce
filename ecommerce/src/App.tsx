import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { Home } from './pages/Home';

function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <Home />
      </CartProvider>
    </AuthProvider>
  );
}

export default App;
