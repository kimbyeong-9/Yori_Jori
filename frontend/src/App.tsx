import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { ScrollToTop } from './components/ScrollToTop'
import { SessionProvider } from './context/SessionContext'
import { AppLayout } from './layout/AppLayout'
import { ContactPage } from './pages/ContactPage'
import { CookiePage } from './pages/CookiePage'
import { FridgePage } from './pages/FridgePage'
import { HelpPage } from './pages/HelpPage'
import { HomePage } from './pages/HomePage'
import { IngredientAddPage } from './pages/IngredientAddPage'
import { PrivacyPage } from './pages/PrivacyPage'
import { RecipeDetailPage } from './pages/RecipeDetailPage'
import { RecipeListPage } from './pages/RecipeListPage'
import { SafetyPage } from './pages/SafetyPage'
import { SavedRecipesPage } from './pages/SavedRecipesPage'
import { TermsPage } from './pages/TermsPage'

function App() {
  return (
    <SessionProvider>
      <BrowserRouter>
        <ScrollToTop />
        <Routes>
          <Route element={<AppLayout />}>
            <Route path="/" element={<HomePage />} />
            <Route path="/ingredients/new" element={<IngredientAddPage />} />
            <Route path="/fridge" element={<FridgePage />} />
            <Route path="/recipes" element={<RecipeListPage />} />
            <Route path="/recipes/:id" element={<RecipeDetailPage />} />
            <Route path="/saved" element={<SavedRecipesPage />} />
            <Route path="/legal/terms" element={<TermsPage />} />
            <Route path="/legal/privacy" element={<PrivacyPage />} />
            <Route path="/legal/cookie" element={<CookiePage />} />
            <Route path="/support/help" element={<HelpPage />} />
            <Route path="/support/safety" element={<SafetyPage />} />
            <Route path="/support/contact" element={<ContactPage />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </SessionProvider>
  )
}

export default App
