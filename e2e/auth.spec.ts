import { test, expect } from '@playwright/test'

test.describe('Autenticação - Páginas', () => {
  test('página de login renderiza formulário', async ({ page }) => {
    await page.goto('/pt-BR/entrar')
    await expect(page.locator('h1')).toContainText('Entrar')
    await expect(page.locator('input[type="email"]')).toBeVisible()
    await expect(page.locator('input[type="password"]')).toBeVisible()
    await expect(page.locator('button[type="submit"]')).toBeVisible()
  })

  test('página de cadastro renderiza formulário completo', async ({ page }) => {
    await page.goto('/pt-BR/cadastro')
    await expect(page.locator('h1')).toContainText('Cadastrar')
    await expect(page.locator('input[type="email"]')).toBeVisible()
    // Deve ter campos de senha e confirmar senha (2 inputs password)
    const senhaInputs = page.locator('input[type="password"]')
    await expect(senhaInputs).toHaveCount(2)
  })

  test('login com campos vazios não submete (validação HTML)', async ({ page }) => {
    await page.goto('/pt-BR/entrar')
    await page.click('button[type="submit"]')
    // Deve permanecer na mesma página (required impede submit)
    await expect(page).toHaveURL(/\/pt-BR\/entrar/)
  })

  test('cadastro mostra erro quando senhas não coincidem', async ({ page }) => {
    await page.goto('/pt-BR/cadastro')
    await page.fill('input[type="email"]', 'teste@teste.com')
    // Preenche nome de usuário
    const inputs = page.locator('input[type="text"]')
    await inputs.first().fill('meuuser')
    await page.fill('input[type="date"]', '2000-01-01')
    // Preenche senhas diferentes
    const senhaInputs = page.locator('input[type="password"]')
    await senhaInputs.nth(0).fill('123456')
    await senhaInputs.nth(1).fill('654321')
    await page.click('button[type="submit"]')
    await expect(page.locator('text=As senhas não coincidem')).toBeVisible()
  })

  test('link de cadastro na página de login funciona', async ({ page }) => {
    await page.goto('/pt-BR/entrar')
    await page.click('text=Cadastrar')
    await expect(page).toHaveURL(/\/pt-BR\/cadastro/)
  })

  test('link de login na página de cadastro funciona', async ({ page }) => {
    await page.goto('/pt-BR/cadastro')
    await page.click('text=Entrar')
    await expect(page).toHaveURL(/\/pt-BR\/entrar/)
  })
})
