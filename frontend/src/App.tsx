import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { SessionProvider } from './context/SessionContext'
import { AppLayout } from './layout/AppLayout'
import { FridgePage } from './pages/FridgePage'
import { HomePage } from './pages/HomePage'
import { IngredientAddPage } from './pages/IngredientAddPage'
import { RecipeDetailPage } from './pages/RecipeDetailPage'
import { RecipeListPage } from './pages/RecipeListPage'
import { SavedRecipesPage } from './pages/SavedRecipesPage'

function App() {
  return (
    <SessionProvider>
      <BrowserRouter>
        <Routes>
          <Route element={<AppLayout />}>
            <Route path="/" element={<HomePage />} />
            <Route path="/ingredients/new" element={<IngredientAddPage />} />
            <Route path="/fridge" element={<FridgePage />} />
            <Route path="/recipes" element={<RecipeListPage />} />
            <Route path="/recipes/:id" element={<RecipeDetailPage />} />
            <Route path="/saved" element={<SavedRecipesPage />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </SessionProvider>
  )
}

export default App
