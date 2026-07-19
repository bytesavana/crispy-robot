import { Navigate, RouterProvider, createBrowserRouter } from 'react-router-dom'
import { AppShell } from '@/components/layout/AppShell'
import { AuthGuard } from '@/lib/auth/AuthGuard'
import { LoginPage } from '@/pages/LoginPage'
import { DashboardPage } from '@/pages/dashboard/DashboardPage'
import { CategoriesPage } from '@/pages/catalog/CategoriesPage'
import { CategoryDetailPage } from '@/pages/catalog/CategoryDetailPage'
import { ZoneLookupPage } from '@/pages/catalog/ZoneLookupPage'
import { EstimatorPage } from '@/pages/catalog/EstimatorPage'
import { ProvidersListPage } from '@/pages/providers/ProvidersListPage'
import { NewProviderPage } from '@/pages/providers/NewProviderPage'
import { ProviderDetailPage } from '@/pages/providers/ProviderDetailPage'
import { RequestLookupPage } from '@/pages/requests/RequestLookupPage'
import { RequestDetailPage } from '@/pages/requests/RequestDetailPage'
import { OrdersOverviewPage } from '@/pages/requests/OrdersOverviewPage'
import { ConsumersListPage } from '@/pages/consumers/ConsumersListPage'
import { ConsumerDetailPage } from '@/pages/consumers/ConsumerDetailPage'

const router = createBrowserRouter([
  { path: '/login', element: <LoginPage /> },
  {
    element: <AuthGuard />,
    children: [
      {
        element: <AppShell />,
        children: [
          { index: true, element: <Navigate to="/dashboard" replace /> },
          { path: 'dashboard', element: <DashboardPage /> },
          { path: 'catalog/categories', element: <CategoriesPage /> },
          { path: 'catalog/categories/:code', element: <CategoryDetailPage /> },
          { path: 'catalog/zones', element: <ZoneLookupPage /> },
          { path: 'catalog/estimator', element: <EstimatorPage /> },
          { path: 'providers', element: <ProvidersListPage /> },
          { path: 'providers/new', element: <NewProviderPage /> },
          { path: 'providers/:id', element: <ProviderDetailPage /> },
          { path: 'requests/lookup', element: <RequestLookupPage /> },
          { path: 'requests/:id', element: <RequestDetailPage /> },
          { path: 'orders', element: <OrdersOverviewPage /> },
          { path: 'consumers', element: <ConsumersListPage /> },
          { path: 'consumers/:id', element: <ConsumerDetailPage /> },
        ],
      },
    ],
  },
])

function App() {
  return <RouterProvider router={router} />
}

export default App
