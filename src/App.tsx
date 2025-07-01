import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Login } from '@/pages/Login';
import { Dashboard } from '@/pages/Dashboard';
import { POS } from '@/pages/POS';
import { Inventory } from '@/pages/Inventory';
import { Products } from '@/pages/Products';
import { Reports } from '@/pages/Reports';
//import { Users } from '@/pages/Users';
import { Settings } from '@/pages/Settings';
//import { Notifications } from '@/pages/Notifications';
//import { Reception } from '@/pages/Reception';
import { Layout } from '@/components/Layout';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<Layout />}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="pos" element={<POS />} />
          <Route path="inventory" element={<Inventory />} />
          {/* <Route path="inventory/reception" element={<Reception />} /> */}
          <Route path="products" element={<Products />} />
          <Route path="reports" element={<Reports />} />
          {/* <Route path="users" element={<Users />} /> */}
          <Route path="settings" element={<Settings />} />
          {/* <Route path="notifications" element={<Notifications />} /> */}
        </Route>
      </Routes>
    </Router>
  );
}

export default App;