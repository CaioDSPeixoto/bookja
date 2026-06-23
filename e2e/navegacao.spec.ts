import { test, expect } from '@playwright/test'

test.describe('Navegação e i18n', () => {
  test('redireciona raiz para /pt-BR', async ({ page }) => {
    await page.goto('/')
    await expect(page).toHaveURL(/\/pt-BR/)
  })

  test('página inicial carrega com título correto', async ({ page }) => {
    await page.goto('/pt-BR')
    await expect(page.locator('h1')).toContainText('Descubra histórias incríveis')
  })

  test('cabeçalho contém logo Bookja', async ({ page }) => {
    await page.goto('/pt-BR')
    await expect(page.locator('header')).toContainText('Bookja')
  })

  test('cabeçalho contém links de navegação', async ({ page }) => {
    await page.goto('/pt-BR')
    await expect(page.locator('header nav')).toContainText('Início')
    await expect(page.locator('header nav')).toContainText('Histórias')
  })

  test('link Entrar leva para página de login', async ({ page }) => {
    await page.goto('/pt-BR')
    await page.click('text=Entrar')
    await expect(page).toHaveURL(/\/pt-BR\/entrar/)
  })
})
