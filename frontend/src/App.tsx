import { useEffect } from 'react';
import { Provider, useDispatch } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import { BrowserRouter, useRoutes } from 'react-router-dom';
import {  setLoading } from './store/AdminAuthSlice';
import routes from './routers';
import { persistor, store } from './store/Store';
import 'react-toastify/dist/ReactToastify.css';
import { ToastContainer } from 'react-toastify';
import PermissionAuthInitializer from './components/location/PermissionAuthInitializer';

const AuthInitializer = ({ children }: { children: React.ReactNode }) => {
  const dispatch = useDispatch();

  useEffect(() => {
    dispatch(setLoading(false));
    persistor.flush().then(() => {
    });
  }, [dispatch]);
  return <>{children}</>;
};

const AppRoutes = () => {
  const element = useRoutes(routes);
  return element;
};

function App() {
  return (
    <Provider store={store}>
      <PersistGate loading={null} persistor={persistor}>
        <BrowserRouter>
          <AuthInitializer>
            <PermissionAuthInitializer>
             <ToastContainer
                position="bottom-right"
                autoClose={3000}
                hideProgressBar={false}
                newestOnTop={false}
                closeOnClick
                rtl={false}
                pauseOnFocusLoss
                draggable
                pauseOnHover
                theme="colored"
                limit={3}
              />
              <AppRoutes />
            </PermissionAuthInitializer>
          </AuthInitializer>
        </BrowserRouter>
      </PersistGate>
    </Provider>
  );
}

export default App;
